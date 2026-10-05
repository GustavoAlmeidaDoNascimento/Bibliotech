import { BookWithStats } from './bookRecommendationService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Obtém a URL da Cloud Function para chat de livros
 */
const getBookChatFunctionUrl = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_URL) {
    return `${process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_URL}/bookChat`;
  }
  if (process.env.REACT_APP_BOOK_CHAT_FUNCTION_URL) {
    return process.env.REACT_APP_BOOK_CHAT_FUNCTION_URL;
  }
  return 'https://us-central1-shoollibsystem.cloudfunctions.net/bookChat';
};

export const bookChatService = {
  async sendMessage(
    messages: ChatMessage[],
    books: BookWithStats[],
    studentName?: string
  ): Promise<string> {
    const url = getBookChatFunctionUrl();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        books,
        studentName,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Desculpa, tive um problema ao responder. Pode tentar de novo? 😅';
      try {
        const errorData = await response.json();
        if (errorData?.error || errorData?.message) {
          errorMessage = errorData.error || errorData.message;
        }
      } catch {
        // Ignora erro ao parsear JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data?.reply) {
      throw new Error('Resposta vazia do assistente.');
    }

    return data.reply;
  },
};

