import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTags } from '../../contexts/TagsContext';
import { useInfiniteScroll, useBarcodeGenerator } from '../../hooks';
import { useOptimizedSearch, type Book } from '../../hooks/useOptimizedSearch';
import { PlusIcon, TrashIcon, FunnelIcon, XMarkIcon, ListBulletIcon, Squares2X2Icon, ArrowsUpDownIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import styles from './Books.module.css';

type SortOption = 'alphabetical' | 'dateAdded';

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  
  const { currentUser } = useAuth();
  const { getTagsByIds, tags } = useTags();
  const navigate = useNavigate();
  const { generatePDF, isGenerating } = useBarcodeGenerator();

  // Hook de busca otimizada
  const {
    filters,
    filteredBooks,
    hasActiveFilters,
    isSearching,
    updateFilter,
    clearFilters: clearSearchFilters,
    addTagFilter,
    removeTagFilter,
    filteredCount
  } = useOptimizedSearch({
    books,
    debounceMs: 300
  });

  const getDisplayCode = (book: Book): string => {
    if (book.codes && book.codes.length > 0) {
      return book.codes.length > 1 ? `${book.codes.length} cópias` : book.codes[0];
    }
    return book.code || '-';
  };

  const getAllCodes = (book: Book): string[] => {
    if (book.codes && book.codes.length > 0) {
      return book.codes;
    }
    return book.code ? [book.code] : [];
  };

  // Função para renderizar tags
  const renderTags = (book: Book) => {
    if (!book.tags || book.tags.length === 0) return '-';
    
    const tags = getTagsByIds(book.tags);
    if (tags.length === 0) return '-';

    return (
      <div className={styles.tagContainer}>
        {tags.map(tag => (
          <span 
            key={tag.id} 
            className={styles.bookTag}
            style={{ 
              backgroundColor: tag.color + '20',
              borderColor: tag.color,
              color: tag.color
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    );
  };

  const fetchBooks = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const q = query(booksRef);
      const querySnapshot = await getDocs(q);
      
      const fetchedBooks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Ordenação dos livros filtrados
  const sortBooks = useCallback((booksToSort: Book[]) => {
    const booksCopy = [...booksToSort];

    if (sortBy === 'alphabetical') {
      return booksCopy.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Sort by date added (createdAt timestamp) or by ID if createdAt is not available
      return booksCopy.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt - a.createdAt; // newest first
        } else {
          return a.id.localeCompare(b.id); // fallback to id
        }
      });
    }
  }, [sortBy]);

  const sortedBooks = useMemo(() => sortBooks(filteredBooks), [filteredBooks, sortBooks]);

  // Hook de paginação com scroll infinito
  const {
    displayedItems: displayedBooks,
    isLoading: isLoadingMore,
    loadingRef,
    resetPagination
  } = useInfiniteScroll({
    items: sortedBooks,
    itemsPerPage: 30,
    threshold: 200,
    enabled: !loading
  });

  // Reset pagination when filters or sort change
  useEffect(() => {
    resetPagination();
  }, [filteredBooks, sortBy, resetPagination]);

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    const currentBooks = displayedBooks;
    setSelectedBooks(
      selectedBooks.length === currentBooks.length
        ? []
        : currentBooks.map(book => book.id)
    );
  };

  const handleDeleteSelected = async () => {
    if (!currentUser || !window.confirm('Tem certeza que deseja excluir os livros selecionados?')) return;

    try {
      setDeleting(true);
      for (const bookId of selectedBooks) {
        const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
        await deleteDoc(bookRef);
      }
      await fetchBooks();
      setSelectedBooks([]);
    } catch (error) {
      console.error('Error deleting books:', error);
      alert('Erro ao excluir livros. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateBarcodes = async () => {
    if (selectedBooks.length === 0) {
      alert('Selecione pelo menos um livro para gerar etiquetas.');
      return;
    }

    try {
      // Filtrar livros selecionados
      const selectedBooksData = books.filter(book => selectedBooks.includes(book.id));
      
      // Gerar PDF com etiquetas
      await generatePDF(selectedBooksData);
      
      // Limpar seleção após sucesso
      setSelectedBooks([]);
      
      // Mostrar feedback de sucesso
      const totalCodes = selectedBooksData.reduce((total, book) => {
        return total + getAllCodes(book).length;
      }, 0);
      
      alert(`Etiquetas geradas com sucesso! ${totalCodes} etiqueta(s) de ${selectedBooksData.length} livro(s) pronta(s) para impressão e recorte.`);
      
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      alert('Erro ao gerar etiquetas. Tente novamente.');
    }
  };

  const handleExportToExcel = () => {
    try {
      // Preparar os dados para exportação
      const dataToExport = books.map((book, index) => {
        const bookTags = book.tags ? getTagsByIds(book.tags).map(tag => tag.name).join(', ') : '';
        const bookAuthors = book.authors 
          ? (Array.isArray(book.authors) ? book.authors.join(', ') : book.authors)
          : '';
        const bookGenres = book.genres ? book.genres.join(', ') : '';
        const bookCodes = getAllCodes(book).join(', ') || '';

        return {
          '#': index + 1,
          'Título': book.title || '',
          'Código(s)': bookCodes,
          'Autor(es)': bookAuthors,
          'Editora': book.publisher || '',
          'Gêneros': bookGenres,
          'Tags': bookTags,
          'Prateleira': book.shelf || '',
          'Coleção': book.collection || '',
          'Quantidade': book.quantity || 1,
          'Data de Aquisição': book.acquisitionDate || '',
          'Descrição': book.description || ''
        };
      });

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      
      // Adicionar a planilha ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Livros');

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 5 },   // #
        { wch: 30 },  // Título
        { wch: 15 },  // Código(s)
        { wch: 25 },  // Autor(es)
        { wch: 20 },  // Editora
        { wch: 20 },  // Gêneros
        { wch: 20 },  // Tags
        { wch: 15 },  // Prateleira
        { wch: 15 },  // Coleção
        { wch: 12 },  // Quantidade
        { wch: 15 },  // Data de Aquisição
        { wch: 30 }   // Descrição
      ];
      ws['!cols'] = colWidths;

      // Gerar nome do arquivo com data atual
      const hoje = new Date();
      const dataFormatada = hoje.toLocaleDateString('pt-BR').replace(/\//g, '-');
      const nomeArquivo = `acervo-biblioteca-${dataFormatada}.xlsx`;

      // Fazer download do arquivo
      XLSX.writeFile(wb, nomeArquivo);
      
      // Mostrar mensagem de sucesso
      alert(`Arquivo exportado com sucesso! ${books.length} livros foram incluídos no arquivo "${nomeArquivo}".`);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Acervo da Biblioteca</h2>
        <div className={styles.headerActions}>
          {selectedBooks.length > 0 && (
            <>
              <button
                className={styles.selectAllButton}
                onClick={handleSelectAll}
              >
                {selectedBooks.length === displayedBooks.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <button
                className={styles.printButton}
                onClick={handleGenerateBarcodes}
                disabled={isGenerating}
                title="Gerar etiquetas com códigos de barras dos livros selecionados"
              >
                <PrinterIcon className={styles.buttonIcon} />
                {isGenerating ? 'Gerando...' : 'Gerar Etiquetas'}
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteSelected}
                disabled={deleting}
              >
                <TrashIcon className={styles.buttonIcon} />
                {deleting ? 'Excluindo...' : 'Excluir Selecionados'}
              </button>
            </>
          )}
          {selectedBooks.length === 0 && (
            <>
              <div className={styles.viewOptions}>
                <button
                  className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Visualização em Lista"
                >
                  <ListBulletIcon className={styles.buttonIcon} />
                </button>
                <button
                  className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Visualização em Grade"
                >
                  <Squares2X2Icon className={styles.buttonIcon} />
                </button>
              </div>
              <div className={styles.sortOptions}>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={styles.sortSelect}
                >
                  <option value="dateAdded">Ordem de Registro</option>
                  <option value="alphabetical">Ordem Alfabética (A-Z)</option>
                </select>
                <ArrowsUpDownIcon className={styles.sortIcon} />
              </div>
              <button
                className={styles.filterButton}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <>
                    <XMarkIcon className={styles.buttonIcon} />
                    Ocultar Filtros
                  </>
                ) : (
                  <>
                    <FunnelIcon className={styles.buttonIcon} />
                    Mostrar Filtros
                  </>
                )}
              </button>
              <button
                className={styles.exportButton}
                onClick={handleExportToExcel}
                disabled={books.length === 0}
                title="Exportar todos os livros para Excel"
              >
                <ArrowDownTrayIcon className={styles.buttonIcon} />
                Exportar Excel
              </button>
              <button 
                className={styles.registerButton}
                onClick={() => navigate('/books/register')}
              >
                <PlusIcon className={styles.buttonIcon} />
                Registrar Livro
              </button>
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <div className={styles.filters}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="title">Título</label>
              <input
                type="text"
                id="title"
                value={filters.title}
                onChange={(e) => updateFilter('title', e.target.value)}
                placeholder="Filtrar por título..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="code">Código</label>
              <input
                type="text"
                id="code"
                value={filters.code}
                onChange={(e) => updateFilter('code', e.target.value)}
                placeholder="Filtrar por código..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="author">Autor</label>
              <input
                type="text"
                id="author"
                value={filters.author}
                onChange={(e) => updateFilter('author', e.target.value)}
                placeholder="Filtrar por autor..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="tags">Tags</label>
              <select
                id="tags"
                value=""
                onChange={(e) => addTagFilter(e.target.value)}
              >
                <option value="">Selecionar tag...</option>
                {tags
                  .filter(tag => !filters.tags.includes(tag.id))
                  .map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))
                }
              </select>
              
              {filters.tags.length > 0 && (
                <div className={styles.selectedTags}>
                  {filters.tags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    
                    return (
                      <div key={tagId} className={styles.selectedTag}>
                        <span 
                          className={styles.tagChip}
                          style={{ 
                            backgroundColor: tag.color + '20',
                            borderColor: tag.color,
                            color: tag.color
                          }}
                        >
                          {tag.name}
                          <button
                            type="button"
                            className={styles.removeTagButton}
                            onClick={() => removeTagFilter(tagId)}
                            aria-label={`Remover ${tag.name}`}
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterActions}>
            {isSearching && (
              <span className={styles.searchingIndicator}>
                Buscando... 🔍
              </span>
            )}
            {hasActiveFilters && !isSearching && (
              <span className={styles.resultsCount}>
                {filteredCount} {filteredCount === 1 ? 'resultado' : 'resultados'} encontrado{filteredCount === 1 ? '' : 's'}
              </span>
            )}
            <button
              className={styles.clearFiltersButton}
              onClick={clearSearchFilters}
              disabled={!hasActiveFilters}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : books.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhum livro registrado ainda.</p>
            <button 
              className={styles.registerButton}
              onClick={() => navigate('/books/register')}
            >
              Registrar Primeiro Livro
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className={styles.booksGrid}>
                {displayedBooks.map(book => (
                  <div
                    key={book.id}
                    className={`${styles.bookCard} ${selectedBooks.includes(book.id) ? styles.selected : ''}`}
                  >
                    <div className={styles.bookHeader}>
                      <div
                        className={styles.checkbox}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookSelection(book.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                          }}
                          className='checkboxInput'
                        />
                      </div>
                      <h3>{book.title}</h3>
                    </div>
                    <Link
                      to={`/books/${book.id}`}
                      className={styles.bookLink}
                    >
                      <p className={styles.bookCode}>Código: {getDisplayCode(book)}</p>
                      <p className={styles.bookAuthors}>
                        {book.authors 
                          ? (Array.isArray(book.authors) ? book.authors.join(', ') : book.authors)
                          : '-'
                        }
                      </p>
                      {book.genres && (
                        <div className={styles.genreTags}>
                          {book.genres.map(genre => (
                            <span key={genre} className={styles.tag}>
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      {renderTags(book)}
                    </Link>
                  </div>
                ))}
                <div ref={loadingRef} className={styles.loadingMore}>
                  {isLoadingMore ? 'Carregando mais livros...' : ''}
                </div>
              </div>
            ) : (
              <div className={styles.booksList}>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Título</th>
                      <th>Código</th>
                      <th>Autor</th>
                      <th>Gêneros</th>
                      <th>Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBooks.map(book => (
                      <tr 
                        key={book.id} 
                        className={selectedBooks.includes(book.id) ? styles.selected : ''}
                      >
                        <td>
                          <div
                            className={styles.checkbox}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookSelection(book.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedBooks.includes(book.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                              }}
                              className={styles.checkboxInput}
                            />
                          </div>
                        </td>
                        <td onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: 'pointer' }}>{book.title || '-'}</td>
                        <td onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: 'pointer' }}>{getDisplayCode(book)}</td>
                        <td onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: 'pointer' }}>
                          {book.authors ? (Array.isArray(book.authors) ? book.authors.join(', ') : book.authors) : '-'}
                        </td>
                        <td onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: 'pointer' }}>
                          {book.genres && book.genres.length > 0 ? (
                            book.genres.map(genre => (
                              <span key={genre} className={styles.tag}>
                                {genre}
                              </span>
                            ))
                          ) : '-'}
                        </td>
                        <td onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: 'pointer' }}>
                          {renderTags(book)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div ref={loadingRef} className={styles.loadingMore}>
                  {isLoadingMore ? 'Carregando mais livros...' : ''}
                </div>
              </div>
            )}
            {!loading && filteredBooks.length === 0 && hasActiveFilters && (
              <div className={styles.noResults}>
                <p>Nenhum livro encontrado com os filtros aplicados.</p>
                <button
                  className={styles.clearFiltersButton}
                  onClick={clearSearchFilters}
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Books; 