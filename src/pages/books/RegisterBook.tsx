import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTags } from '../../contexts/TagsContext';
import { useDistinctCodes } from '../../hooks/useDistinctCodes';
import AutocompleteInput from '../../components/AutocompleteInput';
import TagAutocomplete from '../../components/TagAutocomplete';
import { searchGoogleBooks, FormattedBookResult } from '../../services/googleBooksService';
import styles from './RegisterBook.module.css';

interface BookForm {
  codes: string[];
  title: string;
  genres: string[];
  tags: string[]; // Array de IDs das tags
  authors: string;
  publisher: string;
  acquisitionDate: string;
  shelf: string;
  collection: string;
  quantity: number;
  description: string;
  coverUrl: string;
}

interface DuplicateCheck {
  codes: boolean;
  title: boolean;
}

interface DuplicateBook {
  codes: string[];
  title: string;
  id: string;
}

// Lista de gêneros/classes sugeridos
const SUGGESTED_GENRES = [
  'Romance',
  'Ficção Científica',
  'Fantasia',
  'Terror',
  'Suspense',
  'Drama',
  'Aventura',
  'História',
  'Biografia',
  'Autoajuda',
  'Educacional',
  'Infantil',
  'Juvenil',
  'Técnico',
  'Científico',
  'Literatura Brasileira',
  'Literatura Estrangeira',
  'Poesia',
  'Quadrinhos',
  'Mangá',
  'Religião',
  'Filosofia',
  'Psicologia',
  'Sociologia',
  'Política',
  'Economia',
  'Direito',
  'Medicina',
  'Engenharia',
  'Informática'
];

