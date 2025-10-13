import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Filter, X, BookOpen, Users, Calendar } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { bookRecommendationService, BookWithStats } from '../../services/bookRecommendationService';
import { studentService } from '../../services/studentService';
import styles from './BookSearch.module.css';

interface FilterOptions {
  genre: string;
  available: boolean | null;
  minLoans: number;
}

const BookSearch: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<BookWithStats[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    genre: '',
    available: null,
    minLoans: 0
  });
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    loadBooks();
  }, [studentId, navigate]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do aluno para obter schoolId
      const student = await studentService.findStudentById(studentId!);
      if (!student) {
        console.error('Aluno não encontrado');
        return;
      }

      // Buscar todos os livros da escola
      const allBooks = await bookRecommendationService.getAllBooksWithStats(student.userId);
      setBooks(allBooks);
      setFilteredBooks(allBooks);

      // Extrair gêneros únicos
      const genres = Array.from(new Set(allBooks.flatMap(book => book.genres)));
      setAvailableGenres(genres.sort());

    } catch (error) {
      console.error('Erro ao carregar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearching(true);
    
    // Aplicar busca
    let results = bookRecommendationService.searchBooks(books, searchTerm);
    
    // Aplicar filtros
    if (filters.genre) {
      results = results.filter(book => 
        book.genres.some(genre => genre.toLowerCase().includes(filters.genre.toLowerCase()))
      );
    }
    
    if (filters.available !== null) {
      results = results.filter(book => book.available === filters.available);
    }
    
    if (filters.minLoans > 0) {
      results = results.filter(book => book.loanCount >= filters.minLoans);
    }
    
    setFilteredBooks(results);
    setSearching(false);
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      available: null,
      minLoans: 0
    });
    setSearchTerm('');
    setFilteredBooks(books);
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando livros...</p>
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
          <div className={styles.logo}>
            <BookOpen size={24} />
            <h1>Bibliotech</h1>
          </div>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/student-dashboard/${studentId}/home`)}
          >
            ← Voltar
          </button>
        </div>
      </header>

      {/* Busca e Filtros */}
      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Buscar por título, autor ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <button 
          className={styles.filterButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filtros
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className={styles.filtersContainer}>
          <div className={styles.filterRow}>
            <label>Gênero:</label>
            <select 
              value={filters.genre}
              onChange={(e) => setFilters({...filters, genre: e.target.value})}
              className={styles.filterSelect}
            >
              <option value="">Todos</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterRow}>
            <label>Disponibilidade:</label>
            <select 
              value={filters.available === null ? '' : filters.available.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters, 
                  available: value === '' ? null : value === 'true'
                });
              }}
              className={styles.filterSelect}
            >
              <option value="">Todos</option>
              <option value="true">Disponível</option>
              <option value="false">Indisponível</option>
            </select>
          </div>
          
          <div className={styles.filterRow}>
            <label>Mín. empréstimos:</label>
            <input
              type="number"
              min="0"
              value={filters.minLoans}
              onChange={(e) => setFilters({...filters, minLoans: parseInt(e.target.value) || 0})}
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterActions}>
            <button className={styles.clearButton} onClick={clearFilters}>
              <X size={16} />
              Limpar
            </button>
            <button className={styles.searchButton} onClick={handleSearch} disabled={searching}>
              {searching ? 'Buscando...' : 'Pesquisar'}
            </button>
          </div>
        </div>
      )}

      {/* Resultados */}
      <main className={styles.main}>
        <div className={styles.resultsHeader}>
          <h2>
            {searchTerm || Object.values(filters).some(v => v !== '' && v !== null && v !== 0) 
              ? `${filteredBooks.length} resultado(s) encontrado(s)` 
              : `${filteredBooks.length} livros na biblioteca`
            }
          </h2>
        </div>

        {filteredBooks.length === 0 ? (
          <div className={styles.noResults}>
            <BookOpen size={48} />
            <p>Nenhum livro encontrado</p>
            <p>Tente ajustar os filtros ou termos de busca</p>
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {filteredBooks.map((book) => (
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
                      <BookOpen size={32} />
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
                      {book.genres.slice(0, 2).map(genre => (
                        <span key={genre} className={styles.genreTag}>{genre}</span>
                      ))}
                      {book.genres.length > 2 && (
                        <span className={styles.moreGenres}>+{book.genres.length - 2}</span>
                      )}
                    </div>
                  )}
                  
                  <div className={styles.bookStats}>
                    <div className={styles.stat}>
                      <Users size={14} />
                      <span>{book.loanCount} empréstimos</span>
                    </div>
                    <div className={styles.stat}>
                      <Calendar size={14} />
                      <span>{formatDate(book.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default BookSearch;
