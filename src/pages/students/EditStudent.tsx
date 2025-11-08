import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './RegisterStudent.module.css'; // Reutilizando os estilos do RegisterStudent

interface StudentForm {
  name: string;
  classroom: string;
  shift: string;
  contact: string;
  address: string;
  number: string;
  neighborhood: string;
  complement: string;
  notes: string;
}

const EditStudent = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [formData, setFormData] = useState<StudentForm>({
    name: '',
    classroom: '',
    shift: '',
    contact: '',
    address: '',
    number: '',
    neighborhood: '',
    complement: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!currentUser || !studentId) return;

      try {
        const studentRef = doc(db, `users/${currentUser.uid}/students/${studentId}`);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const studentData = studentSnap.data() as StudentForm;
          setFormData(studentData);
        } else {
          setError('Aluno não encontrado');
          navigate('/students');
        }
      } catch (err) {
        console.error('Erro ao carregar dados do aluno:', err);
        setError('Erro ao carregar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [currentUser, studentId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const sanitizedValue = id === 'contact' ? value.replace(/\D/g, '') : value;
    setFormData(prev => ({
      ...prev,
      [id]: sanitizedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.classroom) {
      setError('Nome e turma são campos obrigatórios');
      return;
    }

    if (!currentUser || !studentId) {
      setError('Você precisa estar logado para editar alunos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const studentData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      const studentRef = doc(db, `users/${currentUser.uid}/students/${studentId}`);
      await updateDoc(studentRef, studentData);
      
      navigate('/students');
    } catch (err) {
      console.error('Erro ao atualizar aluno:', err);
      if (err instanceof Error) {
        setError(`Erro ao atualizar aluno: ${err.message}`);
      } else {
        setError('Erro ao atualizar aluno. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Editar Aluno</h2>
        <button 
          className={styles.cancelButton}
          onClick={() => navigate('/students')}
        >
          Cancelar
        </button>
      </div>

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
              <label htmlFor="classroom">Turma *</label>
              <input
                type="text"
                id="classroom"
                value={formData.classroom}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="shift">Turno *</label>
              <select
                id="shift"
                value={formData.shift}
                onChange={handleChange}
                required
                className={styles.selectField}
              >
                <option value="" disabled>Selecione o turno</option>
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
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
          <h3>Endereço</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="address">Endereço</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="number">Número</label>
              <input
                type="text"
                id="number"
                value={formData.number}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="neighborhood">Bairro</label>
              <input
                type="text"
                id="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="complement">Complemento</label>
              <input
                type="text"
                id="complement"
                value={formData.complement}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Informações Adicionais</h3>
          <div className={styles.formGroup}>
            <label htmlFor="notes">Observação</label>
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
    </div>
  );
};

export default EditStudent; 