const RegisterBook = () => {
  const [formData, setFormData] = useState<BookForm>({
    codes: [],
    title: '',
    genres: [],
    tags: [],
    authors: '',
    publisher: '',
    acquisitionDate: new Date().toISOString().split('T')[0], // Data atual como padrão
    shelf: '',
    collection: '',
    quantity: 1,
    description: '',
    coverUrl: ''
  });
  
  const [currentCode, setCurrentCode] = useState('');
  const [currentGenre, setCurrentGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateCheck>({ codes: false, title: false });
  const [duplicateBooks, setDuplicateBooks] = useState<DuplicateBook[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  // Estados para Google Books
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [googleSearchResults, setGoogleSearchResults] = useState<FormattedBookResult[]>([]);
  const [googleSearchLoading, setGoogleSearchLoading] = useState(false);
  const [googleSearchError, setGoogleSearchError] = useState('');
  const [showGoogleResults, setShowGoogleResults] = useState(false);
  
  const { currentUser } = useAuth();
  const { genres, addGenre, capitalizeTag } = useTags();
  const useDistinctCodesEnabled = useDistinctCodes();
  const navigate = useNavigate();

  // Função para adicionar código
  const handleAddCode = () => {
    const code = currentCode.trim();
    if (code && !formData.codes.includes(code)) {
      setFormData(prev => ({
        ...prev,
        codes: [...prev.codes, code]
      }));
      setCurrentCode('');
    }
  };

  // Função para remover código
  const removeCode = (codeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      codes: prev.codes.filter(code => code !== codeToRemove)
    }));
  };

  // Função para verificar duplicatas
  const checkDuplicates = useCallback(async (codes: string[], title: string) => {
    if (!currentUser) return;
    
    try {
      setCheckingDuplicates(true);
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      
      const foundDuplicates: DuplicateBook[] = [];
      
      // Buscar todos os livros para verificar duplicatas case-insensitive
      const allBooksQuery = query(booksRef);
      const allBooksSnapshot = await getDocs(allBooksQuery);
      
      allBooksSnapshot.docs.forEach(doc => {
        const bookData = doc.data();
        const bookCodes = bookData.codes || (bookData.code ? [bookData.code] : []); // Compatibilidade com versão antiga
        const writtenOffCodes = bookData.writtenOffCodes || []; // Códigos baixados
        const bookTitle = bookData.title || '';
        
        // Verificar códigos duplicados (ignorando códigos baixados)
        const activeCodes = bookCodes.filter((code: string) => !writtenOffCodes.includes(code));
        const hasDuplicateCode = codes.some(code => 
          activeCodes.some((bookCode: string) => 
            bookCode.toLowerCase() === code.toLowerCase()
          )
        );
        
        if (hasDuplicateCode) {
          foundDuplicates.push({
            id: doc.id,
            codes: activeCodes, // Usar apenas códigos ativos
            title: bookTitle
          });
        }
        
        // Verificar título duplicado (case-insensitive)
        if (title.trim() && bookTitle.toLowerCase() === title.trim().toLowerCase()) {
          if (!foundDuplicates.find(dup => dup.id === doc.id)) {
            foundDuplicates.push({
              id: doc.id,
              codes: bookCodes,
              title: bookTitle
            });
          }
        }
      });
      
      setDuplicateBooks(foundDuplicates);
      setDuplicates({
        codes: foundDuplicates.some(book => 
          codes.some(code => 
            book.codes.some((bookCode: string) => 
              bookCode.toLowerCase() === code.toLowerCase()
            )
          )
        ),
        title: foundDuplicates.some(book => book.title.toLowerCase() === title.trim().toLowerCase())
      });
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    } finally {
      setCheckingDuplicates(false);
    }
  }, [currentUser]);

  // Verificar duplicatas quando códigos ou título mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.codes.length > 0 || formData.title.trim()) {
        checkDuplicates(formData.codes, formData.title.trim());
      } else {
        setDuplicates({ codes: false, title: false });
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.codes, formData.title, currentUser, checkDuplicates]);

  // Função para buscar livros no Google Books
  const handleGoogleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!googleSearchQuery.trim()) {
      setGoogleSearchError('Digite um termo de busca');
      return;
    }

    try {
      setGoogleSearchLoading(true);
      setGoogleSearchError('');
      
      const results = await searchGoogleBooks(googleSearchQuery);
      
      setGoogleSearchResults(results);
      setShowGoogleResults(true);
      
      if (results.length === 0) {
        setGoogleSearchError('Nenhum resultado encontrado');
      }
    } catch (err) {
      console.error('Erro na busca do Google Books:', err);
      const message = err instanceof Error ? err.message : 'Erro ao buscar livros. Tente novamente.';
      setGoogleSearchError(message);
    } finally {
      setGoogleSearchLoading(false);
    }
  };

  // Função para selecionar um livro dos resultados do Google Books
  const handleSelectGoogleBook = (book: FormattedBookResult) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      authors: book.authors.join(', '),
      description: book.synopsis,
      coverUrl: book.coverUrl,
      publisher: book.publisher || prev.publisher
    }));
    
    // Limpar busca
    setGoogleSearchResults([]);
    setShowGoogleResults(false);
    setGoogleSearchQuery('');
  };

  // Função para limpar a busca do Google Books
  const handleClearGoogleSearch = () => {
    setGoogleSearchQuery('');
    setGoogleSearchResults([]);
    setShowGoogleResults(false);
    setGoogleSearchError('');
  };

  // Função para remover a capa
  const handleRemoveCover = () => {
    setFormData(prev => ({ ...prev, coverUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Só processa o submit se for intencional (através do botão)
    if (!isSubmittingForm) {
      return;
    }
    
    if (!formData.codes.length || !formData.title) {
      setError('Pelo menos um código e o título são campos obrigatórios');
      setIsSubmittingForm(false);
      return;
    }

    if (!currentUser) {
      setError('Você precisa estar logado para registrar livros');
      setIsSubmittingForm(false);
      return;
    }

    // Verificar se há duplicatas e pedir confirmação
    if (duplicates.codes || duplicates.title) {
      const duplicateMessages = [];
      if (duplicates.codes) duplicateMessages.push('códigos');
      if (duplicates.title) duplicateMessages.push('título');
      
      let message = `Pode ser que este(s) ${duplicateMessages.join(' e ')} já exista(m) no sistema.\n\n`;
      message += 'Livros encontrados com dados similares:\n\n';
      
      duplicateBooks.forEach((book, index) => {
        message += `${index + 1}. Códigos: ${book.codes.join(', ')} | Título: ${book.title}\n`;
      });
      
      message += '\nDeseja criar mesmo assim?';
      
      if (!window.confirm(message)) {
        setIsSubmittingForm(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      // Prepara os dados do livro
      const bookData = {
        ...formData,
        // Se useDistinctCodes estiver ativado, a quantidade é o número de códigos
        quantity: useDistinctCodesEnabled ? formData.codes.length : formData.quantity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUser.uid, // Adiciona referência ao usuário
        status: 'available', // Status inicial do livro
      };

      // Referência à coleção de livros do usuário
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      
      // Adiciona o documento
      await addDoc(booksRef, bookData);
      
      // Redireciona para a lista de livros
      navigate('/books');
    } catch (err) {
      console.error('Error adding book:', err);
      if (err instanceof Error) {
        setError(`Erro ao registrar livro: ${err.message}`);
      } else {
        setError('Erro ao registrar livro. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
      setIsSubmittingForm(false);
    }
  };

  const handleGenreSelect = (genre: string) => {
    const capitalizedGenre = capitalizeTag(genre);
    if (!formData.genres.includes(capitalizedGenre)) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, capitalizedGenre]
      }));
      addGenre(capitalizedGenre);
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  // Funções para gerenciar tags
  const handleTagSelect = (tagId: string) => {
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
    }
  };

  const handleTagRemove = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Registrar Novo Livro</h2>
        <button 
          className={styles.cancelButton}
          onClick={() => navigate('/books')}
        >
          Cancelar
        </button>
      </div>

      {/* Registro Rápido - Google Books */}
      <div className={styles.quickSearchSection}>
        <label className={styles.quickSearchLabel}>Registro Rápido</label>
        <form onSubmit={handleGoogleSearch} className={styles.googleSearchForm}>
          <div className={styles.googleSearchWrapper}>
            <input
              type="text"
              value={googleSearchQuery}
              onChange={(e) => setGoogleSearchQuery(e.target.value)}
              placeholder="Pesquise o título ou ISBN do livro para preencher os campos automaticamente"
              className={styles.googleSearchInput}
            />
            <button
              type="submit"
              className={styles.googleSearchButton}
              disabled={googleSearchLoading}
            >
              {googleSearchLoading ? 'Buscando...' : 'Buscar'}
            </button>
            {googleSearchQuery && (
              <button
                type="button"
                onClick={handleClearGoogleSearch}
                className={styles.clearSearchButton}
              >
                Limpar
              </button>
            )}
          </div>
        </form>

        {googleSearchError && (
          <div className={styles.googleSearchError}>
            {googleSearchError}
          </div>
        )}

        {showGoogleResults && googleSearchResults.length > 0 && (
          <div className={styles.resultsDropdown}>
            <p className={styles.resultsCount}>
              {googleSearchResults.length} resultado(s) — clique para preencher os campos automaticamente
            </p>
            {googleSearchResults.map((book) => (
              <div
                key={book.id}
                className={styles.bookResult}
                onClick={() => handleSelectGoogleBook(book)}
              >
                <div className={styles.bookResultThumbnail}>
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} />
                  ) : (
                    <div className={styles.noThumbnail}>📚</div>
                  )}
                </div>
                <div className={styles.bookResultInfo}>
                  <h4>{book.title}</h4>
                  {book.authors.length > 0 && (
                    <p className={styles.bookResultAuthors}>
                      {book.authors.join(', ')}
                    </p>
                  )}
                  <p className={styles.bookResultDescription}>
                    {book.synopsis}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.formGrid}>
          <div className={styles.mainSection}>
            <div className={styles.formGroup}>
              <label htmlFor="codes">Códigos * (cada exemplar tem seu código)</label>
              <div className={styles.codeInputWrapper}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    id="codes"
                    value={currentCode}
                    onChange={e => setCurrentCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCode();
                      }
                    }}
                    className={duplicates.codes ? styles.inputError : ''}
                    placeholder="Digite o código do exemplar"
                  />
                  <button
                    type="button"
                    onClick={handleAddCode}
                    className={styles.addCodeButton}
                    disabled={!currentCode.trim()}
                  >
                    Adicionar
                  </button>
                  {checkingDuplicates && <div className={styles.checkingIndicator}>Verificando...</div>}
                </div>
                {duplicates.codes && !checkingDuplicates && (
                  <div className={styles.duplicateWarning}>
                    ⚠️ Algum destes códigos já existe no sistema
                  </div>
                )}
              </div>
              <div className={styles.codesList}>
                {formData.codes.map(code => (
                  <span key={code} className={styles.codeTag}>
                    {code}
                    <button
                      type="button"
                      onClick={() => removeCode(code)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {formData.codes.length === 0 && (
                <div className={styles.emptyCodesMessage}>
                  Adicione pelo menos um código para o livro
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Título do Livro *</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={duplicates.title ? styles.inputError : ''}
                  required
                />
                {checkingDuplicates && <div className={styles.checkingIndicator}>Verificando...</div>}
                {duplicates.title && !checkingDuplicates && (
                  <div className={styles.duplicateWarning}>
                    ⚠️ Este título já existe no sistema
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="authors">Autores</label>
                <input
                  type="text"
                  id="authors"
                  value={formData.authors}
                  onChange={e => setFormData(prev => ({ ...prev, authors: e.target.value }))}
                  placeholder="Ex: João Silva, Maria Santos"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="collection">Coleção</label>
                <input
                  type="text"
                  id="collection"
                  value={formData.collection}
                  onChange={e => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="acquisitionDate">Data de Aquisição</label>
                <input
                  type="date"
                  id="acquisitionDate"
                  value={formData.acquisitionDate}
                  onChange={e => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="shelf">Prateleira</label>
                <input
                  type="text"
                  id="shelf"
                  value={formData.shelf}
                  onChange={e => setFormData(prev => ({ ...prev, shelf: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.formGroup}>
              <AutocompleteInput
                id="genres"
                label="Gêneros/Classes"
                value={currentGenre}
                onChange={setCurrentGenre}
                onSelect={handleGenreSelect}
                suggestions={genres}
                placeholder="Digite para buscar ou adicionar"
              />
              <div className={styles.tags}>
                {formData.genres.map(genre => (
                  <span key={genre} className={styles.tag}>
                    {genre}
                    <button
                      type="button"
                      onClick={() => removeGenre(genre)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <TagAutocomplete
                id="tags"
                label="Tags"
                selectedTags={formData.tags}
                onTagSelect={handleTagSelect}
                onTagRemove={handleTagRemove}
                placeholder="Digite para buscar ou criar tags..."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="publisher">Editora</label>
              <input
                type="text"
                id="publisher"
                value={formData.publisher}
                onChange={e => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
              />
            </div>

            {!useDistinctCodesEnabled && (
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantidade</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
                <p className={styles.helpText}>
                  Número de exemplares disponíveis deste título
                </p>
              </div>
            )}
            
            {useDistinctCodesEnabled && (
              <div className={styles.formGroup}>
                <label>Quantidade Calculada</label>
                <div className={styles.calculatedQuantity}>
                  {formData.codes.length} exemplar(es)
                </div>
                <p className={styles.helpText}>
                  A quantidade é calculada automaticamente pelo número de códigos adicionados
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
            onClick={() => setIsSubmittingForm(true)}
          >
            {loading ? 'Registrando...' : 'Registrar Livro'}
          </button>
        </div>
      </form>

      {/* Seção de Catálogo de Reservas - Capa e Sinopse */}
      <div className={styles.catalogSection}>
        <h3>Catálogo de Reservas</h3>
        <p className={styles.catalogDescription}>
          Adicione uma capa e sinopse para que os alunos possam visualizá-los no catálogo.
          Use o "Registro Rápido" acima para preencher automaticamente via Google Books.
        </p>

        {/* Preview da Capa e Sinopse Selecionadas */}
        <div className={styles.catalogPreviewSection}>
          <div className={styles.catalogPreviewGrid}>
            {/* Coluna da Capa */}
            <div className={styles.catalogField}>
              <label>Capa do Livro</label>
              {formData.coverUrl ? (
                <div className={styles.coverPreviewWrapper}>
                  <div className={styles.coverPreview}>
                    <img 
                      src={formData.coverUrl} 
                      alt="Capa do livro" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className={styles.removeCoverButton}
                      title="Remover capa"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.noCoverPreview}>
                  <span>📚</span>
                  <p>Nenhuma capa selecionada</p>
                  <small>Busque no Google Books ou cole a URL abaixo</small>
                </div>
              )}
              
              {/* Campo para URL manual */}
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="coverUrlManual" style={{ fontSize: '0.85rem' }}>
                  Ou cole a URL da capa manualmente:
                </label>
                <input
                  type="text"
                  id="coverUrlManual"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
                  placeholder="https://exemplo.com/capa.jpg"
                  className={styles.coverUrlInput}
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
            </div>
            
            {/* Coluna da Sinopse */}
            <div className={styles.catalogField}>
              <label htmlFor="catalogSynopsis">Sinopse para o Catálogo</label>
              <textarea
                id="catalogSynopsis"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite ou selecione um livro do Google Books para preencher automaticamente..."
                className={styles.synopsisTextarea}
                rows={12}
              />
              <small className={styles.fieldHint}>
                Esta sinopse será exibida para os alunos no catálogo de livros disponíveis
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterBook; 