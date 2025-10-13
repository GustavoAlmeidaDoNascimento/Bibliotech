import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Tag } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService, StudentDashboardData } from '../../services/studentService';
import styles from './BookDetails.module.css';

interface BookDetails {
  id: string;
  title: string;
  author: string;
  genres: string[];
  synopsis: string;
  loanCount: number;
  available: boolean;
  coverUrl?: string;
}

const BookDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (!studentId || !bookId) {
      navigate('/student-id-input');
      return;
    }

    const loadBookDetails = async () => {
      try {
        const data = await studentService.getStudentDashboardData(studentId);
        if (data) {
          const foundBook = data.books.find(b => b.id === bookId);
          if (foundBook) {
            setBook({
              id: foundBook.id || bookId,
              title: foundBook.title,
              author: (foundBook.authors && foundBook.authors.length > 0) ? foundBook.authors[0] : 'Autor não informado',
              genres: foundBook.genres || [],
              synopsis: 'Uma história emocionante que vai prender sua atenção do início ao fim. Este livro explora temas profundos e relevantes de uma forma única e cativante.',
              loanCount: Math.floor(Math.random() * 250) + 50,
              available: Math.random() > 0.3,
              coverUrl: undefined
            });
          } else {
            // Livro não encontrado
            navigate(`/student-dashboard/${studentId}/home`);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do livro:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookDetails();
  }, [studentId, bookId, navigate]);

  const handleGoBack = () => {
    navigate(`/student-dashboard/${studentId}/home`);
  };

  const handleReserve = async () => {
    if (!book?.available || reserving) return;

    setReserving(true);
    
    // Simular reserva
    setTimeout(() => {
      alert(`Livro "${book.title}" reservado com sucesso! Retire-o na biblioteca.`);
      setReserving(false);
      navigate(`/student-dashboard/${studentId}/home`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes...</p>
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Livro não encontrado</h2>
          <button onClick={handleGoBack} className={styles.backToHomeButton}>
            Voltar ao Catálogo
          </button>
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={handleGoBack}>
            <ArrowLeft size={24} />
          </button>
          <h1>Detalhes do Livro</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Book Cover */}
        <div className={styles.coverSection}>
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
          ) : (
            <div className={styles.bookCoverPlaceholder}>
              <BookOpen size={60} />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className={styles.infoSection}>
          <h2 className={styles.title}>{book.title}</h2>
          <p className={styles.author}>{book.author}</p>
          
          {book.genres.length > 0 && (
            <div className={styles.genreBadge}>
              {book.genres[0]}
            </div>
          )}

          <div className={styles.stats}>
            <BookOpen size={18} />
            <span>{book.loanCount} retiradas</span>
          </div>
        </div>

        {/* Synopsis */}
        <div className={styles.synopsisSection}>
          <h3 className={styles.synopsisTitle}>
            <BookOpen size={20} />
            Sobre o livro
          </h3>
          <p className={styles.synopsisText}>{book.synopsis}</p>
        </div>

        {/* Reserve Button */}
        <button
          className={`${styles.reserveButton} ${!book.available ? styles.reserveButtonDisabled : ''}`}
          onClick={handleReserve}
          disabled={!book.available || reserving}
        >
          {reserving ? 'Reservando...' : book.available ? 'Reservar pra mim' : 'Indisponível'}
        </button>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default BookDetailsPage;

