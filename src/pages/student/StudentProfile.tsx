import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookMarked, MessageCircle, LogOut } from 'lucide-react';
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

    // Se já tem dados em cache, usar eles
    if (cachedData) {
      setDashboardData(cachedData.dashboardData);
      setLoading(false);
      console.log('✅ Usando dados do perfil em cache');
      return;
    }

    const loadData = async () => {
      try {
        console.log('🔄 Buscando dados do perfil do servidor...');
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

    loadData();
  }, [studentId, navigate, cachedData, setCachedData]);

  const handleMyBooksClick = () => {
    navigate(`/student-dashboard/${studentId}/my-books`);
  };


  const handleLogout = () => {
    navigate('/student-id-input');
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '5551997188572'; // Número do suporte (formato internacional)
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

  const student = dashboardData?.student;

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

