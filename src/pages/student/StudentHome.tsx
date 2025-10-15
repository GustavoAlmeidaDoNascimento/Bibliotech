import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, BookOpen, TrendingUp, Star, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService, StudentDashboardData } from '../../services/studentService';
import { bookRecommendationService, RecommendationSection, BookWithStats } from '../../services/bookRecommendationService';
import styles from './StudentHome.module.css';

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [recommendationSections, setRecommendationSections] = useState<RecommendationSection[]>([]);
  const [allBooks, setAllBooks] = useState<BookWithStats[]>([]);
  const [searchResults, setSearchResults] = useState<BookWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    const loadData = async () => {
      try {
        // Buscar dados do aluno para obter schoolId
        const student = await studentService.findStudentById(studentId);
        if (!student) {
          console.error('Aluno não encontrado');
          return;
        }

        // Buscar dados do dashboard (para estatísticas do aluno)
        const dashboardData = await studentService.getStudentDashboardData(studentId);
        if (dashboardData) {
          setDashboardData(dashboardData);
        }

        // Buscar todos os livros da escola e gerar recomendações
        const booksData = await bookRecommendationService.getAllBooksWithStats(student.userId);
        const recommendations = bookRecommendationService.generateRecommendations(booksData);
        setAllBooks(booksData);
        setRecommendationSections(recommendations);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, navigate]);

  const getSectionIcon = (title: string) => {
    if (title.includes('Mais Retirados') || title.includes('Popular')) return <TrendingUp size={20} />;
    if (title.includes('Novidades')) return <Sparkles size={20} />;
    if (title.includes('Disponíveis')) return <BookOpen size={20} />;
    return <Star size={20} />;
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    const results = bookRecommendationService.searchBooks(allBooks, searchTerm);
    setSearchResults(results);
    setShowSearchResults(true);
    setIsSearching(false);
  };

  const handleSearchInputFocus = () => {
    if (searchTerm.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const scrollCarousel = (direction: 'left' | 'right', sectionIndex: number) => {
    const carousel = document.querySelector(`[data-carousel="${sectionIndex}"]`) as HTMLElement;
    if (carousel) {
      const scrollAmount = 200; // Quantidade de pixels para scroll
      if (direction === 'left') {
        carousel.scrollLeft -= scrollAmount;
      } else {
        carousel.scrollLeft += scrollAmount;
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando catálogo...</p>
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header com Logo e Busca */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <BookOpen size={24} />
            <h1>Bibliotech</h1>
          </div>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Buscar livros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleSearchInputFocus}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.clearButton}
              >
                ×
              </button>
            )}
            {searchTerm && (
              <button
                type="submit"
                disabled={isSearching}
                className={styles.searchButton}
              >
                {isSearching ? (
                  <div className={styles.spinner}></div>
                ) : (
                  <Search size={16} />
                )}
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className={styles.main}>
        {/* Resultados de Busca */}
        {showSearchResults && (
          <section className={styles.searchResultsSection}>
            <div className={styles.searchResultsHeader}>
              <h2>
                {searchResults.length > 0 
                  ? `${searchResults.length} resultado(s) para "${searchTerm}"`
                  : `Nenhum resultado para "${searchTerm}"`
                }
              </h2>
              <button 
                onClick={handleClearSearch}
                className={styles.backToRecommendationsButton}
              >
                ← Voltar às recomendações
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className={styles.booksGrid}>
                {searchResults.map((book) => (
                  <div
                    key={book.id}
                    className={styles.bookCard}
                    onClick={() => handleBookClick(book.id)}
                  >
                    <div className={styles.bookCoverWrapper}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
                      ) : (
                        <div className={styles.bookCoverPlaceholder}>
                          <BookOpen size={40} />
                        </div>
                      )}
                      {!book.available && (
                        <div className={styles.unavailableBadge}>Indisponível</div>
                      )}
                    </div>
                    <div className={styles.bookInfo}>
                      <h3 className={styles.bookTitle}>{book.title}</h3>
                      <p className={styles.bookAuthor}>
                        {book.authors.length > 0 ? book.authors.join(', ') : 'Autor não informado'}
                      </p>
                      {book.genres.length > 0 && (
                        <div className={styles.bookGenres}>
                          {book.genres.slice(0, 2).map((genre: string) => (
                            <span key={genre} className={styles.genreTag}>{genre}</span>
                          ))}
                          {book.genres.length > 2 && (
                            <span className={styles.moreGenres}>+{book.genres.length - 2}</span>
                          )}
                        </div>
                      )}
                      <div className={styles.bookStats}>
                        <BookOpen size={14} />
                        <span>{book.loanCount} empréstimos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <BookOpen size={48} />
                <p>Nenhum livro encontrado</p>
                <p>Tente outro termo de busca</p>
              </div>
            )}
          </section>
        )}

        {/* Seções de Recomendação */}
        {!showSearchResults && recommendationSections.map((section, index) => (
          <section key={index} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {getSectionIcon(section.title)}
              {section.emoji} {section.title}
            </h2>
            <div className={styles.carouselContainer}>
              <button
                className={styles.navButton}
                onClick={() => scrollCarousel('left', index)}
                aria-label="Voltar livros"
              >
                <ChevronLeft size={20} />
              </button>
              <div 
                className={styles.booksScroll}
                data-carousel={index}
              >
                {section.books.map((book) => (
                  <div
                    key={book.id}
                    className={styles.bookCard}
                    onClick={() => handleBookClick(book.id)}
                  >
                    <div className={styles.bookCoverWrapper}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
                      ) : (
                        <div className={styles.bookCoverPlaceholder}>
                          <BookOpen size={40} />
                        </div>
                      )}
                      {!book.available && (
                        <div className={styles.unavailableBadge}>Indisponível</div>
                      )}
                    </div>
                    <div className={styles.bookInfo}>
                      <h3 className={styles.bookTitle}>{book.title}</h3>
                      <p className={styles.bookAuthor}>
                        {book.authors.length > 0 ? book.authors.join(', ') : 'Autor não informado'}
                      </p>
                      {book.genres.length > 0 && (
                        <div className={styles.bookGenres}>
                          {book.genres.slice(0, 2).map((genre: string) => (
                            <span key={genre} className={styles.genreTag}>{genre}</span>
                          ))}
                          {book.genres.length > 2 && (
                            <span className={styles.moreGenres}>+{book.genres.length - 2}</span>
                          )}
                        </div>
                      )}
                      <div className={styles.bookStats}>
                        <BookOpen size={14} />
                        <span>{book.loanCount} empréstimos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.navButton}
                onClick={() => scrollCarousel('right', index)}
                aria-label="Avançar livros"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        ))}
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default StudentHome;

