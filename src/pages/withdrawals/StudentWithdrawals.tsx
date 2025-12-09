import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, addDoc, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BookOpenIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import NewBadge from '../../components/NewBadge';
import styles from './Withdrawals.module.css';

interface Student {
  id: string;
  name: string;
  classroom: string;
  contact: string;
}

interface Book {
  id: string;
  code?: string;
  codes?: string[];
  title: string;
  authors?: string[] | string;
  availableCodes?: string[];
}

interface Filters {
  name: string;
  classroom: string;
}

const StudentWithdrawals = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    classroom: ''
  });
  
  // Estados para modo rápido
  const [fastCheckoutMode, setFastCheckoutMode] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<{ [bookId: string]: string }>({});
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [confirmClickCount, setConfirmClickCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    const isFastCheckoutEnabled = settings.fastCheckoutEnabled ?? false;
    setFastCheckoutMode(isFastCheckoutEnabled);
    if (isFastCheckoutEnabled) {
      fetchBooks();
    }
  }, [currentUser, settings.fastCheckoutEnabled]);

  const fetchStudents = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        classroom: doc.data().classroom || '',
        contact: doc.data().contact || ''
      }));
      
      setStudents(fetchedStudents);
      setFilteredStudents(fetchedStudents);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const applyFilters = () => {
    const nameFilter = filters.name.toLowerCase().trim();
    const classroomFilter = filters.classroom.toLowerCase().trim();
    
    if (!nameFilter && !classroomFilter) {
      setFiltersApplied(false);
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => {
      const matchesName = !nameFilter || student.name.toLowerCase().includes(nameFilter);
      const matchesClassroom = !classroomFilter || student.classroom.toLowerCase().includes(classroomFilter);
      return matchesName && matchesClassroom;
    });
    
    setFilteredStudents(filtered);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({ name: '', classroom: '' });
    setFiltersApplied(false);
    setFilteredStudents(students);
  };

  const handleWithdraw = (studentId: string, studentName: string) => {
    navigate(`/student-withdrawals/${studentId}`, { 
      state: { studentName } 
    });
  };

  // Funções para modo rápido
  const fetchBooks = async () => {
    if (!currentUser) return;
    
    try {
      setBooksLoading(true);
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const q = query(booksRef);
      const querySnapshot = await getDocs(q);
      
      const fetchedBooks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      
      // Calcular códigos disponíveis para cada livro
      const booksWithAvailability = await Promise.all(
        fetchedBooks.map(async (book) => {
          const availableCodes = await calculateAvailableCodes(book);
          return {
            ...book,
            availableCodes
          };
        })
      );
      
      setBooks(booksWithAvailability);
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    } finally {
      setBooksLoading(false);
    }
  };

  const calculateAvailableCodes = async (book: Book): Promise<string[]> => {
    if (!currentUser) return [];
    
    try {
      const allCodes = book.codes && book.codes.length > 0 ? book.codes : (book.code ? [book.code] : []);
      if (allCodes.length === 0) return [];
      
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const activeLoansQuery = query(
        loansRef,
        where('bookId', '==', book.id),
        where('status', '==', 'active')
      );
      
      const activeLoansSnapshot = await getDocs(activeLoansQuery);
      const borrowedCodes = activeLoansSnapshot.docs
        .map(doc => doc.data().bookCode)
        .filter(code => code);
      
      return allCodes.filter(code => !borrowedCodes.includes(code));
    } catch (error) {
      console.error('Erro ao calcular códigos disponíveis:', error);
      return [];
    }
  };

  const filteredStudentsForFast = students.filter(student => {
    const searchLower = studentSearch.toLowerCase().trim();
    if (!searchLower) return false;
    return student.name.toLowerCase().includes(searchLower) ||
           student.classroom.toLowerCase().includes(searchLower);
  });

  const filteredBooksForFast = books.filter(book => {
    const searchLower = bookSearch.toLowerCase().trim();
    if (!searchLower) return false;
    const matchesTitle = book.title.toLowerCase().includes(searchLower);
    const matchesAuthor = book.authors ? (
      Array.isArray(book.authors) 
        ? book.authors.some(a => a.toLowerCase().includes(searchLower))
        : book.authors.toLowerCase().includes(searchLower)
    ) : false;
    const matchesCode = (book.codes || (book.code ? [book.code] : [])).some(
      code => code.toLowerCase().includes(searchLower)
    );
    return matchesTitle || matchesAuthor || matchesCode;
  });

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
  };

  const handleBookSelect = (book: Book) => {
    // Verifica se já atingiu o limite de 3 livros
    if (selectedBooks.length >= 3) {
      alert('Você pode selecionar no máximo 3 livros por retirada');
      return;
    }
    
    // Verifica se o livro já foi selecionado
    if (selectedBooks.some(b => b.id === book.id)) {
      alert('Este livro já foi selecionado');
      return;
    }
    
    // Adiciona o livro à lista
    setSelectedBooks(prev => [...prev, book]);
    
    // Se houver apenas um código disponível, seleciona automaticamente
    if (book.availableCodes && book.availableCodes.length === 1) {
      setSelectedCodes(prev => ({ ...prev, [book.id]: book.availableCodes![0] }));
    }
    
    // Limpa a busca para permitir nova pesquisa
    setBookSearch('');
  };

  const handleRemoveBook = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(b => b.id !== bookId));
    setSelectedCodes(prev => {
      const newCodes = { ...prev };
      delete newCodes[bookId];
      return newCodes;
    });
  };

  const handleCodeSelect = (bookId: string, code: string) => {
    setSelectedCodes(prev => ({ ...prev, [bookId]: code }));
  };

  const handleFastWithdraw = async () => {
    if (!currentUser || !selectedStudent || selectedBooks.length === 0) return;
    
    if (confirmClickCount === 0) {
      setConfirmClickCount(1);
      return;
    }

    // Verificar se todos os livros que precisam de código têm um código selecionado
    for (const book of selectedBooks) {
      if (book.availableCodes && book.availableCodes.length > 1 && !selectedCodes[book.id]) {
        alert(`Por favor, selecione um código para o livro "${book.title}"`);
        setConfirmClickCount(0);
        return;
      }
    }

    try {
      setProcessing(true);
      
      const loanDurationDays = Math.max(1, settings.loanDuration || 30);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loanDurationDays);

      const loansRef = collection(db, `users/${currentUser.uid}/loans`);

      // Criar um empréstimo para cada livro selecionado
      for (const book of selectedBooks) {
        // Determinar o código a ser usado
        let bookCode = '';
        if (selectedCodes[book.id]) {
          bookCode = selectedCodes[book.id];
        } else if (book.availableCodes && book.availableCodes.length === 1) {
          bookCode = book.availableCodes[0];
        } else if (book.availableCodes && book.availableCodes.length > 0) {
          bookCode = book.availableCodes[0];
        } else {
          throw new Error(`Nenhum código disponível para o livro "${book.title}"`);
        }

        const loanData = {
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          bookId: book.id,
          bookTitle: book.title,
          bookCode,
          borrowDate: serverTimestamp(),
          status: 'active' as const,
          dueDate: Timestamp.fromDate(dueDate),
          loanDurationDays,
          createdAt: serverTimestamp()
        };
        
        await addDoc(loansRef, loanData);
      }
      
      const bookCount = selectedBooks.length;
      const bookTitles = selectedBooks.map(b => b.title).join(', ');
      
      // Reset form
      setSelectedStudent(null);
      setSelectedBooks([]);
      setSelectedCodes({});
      setStudentSearch('');
      setBookSearch('');
      setConfirmClickCount(0);
      
      // Recarregar livros para atualizar disponibilidade
      await fetchBooks();
      
      navigate('/student-loans', { 
        state: { 
          message: `${bookCount} livro${bookCount > 1 ? 's' : ''} retirado${bookCount > 1 ? 's' : ''} com sucesso por ${selectedStudent.name}` 
        } 
      });
    } catch (error) {
      console.error('Erro ao registrar retirada:', error);
      alert('Erro ao registrar a retirada. Por favor, tente novamente.');
    } finally {
      setProcessing(false);
      setConfirmClickCount(0);
    }
  };

  const currentStudents = filtersApplied ? filteredStudents : students;

  // Renderizar modo rápido
  if (fastCheckoutMode) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>
            Retirada Rápida
            <NewBadge />
          </h2>
        </div>

        <div className={styles.fastCheckoutContainer}>
          <div className={styles.fastCheckoutForms}>
            {/* Formulário de Aluno */}
            <div className={styles.fastFormSection}>
              <h3>Aluno</h3>
              <div className={styles.searchWrapper}>
                <MagnifyingGlassIcon className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar aluno por nome ou turma..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                />
              </div>
              {studentSearch && !selectedStudent && (
                <div className={styles.searchResults}>
                  {filteredStudentsForFast.length > 0 ? (
                    filteredStudentsForFast.map(student => (
                      <div
                        key={student.id}
                        className={styles.searchResultItem}
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className={styles.resultName}>{student.name}</div>
                        {student.classroom && (
                          <div className={styles.resultMeta}>{student.classroom}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noResults}>Nenhum aluno encontrado</div>
                  )}
                </div>
              )}
              {selectedStudent && (
                <div className={styles.selectedItem}>
                  <div className={styles.selectedItemContent}>
                    <div className={styles.selectedItemName}>{selectedStudent.name}</div>
                    {selectedStudent.classroom && (
                      <div className={styles.selectedItemMeta}>{selectedStudent.classroom}</div>
                    )}
                  </div>
                  <button
                    className={styles.clearSelectionButton}
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch('');
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Formulário de Livros */}
            <div className={styles.fastFormSection}>
              <div className={styles.booksSectionHeader}>
                <h3>Livros ({selectedBooks.length}/3)</h3>
                {selectedBooks.length > 0 && (
                  <span className={styles.bookCountBadge}>
                    {selectedBooks.length === 3 ? 'Limite atingido' : `${3 - selectedBooks.length} restante${3 - selectedBooks.length > 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
              
              {/* Campo de busca sempre visível */}
              <div className={styles.searchWrapper}>
                <MagnifyingGlassIcon className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={selectedBooks.length >= 3 ? "Limite de 3 livros atingido" : "Buscar livro por título, autor ou código..."}
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  disabled={selectedBooks.length >= 3}
                />
              </div>

              {/* Resultados da busca */}
              {bookSearch && selectedBooks.length < 3 && (
                <div className={styles.searchResults}>
                  {booksLoading ? (
                    <div className={styles.loading}>Carregando...</div>
                  ) : filteredBooksForFast.length > 0 ? (
                    filteredBooksForFast
                      .filter(book => (book.availableCodes?.length || 0) > 0)
                      .filter(book => !selectedBooks.some(sb => sb.id === book.id))
                      .map(book => (
                        <div
                          key={book.id}
                          className={styles.searchResultItem}
                          onClick={() => handleBookSelect(book)}
                        >
                          <div className={styles.resultName}>{book.title}</div>
                          {book.authors && (
                            <div className={styles.resultMeta}>
                              {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
                            </div>
                          )}
                          {book.availableCodes && (
                            <div className={styles.availableInfo}>
                              {book.availableCodes.length} disponível(is)
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className={styles.noResults}>Nenhum livro encontrado</div>
                  )}
                </div>
              )}

              {/* Lista de livros selecionados */}
              {selectedBooks.length > 0 && (
                <div className={styles.selectedBooksList}>
                  {selectedBooks.map((book, index) => (
                    <div key={book.id} className={styles.selectedBookCard} data-index={index}>
                      <div className={styles.selectedBookHeader}>
                        <button
                          className={styles.removeBookButton}
                          onClick={() => handleRemoveBook(book.id)}
                          title="Remover livro"
                        >
                          ×
                        </button>
                      </div>
                      <div className={styles.selectedBookContent}>
                        <div className={styles.selectedBookTitle}>{book.title}</div>
                        {book.authors && (
                          <div className={styles.selectedBookAuthors}>
                            {Array.isArray(book.authors) 
                              ? book.authors.join(', ') 
                              : book.authors}
                          </div>
                        )}
                        
                        {/* Seleção de código se necessário */}
                        {book.availableCodes && book.availableCodes.length > 1 && (
                          <div className={styles.bookCodeSelection}>
                            <label>Código:</label>
                            <div className={styles.codeOptions}>
                              {book.availableCodes.map(code => (
                                <button
                                  key={code}
                                  className={`${styles.codeOption} ${selectedCodes[book.id] === code ? styles.codeOptionSelected : ''}`}
                                  onClick={() => handleCodeSelect(book.id, code)}
                                >
                                  {code}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {book.availableCodes && book.availableCodes.length === 1 && (
                          <div className={styles.autoSelectedCode}>
                            Código: <strong>{book.availableCodes[0]}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Retirar */}
          <div className={styles.fastCheckoutActions}>
            <button
              className={styles.fastWithdrawButton}
              onClick={handleFastWithdraw}
              disabled={!selectedStudent || selectedBooks.length === 0 || processing || 
                       selectedBooks.some(book => 
                         book.availableCodes && book.availableCodes.length > 1 && !selectedCodes[book.id]
                       )}
            >
              {processing ? (
                'Processando...'
              ) : confirmClickCount === 1 ? (
                'Clique novamente para confirmar'
              ) : (
                <>
                  <BookOpenIcon className={styles.buttonIcon} />
                  Retirar {selectedBooks.length > 0 && `(${selectedBooks.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Retiradas de Alunos</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            {filtersApplied ? 'Filtros Aplicados' : 'Mostrar Filtros'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filters}>
          <form onSubmit={handleSubmit} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filtrar por nome..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="classroom">Turma</label>
              <input
                type="text"
                id="classroom"
                value={filters.classroom}
                onChange={(e) => handleFilterChange('classroom', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filtrar por turma..."
              />
            </div>
          </form>

          <div className={styles.filterActions}>
            <button
              className={styles.applyFiltersButton}
              onClick={applyFilters}
            >
              Aplicar Filtros
            </button>
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
              disabled={!filtersApplied}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : students.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.emptyIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.479m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <h3>Nenhum aluno registrado</h3>
            <p>Nenhum aluno foi cadastrado no sistema.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filtersApplied && filteredStudents.length === 0 ? (
              <div className={styles.noResults}>
                <p>Nenhum aluno encontrado com os filtros aplicados.</p>
                <button
                  className={styles.clearFiltersButton}
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Turma</th>
                    <th>Contato</th>
                    <th className={styles.actionsColumn}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map(student => (
                    <tr key={student.id} className={styles.studentRow}>
                      <td>
                        {student.name ? (
                          <Link
                            to={`/students/${student.id}`}
                            className={styles.studentNameLink}
                          >
                            {student.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{student.classroom || '-'}</td>
                      <td>{student.contact || '-'}</td>
                      <td className={styles.actionsColumn}>
                        <button 
                          className={styles.withdrawButton}
                          onClick={() => handleWithdraw(student.id, student.name)}
                        >
                          <BookOpenIcon className={styles.buttonIcon} />
                          Retirar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentWithdrawals; 