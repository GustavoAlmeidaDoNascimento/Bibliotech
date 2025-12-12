import React from 'react';
import styles from './NewBadge.module.css';

/**
 * Props do componente NewBadge
 */
interface NewBadgeProps {
  /** Texto a ser exibido no badge. Padrão: 'novo!' */
  text?: string;
  /** Variante visual do badge. Padrão: 'new' */
  variant?: 'new' | 'beta' | 'updated';
}

/**
 * Componente NewBadge
 * 
 * Este componente renderiza um badge (etiqueta) visual usado para destacar elementos
 * novos, atualizados ou em versão beta no sistema.
 * 
 * O NewBadge é utilizado para indicar visualmente ao usuário que um item, funcionalidade
 * ou conteúdo é recente, foi atualizado recentemente ou está em fase de testes (beta).
 * 
 * @example
 * // Badge padrão com texto "novo!"
 * <NewBadge />
 * 
 * @example
 * // Badge personalizado com texto customizado
 * <NewBadge text="lançamento" />
 * 
 * @example
 * // Badge do tipo "beta"
 * <NewBadge text="beta" variant="beta" />
 * 
 * @example
 * // Badge do tipo "updated" (atualizado)
 * <NewBadge text="atualizado!" variant="updated" />
 * 
 * @param props - Props do componente NewBadge
 * @returns Componente React que renderiza um badge estilizado
 */
const NewBadge: React.FC<NewBadgeProps> = ({ text = 'novo!', variant = 'new' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {text}
    </span>
  );
};

export default NewBadge;

