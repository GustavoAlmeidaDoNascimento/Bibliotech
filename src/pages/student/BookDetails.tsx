import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Tag, Clock, Heart } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService } from '../../services/studentService';
import styles from './BookDetails.module.css';

interface BookWithGenres {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  tags: string[];
  genres?: string[];
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  userId: string;
  description?: string;
  synopsis?: string;
  coverUrl?: string;
  createdAt: any;
  updatedAt: any;
}

const BookDetails: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  const [book, setBook] = useState<BookWithGenres | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId || !bookId) {
      navigate(`/student-dashboard/${studentId}/home`);
      return;
    }

    const loadBookDetails = async () => {
      try {
        // Buscar dados do aluno para obter schoolId
        const student = await studentService.findStudentById(studentId);
        if (!student) {
          console.error('Aluno não encontrado');
          setError('Aluno não encontrado');
          setLoading(false);
          return;
        }

        // Buscar detalhes do livro
        const bookData = await studentService.getBookById(bookId, student.userId);
        if (bookData) {
          setBook(bookData);
        } else {
          setError('Livro não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do livro:', error);
        setError('Erro ao carregar detalhes do livro');
      } finally {
        setLoading(false);
      }
    };

    loadBookDetails();
  }, [studentId, bookId, navigate]);

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/home`);
  };

  const handleReserve = () => {
    navigate(`/student-dashboard/${studentId}/reserve/${bookId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do livro...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <h1>Erro</h1>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <BookOpen size={64} className={styles.errorIcon} />
            <h2>Livro não encontrado</h2>
            <p>{error || 'O livro solicitado não foi encontrado.'}</p>
            <button onClick={handleBack} className={styles.backToHomeButton}>
              Voltar ao Início
            </button>
          </div>
        </main>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1>Detalhes do Livro</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.bookContainer}>
          {/* Cover Section */}
          <div className={styles.coverSection}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <BookOpen size={64} />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className={styles.bookInfo}>
            <h2 className={styles.bookTitle}>{book.title}</h2>
            <p className={styles.bookAuthor}>
              <User size={16} />
              {book.author || 'Autor não informado'}
            </p>

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div className={styles.tagsSection}>
                <h3>
                  <Tag size={16} />
                  Gêneros
                </h3>
                <div className={styles.tagsList}>
                  {book.genres.map((genre, index) => (
                    <span key={index} className={styles.tag}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {book.synopsis && (
              <div className={styles.synopsisSection}>
                <h3>
                  <BookOpen size={16} />
                  Sinopse
                </h3>
                <p className={styles.synopsis}>{book.synopsis}</p>
              </div>
            )}

            {/* Book Stats */}
            <div className={styles.statsSection}>
              <h3>
                <Clock size={16} />
                Informações
              </h3>
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Disponível:</span>
                  <span className={styles.statValue}>
                    {book.available ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Cópias totais:</span>
                  <span className={styles.statValue}>{book.totalCopies}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Cópias disponíveis:</span>
                  <span className={styles.statValue}>{book.availableCopies}</span>
                </div>
              </div>
            </div>

            {/* Reserve Button */}
            <button 
              onClick={handleReserve}
              className={styles.reserveButton}
            >
              <Heart size={20} />
              {book.availableCopies > 0 ? 'Reservar para mim' : 'Entrar na fila de espera'}
            </button>

            <div className={styles.reserveInfo}>
              {book.availableCopies > 0 ? (
                <p className={styles.availableMessage}>
                  ✅ Este livro está disponível à pronta entrega! Você pode reservá-lo para pegar quando quiser.
                </p>
              ) : (
                <div className={styles.waitlistInfo}>
                  <p className={styles.waitlistMessage}>
                    📋 Este livro está emprestado. Ao reservar, você entrará na fila de espera.
                  </p>
                  <p className={styles.waitlistDetails}>
                    Quando o livro for devolvido, você será notificado via whatsapp para pegá-lo antes dos outros.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default BookDetails;