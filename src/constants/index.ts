// Animation constants
export const ANIMATION_DURATION = {
  SHORT: 0.2,
  MEDIUM: 0.6,
  LONG: 1.0,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px',
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#0078d4',
  SECONDARY: '#4db5ff',
  SUCCESS: '#00b894',
  ERROR: '#d63031',
  WARNING: '#fdcb6e',
  TEXT: {
    PRIMARY: '#2c3e50',
    SECONDARY: '#6c7686',
    LIGHT: '#ffffff',
    DARK: '#1a1a1a',
  },
  BACKGROUND: {
    PRIMARY: '#ffffff',
    SECONDARY: '#f8f9fa',
    DARK: '#1a1a1a',
  },
} as const;

// Z-Index layers
export const Z_INDEX = {
  DROPDOWN: 100,
  STICKY: 200,
  MODAL: 1000,
  TOAST: 1100,
} as const;

// Common sizes
export const SIZES = {
  HEADER_HEIGHT: '60px',
  SIDEBAR_WIDTH: '250px',
  BORDER_RADIUS: '8px',
  MAX_WIDTH: '1200px',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  USER_TYPE_SELECTION: '/select-user-type',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STAFF: '/staff',
  BOOKS: '/books',
  CLASSES: '/classes',
  LOANS: '/loans',
  RETURNS: '/returns',
  WITHDRAWALS: '/withdrawals',
  SETTINGS: '/settings',
  CATALOG: '/catalog',
} as const;

// Perguntas de verificação para controle de leitura
export const VERIFICATION_QUESTIONS = [
  'Qual o personagem que tu mais se identificou até a parte que você leu?',
  'Teve alguma frase ou diálogo que ficou na sua cabeça?',
  'Se você tivesse que explicar o que leu até agora pra alguém que nunca viu esse livro, o que diria?',
  'Se tivesse que resumir o que você leu em três palavras, quais seriam?',
  'Tem alguma parte que ficou na sua cabeça depois que você leu? Qual foi?',
  'Imagina que alguém te perguntou: "Vale a pena ler esse livro?" O que você responderia?',
  'Se você tivesse que discordar de alguma coisa que leu, o que seria? (não precisa ser algo que você discorde de verdade)'
];

// Função para selecionar perguntas aleatórias
export const selectRandomQuestions = (count: number = 3) => {
  const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}; 