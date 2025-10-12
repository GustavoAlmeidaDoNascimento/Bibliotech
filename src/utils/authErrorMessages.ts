/**
 * Utilitário para converter erros do Firebase Auth em mensagens amigáveis para o usuário
 */

export const getAuthErrorMessage = (error: any): string => {
  if (!error || !error.code) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    
    case 'auth/invalid-email':
      return 'O email fornecido não é válido.';
    
    case 'auth/user-disabled':
      return 'Esta conta foi desabilitada. Entre em contato com o administrador.';
    
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login. Tente novamente mais tarde.';
    
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    
    case 'auth/weak-password':
      return 'A senha é muito fraca. Escolha uma senha mais forte.';
    
    case 'auth/email-already-in-use':
      return 'Este email já está sendo usado por outra conta.';
    
    case 'auth/operation-not-allowed':
      return 'Operação não permitida. Entre em contato com o administrador.';
    
    case 'auth/requires-recent-login':
      return 'Esta operação requer um login recente. Faça login novamente.';
    
    default:
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
};
