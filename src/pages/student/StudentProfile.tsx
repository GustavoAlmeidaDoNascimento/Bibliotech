import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookMarked, MessageCircle, LogOut, Trophy, Crown } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService, StudentDashboardData } from '../../services/studentService';
import { useStudentProfileCache } from '../../hooks/useStudentProfileCache';
import styles from './StudentProfile.module.css';

const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  
  // Usar o hook de cache
  const { cachedData, isLoading: cacheLoading, setCachedData } = useStudentProfileCache(studentId || '');
  
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(cachedData?.dashboardData || null);
  const [loading, setLoading] = useState(cacheLoading);

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    let shouldFetchFromServer = true;

    // Se já tem dados em cache, usar eles
    if (cachedData) {
      setDashboardData(cachedData.dashboardData);
      setLoading(false);
      console.log('✅ Usando dados do perfil em cache', {
        studentId,
        hasSubscriptionPlan: typeof cachedData.dashboardData.subscriptionPlan !== 'undefined',
        subscriptionPlan: cachedData.dashboardData.subscriptionPlan
      });

      if (typeof cachedData.dashboardData.subscriptionPlan !== 'undefined') {
        console.log('🏷️ Plano obtido via cache, não é necessário buscar no servidor');
        shouldFetchFromServer = false;
      } else {
        console.log('ℹ️ Plano não presente no cache, buscando do servidor...');
      }
    }

    const loadData = async () => {
      try {
        console.log('🔄 Buscando dados do perfil do servidor...', { studentId });
        const data = await studentService.getStudentDashboardData(studentId);
        if (data) {
          setDashboardData(data);
          
          // Salvar no cache
          setCachedData({
            dashboardData: data
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (shouldFetchFromServer) {
      loadData();
    }
  }, [studentId, navigate, cachedData, setCachedData]);

  const handleMyBooksClick = () => {
    navigate(`/student-dashboard/${studentId}/my-books`);
  };

  const handleAchievementsClick = () => {
    navigate(`/student-dashboard/${studentId}/achievements`);
  };

  const handleLogout = () => {
    navigate('/student-id-input');
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '5551996468758'; // Número do suporte (formato internacional)
    const message = encodeURIComponent('Olá! Preciso de ajuda com o sistema Bibliotech.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  type PlanVariant = 'basic' | 'intermediate' | 'advanced';
  interface PlanDisplayData {
    tierLabel: string;
    variant: PlanVariant;
  }

  const subscriptionVariantClasses: Record<PlanVariant, { container: string; tier: string }> = {
    basic: {
      container: styles.subscriptionValueBasic,
      tier: styles.subscriptionTierBasic
    },
    intermediate: {
      container: styles.subscriptionValueIntermediate,
      tier: styles.subscriptionTierIntermediate
    },
    advanced: {
      container: styles.subscriptionValueAdvanced,
      tier: styles.subscriptionTierAdvanced
    }
  };

  const removeDiacritics = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const getPlanDisplayData = (plan?: string | null): PlanDisplayData | null => {
    if (plan === undefined || plan === null) {
      return null;
    }

    const rawValue = plan.toString().trim();
    if (!rawValue) {
      return null;
    }

    const normalized = removeDiacritics(rawValue).toLowerCase();

    if (
      normalized === '1' ||
      normalized === 'plano 1' ||
      normalized.includes('basico') ||
      normalized.includes('basic')
    ) {
      return { tierLabel: 'Básico', variant: 'basic' };
    }

    if (
      normalized === '2' ||
      normalized === 'plano 2' ||
      normalized.includes('intermediario') ||
      normalized.includes('intermediate')
    ) {
      return { tierLabel: 'Intermediário', variant: 'intermediate' };
    }

    if (
      normalized === '3' ||
      normalized === 'plano 3' ||
      normalized.includes('avancado') ||
      normalized.includes('advanced')
    ) {
      return { tierLabel: 'Avançado', variant: 'advanced' };
    }

    return null;
  };

  const formatPlanName = (plan?: string | null) => {
    if (!plan) {
      return '';
    }

    const normalized = plan
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

    if (!normalized) {
      return '';
    }

    if (/^\d+$/.test(normalized)) {
      return `Plano ${normalized}`;
    }

    return normalized;
  };

  const student = dashboardData?.student;
  const subscriptionPlan = dashboardData?.subscriptionPlan;
  const schoolName = dashboardData?.schoolName;
  const showSubscriptionSkeleton = dashboardData !== null && typeof subscriptionPlan === 'undefined';
  const planDisplayData = getPlanDisplayData(subscriptionPlan);
  const planVariantClasses = planDisplayData ? subscriptionVariantClasses[planDisplayData.variant] : null;

  useEffect(() => {
    console.log('🔍 Estado do plano na renderização do perfil', {
      studentId,
      subscriptionPlan,
      showSubscriptionSkeleton,
      hasDashboardData: !!dashboardData
    });
  }, [studentId, subscriptionPlan, showSubscriptionSkeleton, dashboardData]);

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Header Skeleton */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerTitleSkeleton}></div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className={styles.main}>
          {/* User Info Skeleton */}
          <div className={styles.userCard}>
            <div className={styles.avatarSkeleton}></div>
            <div className={styles.userInfo}>
              <div className={styles.userNameSkeleton}></div>
              <div className={styles.userIdSkeleton}></div>
              <div className={styles.subscriptionSkeleton}></div>
            </div>
          </div>

          {/* Menu Options Skeleton */}
          <div className={styles.menuSection}>
            <div className={styles.menuItemSkeleton}>
              <div className={styles.menuItemIconSkeleton}></div>
              <div className={styles.menuItemLabelSkeleton}></div>
            </div>

            <div className={styles.menuItemSkeleton}>
              <div className={styles.menuItemIconSkeleton}></div>
              <div className={styles.menuItemLabelSkeleton}></div>
            </div>
          </div>

          {/* Logout Button Skeleton */}
          <div className={styles.logoutButtonSkeleton}></div>
        </main>

        <BottomNavigation studentId={studentId || ''} activePage="profile" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Perfil</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* User Info */}
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {student?.name ? getInitials(student.name) : 'AL'}
          </div>
          <div className={styles.userInfo}>
            {student?.name ? (
              <h2>{student.name}</h2>
            ) : (
              <div className={styles.userNameSkeleton}></div>
            )}
            {student?.id ? (
              <p>ID: {student.id}</p>
            ) : (
              <div className={styles.userIdSkeleton}></div>
            )}
            {schoolName && (
              <p className={styles.schoolName}>{schoolName}</p>
            )}
            {showSubscriptionSkeleton ? (
              <div className={styles.subscriptionSkeleton}></div>
            ) : (
              <div className={styles.subscriptionInfo}>
                <span className={styles.subscriptionLabel}>Plano da escola</span>
                {subscriptionPlan ? (
                  <span className={`${styles.subscriptionValue} ${planVariantClasses?.container ?? ''}`}>
                    <Crown size={16} />
                    <span className={styles.subscriptionBrand}>Bibliotech</span>
                    <span className={`${styles.subscriptionTier} ${planVariantClasses?.tier ?? ''}`}>
                      {planDisplayData ? planDisplayData.tierLabel : formatPlanName(subscriptionPlan)}
                    </span>
                  </span>
                ) : (
                  <span className={styles.subscriptionEmpty}>Plano não disponível</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu Options */}
        <div className={styles.menuSection}>
          <button className={styles.menuItem} onClick={handleMyBooksClick}>
            <div className={styles.menuItemIcon}>
              <BookMarked size={20} />
            </div>
            <span className={styles.menuItemLabel}>Meus Livros Reservados</span>
          </button>

          <button className={styles.menuItem} onClick={handleAchievementsClick}>
            <div className={styles.menuItemIcon}>
              <Trophy size={20} />
            </div>
            <span className={styles.menuItemLabel}>Conquistas</span>
          </button>

          <button className={styles.menuItem} onClick={handleWhatsAppSupport}>
            <div className={styles.menuItemIcon}>
              <MessageCircle size={20} />
            </div>
            <span className={styles.menuItemLabel}>Suporte via WhatsApp</span>
          </button>
        </div>

        {/* Logout Button */}
        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="profile" />
    </div>
  );
};

export default StudentProfile;

