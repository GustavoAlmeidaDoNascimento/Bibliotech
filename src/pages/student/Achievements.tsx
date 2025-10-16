import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, BookOpen, Target, Flame, Crown, Award, Zap } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import styles from './Achievements.module.css';

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/profile`);
  };

  const achievementExamples = [
    {
      icon: <BookOpen size={24} />,
      title: 'Primeiro Passo',
      description: 'Retirar seu primeiro livro da biblioteca',
      color: '#3B82F6'
    },
    {
      icon: <Star size={24} />,
      title: 'Leitor Dedicado',
      description: 'Ler 10 livros em um mês',
      color: '#F59E0B'
    },
    {
      icon: <Trophy size={24} />,
      title: 'Explorador Literário',
      description: 'Ler livros de 5 categorias diferentes',
      color: '#8B5CF6'
    },
    {
      icon: <Flame size={24} />,
      title: 'Sequência de Leitura',
      description: 'Manter uma sequência de 30 dias lendo',
      color: '#EF4444'
    },
    {
      icon: <Target size={24} />,
      title: 'Meta Alcançada',
      description: 'Completar sua meta de leitura mensal',
      color: '#10B981'
    },
    {
      icon: <Crown size={24} />,
      title: 'Mestre da Biblioteca',
      description: 'Alcançar o topo do ranking mensal',
      color: '#F59E0B'
    },
    {
      icon: <Award size={24} />,
      title: 'Colecionador',
      description: 'Ler todos os livros de uma série',
      color: '#06B6D4'
    },
    {
      icon: <Zap size={24} />,
      title: 'Velocista',
      description: 'Terminar um livro em menos de 3 dias',
      color: '#EC4899'
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>Conquistas</h1>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Em Construção Banner */}
        <div className={styles.constructionBanner}>
          <div className={styles.constructionIcon}>
            <Trophy size={48} />
          </div>
          <h2>Funcionalidade em Construção</h2>
          <p>Estamos preparando um sistema completo de conquistas para tornar sua jornada de leitura ainda mais divertida e motivadora!</p>
        </div>

        {/* O que Esperar */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>O que você poderá fazer</h3>
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Trophy size={20} />
              </div>
              <div className={styles.featureContent}>
                <h4>Desbloquear Conquistas</h4>
                <p>Complete desafios de leitura e ganhe conquistas exclusivas</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Star size={20} />
              </div>
              <div className={styles.featureContent}>
                <h4>Acumular Pontos</h4>
                <p>Ganhe pontos a cada livro lido e suba no ranking</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Target size={20} />
              </div>
              <div className={styles.featureContent}>
                <h4>Definir Metas</h4>
                <p>Crie metas pessoais de leitura e acompanhe seu progresso</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Crown size={20} />
              </div>
              <div className={styles.featureContent}>
                <h4>Competir com Amigos</h4>
                <p>Compare seu desempenho com outros estudantes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Exemplos de Conquistas */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Exemplos de Conquistas</h3>
          <p className={styles.sectionDescription}>
            Veja alguns exemplos das conquistas que você poderá desbloquear:
          </p>

          <div className={styles.achievementsGrid}>
            {achievementExamples.map((achievement, index) => (
              <div key={index} className={styles.achievementCard}>
                <div 
                  className={styles.achievementIcon} 
                  style={{ backgroundColor: `${achievement.color}15`, color: achievement.color }}
                >
                  {achievement.icon}
                </div>
                <div className={styles.achievementContent}>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </div>
                <div className={styles.achievementLock}>
                  <div className={styles.lockIcon}>🔒</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className={styles.ctaBox}>
          <h3>Fique ligado!</h3>
          <p>
            Em breve você poderá acompanhar todas as suas conquistas, 
            desafios e progresso de leitura. Continue lendo e acumulando 
            experiência para quando o sistema estiver disponível!
          </p>
        </div>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="profile" />
    </div>
  );
};

export default Achievements;

