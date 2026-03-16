import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { EyeIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { catalogShowcaseService, ShowcaseConfig } from '../../services/catalogShowcaseService';
import { bookRecommendationService, BookWithStats } from '../../services/bookRecommendationService';
import NewBadge from '../../components/NewBadge/NewBadge';
import styles from './OnlineCatalog.module.css';

const OnlineCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showcaseMode, setShowcaseMode] = useState<'specific' | 'random'>('random');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [availableBooks, setAvailableBooks] = useState<BookWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [previewBook, setPreviewBook] = useState<BookWithStats | null>(null);
  const [loadingStudentPreview, setLoadingStudentPreview] = useState(false);
  const [noStudentsMessage, setNoStudentsMessage] = useState('');

  // Selecionar livro aleatório para preview
  const selectRandomBook = () => {
    if (availableBooks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableBooks.length);
    const newBook = availableBooks[randomIndex];
    setPreviewBook(newBook);
    // Atualizar selectedBookId para refletir o novo livro escolhido
    setSelectedBookId(newBook.id);
  };

  // Carregar preview quando muda o modo ou livro selecionado
  useEffect(() => {
    if (availableBooks.length === 0) return;
    
    if (showcaseMode === 'random') {
      // No modo aleatório, se temos um selectedBookId salvo, usar esse livro
      // (selectedBookId contém o ID do livro que foi salvo anteriormente)
      if (selectedBookId) {
        const savedBook = availableBooks.find(b => b.id === selectedBookId);
        if (savedBook) {
          setPreviewBook(savedBook);
          return;
        }
      }
      // Se não tem livro salvo ou não encontrou, e não tem preview, selecionar aleatório
      if (!previewBook) {
        const randomIndex = Math.floor(Math.random() * availableBooks.length);
        setPreviewBook(availableBooks[randomIndex]);
      }
    } else if (showcaseMode === 'specific' && selectedBookId) {
      // Buscar o livro selecionado
      const book = availableBooks.find(b => b.id === selectedBookId);
      setPreviewBook(book || null);
    } else if (showcaseMode === 'specific' && !selectedBookId) {
      // Limpar preview se não tem livro selecionado
      setPreviewBook(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showcaseMode, selectedBookId, availableBooks]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Carregar configuração atual
        const config = await catalogShowcaseService.getShowcaseConfig(currentUser.uid);
        if (config) {
          setShowcaseMode(config.mode);
          setSelectedBookId(config.specificBookId || '');
        }

        // Carregar livros que têm capa e sinopse (não descrição)
        const allBooks = await bookRecommendationService.getAllBooksWithStats(currentUser.uid);
        const eligibleBooks = allBooks.filter(book => 
          book.coverUrl && 
          book.coverUrl.trim() !== '' && 
          book.synopsis && 
          book.synopsis.trim() !== ''
        );
        setAvailableBooks(eligibleBooks);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleViewAsStudent = async () => {
    if (!currentUser) return;
    try {
      setLoadingStudentPreview(true);
      setNoStudentsMessage('');
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const snapshot = await getDocs(query(studentsRef, limit(1)));
      if (snapshot.empty) {
        setNoStudentsMessage('Nenhum aluno cadastrado ainda. Cadastre um aluno primeiro para visualizar o catálogo.');
        setTimeout(() => setNoStudentsMessage(''), 5000);
        return;
      }
      const studentId = snapshot.docs[0].id;
      window.open(`/student-dashboard/${studentId}/home`, '_blank');
    } catch (error) {
      console.error('Erro ao buscar aluno de exemplo:', error);
    } finally {
      setLoadingStudentPreview(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // Validar modo específico
    if (showcaseMode === 'specific' && !selectedBookId) {
      alert('Por favor, selecione um livro para a vitrine.');
      return;
    }

    // Validar modo aleatório (precisa ter um livro na preview)
    if (showcaseMode === 'random' && !previewBook) {
      alert('Nenhum livro disponível para vitrine. Adicione livros com capa e sinopse primeiro.');
      return;
    }

    try {
      setSaving(true);
      
      // Em ambos os modos, salvar o ID do livro que está na preview
      const bookIdToSave = showcaseMode === 'specific' ? selectedBookId : previewBook?.id;
      
      const config: ShowcaseConfig = {
        mode: showcaseMode,
        specificBookId: bookIdToSave
      };

      await catalogShowcaseService.saveShowcaseConfig(currentUser.uid, config);
      
      setSavedMessage('Configuração salva com sucesso!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const filteredBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Vitrine do Catálogo
        <NewBadge text="novo!" variant="new" />
      </h1>

      <p className={styles.description}>
        Configure o livro que aparecerá em destaque no catálogo dos alunos, 
        logo no início da página, antes das seções de recomendações.
      </p>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Carregando configurações...</p>
        </div>
      ) : (
        <>
          <div className={styles.showcaseSection}>
            <h2 className={styles.sectionTitle}>Configuração da Vitrine</h2>
            
            <div className={styles.optionsContainer}>
              <label className={`${styles.optionCard} ${showcaseMode === 'random' ? styles.optionCardActive : ''}`}>
                <input
                  type="radio"
                  name="showcaseMode"
                  value="random"
                  checked={showcaseMode === 'random'}
                  onChange={(e) => setShowcaseMode(e.target.value as 'random')}
                  className={styles.radioInput}
                />
                <div className={styles.optionContent}>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionTitle}>Livro Aleatório</span>
                    {showcaseMode === 'random' && (
                      <CheckIcon width={20} height={20} className={styles.checkIcon} />
                    )}
                  </div>
                  <p className={styles.optionDescription}>
                    A cada carregamento, um livro diferente com capa e sinopse aparece na vitrine
                  </p>
                </div>
              </label>

              <label className={`${styles.optionCard} ${showcaseMode === 'specific' ? styles.optionCardActive : ''}`}>
                <input
                  type="radio"
                  name="showcaseMode"
                  value="specific"
                  checked={showcaseMode === 'specific'}
                  onChange={(e) => setShowcaseMode(e.target.value as 'specific')}
                  className={styles.radioInput}
                />
                <div className={styles.optionContent}>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionTitle}>Livro Específico</span>
                    {showcaseMode === 'specific' && (
                      <CheckIcon width={20} height={20} className={styles.checkIcon} />
                    )}
                  </div>
                  <p className={styles.optionDescription}>
                    Escolha um livro fixo para aparecer sempre na vitrine
                  </p>
                </div>
              </label>
            </div>

            {showcaseMode === 'specific' && (
              <div className={styles.bookSelectionContainer}>
                <h3 className={styles.subsectionTitle}>Selecione o Livro da Vitrine</h3>
                
                <input
                  type="text"
                  placeholder="Buscar por título ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />

                {filteredBooks.length === 0 ? (
                  <div className={styles.emptyState}>
                    <BookOpenIcon width={48} height={48} />
                    <p>
                      {searchTerm 
                        ? 'Nenhum livro encontrado com esse termo'
                        : 'Nenhum livro disponível com capa e sinopse'
                      }
                    </p>
                  </div>
                ) : (
                  <div className={styles.booksGrid}>
                    {filteredBooks.map(book => (
                      <label
                        key={book.id}
                        className={`${styles.bookSelectCard} ${selectedBookId === book.id ? styles.bookSelectCardActive : ''}`}
                      >
                        <input
                          type="radio"
                          name="selectedBook"
                          value={book.id}
                          checked={selectedBookId === book.id}
                          onChange={(e) => setSelectedBookId(e.target.value)}
                          className={styles.bookRadioInput}
                        />
                        <div className={styles.bookSelectContent}>
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
                          ) : (
                            <div className={styles.bookCoverPlaceholder}>
                              <BookOpenIcon width={40} height={40} />
                            </div>
                          )}
                          <div className={styles.bookInfo}>
                            <h4 className={styles.bookTitle}>{book.title}</h4>
                            <p className={styles.bookAuthor}>
                              {book.authors.length > 0 ? book.authors.join(', ') : 'Autor não informado'}
                            </p>
                            <p className={styles.bookStats}>
                              {book.loanCount} empréstimos
                            </p>
                          </div>
                          {selectedBookId === book.id && (
                            <div className={styles.selectedBadge}>
                              <CheckIcon width={16} height={16} />
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview da Vitrine */}
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <h2 className={styles.sectionTitle}>Prévia da Vitrine</h2>
              {showcaseMode === 'random' && availableBooks.length > 0 && (
                <button
                  type="button"
                  className={styles.rerollButton}
                  onClick={selectRandomBook}
                >
                  🎲 Reescolher Livro
                </button>
              )}
            </div>

            <div className={styles.showcasePreview}>
              <div className={styles.previewBackground}>
                {previewBook?.coverUrl && (
                  <img 
                    src={previewBook.coverUrl} 
                    alt="" 
                    className={styles.previewBackgroundImage}
                  />
                )}
                <div className={styles.previewGradient}></div>
              </div>
              
              <div className={styles.previewContent}>
                <div className={styles.previewCover}>
                  {previewBook?.coverUrl ? (
                    <img src={previewBook.coverUrl} alt={previewBook.title} />
                  ) : (
                    <div className={styles.previewCoverPlaceholder}>
                      <BookOpenIcon width={40} height={40} />
                    </div>
                  )}
                </div>

                <div className={styles.previewInfo}>
                  <div className={styles.previewBadge}>Em Destaque</div>
                  
                  <h3 className={styles.previewTitle}>
                    {previewBook?.title || 'Título do Livro'}
                  </h3>
                  
                  <div className={styles.previewMeta}>
                    <span className={styles.previewAuthor}>
                      {previewBook?.authors?.[0] || 'Autor'}
                    </span>
                    <span className={styles.previewDivider}>•</span>
                    <span className={styles.previewGenre}>
                      {previewBook?.genres?.[0] || 'Gênero'}
                    </span>
                    <span className={styles.previewDivider}>•</span>
                    <span className={styles.previewLoans}>
                      {previewBook?.loanCount ?? 0} empréstimos
                    </span>
                  </div>

                  <p className={styles.previewSynopsis}>
                    {previewBook?.synopsis || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'}
                  </p>

                  {(previewBook?.available !== undefined ? previewBook.available : true) && (
                    <div className={styles.previewAvailability}>
                      <div className={styles.previewAvailableDot}></div>
                      Disponível para empréstimo agora
                    </div>
                  )}

                  <div className={styles.previewButton}>
                    <BookOpenIcon width={18} height={18} />
                    Ver Detalhes e Reservar
                  </div>
                </div>
              </div>
            </div>
          </div>

          {savedMessage && (
            <div className={styles.successMessage}>
              <CheckIcon width={20} height={20} />
              {savedMessage}
            </div>
          )}

          {noStudentsMessage && (
            <div className={styles.warningMessage}>
              {noStudentsMessage}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon width={20} height={20} />
              Voltar
            </button>
            <button
              type="button"
              className={styles.previewStudentButton}
              onClick={handleViewAsStudent}
              disabled={loadingStudentPreview}
            >
              {loadingStudentPreview ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Carregando...
                </>
              ) : (
                <>
                  <EyeIcon width={20} height={20} />
                  Ver como Aluno
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckIcon width={20} height={20} />
                  Salvar Configuração
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OnlineCatalog;

