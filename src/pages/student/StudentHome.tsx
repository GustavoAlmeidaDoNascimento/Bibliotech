import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, BookOpen, TrendingUp, Star, Sparkles, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService } from '../../services/studentService';
import { bookRecommendationService, RecommendationSection, BookWithStats } from '../../services/bookRecommendationService';
import { useStudentHomeCache } from '../../hooks/useStudentHomeCache';
import styles from './StudentHome.module.css';

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Usar o hook de cache
  const { cachedData, setCachedData } = useStudentHomeCache(studentId || '');
  
  const [recommendationSections, setRecommendationSections] = useState<RecommendationSection[]>(cachedData?.recommendationSections || []);
  const [allBooks, setAllBooks] = useState<BookWithStats[]>(cachedData?.allBooks || []);
  const [searchResults, setSearchResults] = useState<BookWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(!cachedData); // Iniciar como true se não houver cache
  
  // Estados para o filtro
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    // Se já tem dados em cache, usar eles
    if (cachedData) {
      setRecommendationSections(cachedData.recommendationSections);
      setAllBooks(cachedData.allBooks);
      setLoading(false);
      console.log('✅ Usando dados do catálogo em cache');
      return;
    }

    // Se não tem cache, buscar do servidor
    const loadData = async () => {
      try {
        setLoading(true); // Garantir que loading está ativo
        console.log('🔄 Buscando dados do catálogo do servidor...');
        
        // Buscar dados do aluno para obter schoolId
        const student = await studentService.findStudentById(studentId);
        if (!student) {
          console.error('Aluno não encontrado');
          setLoading(false);
          return;
        }

        // Buscar dados do dashboard (para estatísticas do aluno)
        const dashboardData = await studentService.getStudentDashboardData(studentId);
        
        // Buscar todos os livros da escola e gerar recomendações
        const booksData = await bookRecommendationService.getAllBooksWithStats(student.userId);
        const recommendations = bookRecommendationService.generateRecommendations(booksData);
        
        // Atualizar estado
        setRecommendationSections(recommendations);
        setAllBooks(booksData);

        // Salvar no cache
        setCachedData({
          dashboardData,
          recommendationSections: recommendations,
          allBooks: booksData
        });

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, navigate, cachedData, setCachedData]);

  // Extrair todas as categorias únicas dos livros
  useEffect(() => {
    if (allBooks.length > 0) {
      const categories = new Set<string>();
      allBooks.forEach(book => {
        if (book.genres && Array.isArray(book.genres)) {
          book.genres.forEach(genre => {
            if (genre && genre.trim()) {
              categories.add(genre.trim());
            }
          });
        }
      });
      setAllCategories(Array.from(categories).sort());
    }
  }, [allBooks]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const getSectionIcon = (title: string) => {
    if (title.includes('Mais Retirados') || title.includes('Popular')) return <TrendingUp size={20} />;
    if (title.includes('Novidades')) return <Sparkles size={20} />;
    if (title.includes('Disponíveis')) return <BookOpen size={20} />;
    return <Star size={20} />;
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    
    // Buscar livros com base no termo de pesquisa
    let results = searchTerm.trim() 
      ? bookRecommendationService.searchBooks(allBooks, searchTerm)
      : allBooks;
    
    // Aplicar filtro de categoria se houver
    if (categoryFilter) {
      results = results.filter(book => 
        book.genres && book.genres.some(genre => 
          genre.toLowerCase() === categoryFilter.toLowerCase()
        )
      );
    }
    
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
    setCategoryFilter('');
    setCategorySearchTerm('');
  };

  const handleToggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleSelectCategory = (category: string) => {
    setCategoryFilter(category);
    setShowFilterDropdown(false);
    setCategorySearchTerm('');
    // Aplicar a busca automaticamente
    setTimeout(() => handleSearch(), 0);
  };

  const handleRemoveCategoryFilter = () => {
    setCategoryFilter('');
    // Re-aplicar a busca sem o filtro
    setTimeout(() => handleSearch(), 0);
  };

  // Filtrar categorias com base na busca
  const filteredCategories = allCategories.filter(category =>
    category.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const scrollCarousel = (direction: 'left' | 'right', sectionIndex: number) => {
    const carousel = document.querySelector(`[data-carousel="${sectionIndex}"]`) as HTMLElement;
    if (carousel) {
      const scrollAmount = 200; // Quantidade de pixels para scroll
      const currentScroll = carousel.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      carousel.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Header Skeleton */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <BookOpen size={24} />
              <h1>Bibliotech</h1>
            </div>
            <div className={styles.searchSkeleton}></div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className={styles.main}>
          {/* Simular 4 seções de carrosséis */}
          {[1, 2, 3, 4].map((sectionIndex) => (
            <section key={sectionIndex} className={styles.section}>
              <div className={styles.sectionTitleSkeleton}></div>
              <div className={styles.carouselContainer}>
                <div className={styles.booksScroll}>
                  {/* Simular 6 cards de livros */}
                  {[1, 2, 3, 4, 5, 6].map((cardIndex) => (
                    <div key={cardIndex} className={styles.bookCardSkeleton}>
                      <div className={styles.bookCoverSkeleton}></div>
                      <div className={styles.bookInfoSkeleton}>
                        <div className={styles.bookTitleSkeleton}></div>
                        <div className={styles.bookAuthorSkeleton}></div>
                        <div className={styles.bookGenresSkeleton}>
                          <div className={styles.genreTagSkeleton}></div>
                          <div className={styles.genreTagSkeleton}></div>
                        </div>
                        <div className={styles.bookStatsSkeleton}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </main>

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
          <div className={styles.searchContainer}>
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

            {/* Botão de Filtro */}
            <div className={styles.filterContainer} ref={filterDropdownRef}>
              <button
                type="button"
                onClick={handleToggleFilterDropdown}
                className={`${styles.filterButton} ${categoryFilter ? styles.filterButtonActive : ''}`}
                title="Filtrar por categoria"
              >
                <Filter size={20} />
                {categoryFilter && <span className={styles.filterBadge}>1</span>}
              </button>

              {/* Dropdown de Filtros */}
              {showFilterDropdown && (
                <div className={styles.filterDropdown}>
                  <div className={styles.filterDropdownHeader}>
                    <h4>Filtrar por Categoria</h4>
                  </div>

                  {/* Filtro selecionado */}
                  {categoryFilter && (
                    <div className={styles.selectedFilters}>
                      <div className={styles.filterTag}>
                        <span>{categoryFilter}</span>
                        <button
                          type="button"
                          onClick={handleRemoveCategoryFilter}
                          className={styles.removeFilterButton}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Campo de busca de categorias */}
                  <div className={styles.categorySearchContainer}>
                    <Search size={16} className={styles.categorySearchIcon} />
                    <input
                      type="text"
                      placeholder="Buscar categoria..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className={styles.categorySearchInput}
                    />
                  </div>

                  {/* Lista de categorias */}
                  <div className={styles.categoriesList}>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleSelectCategory(category)}
                          className={`${styles.categoryItem} ${
                            categoryFilter === category ? styles.categoryItemActive : ''
                          }`}
                        >
                          {category}
                        </button>
                      ))
                    ) : (
                      <div className={styles.noCategoriesFound}>
                        <p>Nenhuma categoria encontrada</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className={styles.main}>
        {/* Resultados de Busca */}
        {showSearchResults && (
          <section className={styles.searchResultsSection}>
            <div className={styles.searchResultsHeader}>
              <div className={styles.searchResultsInfo}>
                <h2>
                  {searchResults.length > 0 
                    ? `${searchResults.length} resultado(s)${searchTerm ? ` para "${searchTerm}"` : ''}`
                    : `Nenhum resultado${searchTerm ? ` para "${searchTerm}"` : ''}`
                  }
                </h2>
                {categoryFilter && (
                  <div className={styles.activeFilter}>
                    <span>Categoria: {categoryFilter}</span>
                    <button
                      type="button"
                      onClick={handleRemoveCategoryFilter}
                      className={styles.removeActiveFilterButton}
                      title="Remover filtro"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
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
                      {book.available && (
                        <div className={styles.availableBadge}>À pronta-entrega</div>
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
              {section.title}
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
                      {book.available && (
                        <div className={styles.availableBadge}>À pronta-entrega</div>
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

