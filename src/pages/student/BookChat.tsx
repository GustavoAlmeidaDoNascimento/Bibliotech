import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Sparkles } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { FeatureBlock } from '../../components/ui';
import { studentService } from '../../services/studentService';
import { bookRecommendationService, BookWithStats } from '../../services/bookRecommendationService';
import { bookChatService, ChatMessage } from '../../services/bookChatService';
import { inferTierFromPlanValue, formatPlanDisplayName } from '../../services/subscriptionService';
import styles from './BookChat.module.css';

const SUGGESTED_QUESTIONS = [
  'Quais livros de aventura você me recomenda?',
  'Tem algum livro de romance disponível?',
  'Me conta sobre os livros mais emprestados.',
  'Quero algo de suspense, o que você sugere?',
  'Pode me dar uma lista de leituras para iniciantes?',
];

const BookChat: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [books, setBooks] = useState<BookWithStats[]>([]);
  const [studentName, setStudentName] = useState<string | undefined>();
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const planTier = useMemo(
    () => inferTierFromPlanValue(subscriptionPlan),
    [subscriptionPlan]
  );
  const isBlocked = useMemo(
    () => planTier !== 'advanced',
    [planTier]
  );
  const planDisplayName = useMemo(
    () => formatPlanDisplayName(subscriptionPlan),
    [subscriptionPlan]
  );

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    const loadData = async () => {
      try {
        const data = await studentService.getStudentDashboardData(studentId);
        if (data) {
          setStudentName(data.student?.name);
          setSubscriptionPlan(data.subscriptionPlan ?? null);

          if (data.student?.userId) {
            const allBooks = await bookRecommendationService.getAllBooksWithStats(data.student.userId);
            setBooks(allBooks);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);

    try {
      const reply = await bookChatService.sendMessage(updatedMessages, books, studentName);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpa, tive um problema ao responder. Pode tentar de novo? 😅',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestion = (question: string) => {
    sendMessage(question);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Carregando BiblioIA...</p>
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="chat" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(`/student-dashboard/${studentId}/home`)}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerTitle}>
            <Bot size={22} />
            <span>BiblioIA</span>
          </div>
        </div>
        <div className={styles.blockedContent}>
          <FeatureBlock
            planDisplayName={planDisplayName}
            featureName="BiblioIA — Assistente de Livros Avançado"
            description="Com a BiblioIA você pode conversar sobre o acervo, pedir recomendações personalizadas e descobrir novos livros. Disponível no Plano Avançado."
            highlights={[
              'Recomendações personalizadas por gênero e preferência',
              'Respostas sobre qualquer livro do acervo',
              'IA disponível 24h para os alunos',
            ]}
            buttonText="Conhecer Plano Avançado"
            footnoteText="Disponível exclusivamente no Plano Avançado."
          />
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="chat" />
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(`/student-dashboard/${studentId}/home`)}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerTitle}>
          <Bot size={22} />
          <span>BiblioIA</span>
        </div>
        <div className={styles.headerBadge}>
          <Sparkles size={12} />
          <span>IA</span>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {!hasMessages && (
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>
              <Bot size={40} />
            </div>
            <h2>Olá{studentName ? `, ${studentName.split(' ')[0]}` : ''}! 👋</h2>
            <p>Sou a BiblioIA, sua assistente de leitura. Posso recomendar livros do acervo, contar sinopses e te ajudar a encontrar a próxima leitura perfeita!</p>

            <div className={styles.suggestions}>
              <p className={styles.suggestionsLabel}>Experimente perguntar:</p>
              <div className={styles.suggestionsList}>
                {SUGGESTED_QUESTIONS.map((question, i) => (
                  <button
                    key={i}
                    className={styles.suggestionButton}
                    onClick={() => handleSuggestion(question)}
                    disabled={isSending}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
          >
            {msg.role === 'assistant' && (
              <div className={styles.assistantAvatar}>
                <Bot size={16} />
              </div>
            )}
            <div className={styles.messageBubble}>
              {msg.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {isSending && (
          <div className={`${styles.message} ${styles.messageAssistant}`}>
            <div className={styles.assistantAvatar}>
              <Bot size={16} />
            </div>
            <div className={`${styles.messageBubble} ${styles.typingBubble}`}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className={styles.textInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre livros..."
            rows={1}
            disabled={isSending}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!input.trim() || isSending}
            aria-label="Enviar mensagem"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <BottomNavigation studentId={studentId || ''} activePage="chat" />
    </div>
  );
};

export default BookChat;
