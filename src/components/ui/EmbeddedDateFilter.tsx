import React, { useState, useRef, useEffect } from 'react';
import { CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './EmbeddedDateFilter.module.css';

interface EmbeddedDateFilterProps {
  onApplyFilter: (startDate: string, endDate: string) => void;
  onClearFilter: () => void;
  hasActiveFilter: boolean;
  activeStartDate?: string;
  activeEndDate?: string;
  loading?: boolean;
}

const EmbeddedDateFilter: React.FC<EmbeddedDateFilterProps> = ({
  onApplyFilter,
  onClearFilter,
  hasActiveFilter,
  activeStartDate,
  activeEndDate,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar filtro ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isExpanded]);


  const handleApply = () => {
    if (startDate && endDate) {
      onApplyFilter(startDate, endDate);
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onClearFilter();
    setIsExpanded(false);
  };

  const formatDateRange = () => {
    if (!activeStartDate || !activeEndDate) return '';
    try {
      const start = format(new Date(activeStartDate), 'dd/MM', { locale: ptBR });
      const end = format(new Date(activeEndDate), 'dd/MM', { locale: ptBR });
      return `${start} - ${end}`;
    } catch {
      return 'Período selecionado';
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Botão de filtro */}
      <button
        className={`${styles.filterButton} ${hasActiveFilter ? styles.active : ''} ${isExpanded ? styles.expanded : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loading}
        title={hasActiveFilter ? `Filtrado: ${formatDateRange()}` : 'Filtrar por período'}
      >
        <CalendarDaysIcon className={styles.icon} />
        {hasActiveFilter && <span className={styles.activeIndicator}>{formatDateRange()}</span>}
      </button>

      {/* Botão de limpar (só aparece quando há filtro ativo) */}
      {hasActiveFilter && (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          disabled={loading}
          title="Limpar filtro"
        >
          <XMarkIcon className={styles.clearIcon} />
        </button>
      )}

      {/* Painel de filtro expandido */}
      {isExpanded && (
        <>
          <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
          <div className={styles.filterPanel}>
            <h3 className={styles.modalTitle}>Filtrar por Período</h3>
            <div className={styles.dateInputs}>
            <div className={styles.inputGroup}>
              <label>De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                disabled={loading}
              />
            </div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={handleApply}
              disabled={!startDate || !endDate || loading}
              className={styles.applyButton}
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default EmbeddedDateFilter;
