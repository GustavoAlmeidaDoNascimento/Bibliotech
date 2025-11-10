import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, doc, getDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BookRecommendations from '../../components/recommendations/BookRecommendations';
import styles from './StudentDashboard.module.css';

// Registrando os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Student {
  id: string;
  name: string;
  classroom: string;
  contact?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  notes?: string;
  shift?: string;
  userId?: string;
}

interface Loan {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned';
  genres?: string[];
  createdAt: Date;
  completed: boolean;
  readPercentage?: number; // Percentual lido do livro
}

interface Book {
  id: string;
  title: string;
  genres?: string[];
  authors?: string[];
  description?: string;
}

const StudentDashboard = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dados processados para gráficos
  const [genresData, setGenresData] = useState<{labels: string[], data: number[]}>({ labels: [], data: [] });
  const [monthlyLoansData, setMonthlyLoansData] = useState<{
    labels: string[], 
    borrowed: number[],
    completed: number[]
  }>({ 
    labels: [], 
    borrowed: [],
    completed: [] 
  });
  const [quarterlyData, setQuarterlyData] = useState<{labels: string[], data: number[]}>({ labels: [], data: [] });
  
  // Métricas calculadas
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [bestQuarter, setBestQuarter] = useState('');

  useEffect(() => {
    if (!currentUser || !studentId) return;
    
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do estudante
        const studentRef = doc(db, `users/${currentUser.uid}/students/${studentId}`);
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) {
          setError('Estudante não encontrado');
          return;
        }
        
        const studentData = { id: studentSnap.id, ...studentSnap.data() } as Student;
        setStudent(studentData);
        
        // Buscar todos os empréstimos do estudante
        const loansRef = collection(db, `users/${currentUser.uid}/loans`);
        const q = query(
          loansRef,
          where('studentId', '==', studentId)
        );
        
        const loansSnap = await getDocs(q);
        
        // Se não há empréstimos, parar por aqui
        if (loansSnap.empty) {
          setLoading(false);
          return;
        }
        
        // Processar todos os empréstimos
        const loansData = loansSnap.docs.map(doc => {
          const data = doc.data();
          
          // Converter timestamps para Dates
          const borrowDate = data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date();
          const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date();
          const returnDate = data.returnDate?.toDate ? data.returnDate.toDate() : undefined;
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          
          return {
            id: doc.id,
            ...data,
            borrowDate,
            dueDate,
            returnDate,
            createdAt
          };
        }) as Loan[];
        
        setLoans(loansData);
        
        // Buscar detalhes dos livros emprestados para obter gêneros
        const bookIds = Array.from(new Set(loansData.map(loan => loan.bookId)));
        const booksData: Book[] = [];
        
        for (const bookId of bookIds) {
          const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
          const bookSnap = await getDoc(bookRef);
          
          if (bookSnap.exists()) {
            booksData.push({
              id: bookSnap.id,
              ...bookSnap.data()
            } as Book);
          }
        }
        
        setBooks(booksData);
        
        // Processar dados para visualizações
        processData(loansData, booksData);
      } catch (error) {
        console.error('Erro ao buscar dados do estudante:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [currentUser, studentId]);
  
  const processData = (loansData: Loan[], booksData: Book[]) => {
    if (loansData.length === 0) return;
    
    // total de livros lidos (só os devolvidos)
    const completedLoans = loansData.filter(loan => loan.status === 'returned');
    setTotalBooksRead(completedLoans.length);
    
    // calcula gêneros mais lidos
    const genreCounts: {[key: string]: number} = {};
    
    loansData.forEach(loan => {
      const book = booksData.find(b => b.id === loan.bookId);
      
      if (book?.genres) {
        book.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    // ordena gêneros por popularidade
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5 gêneros
    
    if (sortedGenres.length > 0) {
      setFavoriteGenre(sortedGenres[0][0]);
      
      setGenresData({
        labels: sortedGenres.map(([genre]) => genre),
        data: sortedGenres.map(([, count]) => count)
      });
    }
    
    // empréstimos por mês (últimos 6 meses)
    const lastSixMonths = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        label: format(date, 'MMM/yyyy', { locale: ptBR }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    }).reverse();
    
    const monthlyLoans = lastSixMonths.map(month => {
      // todos os empréstimos realizados no mês
      const borrowedCount = loansData.filter(loan => 
        isWithinInterval(loan.borrowDate, {
          start: month.startDate,
          end: month.endDate
        })
      ).length;
      
      // calculando livros lidos no mês
      // se um livro tem readPercentage, usa esse valor, senão verifica se completed
      let completedCount = 0;
      
      loansData.forEach(loan => {
        if (loan.status === 'returned' && 
            loan.returnDate && 
            isWithinInterval(loan.returnDate, {
              start: month.startDate,
              end: month.endDate
            })) {
          if (loan.readPercentage !== undefined) {
            // se tiver percentual de leitura, soma o valor proporcional
            completedCount += (loan.readPercentage / 100);
          } else if (loan.completed) {
            // se não tiver percentual mas estiver marcado como completo, soma 1
            completedCount += 1;
          } else {
            // padrão: se foi devolvido mas sem indicação, considera 50%
            completedCount += 0.5;
          }
        }
      });
      
      return { 
        label: month.label, 
        borrowed: borrowedCount,
        completed: completedCount 
      };
    });
    
    setMonthlyLoansData({
      labels: monthlyLoans.map(m => m.label),
      borrowed: monthlyLoans.map(m => m.borrowed),
      completed: monthlyLoans.map(m => m.completed)
    });
    
    // Determinar em qual trimestre o estudante leu mais
    const quarters = [
      { name: '1º Trimestre', months: [0, 1, 2] },
      { name: '2º Trimestre', months: [3, 4, 5] },
      { name: '3º Trimestre', months: [6, 7, 8] },
      { name: '4º Trimestre', months: [9, 10, 11] }
    ];
    
    const quarterCounts = quarters.map(quarter => {
      const count = loansData.filter(loan => {
        const month = loan.borrowDate.getMonth();
        return quarter.months.includes(month);
      }).length;
      
      return { name: quarter.name, count };
    });
    
    setQuarterlyData({
      labels: quarterCounts.map(q => q.name),
      data: quarterCounts.map(q => q.count)
    });
    
    // Determinar o melhor trimestre
    const bestQ = quarterCounts.reduce((best, current) => 
      current.count > best.count ? current : best, 
      { name: '', count: -1 }
    );
    
    if (bestQ.count > 0) {
      setBestQuarter(bestQ.name);
    }
    
    // calcula velocidade média de leitura (dias)
    if (completedLoans.length > 0) {
      const totalDays = completedLoans.reduce((sum, loan) => {
        if (loan.returnDate) {
          // diferença em dias entre empréstimo e devolução
          const diffTime = loan.returnDate.getTime() - loan.borrowDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      
      setReadingSpeed(Math.round(totalDays / completedLoans.length));
    }
  };
  
  const navigateBack = () => {
    navigate('/students');
  };
  
  // abre o WhatsApp
  const openWhatsApp = () => {
    // verifica se existe número de telefone no campo contact ou number
    const phoneNumber = student?.contact || student?.number;
    
    if (phoneNumber) {
      // Remover caracteres não numéricos
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      // Abrir WhatsApp com o número
      window.open(`https://wa.me/55${formattedNumber}`, '_blank');
    }
  };

  const getStudentAccessCode = () => {
    if (!studentId) return '';
    const schoolId = student?.userId || currentUser?.uid;
    if (schoolId) {
      return `${schoolId}@${studentId}`;
    }
    return studentId;
  };

  // Gera o link de acesso do aluno
  const getStudentAccessLink = () => {
    const accessCode = getStudentAccessCode();
    if (!accessCode) return '';
    return `https://bibliotech.tech/student-dashboard/${accessCode}/`;
  };

  // copia o ID do aluno para a área de transferência
  const copyStudentId = async () => {
    if (!studentId) return;
    
    try {
      // Tentar usar a API moderna do clipboard primeiro
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(studentId);
        alert('ID do aluno copiado para a área de transferência!');
      } else {
        // Fallback: método tradicional usando textarea temporário
        const textArea = document.createElement('textarea');
        textArea.value = studentId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            alert('ID do aluno copiado para a área de transferência!');
          } else {
            throw new Error('Falha ao copiar usando execCommand');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Erro ao copiar ID do aluno:', error);
      // Como último recurso, mostrar o ID para o usuário copiar manualmente
      alert(`Não foi possível copiar automaticamente. ID do aluno: ${studentId}`);
    }
  };

  const copyAccessCode = async () => {
    const accessCode = getStudentAccessCode();
    if (!accessCode) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(accessCode);
        alert('Código de acesso copiado para a área de transferência!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = accessCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            alert('Código de acesso copiado para a área de transferência!');
          } else {
            throw new Error('Falha ao copiar usando execCommand');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Erro ao copiar código de acesso:', error);
      alert(`Não foi possível copiar automaticamente. Código: ${accessCode}`);
    }
  };

  // Copia o link de acesso do aluno
  const copyAccessLink = async () => {
    const link = getStudentAccessLink();
    if (!link) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        alert('Link de acesso copiado para a área de transferência!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            alert('Link de acesso copiado para a área de transferência!');
          } else {
            throw new Error('Falha ao copiar usando execCommand');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Erro ao copiar link de acesso:', error);
      alert(`Não foi possível copiar automaticamente. Link: ${link}`);
    }
  };

  // Envia o link de acesso por WhatsApp
  const sendAccessLinkWhatsApp = () => {
    const phoneNumber = student?.contact || student?.number;
    const link = getStudentAccessLink();
    
    if (!phoneNumber) {
      alert('Número de telefone não cadastrado para este aluno.');
      return;
    }
    
    if (!link) return;
    
    const message = `Olá! Aqui está seu link de acesso ao portal do aluno: ${link}`;
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${formattedNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };
  
  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={navigateBack}>Voltar para a Lista de Estudantes</button>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className={styles.error}>
        <p>Estudante não encontrado</p>
        <button onClick={navigateBack}>Voltar para a Lista de Estudantes</button>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Dashboard do Aluno: {student.name}</h2>
        <p className={styles.classroom}>Turma: {student.classroom}</p>
        <div className={styles.headerButtons}>
          <button 
            className={styles.backButton}
            onClick={navigateBack}
          >
            <span aria-hidden="true" className={styles.backButtonIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </span>
            Voltar para a Lista de Alunos
          </button>
          
          <button 
            className={styles.editButton}
            onClick={() => navigate(`/students/${studentId}/edit`)}
            title="Editar aluno"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </button>
          
          {(student.contact || student.number) && (
            <button 
              className={styles.whatsappButton}
              onClick={openWhatsApp}
            >
              Chamar no WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className={styles.studentIdSection}>
        <div className={styles.studentAccessInfo}>
          <div className={styles.studentIdInfo}>
            <span className={styles.studentIdLabel}>ID interno do aluno:</span>
            <span className={styles.studentIdValue}>{studentId}</span>
            <button 
              className={styles.copyButton} 
              onClick={copyStudentId}
              title="Copiar ID interno"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.375a2.25 2.25 0 0 1-2.25-2.25V6.108c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              Copiar
            </button>
          </div>

          <div className={styles.studentIdInfo}>
            <span className={styles.studentIdLabel}>Código de acesso (escola@aluno):</span>
            <span className={styles.studentIdValue}>{getStudentAccessCode()}</span>
            <button 
              className={styles.copyButton} 
              onClick={copyAccessCode}
              title="Copiar código de acesso"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.375a2.25 2.25 0 0 1-2.25-2.25V6.108c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              Copiar
            </button>
          </div>
          
          <div className={styles.studentLinkInfo}>
            <span className={styles.studentIdLabel}>Link de acesso:</span>
            <span className={styles.studentLinkValue}>{getStudentAccessLink()}</span>
            <button 
              className={styles.copyButton} 
              onClick={copyAccessLink}
              title="Copiar link para área de transferência"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.375a2.25 2.25 0 0 1-2.25-2.25V6.108c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              Copiar Link
            </button>
          </div>
        </div>
        
        <button 
          className={styles.sendLinkButton} 
          onClick={sendAccessLinkWhatsApp}
          title="Enviar link por WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: '18px', height: '18px', fill: 'white' }}>
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
          </svg>
          Enviar Link
        </button>
      </div>
      
      {loans.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Este aluno ainda não possui histórico de leitura</h3>
          <p>Quando o aluno começar a retirar livros, os dados aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total de Livros Lidos</h3>
              <div className={styles.value}>{totalBooksRead}</div>
              <p>Livros devolvidos até o momento</p>
            </div>
            
            <div className={styles.statCard}>
              <h3>Categoria Favorita</h3>
              <div className={styles.value}>{favoriteGenre || "Não definido"}</div>
              <p>Categoria mais lida pelo aluno</p>
            </div>
            
            <div className={styles.statCard}>
              <h3>Tempo Médio de Leitura</h3>
              <div className={styles.value}>
                {readingSpeed > 0 
                  ? `${readingSpeed} dias`
                  : "Não disponível"}
              </div>
              <p>Tempo médio entre retirada e devolução</p>
            </div>
            
            <div className={styles.statCard}>
              <h3>Melhor Trimestre</h3>
              <div className={styles.value}>{bestQuarter || "Não definido"}</div>
              <p>Trimestre com mais retiradas</p>
            </div>
          </div>
          
          {/* Seção de Recomendações */}
          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h3>Evolução de Leitura</h3>
              {monthlyLoansData.labels.length > 0 ? (
                <div className={styles.chart}>
                  <Line 
                    data={{
                      labels: monthlyLoansData.labels,
                      datasets: [
                        {
                          label: 'Livros retirados por mês',
                          data: monthlyLoansData.borrowed,
                          borderColor: '#4a90e2',
                          backgroundColor: 'rgba(74, 144, 226, 0.5)',
                          tension: 0.3
                        },
                        {
                          label: 'Livros lidos por mês',
                          data: monthlyLoansData.completed,
                          borderColor: '#50c878',
                          backgroundColor: 'rgba(80, 200, 120, 0.5)',
                          tension: 0.3
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            title: function(context) {
                              return context[0].label;
                            },
                            afterTitle: function(context) {
                              const datasetIndex = context[0].datasetIndex;
                              const index = context[0].dataIndex;
                              const value = context[0].parsed.y;
                              
                              if (datasetIndex === 1) { // Livros lidos
                                const otherDataset = context[0].chart.data.datasets[0];
                                const borrowedValue = otherDataset.data[index];
                                
                                if (typeof borrowedValue === 'number' && typeof value === 'number' && borrowedValue > 0) {
                                  const percentage = Math.round((value / borrowedValue) * 100);
                                  return `Taxa de conclusão: ${percentage}%`;
                                }
                              }
                              return '';
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={styles.noData}>Dados insuficientes</div>
              )}
            </div>
            
            <div className={styles.chartCard}>
              <h3>Categorias Lidas</h3>
              {genresData.labels.length > 0 ? (
                <div className={styles.chart}>
                  <Pie 
                    data={{
                      labels: genresData.labels,
                      datasets: [
                        {
                          data: genresData.data,
                          backgroundColor: [
                            '#4a90e2',
                            '#50c878',
                            '#f78fb3',
                            '#f5cd79',
                            '#778beb'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={styles.noData}>Dados insuficientes</div>
              )}
            </div>
            
            <div className={styles.chartCard}>
              <h3>Leitura por Trimestre</h3>
              {quarterlyData.labels.length > 0 ? (
                <div className={styles.chart}>
                  <Bar 
                    data={{
                      labels: quarterlyData.labels,
                      datasets: [
                        {
                          label: 'Livros por trimestre',
                          data: quarterlyData.data,
                          backgroundColor: '#50c878',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={styles.noData}>Dados insuficientes</div>
              )}
            </div>
            
            <div className={styles.chartCard}>
              <h3>Histórico de Empréstimos</h3>
              <div className={styles.loansList}>
                <table className={styles.loansTable}>
                  <thead>
                    <tr>
                      <th>Livro</th>
                      <th>Data Retirada</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.slice(0, 5).map(loan => (
                      <tr 
                        key={loan.id}
                        onClick={() => navigate(`/student-loan-detail/${loan.id}`)}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ver detalhes do empréstimo"
                      >
                        <td>{loan.bookTitle}</td>
                        <td>{format(loan.borrowDate, 'dd/MM/yyyy')}</td>
                        <td className={loan.status === 'returned' ? styles.returned : styles.active}>
                          {loan.status === 'returned' ? 'Devolvido' : 'Ativo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loans.length > 5 && (
                  <p className={styles.moreLoans}>Exibindo 5 dos {loans.length} empréstimos</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className={styles.recommendationsSection}>
        <BookRecommendations
          userId={currentUser?.uid || ''}
          studentId={studentId || ''}
          onBookClick={(bookId) => {
            // Navegar para detalhes do livro
            navigate(`/books/${bookId}`);
          }}
        />
      </div>
    </div>
  );
};

export default StudentDashboard; 