import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { selectRandomQuestions } from '../../constants';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon
} from '@heroicons/react/24/outline';


import styles from './StudentLoanDetail.module.css';

interface Loan {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookCode?: string;
  borrowDate: any;
  dueDate: any;
  returnDate?: any;
  status: 'active' | 'returned';
  createdAt: any;
  readingProgress?: number;
  completed?: boolean;
}



const StudentLoanDetail = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [readingCompleted, setReadingCompleted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);


  
  useEffect(() => {
    fetchLoanDetails();
  }, [currentUser, loanId]);
  
  const fetchLoanDetails = async () => {
    if (!currentUser || !loanId) {
      setError('Informações de locação não encontradas');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const loanRef = doc(db, `users/${currentUser.uid}/loans/${loanId}`);
      const loanDoc = await getDoc(loanRef);
      
      if (!loanDoc.exists()) {
        setError('Locação não encontrada');
        setLoading(false);
        return;
      }
      
      const loanData = loanDoc.data();
      
      // Converter timestamps para Date
      const borrowDate = loanData.borrowDate?.toDate ? loanData.borrowDate.toDate() : new Date();
      const dueDate = loanData.dueDate?.toDate ? loanData.dueDate.toDate() : new Date();
      const returnDate = loanData.returnDate?.toDate ? loanData.returnDate.toDate() : undefined;
      const createdAt = loanData.createdAt?.toDate ? loanData.createdAt.toDate() : new Date();
      
      setLoan({
        id: loanDoc.id,
        ...loanData,
        borrowDate,
        dueDate,
        returnDate,
        createdAt
      } as Loan);
      
    } catch (err) {
      console.error('Erro ao buscar detalhes da locação:', err);
      setError('Ocorreu um erro ao carregar os detalhes da locação');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatDateTime = (date: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getDaysLeft = (dueDate: Date) => {
    if (!dueDate) return 0;
    
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getStatusText = (loan: Loan) => {
    if (loan.status === 'returned') return 'Devolvido';
    
    const daysLeft = getDaysLeft(loan.dueDate);
    
    if (daysLeft < 0) return `Atrasado (${Math.abs(daysLeft)} dias)`;
    if (daysLeft === 0) return 'Vence hoje';
    if (daysLeft === 1) return 'Vence amanhã';
    return `${daysLeft} dias restantes`;
  };
  
  const getStatusClass = () => {
    if (!loan) return '';
    
    if (loan.status === 'returned') return styles.statusReturned;
    
    const daysLeft = getDaysLeft(loan.dueDate);
    
    if (daysLeft < 0) return styles.statusOverdue;
    if (daysLeft <= 3) return styles.statusWarning;
    return styles.statusActive;
  };

  const generateWhatsAppMessage = () => {
    if (!loan) return '';
    
    const daysLeft = getDaysLeft(loan.dueDate);
    const borrowDateTime = formatDateTime(loan.borrowDate);
    const dueDate = formatDate(loan.dueDate);
    const borrowDate = formatDate(loan.borrowDate);
    
    // Verificar se deve usar formato para responsáveis
    if (settings.useGuardianContact) {
      const overdueDays = Math.abs(daysLeft);
      
      const message = `📚 *Lembrete de Devolução - ${settings.schoolName}*

Prezado(a) responsável,

O(a) aluno(a) *${loan.studentName}* retirou o livro "*${loan.bookTitle}*" da biblioteca no dia ${borrowDate}.

${daysLeft < 0 
  ? `⚠️ O prazo de devolução já passou há ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}.` 
  : daysLeft === 0
    ? '⚠️ O prazo de devolução é hoje.'
    : daysLeft === 1
      ? '⏰ O prazo de devolução é amanhã.'
      : `⏰ O prazo de devolução é ${dueDate}.`
}

Por favor, lembre o(a) aluno(a) de retornar o livro à biblioteca da escola.

📍 *${settings.schoolName}*
💻 *Feito através do Bibliotech*`;

      return encodeURIComponent(message);
    }
    
    // Formato original para contato direto com o aluno
    let statusMessage = '';
    
    if (daysLeft < 0) {
      const overdueDays = Math.abs(daysLeft);
      statusMessage = `📅 *Status:* Atrasado há ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`;
    } else if (daysLeft === 0) {
      statusMessage = `⚠️ *Status:* Vence hoje`;
    } else if (daysLeft === 1) {
      statusMessage = `⏰ *Status:* Vence amanhã`;
    } else {
      statusMessage = `✅ *Status:* ${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'}`;
    }
    
    const message = `📚 *Lembrete de Devolução - Bibliotech*

👤 *Aluno:* ${loan.studentName}
📖 *Livro:* ${loan.bookTitle}
🏷️ *Código:* ${loan.bookCode || 'N/A'}
📅 *Data de Retirada:* ${borrowDateTime}
📆 *Prazo de devolução:* ${dueDate}

${statusMessage}

${daysLeft < 0 
  ? '🔴 Por favor, retornar à biblioteca.' 
  : daysLeft <= 3 
    ? '🟡 Lembre-se de devolver o livro no prazo.' 
    : '🟢 Aproveite sua leitura!'
}

Você pode acessar suas métricas pelo link: https://bibliotech.tech/student-dashboard/${loan.studentId}

📍 *Biblioteca Escolar*
💻 *Feito através do Bibliotech*`;

    return encodeURIComponent(message);
  };

  // Função para buscar dados do aluno
  const getStudentData = async (studentId: string) => {
    if (!currentUser || !studentId) return null;
    
    try {
      const studentRef = doc(db, `users/${currentUser.uid}/students`, studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        return studentDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do aluno:', error);
      return null;
    }
  };

  const handleWhatsAppNotification = async () => {
    if (!loan?.studentId) {
      alert('ID do aluno não encontrado');
      return;
    }

    try {
      // Buscar dados do aluno para obter o número de telefone
      const studentData = await getStudentData(loan.studentId);
      
      if (!studentData) {
        alert('Dados do aluno não encontrados');
        return;
      }

      // Verificar se o aluno tem número de telefone
      const phoneNumber = studentData.contact || studentData.number;
      
      if (!phoneNumber) {
        alert('Número de telefone não encontrado para este aluno');
        return;
      }

      // Limpar número de telefone (remover caracteres não numéricos)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      if (cleanPhoneNumber.length < 10) {
        alert('Número de telefone inválido');
        return;
      }

      // Gerar mensagem
      const message = generateWhatsAppMessage();
      
      // Adicionar código do país (55 para Brasil) se não estiver presente
      const fullPhoneNumber = cleanPhoneNumber.startsWith('55') 
        ? cleanPhoneNumber 
        : `55${cleanPhoneNumber}`;
      
      // Abrir WhatsApp com número específico do aluno
      const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
      alert('Erro ao tentar enviar mensagem pelo WhatsApp');
    }
  };
  
  const handleReturnLoan = async () => {
    if (!currentUser || !loan) return;

    try {
      setProcessing(true);
      const loanRef = doc(db, `users/${currentUser.uid}/loans/${loan.id}`);

      await updateDoc(loanRef, {
        status: 'returned',
        returnDate: serverTimestamp(),
        completed: readingCompleted,
        readingProgress: readingProgress,
        updatedAt: serverTimestamp()
      });

      // CORREÇÃO: O código específico do exemplar agora fica disponível para novo empréstimo
      // O sistema de estoque é calculado dinamicamente baseado nos códigos disponíveis 
      // versus códigos emprestados, então não precisamos atualizar quantity manualmente

      setShowReturnDialog(false);
      setShowQuestions(false);
      await fetchLoanDetails(); // Re-fetch data to update UI

    } catch (err) {
      console.error('Erro ao processar devolução:', err);
      setError('Ocorreu um erro ao processar a devolução');
      setShowReturnDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleReadingProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setReadingProgress(value);
    
    // Considerar automaticamente como leitura concluída quando atingir 100%
    setReadingCompleted(value === 100);

    // Mostrar perguntas se o progresso for maior que 50%
    if (value > 50 && !showQuestions) {
      setSelectedQuestions(selectRandomQuestions(3));
      setShowQuestions(true);
    } else if (value <= 50) {
      setShowQuestions(false);
    }
  };

  const handleCancelLoan = async () => {
    if (!currentUser || !loan) return;
    
    try {
      setProcessing(true);
      
      // CORREÇÃO: Remove apenas o registro de locação
      // O sistema de estoque é calculado dinamicamente baseado nos códigos 
      // disponíveis versus códigos emprestados, então não precisamos atualizar
      // o campo 'quantity' manualmente
      
      // Excluir o registro de locação (isso libera automaticamente o código do exemplar)
      const loanRef = doc(db, `users/${currentUser.uid}/loans/${loan.id}`);
      await deleteDoc(loanRef);
      
      // Redirecionar para a página de locações com mensagem
      navigate('/student-loans', { 
        state: { 
          message: `Locação do livro "${loan.bookTitle}" cancelada com sucesso` 
        } 
      });
      
    } catch (err) {
      console.error('Erro ao cancelar locação:', err);
      setError('Erro ao processar o cancelamento da locação');
      setShowCancelDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleRenewLoan = async () => {
    if (!currentUser || !loan) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Calcular nova data de vencimento usando a configuração loanDuration
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + settings.loanDuration);
      
      // Atualizar o empréstimo com a nova data de vencimento
      const loanRef = doc(db, `users/${currentUser.uid}/loans/${loan.id}`);
      await updateDoc(loanRef, {
        dueDate: newDueDate,
        renewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setShowRenewDialog(false);
      await fetchLoanDetails(); // Recarregar dados para atualizar a UI
      
    } catch (err) {
      console.error('Erro ao renovar locação:', err);
      setError('Erro ao processar a renovação da locação');
      setShowRenewDialog(false);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/student-loans');
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleGoBack}
        >
          ← Voltar para Locações
        </button>
        <h2>Detalhes da Locação</h2>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loading}>Carregando detalhes da locação...</div>
      ) : !loan ? (
        <div className={styles.notFound}>
          <h3>Locação não encontrada</h3>
          <p>A locação solicitada não foi encontrada ou não existe mais.</p>
          <button 
            className={styles.backButton}
            onClick={handleGoBack}
          >
            Voltar para Locações
          </button>
        </div>
      ) : (
        <div className={styles.detailsContainer}>
          <div className={styles.loanInfo}>
            <div className={styles.mainDetails}>
              <div className={styles.bookTitle}>
                <h3>{loan.bookTitle}</h3>
                <span className={`${styles.statusTag} ${getStatusClass()}`}>
                  {getStatusText(loan)}
                </span>
              </div>
              
              <div className={styles.studentInfo}>
                <p>Aluno: <strong>
                  <span 
                    style={{
                      cursor: 'pointer',
                      color: '#4a90e2',
                      borderBottom: '1px dotted #4a90e2',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/students/${loan.studentId}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2c5aa0';
                      e.currentTarget.style.borderBottomStyle = 'solid';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4a90e2';
                      e.currentTarget.style.borderBottomStyle = 'dotted';
                    }}
                    title={`Ir para o perfil de ${loan.studentName}`}
                  >
                    {loan.studentName}
                  </span>
                </strong></p>
              </div>
            </div>
            
            <div className={styles.datesSection}>
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>Retirado em:</span>
                <span className={styles.dateValue}>{formatDateTime(loan.borrowDate)}</span>
              </div>
              
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>Prazo para devolução:</span>
                <span className={styles.dateValue}>{formatDate(loan.dueDate)}</span>
              </div>
              
              {loan.bookCode && (
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Código do exemplar:</span>
                  <span className={styles.dateValue} style={{ fontWeight: '600', color: '#1a73e8' }}>{loan.bookCode}</span>
                </div>
              )}
              
              {loan.returnDate ? (
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Devolvido em:</span>
                  <span className={styles.dateValue}>{formatDateTime(loan.returnDate)}</span>
                </div>
              ) : (
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Status:</span>
                  <span className={styles.dateValue} style={{ color: '#4a90e2', fontWeight: '500' }}>Locação ainda ativa</span>
                </div>
              )}
            </div>
            
            <div className={styles.actionsSection}>
              <button 
                className={styles.whatsappButton}
                onClick={handleWhatsAppNotification}
                title="Enviar lembrete por WhatsApp"
              >
                Avisar no WhatsApp
              </button>
              
              {loan.status === 'active' && (
                <>
                  <button 
                    className={styles.renewButton}
                    onClick={() => setShowRenewDialog(true)}
                    disabled={processing}
                    title="Renovar por mais tempo conforme configuração da escola"
                  >
                    <ArrowPathIcon className={styles.buttonIcon} />
                    Renovar Retirada
                  </button>
                  <button 
                    className={styles.returnButton}
                    onClick={() => {
                      setReadingProgress(loan.readingProgress || 0);
                      setReadingCompleted(loan.completed || false);
                      setShowReturnDialog(true);
                    }}
                    disabled={processing}
                  >
                    <CheckCircleIcon className={styles.buttonIcon} />
                    Devolver
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCancelDialog(true)}
                    disabled={processing}
                  >
                    <XCircleIcon className={styles.buttonIcon} />
                    Cancelar Retirada
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showReturnDialog && loan && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Devolução</h3>
            <p>Livro: <strong>{loan.bookTitle}</strong></p>
            <p>Aluno: <strong>{loan.studentName}</strong></p>
            
            <div className={styles.readingInfo}>
              <h4>Informações de Leitura</h4>
              
              <div className={styles.progressField}>
                <label>Progresso da leitura: {readingProgress}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={readingProgress}
                  onChange={handleReadingProgressChange}
                  className={styles.progressSlider}
                  disabled={processing}
                />
                <div className={styles.progressLabels}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {showQuestions && (
              <div className={styles.verificationSection}>
                <div className={styles.verificationAlert}>
                  <strong>Importante:</strong> Essas perguntas são essenciais para que tenhamos um bom controle de quanto o aluno leu. Pedimos que o ato de fazer as perguntas (quando os alunos falam que leram mais de 50%) vire rotina para ter um bom controle.
                </div>
                
                <h4>Perguntas de Verificação</h4>
                <p className={styles.verificationSubtitle}>
                  Faça essas perguntas ao aluno para verificar se ele realmente leu o conteúdo:
                </p>
                
                <div className={styles.questionsList}>
                  {selectedQuestions.map((question, index) => (
                    <div key={index} className={styles.questionItem}>
                      <span className={styles.questionNumber}>{index + 1}.</span>
                      <span className={styles.questionText}>{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.modalActions}>
               <button 
                className={styles.modalCancelButton}
                onClick={() => setShowReturnDialog(false)}
                disabled={processing}
              >
                Cancelar
              </button>
              <button 
                className={styles.modalConfirmReturnButton}
                onClick={handleReturnLoan}
                disabled={processing}
              >
                {processing ? 'Processando...' : 'Confirmar Devolução'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenewDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Renovação</h3>
            <p>Tem certeza que deseja renovar a retirada do livro <strong>"{loan?.bookTitle}"</strong>?</p>
            <p>A nova data de vencimento será <strong>{settings.loanDuration} dias</strong> a partir de hoje, conforme configuração da escola.</p>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => setShowRenewDialog(false)}
                disabled={processing}
              >
                Cancelar
              </button>
              <button 
                className={styles.modalConfirmButton}
                onClick={handleRenewLoan}
                disabled={processing}
              >
                {processing ? 'Processando...' : 'Sim, Renovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Cancelamento</h3>
            <p>Tem certeza que deseja cancelar a retirada do livro <strong>"{loan?.bookTitle}"</strong>?</p>
            <p>Esta ação não pode ser desfeita. O livro retornará ao acervo e todas as estatísticas relacionadas serão anuladas.</p>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => setShowCancelDialog(false)}
                disabled={processing}
              >
                Não, Manter Retirada
              </button>
              <button 
                className={styles.modalConfirmButton}
                onClick={handleCancelLoan}
                disabled={processing}
              >
                {processing ? 'Processando...' : 'Sim, Cancelar Retirada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLoanDetail; 