import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, BookOpen, TrendingUp, Star, Sparkles, ChevronLeft, ChevronRight, Filter, X, Lock, ArrowUpRight } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService, StudentDashboardData } from '../../services/studentService';
import { bookRecommendationService, RecommendationSection, BookWithStats } from '../../services/bookRecommendationService';
import { catalogShowcaseService } from '../../services/catalogShowcaseService';
import { useStudentHomeCache } from '../../hooks/useStudentHomeCache';
import { inferTierFromPlanValue, formatPlanDisplayName } from '../../services/subscriptionService';
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
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(cachedData?.dashboardData || null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(cachedData?.dashboardData?.subscriptionPlan ?? null);
  const [searchResults, setSearchResults] = useState<BookWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(!cachedData); // Iniciar como true se não houver cache
  const [catalogBlockResolved, setCatalogBlockResolved] = useState(false);
  const [showcaseBook, setShowcaseBook] = useState<BookWithStats | null>(null);
  const [showcaseLoaded, setShowcaseLoaded] = useState(false);
  
  // Estados para o filtro
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Plano efetivo: usa o que estiver em memória ou no cache do dashboard
  const effectiveSubscriptionPlan = useMemo(
    () => subscriptionPlan ?? cachedData?.dashboardData?.subscriptionPlan ?? null,
    [subscriptionPlan, cachedData?.dashboardData?.subscriptionPlan]
  );

  const planTier = useMemo(
    () => inferTierFromPlanValue(effectiveSubscriptionPlan ?? null),
    [effectiveSubscriptionPlan]
  );
  const isCatalogBlocked = useMemo(
    () => planTier === 'basic' || planTier === 'unknown',
    [planTier]
  );
  const planDisplayName = useMemo(
    () => formatPlanDisplayName(effectiveSubscriptionPlan ?? null),
    [effectiveSubscriptionPlan]
  );

  // Carregar showcase PRIMEIRO, antes de tudo (prioridade máxima)
  // Mas só se não estiver no cache
  useEffect(() => {
    if (!studentId || showcaseLoaded) return;
    
    // Se já tem no cache, não precisa buscar
    if (cachedData?.showcaseBook !== undefined) {
      setShowcaseBook(cachedData.showcaseBook);
      setShowcaseLoaded(true);
      return;
    }

    const loadShowcase = async () => {
      try {
        // Buscar aluno para obter userId
        const student = await studentService.findStudentById(studentId);
        if (student) {
          // Carregar showcase imediatamente (sem esperar nada)
          const showcase = await catalogShowcaseService.getShowcaseBook(student.userId);
          if (showcase) {
            setShowcaseBook(showcase);
            console.log('✅ Showcase carregado PRIMEIRO:', showcase.title);
          }
          setShowcaseLoaded(true);
        }
      } catch (error) {
        console.error('Erro ao carregar showcase:', error);
        setShowcaseLoaded(true); // Marcar como carregado mesmo em erro para evitar loop
      }
    };
    
    // Executar imediatamente, sem delay
    loadShowcase();
  }, [studentId, showcaseLoaded, cachedData]);

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    // Se já tem dados em cache e o catálogo não está bloqueado, usar eles
    if (cachedData && !isCatalogBlocked) {
      setRecommendationSections(cachedData.recommendationSections);
      setAllBooks(cachedData.allBooks);
      setDashboardData(cachedData.dashboardData || null);
      setSubscriptionPlan(cachedData.dashboardData?.subscriptionPlan ?? null);
      
      // Carregar showcase do cache se disponível
      if (cachedData.showcaseBook !== undefined) {
        setShowcaseBook(cachedData.showcaseBook);
        setShowcaseLoaded(true);
        console.log('✅ Showcase carregado do cache:', cachedData.showcaseBook?.title || 'nenhum');
      }
      
      setLoading(false);
      console.log('✅ Usando dados do catálogo em cache');
      return;
    }

    // Se já resolvemos que o catálogo está bloqueado para este aluno, não buscar mais nada
    if (isCatalogBlocked && catalogBlockResolved) {
      if (loading) {
        setLoading(false);
      }
      console.log('⛔ Catálogo bloqueado para este plano (cacheado), nenhuma nova consulta será feita');
      return;
    }

    // Se já sabemos o plano efetivo e ele bloqueia o catálogo, marcar como resolvido
    if (effectiveSubscriptionPlan && isCatalogBlocked && !catalogBlockResolved) {
      setCatalogBlockResolved(true);
      setLoading(false);
      console.log('⛔ Catálogo bloqueado para este plano, nenhum dado será buscado');
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

        // Carregar showcase em paralelo (se ainda não foi carregado)
        if (!showcaseLoaded) {
          catalogShowcaseService.getShowcaseBook(student.userId)
            .then(showcase => {
              if (showcase) {
                setShowcaseBook(showcase);
                console.log('✅ Showcase carregado em paralelo:', showcase.title);
              }
              setShowcaseLoaded(true);
            })
            .catch(error => {
              console.error('Erro ao carregar showcase em paralelo:', error);
              setShowcaseLoaded(true);
            });
        }

        // Buscar apenas o plano da escola
        const plan = await studentService.getSchoolSubscriptionPlan(student.userId);
        setSubscriptionPlan(plan);

        const tier = inferTierFromPlanValue(plan ?? null);

        // Se plano básico/indefinido, não carregar catálogo (e marcar como resolvido)
        if (tier === 'basic' || tier === 'unknown') {
          console.log('⛔ Plano básico/indefinido: catálogo bloqueado, não serão feitas consultas de livros.');
          setCatalogBlockResolved(true);
          setLoading(false);
          return;
        }

        // Buscar dados do dashboard (para estatísticas do aluno)
        const dashboardDataResponse = await studentService.getStudentDashboardData(studentId);
        setDashboardData(dashboardDataResponse);
        
        // Buscar todos os livros da escola e gerar recomendações
        const booksData = await bookRecommendationService.getAllBooksWithStats(student.userId);
        const recommendations = bookRecommendationService.generateRecommendations(booksData);
        
        // Atualizar estado
        setRecommendationSections(recommendations);
        setAllBooks(booksData);
        
        // Carregar showcase se ainda não foi carregado
        let showcaseToCache = showcaseBook;
        if (!showcaseLoaded) {
          const showcase = await catalogShowcaseService.getShowcaseBook(student.userId);
          if (showcase) {
            setShowcaseBook(showcase);
            showcaseToCache = showcase;
            console.log('✅ Showcase carregado junto com catálogo:', showcase.title);
          }
          setShowcaseLoaded(true);
        }
        
        // Salvar no cache (incluindo showcase)
        setCachedData({
          dashboardData: dashboardDataResponse || null,
          recommendationSections: recommendations,
          allBooks: booksData,
          showcaseBook: showcaseToCache || null
        });

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    // Só tentar carregar se ainda não resolvemos que está bloqueado
    if (!catalogBlockResolved) {
      loadData();
    }
  }, [studentId, navigate, cachedData, setCachedData, isCatalogBlocked, effectiveSubscriptionPlan, catalogBlockResolved]);

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
    
    // Aplicar filtro de categorias se houver (OR - qualquer uma das categorias)
    if (categoryFilters.length > 0) {
      results = results.filter(book => 
        book.genres && book.genres.some(bookGenre => 
          categoryFilters.some(filterCategory =>
            bookGenre.toLowerCase() === filterCategory.toLowerCase()
          )
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
    setCategoryFilters([]);
    setCategorySearchTerm('');
  };

  const handleToggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleSelectCategory = (category: string) => {
    // Toggle categoria - adiciona se não existe, remove se já existe
    const newFilters = categoryFilters.includes(category)
      ? categoryFilters.filter(f => f !== category)
      : [...categoryFilters, category];
    
    setCategoryFilters(newFilters);
    setCategorySearchTerm('');
    
    // Aplicar a busca automaticamente com os filtros
    setIsSearching(true);
    
    let results = searchTerm.trim() 
      ? bookRecommendationService.searchBooks(allBooks, searchTerm)
      : allBooks;
    
    // Aplicar filtros de categoria (OR - qualquer uma das categorias)
    if (newFilters.length > 0) {
      results = results.filter(book => 
        book.genres && book.genres.some(bookGenre => 
          newFilters.some(filterCategory =>
            bookGenre.toLowerCase() === filterCategory.toLowerCase()
          )
        )
      );
    }
    
    setSearchResults(results);
    setShowSearchResults(true);
    setIsSearching(false);
  };

  const handleRemoveCategoryFilter = (categoryToRemove: string) => {
    const newFilters = categoryFilters.filter(f => f !== categoryToRemove);
    setCategoryFilters(newFilters);
    
    // Re-aplicar a busca sem o filtro removido
    setIsSearching(true);
    
    let results = searchTerm.trim() 
      ? bookRecommendationService.searchBooks(allBooks, searchTerm)
      : allBooks;
    
    // Aplicar filtros restantes
    if (newFilters.length > 0) {
      results = results.filter(book => 
        book.genres && book.genres.some(bookGenre => 
          newFilters.some(filterCategory =>
            bookGenre.toLowerCase() === filterCategory.toLowerCase()
          )
        )
      );
    }
    
    setSearchResults(results);
    setShowSearchResults(newFilters.length > 0 || searchTerm.trim() ? true : false);
    setIsSearching(false);
  };

  const handleClearAllFilters = () => {
    setCategoryFilters([]);
    
    // Re-aplicar a busca sem filtros
    setIsSearching(true);
    
    let results = searchTerm.trim() 
      ? bookRecommendationService.searchBooks(allBooks, searchTerm)
      : allBooks;
    
    setSearchResults(results);
    setShowSearchResults(searchTerm.trim() ? true : false);
    setIsSearching(false);
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

  if (isCatalogBlocked) {
    return (
      <div className={styles.container}>
        {/* Header simples sem busca */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <BookOpen size={24} />
              <h1>Bibliotech</h1>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.featureBlockContainer}>
            <div className={styles.featureBlockBackdrop} aria-hidden="true">
              <div className={styles.catalogSkeleton}>
                <div className={styles.catalogRow}>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                </div>
                <div className={styles.catalogRow}>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                </div>
                <div className={styles.catalogRow}>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                  <span className={styles.catalogCard}></span>
                </div>
              </div>
            </div>

            <div className={styles.featureBlockCard}>
              <div className={styles.featureBlockHeader}>
                <div className={styles.featureBlockIcon}>
                  <Lock size={20} />
                </div>
                <div>
                  <span className={styles.featureBlockBadge}>
                    Plano da escola:{' '}
                    {planDisplayName.includes('Básico') ? (
                      <>
                        Plano <span className={styles.planNameHighlight}>Básico</span>
                      </>
                    ) : (
                      planDisplayName
                    )}
                  </span>
                  <h4>Catálogo de livros disponível no plano Intermediário</h4>
                </div>
              </div>
              <p className={styles.featureBlockDescription}>
                Com o catálogo do Bibliotech você busca, filtra e descobre livros em segundos, sem depender do balcão da biblioteca.
              </p>
              <ul className={styles.featureBlockHighlights}>
                <li>Busque por título, autor, categorias e muito mais</li>
                <li>Veja rapidamente quais livros estão disponíveis para retirada</li>
                <li>Receba recomendações personalizadas para o seu perfil de leitura</li>
                <li>Explore as categorias mais lidas da escola para descobrir novos livros favoritos</li>
              </ul>
              <a
                className={styles.featureBlockButton}
                href="https://bibliotech.tech/#planos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Conhecer plano intermediário
                <ArrowUpRight size={16} />
              </a>
              <span className={styles.featureBlockFootnote}>
                Disponível nos planos Bibliotech Intermediário e Avançado.
              </span>
            </div>
          </div>
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
                className={`${styles.filterButton} ${categoryFilters.length > 0 ? styles.filterButtonActive : ''}`}
                title="Filtrar por categoria"
              >
                <Filter size={20} />
                {categoryFilters.length > 0 && <span className={styles.filterBadge}>{categoryFilters.length}</span>}
              </button>

              {/* Dropdown de Filtros */}
              {showFilterDropdown && (
                <div className={styles.filterDropdown}>
                  <div className={styles.filterDropdownHeader}>
                    <h4>Filtrar por Categoria</h4>
                    {categoryFilters.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className={styles.clearAllFiltersButton}
                      >
                        Limpar todos
                      </button>
                    )}
                  </div>

                  {/* Filtros selecionados */}
                  {categoryFilters.length > 0 && (
                    <div className={styles.selectedFilters}>
                      {categoryFilters.map((filter) => (
                        <div key={filter} className={styles.filterTag}>
                          <span>{filter}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryFilter(filter)}
                            className={styles.removeFilterButton}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
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
                            categoryFilters.includes(category) ? styles.categoryItemActive : ''
                          }`}
                        >
                          <span>{category}</span>
                          {categoryFilters.includes(category) && (
                            <span className={styles.categoryCheckmark}>✓</span>
                          )}
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
        {/* Vitrine/Showcase - Livro em Destaque */}
        {!showSearchResults && showcaseBook && (
          <section className={styles.showcaseSection}>
            <div className={styles.showcaseBackground}>
              {showcaseBook.coverUrl && (
                <img 
                  src={showcaseBook.coverUrl} 
                  alt="" 
                  className={styles.showcaseBackgroundImage}
                />
              )}
              <div className={styles.showcaseGradient}></div>
            </div>
            
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseCover}>
                {showcaseBook.coverUrl ? (
                  <img src={showcaseBook.coverUrl} alt={showcaseBook.title} />
                ) : (
                  <div className={styles.showcaseCoverPlaceholder}>
                    <BookOpen size={60} />
                  </div>
                )}
              </div>

              <div className={styles.showcaseInfo}>
                <div className={styles.showcaseBadge}>Em Destaque</div>
                <h2 className={styles.showcaseTitle}>{showcaseBook.title}</h2>
                
                <div className={styles.showcaseMeta}>
                  {showcaseBook.authors.length > 0 && (
                    <span className={styles.showcaseAuthor}>
                      {showcaseBook.authors.join(', ')}
                    </span>
                  )}
                  {showcaseBook.genres.length > 0 && (
                    <>
                      <span className={styles.showcaseDivider}>•</span>
                      <span className={styles.showcaseGenre}>
                        {showcaseBook.genres[0]}
                      </span>
                    </>
                  )}
                  <span className={styles.showcaseDivider}>•</span>
                  <span className={styles.showcaseLoans}>
                    {showcaseBook.loanCount} empréstimos
                  </span>
                </div>

                {showcaseBook.synopsis && (
                  <p className={styles.showcaseSynopsis}>
                    {showcaseBook.synopsis}
                  </p>
                )}

                {showcaseBook.available && (
                  <div className={styles.showcaseAvailability}>
                    <div className={styles.availableDot}></div>
                    Disponível para empréstimo agora
                  </div>
                )}

                <button 
                  className={styles.showcaseButton}
                  onClick={() => handleBookClick(showcaseBook.id)}
                >
                  <BookOpen size={20} />
                  Ver Detalhes e Reservar
                </button>
              </div>
            </div>
          </section>
        )}

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
                {categoryFilters.length > 0 && (
                  <div className={styles.activeFilters}>
                    {categoryFilters.map((filter) => (
                      <div key={filter} className={styles.activeFilter}>
                        <span>Categoria: {filter}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryFilter(filter)}
                          className={styles.removeActiveFilterButton}
                          title="Remover filtro"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
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

