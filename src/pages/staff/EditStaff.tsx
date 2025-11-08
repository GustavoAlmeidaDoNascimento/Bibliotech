import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Staff.module.css';

interface StaffForm {
  name: string;
  role: string;
  contact: string;
  notes: string;
}

const EditStaff = () => {
  const [formData, setFormData] = useState<StaffForm>({
    name: '',
    role: '',
    contact: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    fetchStaffData();
  }, [id, currentUser]);

  const fetchStaffData = async () => {
    if (!currentUser || !id) return;
    
    try {
      setFetchLoading(true);
      const staffRef = doc(db, `users/${currentUser.uid}/staff/${id}`);
      const staffDoc = await getDoc(staffRef);
      
      if (staffDoc.exists()) {
        const data = staffDoc.data();
        setFormData({
          name: data.name || '',
          role: data.role || data.position || '', 
          contact: data.contact || '',
          notes: data.notes || '',
        });
      } else {
        setError('Professor/Funcionário não encontrado');
        navigate('/staff');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do professor/funcionário:', error);
      setError('Erro ao buscar dados do professor/funcionário');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const sanitizedValue = id === 'contact' ? value.replace(/\D/g, '') : value;
    setFormData(prev => ({
      ...prev,
      [id]: sanitizedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role) {
      setError('Nome e cargo são campos obrigatórios');
      return;
    }

    if (!currentUser || !id) {
      setError('Você precisa estar logado para editar professores/funcionários');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepara os dados atualizados
      const staffData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      // Referência ao documento do funcionário
      const staffRef = doc(db, `users/${currentUser.uid}/staff/${id}`);
      
      // Atualiza o documento
      await updateDoc(staffRef, staffData);
      
      // Redireciona para a lista de funcionários
      navigate('/staff');
    } catch (err) {
      console.error('Erro ao atualizar professor/funcionário:', err);
      if (err instanceof Error) {
        setError(`Erro ao atualizar professor/funcionário: ${err.message}`);
      } else {
        setError('Erro ao atualizar professor/funcionário. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Editar Professor/Funcionário</h2>
        <button 
          className={styles.cancelButton}
          onClick={() => navigate('/staff')}
        >
          Cancelar
        </button>
      </div>

      {fetchLoading ? (
        <div className={styles.loading}>Carregando dados do professor/funcionário...</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.formSection}>
            <h3>Informações Básicas</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Cargo *</label>
                <input
                  type="text"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="contact">Contato</label>
                <input
                  type="tel"
                  id="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Informações Adicionais</h3>
            <div className={styles.formGroup}>
              <label htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditStaff; 