import React, { useState } from 'react';
import { useEducationalLevels } from '../contexts/EducationalLevelsContext';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './EducationalLevelManager.module.css';

const EducationalLevelManager: React.FC = () => {
  const { levels, loading, createLevel, updateLevel, deleteLevel } = useEducationalLevels();
  
  // Estados para criação
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelAbbreviation, setNewLevelAbbreviation] = useState('');
  const [newLevelOrder, setNewLevelOrder] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAbbreviation, setEditAbbreviation] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Estados para feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLevelName.trim()) {
      setError('Nome do nível é obrigatório');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const order = newLevelOrder ? parseInt(newLevelOrder) : undefined;
      await createLevel(newLevelName, newLevelAbbreviation, order);
      
      setNewLevelName('');
      setNewLevelAbbreviation('');
      setNewLevelOrder('');
      setShowCreateForm(false);
      setSuccess('Nível educacional criado com sucesso!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao criar nível:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar nível educacional');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (level) {
      setEditingId(levelId);
      setEditName(level.name);
      setEditAbbreviation(level.abbreviation || '');
      setEditOrder(level.order.toString());
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAbbreviation('');
    setEditOrder('');
    setError('');
  };

  const handleUpdate = async (levelId: string) => {
    if (!editName.trim()) {
      setError('Nome do nível é obrigatório');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      
      const order = editOrder ? parseInt(editOrder) : 1;
      await updateLevel(levelId, editName, editAbbreviation, order);
      
      setEditingId(null);
      setSuccess('Nível educacional atualizado com sucesso!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar nível:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar nível educacional');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (levelId: string, levelName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o nível "${levelName}"?`)) {
      return;
    }

    try {
      await deleteLevel(levelId);
      setSuccess('Nível educacional excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir nível:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir nível educacional');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3>Níveis Educacionais</h3>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Níveis Educacionais</h3>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={creating}
        >
          <PlusIcon className={styles.buttonIcon} />
          Novo Nível
        </button>
      </div>

      {(error || success) && (
        <div className={error ? styles.errorMessage : styles.successMessage}>
          {error || success}
        </div>
      )}

      {showCreateForm && (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="newLevelName">Nome do Nível *</label>
              <input
                id="newLevelName"
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Ex: 1º Ano do Ensino Médio"
                disabled={creating}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newLevelAbbreviation">Abreviação</label>
              <input
                id="newLevelAbbreviation"
                type="text"
                value={newLevelAbbreviation}
                onChange={(e) => setNewLevelAbbreviation(e.target.value)}
                placeholder="Ex: 1EM"
                disabled={creating}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newLevelOrder">Ordem</label>
              <input
                id="newLevelOrder"
                type="number"
                value={newLevelOrder}
                onChange={(e) => setNewLevelOrder(e.target.value)}
                placeholder="1"
                min="1"
                disabled={creating}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" disabled={creating} className={styles.saveButton}>
              {creating ? 'Criando...' : 'Criar Nível'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.levelsList}>
        {levels.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum nível educacional cadastrado.</p>
            <p>Clique em "Novo Nível" para começar.</p>
          </div>
        ) : (
          <div className={styles.levelsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Ordem</div>
              <div className={styles.tableCell}>Nome</div>
              <div className={styles.tableCell}>Abreviação</div>
              <div className={styles.tableCell}>Ações</div>
            </div>
            {levels.map((level) => (
              <div key={level.id} className={styles.tableRow}>
                {editingId === level.id ? (
                  <>
                    <div className={styles.tableCell}>
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        className={styles.editInput}
                        min="1"
                        disabled={updating}
                      />
                    </div>
                    <div className={styles.tableCell}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={styles.editInput}
                        disabled={updating}
                      />
                    </div>
                    <div className={styles.tableCell}>
                      <input
                        type="text"
                        value={editAbbreviation}
                        onChange={(e) => setEditAbbreviation(e.target.value)}
                        className={styles.editInput}
                        disabled={updating}
                      />
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleUpdate(level.id)}
                          disabled={updating}
                          className={styles.saveActionButton}
                        >
                          <CheckIcon className={styles.actionIcon} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={updating}
                          className={styles.cancelActionButton}
                        >
                          <XMarkIcon className={styles.actionIcon} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.tableCell}>
                      <span className={styles.orderBadge}>{level.order}</span>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={styles.levelName}>{level.name}</span>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={styles.levelAbbreviation}>
                        {level.abbreviation || '-'}
                      </span>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => startEdit(level.id)}
                          className={styles.editActionButton}
                        >
                          <PencilIcon className={styles.actionIcon} />
                        </button>
                        <button
                          onClick={() => handleDelete(level.id, level.name)}
                          className={styles.deleteActionButton}
                        >
                          <TrashIcon className={styles.actionIcon} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationalLevelManager;
