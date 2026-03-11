import React, { useState } from 'react';
import { useTags } from '../contexts/TagsContext';
import { Tag } from '../types/common';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
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

interface NewTagModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
}

const DEFAULT_NEW_TAG_COLOR = '#6366F1';

const NewTagModal: React.FC<NewTagModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_NEW_TAG_COLOR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Digite o nome da tag.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onCreate(name.trim(), color);
      onClose();
    } catch (err) {
      console.error('Erro ao criar tag:', err);
      setError('Não foi possível criar a tag. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Nova Tag</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.formGroup}>
              <label htmlFor="newTagName">Nome da Tag</label>
              <input
                type="text"
                id="newTagName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                maxLength={50}
                disabled={loading}
                placeholder="Ex: 4° Ano, Romance..."
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newTagColor">Cor da Tag</label>
              <div className={styles.colorInputGroup}>
                <input
                  type="color"
                  id="newTagColor"
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
            <div className={styles.actionGroup} style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Criando...' : 'Criar tag'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const TagManager: React.FC = () => {
  const { tags, loading, updateTag, deleteTag, createTag } = useTags();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showNewTag, setShowNewTag] = useState(false);

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

  const handleCreateTag = async (name: string, color: string) => {
    const newTag = await createTag(name, color);
    if (!newTag) throw new Error('Falha ao criar tag');
  };

  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  if (loading && tags.length === 0) {
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
          Todas as tags listadas aqui são salvas e usadas como sugestão ao registrar ou editar livros. Clique em uma tag para editar nome ou cor.
        </p>
        <button
          type="button"
          className={styles.addTagButton}
          onClick={() => setShowNewTag(true)}
        >
          <PlusIcon width={20} height={20} />
          Nova tag
        </button>
      </div>

      {sortedTags.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhuma tag ainda.</p>
          <p>Crie tags aqui ou ao adicionar livros; elas aparecerão como sugestões nos formulários.</p>
          <button
            type="button"
            className={styles.addTagButtonEmpty}
            onClick={() => setShowNewTag(true)}
          >
            <PlusIcon width={20} height={20} />
            Criar primeira tag
          </button>
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

      {showNewTag && (
        <NewTagModal
          onClose={() => setShowNewTag(false)}
          onCreate={handleCreateTag}
        />
      )}
    </div>
  );
};

export default TagManager;
