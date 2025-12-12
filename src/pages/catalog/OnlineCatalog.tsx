import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { catalogShowcaseService, ShowcaseConfig } from '../../services/catalogShowcaseService';
import { bookRecommendationService, BookWithStats } from '../../services/bookRecommendationService';
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

        // Carregar livros que têm capa e sinopse
        const allBooks = await bookRecommendationService.getAllBooksWithStats(currentUser.uid);
        const eligibleBooks = allBooks.filter(book => 
          book.coverUrl && 
          book.coverUrl.trim() !== '' && 
          book.description && 
          book.description.trim() !== ''
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

  const handleSave = async () => {
    if (!currentUser) return;

    if (showcaseMode === 'specific' && !selectedBookId) {
      alert('Por favor, selecione um livro para a vitrine.');
      return;
    }

    try {
      setSaving(true);
      const config: ShowcaseConfig = {
        mode: showcaseMode,
        specificBookId: showcaseMode === 'specific' ? selectedBookId : undefined
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
      <h1 className={styles.title}>Vitrine do Catálogo</h1>

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

          {savedMessage && (
            <div className={styles.successMessage}>
              <CheckIcon width={20} height={20} />
              {savedMessage}
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

