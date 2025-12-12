import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { studentIndexService } from '../../services/studentIndexService';
import { dummyContentPacks, DummyContentPack, DummyStudent, DummyBook } from '../../data/dummyContentPacks';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import styles from './DummyContentGenerator.module.css';

type Step = 'pack-selection' | 'students-preview' | 'books-preview' | 'loans-preview';

interface DummyContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const DummyContentGenerator: React.FC<DummyContentGeneratorProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [selectedPack, setSelectedPack] = useState<DummyContentPack | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('pack-selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStudents, setCreatedStudents] = useState<string[]>([]);
  const [createdBooks, setCreatedBooks] = useState<string[]>([]);
  const [createdLoans, setCreatedLoans] = useState<string[]>([]);

  if (!isOpen) return null;

  const handlePackSelect = (pack: DummyContentPack) => {
    setSelectedPack(pack);
    setCurrentStep('students-preview');
    setError(null);
    setCreatedStudents([]);
    setCreatedBooks([]);
    setCreatedLoans([]);
  };

  const handleCreateStudents = async () => {
    if (!currentUser || !selectedPack) return;

    try {
      setLoading(true);
      setError(null);
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const createdIds: string[] = [];

      for (const student of selectedPack.students) {
        const studentData = {
          name: student.name,
          classroom: student.classroom,
          contact: student.contact || '',
          address: student.address || '',
          number: '',
          neighborhood: '',
          complement: '',
          notes: '',
          shift: student.shift || 'Manhã',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: currentUser.uid,
        };
        const newStudentRef = await addDoc(studentsRef, studentData);
        await setDoc(newStudentRef, { studentId: newStudentRef.id }, { merge: true });
        await studentIndexService.upsertEntry(newStudentRef.id, currentUser.uid);
        createdIds.push(newStudentRef.id);
      }

      setCreatedStudents(createdIds);
      setCurrentStep('books-preview');
    } catch (err) {
      console.error('Erro ao criar alunos:', err);
      setError('Erro ao criar alunos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooks = async () => {
    if (!currentUser || !selectedPack) return;

    try {
      setLoading(true);
      setError(null);
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const createdIds: string[] = [];

      for (const book of selectedPack.books) {
        // Gerar código numérico de 5 dígitos se não fornecido
        const generateNumericCode = (): string => {
          // Gera um número aleatório entre 10000 e 99999 (5 dígitos)
          const code = Math.floor(Math.random() * 90000) + 10000;
          return code.toString();
        };
        
        const bookCodes = book.codes && book.codes.length > 0 
          ? book.codes.map(code => {
              // Se o código fornecido não for numérico de 5 dígitos, converter
              const numericCode = code.replace(/\D/g, ''); // Remove caracteres não numéricos
              if (numericCode.length === 5) {
                return numericCode;
              }
              // Se não tiver 5 dígitos, gerar um novo
              return generateNumericCode();
            })
          : [generateNumericCode()];
        
        const bookData = {
          codes: bookCodes,
          title: book.title,
          genres: book.genres,
          tags: [],
          authors: book.authors,
          publisher: book.publisher || '',
          acquisitionDate: new Date().toISOString().split('T')[0],
          shelf: '',
          collection: '',
          quantity: book.quantity || bookCodes.length,
          description: book.description || '',
          coverUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: currentUser.uid,
          status: 'available',
        };
        const newBookRef = await addDoc(booksRef, bookData);
        createdIds.push(newBookRef.id);
      }

      setCreatedBooks(createdIds);
      setCurrentStep('loans-preview');
    } catch (err) {
      console.error('Erro ao criar livros:', err);
      setError('Erro ao criar livros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoans = async () => {
    if (!currentUser || !selectedPack) return;

    try {
      setLoading(true);
      setError(null);

      if (createdStudents.length === 0 || createdBooks.length === 0) {
        setError('É necessário criar alunos e livros antes de criar empréstimos.');
        return;
      }

      // Buscar alunos criados usando os IDs salvos
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const studentsQuery = query(studentsRef, orderBy('createdAt', 'desc'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const allStudents = studentsSnapshot.docs
        .filter(doc => createdStudents.includes(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string; [key: string]: any }));

      // Buscar livros criados usando os IDs salvos
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const booksQuery = query(booksRef, orderBy('createdAt', 'desc'));
      const booksSnapshot = await getDocs(booksQuery);
      const allBooks = booksSnapshot.docs
        .filter(doc => createdBooks.includes(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; title: string; codes?: string[]; [key: string]: any }));

      if (allStudents.length === 0 || allBooks.length === 0) {
        setError('Erro ao buscar alunos ou livros criados. Tente novamente.');
        return;
      }

      // Filtrar apenas livros que têm códigos
      const booksWithCodes = allBooks.filter(book => {
        const codes = book.codes || [];
        return codes.length > 0;
      });

      if (booksWithCodes.length === 0) {
        setError('Nenhum livro com códigos encontrado. Verifique os livros criados.');
        return;
      }

      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const loanDurationDays = Math.max(1, settings.loanDuration || 30);
      const createdIds: string[] = [];

      // Criar 5 empréstimos aleatórios
      let attempts = 0;
      const maxAttempts = 20; // Limite de tentativas para evitar loop infinito
      
      while (createdIds.length < 5 && attempts < maxAttempts) {
        attempts++;
        const randomStudent = allStudents[Math.floor(Math.random() * allStudents.length)];
        const randomBook = booksWithCodes[Math.floor(Math.random() * booksWithCodes.length)];
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDurationDays);

        const bookCodes = randomBook.codes || [];
        if (bookCodes.length === 0) {
          continue;
        }

        const loanData = {
          studentId: randomStudent.id,
          studentName: randomStudent.name,
          bookId: randomBook.id,
          bookTitle: randomBook.title,
          bookCode: bookCodes[0],
          borrowDate: serverTimestamp(),
          status: 'active' as const,
          dueDate: Timestamp.fromDate(dueDate),
          loanDurationDays,
          createdAt: serverTimestamp(),
        };

        const newLoanRef = await addDoc(loansRef, loanData);
        createdIds.push(newLoanRef.id);
      }

      setCreatedLoans(createdIds);
      
      // Mostrar mensagem de sucesso e fechar após 2 segundos
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (err) {
      console.error('Erro ao criar empréstimos:', err);
      setError('Erro ao criar empréstimos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSelectedPack(null);
    setCurrentStep('pack-selection');
    setError(null);
    setCreatedStudents([]);
    setCreatedBooks([]);
    setCreatedLoans([]);
  };

  const handleBack = () => {
    if (currentStep === 'students-preview') {
      setCurrentStep('pack-selection');
      setSelectedPack(null);
    } else if (currentStep === 'books-preview') {
      setCurrentStep('students-preview');
    } else if (currentStep === 'loans-preview') {
      setCurrentStep('books-preview');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetState();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Gerar Dummy Content</h2>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <XMarkIcon className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {currentStep === 'pack-selection' && (
            <div className={styles.step}>
              <p className={styles.stepDescription}>Escolha um pacote de conteúdo:</p>
              <div className={styles.packsGrid}>
                {dummyContentPacks.map((pack) => (
                  <button
                    key={pack.id}
                    className={styles.packCard}
                    onClick={() => handlePackSelect(pack)}
                  >
                    <h3>{pack.name}</h3>
                    <p>{pack.description}</p>
                    <div className={styles.packInfo}>
                      <span>{pack.students.length} alunos</span>
                      <span>{pack.books.length} livros</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'students-preview' && selectedPack && (
            <div className={styles.step}>
              <h3>Criar Alunos</h3>
              <p className={styles.stepDescription}>Os seguintes alunos serão criados:</p>
              <ul className={styles.previewList}>
                {selectedPack.students.map((student, index) => (
                  <li key={index}>
                    <strong>{student.name}</strong> - {student.classroom} ({student.shift || 'Manhã'})
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button className={styles.backButton} onClick={handleBack} disabled={loading}>
                  Voltar
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={handleCreateStudents}
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Alunos'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'books-preview' && selectedPack && (
            <div className={styles.step}>
              <h3>Criar Livros</h3>
              {createdStudents.length > 0 && (
                <div className={styles.successMessage}>
                  <CheckIcon className={styles.successIcon} />
                  {createdStudents.length} alunos criados com sucesso!
                </div>
              )}
              <p className={styles.stepDescription}>Os seguintes livros serão criados:</p>
              <ul className={styles.previewList}>
                {selectedPack.books.map((book, index) => (
                  <li key={index}>
                    <strong>{book.title}</strong> - {book.authors}
                    {book.genres.length > 0 && (
                      <span className={styles.genres}> ({book.genres.join(', ')})</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button className={styles.backButton} onClick={handleBack} disabled={loading}>
                  Voltar
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={handleCreateBooks}
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Livros'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'loans-preview' && selectedPack && (
            <div className={styles.step}>
              <h3>Criar Empréstimos</h3>
              {createdBooks.length > 0 && (
                <div className={styles.successMessage}>
                  <CheckIcon className={styles.successIcon} />
                  {createdBooks.length} livros criados com sucesso!
                </div>
              )}
              <p className={styles.stepDescription}>
                Serão criados 5 empréstimos aleatórios entre os alunos e livros criados.
              </p>
              <div className={styles.actions}>
                <button className={styles.backButton} onClick={handleBack} disabled={loading}>
                  Voltar
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={handleCreateLoans}
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Empréstimos'}
                </button>
              </div>
            </div>
          )}

          {createdLoans.length > 0 && (
            <div className={styles.successMessage}>
              <CheckIcon className={styles.successIcon} />
              {createdLoans.length} empréstimos criados com sucesso! Fechando...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DummyContentGenerator;
