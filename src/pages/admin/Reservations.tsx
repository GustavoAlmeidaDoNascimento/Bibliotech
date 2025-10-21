import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService, Reservation } from '../../services/reservationService';
import {
  BookOpenIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import styles from './Reservations.module.css';

const Reservations: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Reservation['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReservations();
  }, [currentUser]);

  useEffect(() => {
    filterReservations();
  }, [reservations, filter, searchTerm]);

  const loadReservations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservations(currentUser.uid);
      setReservations(data);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    // Filtrar por status
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.studentName.toLowerCase().includes(term) ||
        r.bookTitle.toLowerCase().includes(term)
      );
    }

    setFilteredReservations(filtered);
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      await reservationService.cancelReservation(currentUser.uid, reservationId);
      await loadReservations();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      alert('Erro ao cancelar reserva');
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Confirmar que o livro foi retirado?')) return;

    try {
      await reservationService.completeReservation(currentUser.uid, reservationId);
      await loadReservations();
    } catch (error) {
      console.error('Erro ao completar reserva:', error);
      alert('Erro ao completar reserva');
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const badges = {
      pending: { label: 'Aguardando', color: styles.badgeWarning },
      ready: { label: 'Pronta', color: styles.badgeSuccess },
      completed: { label: 'Concluída', color: styles.badgeInfo },
      cancelled: { label: 'Cancelada', color: styles.badgeError },
      expired: { label: 'Expirada', color: styles.badgeError }
    };
    return badges[status];
  };

  const getTypeBadge = (type: Reservation['type']) => {
    return type === 'available' ? 'Disponível' : 'Fila de Espera';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterCount = (status: 'all' | Reservation['status']) => {
    if (status === 'all') return reservations.length;
    return reservations.filter(r => r.status === status).length;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Reservas de Livros</h1>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <CalendarDaysIcon className={styles.headerIcon} />
          <div>
            <h1>Reservas de Livros</h1>
            <p>{filteredReservations.length} reserva(s) encontrada(s)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por aluno ou livro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({getFilterCount('all')})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'ready' ? styles.active : ''}`}
            onClick={() => setFilter('ready')}
          >
            Prontas ({getFilterCount('ready')})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Aguardando ({getFilterCount('pending')})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Concluídas ({getFilterCount('completed')})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'cancelled' ? styles.active : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Canceladas ({getFilterCount('cancelled')})
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className={styles.content}>
        {filteredReservations.length === 0 ? (
          <div className={styles.emptyState}>
            <CalendarDaysIcon className={styles.emptyIcon} />
            <h3>Nenhuma reserva encontrada</h3>
            <p>
              {filter === 'all'
                ? 'Ainda não há reservas registradas no sistema.'
                : `Não há reservas com o status "${getStatusBadge(filter as Reservation['status']).label}".`}
            </p>
          </div>
        ) : (
          <div className={styles.reservationsList}>
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className={styles.reservationCard}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.bookCover}>
                    {reservation.bookCoverUrl ? (
                      <img src={reservation.bookCoverUrl} alt={reservation.bookTitle} />
                    ) : (
                      <BookOpenIcon />
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3>{reservation.bookTitle}</h3>
                    <p className={styles.author}>{reservation.bookAuthor || 'Autor não informado'}</p>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${getStatusBadge(reservation.status).color}`}>
                        {getStatusBadge(reservation.status).label}
                      </span>
                      <span className={styles.badgeType}>
                        {getTypeBadge(reservation.type)}
                      </span>
                      {reservation.type === 'waitlist' && reservation.position && (
                        <span className={styles.badgePosition}>
                          Posição: {reservation.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                      <UserIcon className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Aluno:</span>
                        <span className={styles.infoValue}>{reservation.studentName}</span>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <ClockIcon className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Criada em:</span>
                        <span className={styles.infoValue}>{formatDate(reservation.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {reservation.status === 'ready' && reservation.expiresAt && (
                    <div className={styles.expiryWarning}>
                      ⏰ Prazo para retirada: {formatDate(reservation.expiresAt)}
                    </div>
                  )}

                  {reservation.status === 'completed' && reservation.completedAt && (
                    <div className={styles.completedInfo}>
                      ✅ Retirado em: {formatDate(reservation.completedAt)}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <button
                    className={styles.btnDetails}
                    onClick={() => navigate(`/reservation-detail/${reservation.id}`)}
                    title="Ver detalhes da reserva"
                  >
                    <EyeIcon />
                    Ver Detalhes
                  </button>
                  
                  {(reservation.status === 'ready' || reservation.status === 'pending') && (
                    <>
                      {reservation.status === 'ready' && (
                        <button
                          className={styles.btnComplete}
                          onClick={() => handleCompleteReservation(reservation.id)}
                          title="Marcar como retirado"
                        >
                          <CheckCircleIcon />
                          Confirmar Retirada
                        </button>
                      )}
                      <button
                        className={styles.btnCancel}
                        onClick={() => handleCancelReservation(reservation.id)}
                        title="Cancelar reserva"
                      >
                        <XCircleIcon />
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;

