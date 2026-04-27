import { db } from '../config/firebase';
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  getCountFromServer,
  query,
  limit,
} from 'firebase/firestore';

const EXCLUDED_USER_IDS = new Set(['defaultSettings']);

export interface DevSchoolStat {
  id: string;
  name: string;
  bookCount: number;
  studentCount: number;
}

/**
 * Extrai IDs de escola únicos a partir dos paths dos documentos de um collectionGroup.
 * Path esperado: users/{schoolId}/<subcollection>/{docId}
 */
function extractSchoolIds(docs: Array<{ ref: { path: string } }>): Set<string> {
  const ids = new Set<string>();
  for (const d of docs) {
    const segments = d.ref.path.split('/');
    if (segments[0] === 'users' && segments[1]) {
      const id = segments[1];
      if (!EXCLUDED_USER_IDS.has(id)) {
        ids.add(id);
      }
    }
  }
  return ids;
}

/**
 * Agrega livros e alunos por escola usando collectionGroup,
 * evitando depender de documentos em users/{uid} (que podem não existir).
 *
 * Regras de segurança necessárias (já existentes):
 *   books   → allow read: if true
 *   students → allow read: if true
 *   settings/library → allow read: if true (para o nome da escola)
 */
export const devPlatformStatsService = {
  async getAllSchoolStats(): Promise<DevSchoolStat[]> {
    // Usa getCountFromServer no collectionGroup para totais globais eficientes
    // e busca um amostra limitada apenas para descobrir os IDs das escolas.
    const DISCOVERY_LIMIT = 2000;

    const [booksGroupSnap, studentsGroupSnap] = await Promise.all([
      getDocs(query(collectionGroup(db, 'books'), limit(DISCOVERY_LIMIT))),
      getDocs(query(collectionGroup(db, 'students'), limit(DISCOVERY_LIMIT))),
    ]);

    const schoolIdSet = new Set<string>([
      ...extractSchoolIds(booksGroupSnap.docs),
      ...extractSchoolIds(studentsGroupSnap.docs),
    ]);

    const schoolIds = Array.from(schoolIdSet);

    if (schoolIds.length === 0) {
      return [];
    }

    const rows = await Promise.all(
      schoolIds.map(async (schoolId) => {
        const [booksCountSnap, studentsCountSnap, settingsSnap] = await Promise.all([
          getCountFromServer(collection(db, `users/${schoolId}/books`)),
          getCountFromServer(collection(db, `users/${schoolId}/students`)),
          getDoc(doc(db, `users/${schoolId}/settings/library`)),
        ]);

        let name = `ID: ${schoolId.slice(0, 8)}…`;
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as { schoolName?: string };
          if (data.schoolName?.trim()) {
            name = data.schoolName.trim();
          }
        }

        return {
          id: schoolId,
          name,
          bookCount: booksCountSnap.data().count,
          studentCount: studentsCountSnap.data().count,
        };
      })
    );

    return rows.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },
};
