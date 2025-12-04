import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useTags } from '../contexts/TagsContext';
import { Tag } from '../types/common';
import styles from './AutocompleteInput.module.css';

interface TagAutocompleteProps {
  id: string;
  label: string;
  placeholder?: string;
  selectedTags: string[]; // Array de IDs das tags selecionadas
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  className?: string;
}

const TagAutocomplete: React.FC<TagAutocompleteProps> = ({
  id,
  label,
  placeholder = "Digite para buscar ou criar uma tag...",
  selectedTags,
  onTagSelect,
  onTagRemove,
  className
}) => {
  const [value, setValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  
  const { tags, createTag, getTagById } = useTags();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrar tags baseado no input e excluir as já selecionadas
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(value.toLowerCase()) &&
    !selectedTags.includes(tag.id)
  );

  // Opção de criar nova tag se não houver correspondência exata
  const exactMatch = tags.find(tag => 
    tag.name.toLowerCase() === value.toLowerCase()
  );
  
  // Simplificar: mostrar opção de criar se há texto e não há match exato
  const showCreateOption = value.trim() && !exactMatch;

  const suggestions = [...filteredTags];
  if (showCreateOption) {
    suggestions.push({
      id: '__create__',
      name: `Criar "${value}"`,
      color: '#6366F1'
    } as Tag);
  }

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      setHighlightedIndex(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // Sempre abrir dropdown quando há texto digitado
    const shouldOpen = !!newValue.trim();
    setIsOpen(shouldOpen);
    setHighlightedIndex(0);
  };

  const handleSelect = async (tag: Tag | null, index?: number) => {
    if (!tag) return;

    if (tag.id === '__create__') {
      // Criar nova tag - capturar valor ANTES de limpar
      const tagName = value.trim();
      // Fechar dropdown e limpar input
      setIsOpen(false);
      setValue('');
      setIsCreating(true);
      
      try {
        const newTag = await createTag(tagName);
        if (newTag) {
          onTagSelect(newTag.id);
        } else {
          setValue(tagName);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('❌ Erro ao criar tag:', error);
        setValue(tagName);
        setIsOpen(true);
      } finally {
        setIsCreating(false);
      }
    } else {
      // Selecionar tag existente
      setIsOpen(false);
      setValue('');
      onTagSelect(tag.id);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (suggestions.length > 0) {
          setIsOpen(true);
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (suggestions.length > 0) {
          setIsOpen(true);
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && suggestions.length > 0 && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (value.trim() && showCreateOption) {
          // Se não há sugestão selecionada mas há texto, criar nova tag
          handleSelect({
            id: '__create__',
            name: `Criar "${value}"`,
            color: '#6366F1'
          } as Tag);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setValue('');
        break;
      case 'Tab':
        if (isOpen && suggestions.length > 0 && highlightedIndex >= 0) {
          e.preventDefault();
          handleSelect(suggestions[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay para permitir clique nas sugestões
    // Verificar se o foco está indo para um elemento dentro do dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && listRef.current?.contains(relatedTarget)) {
      return; // Não fechar se o foco está indo para o dropdown
    }
    
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleFocus = () => {
    // Abrir dropdown se houver texto digitado ou sugestões disponíveis
    if (value.trim() || suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Scroll da lista quando navegar com teclado
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={styles.input}
          disabled={isCreating}
          autoComplete="off"
          style={isCreating ? { opacity: 0.7 } : {}}
        />
        
        {isCreating && (
          <div className={styles.loadingIndicator}>Criando tag...</div>
        )}
        
        {isOpen && suggestions.length > 0 && (
          <ul ref={listRef} className={styles.suggestions}>
            {suggestions.map((tag, index) => (
              <li
                key={tag.id}
                className={`${styles.suggestion} ${
                  index === highlightedIndex ? styles.highlighted : ''
                } ${tag.id === '__create__' ? styles.createOption : ''}`}
                onClick={() => handleSelect(tag, index)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className={styles.tagOption}>
                  {tag.id !== '__create__' && (
                    <div 
                      className={styles.tagColor} 
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  <span className={styles.tagName}>{tag.name}</span>
                  {tag.id === '__create__' && (
                    <span className={styles.createIcon}>+</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tags selecionadas */}
      {selectedTags.length > 0 && (
        <div className={styles.tags}>
          {selectedTags.map(tagId => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            
            return (
              <span 
                key={tag.id} 
                className={styles.tag}
                style={{ 
                  backgroundColor: tag.color + '20',
                  borderColor: tag.color,
                  color: tag.color
                }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => onTagRemove(tag.id)}
                  className={styles.removeTag}
                  style={{ color: tag.color }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TagAutocomplete;
