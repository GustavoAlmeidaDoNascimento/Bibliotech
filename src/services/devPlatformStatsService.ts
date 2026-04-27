import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  getCountFromServer,
} from 'firebase/firestore';

/** Documentos em `users/` que não representam uma escola/biblioteca */
const EXCLUDED_TOP_LEVEL_USER_IDS = new Set(['defaultSettings']);

export interface DevSchoolStat {
  id: string;
  name: string;
  bookCount: number;
  studentCount: number;
}

/**
 * Agrega livros e alunos por escola. Uma “escola” é um documento em `users/{id}`
 * com subcoleções `books` e `students`, no mesmo modelo do app.
 */
export const devPlatformStatsService = {
  async getAllSchoolStats(): Promise<DevSchoolStat[]> {
    const usersSnap = await getDocs(collection(db, 'users'));
    const schoolIds = usersSnap.docs
      .map((d) => d.id)
      .filter((id) => !EXCLUDED_TOP_LEVEL_USER_IDS.has(id));

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
