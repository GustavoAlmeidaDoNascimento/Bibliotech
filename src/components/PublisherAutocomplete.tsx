import React, { useState, useRef, useEffect } from 'react';
import styles from './AutocompleteInput.module.css';

const STORAGE_KEY = 'bibliotech_publisher_suggestions';

interface PublisherAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
}

const PublisherAutocomplete: React.FC<PublisherAutocompleteProps> = ({
  value,
  onChange,
  id = 'publisher',
  label = 'Editora'
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSuggestions(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveSuggestion = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setSuggestions(prev => {
      if (prev.some(s => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      const updated = [trimmed, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeSuggestion = (suggestion: string) => {
    setSuggestions(prev => {
      const updated = prev.filter(s => s !== suggestion);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const filteredSuggestions = value.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase().trim()))
    : suggestions;

  const handleFocus = () => {
    if (suggestions.length > 0) setIsOpen(true);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
    saveSuggestion(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={styles.input}
        autoComplete="off"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div className={styles.dropdown}>
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={styles.suggestion}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setHoveredSuggestion(suggestion)}
              onMouseLeave={() => setHoveredSuggestion(null)}
            >
              {suggestion}
              {hoveredSuggestion === suggestion && (
                <button
                  type="button"
                  className={styles.removeSuggestion}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeSuggestion(suggestion);
                  }}
                  title="Remover sugestão"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublisherAutocomplete;
