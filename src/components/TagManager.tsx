import React, { useState } from 'react';
import { useTags } from '../contexts/TagsContext';
import { Tag } from '../types/common';
import { PencilIcon } from '@heroicons/react/24/outline';
import styles from './TagManager.module.css';

interface TagEditorProps {
  tag: Tag;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  onDelete: () => void;
}

const TagEditor: React.FC<TagEditorProps> = ({ tag, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      alert('Erro ao salvar tag. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir a tag "${tag.name}"?`)) return;

    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      alert('Erro ao deletar tag. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Editar Tag</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="tagName">Nome da Tag</label>
            <input
              type="text"
              id="tagName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tagColor">Cor da Tag</label>
            <div className={styles.colorInputGroup}>
              <input
                type="color"
                id="tagColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={styles.colorInput}
                disabled={loading}
              />
              <div className={styles.colorPreview}>
                <span 
                  className={styles.tagPreview}
                  style={{ 
                    backgroundColor: color + '20',
                    borderColor: color,
                    color: color
                  }}
                >
                  {name || 'Preview'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button 
            className={styles.deleteButton} 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
          <div className={styles.actionGroup}>
            <button 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={loading || !name.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TagManager: React.FC = () => {
  const { tags, loading, updateTag, deleteTag } = useTags();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleSaveTag = async (name: string, color: string) => {
    if (!editingTag) return;
    await updateTag(editingTag.id, name, color);
  };

  const handleDeleteTag = async () => {
    if (!editingTag) return;
    await deleteTag(editingTag.id);
  };

  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando tags...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Gerenciador de Tags</h3>
        <p className={styles.description}>
          Clique em qualquer tag para editar seu nome ou cor. As tags são usadas para categorizar seus livros.
        </p>
      </div>

      {sortedTags.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhuma tag criada ainda.</p>
          <p>As tags serão criadas automaticamente quando você as adicionar aos livros.</p>
        </div>
      ) : (
        <div className={styles.tagGrid}>
          {sortedTags.map(tag => (
            <div
              key={tag.id}
              className={styles.tagCard}
              onClick={() => handleEditTag(tag)}
            >
              <div className={styles.tagInfo}>
                <span 
                  className={styles.tagDisplay}
                  style={{ 
                    backgroundColor: tag.color + '20',
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  {tag.name}
                </span>
                <div className={styles.tagMeta}>
                  <span className={styles.tagColor} style={{ backgroundColor: tag.color }} />
                  <span className={styles.colorCode}>{tag.color}</span>
                </div>
              </div>
              <div className={styles.editIcon}>
                <PencilIcon width={18} height={18} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTag && (
        <TagEditor
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSave={handleSaveTag}
          onDelete={handleDeleteTag}
        />
      )}
    </div>
  );
};

export default TagManager;
