import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Componente de redirecionamento para a nova estrutura
 * Esta rota mantém compatibilidade com links antigos redirecionando para /home
 */
const StudentDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (studentId) {
      // Redireciona para a nova página home
      navigate(`/student-dashboard/${studentId}/home`, { replace: true });
    } else {
      navigate('/student-id-input', { replace: true });
    }
  }, [studentId, navigate]);

  // Retorna null enquanto redireciona
  return null;
};

export default StudentDashboard;

