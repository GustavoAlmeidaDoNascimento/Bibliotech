import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, User } from 'lucide-react';
import styles from './BottomNavigation.module.css';

interface BottomNavigationProps {
  studentId: string;
  activePage: 'home' | 'stats' | 'profile';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ studentId, activePage }) => {
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      path: `/student-dashboard/${studentId}/home`,
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      icon: BarChart3,
      path: `/student-dashboard/${studentId}/stats`,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: `/student-dashboard/${studentId}/profile`,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => handleNavigation(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={styles.navIcon} 
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

