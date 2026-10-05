import { bookChatService, ChatMessage } from './bookChatService';
import { BookWithStats } from './bookRecommendationService';

describe('bookChatService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.REACT_APP_BOOK_CHAT_FUNCTION_URL;
  });

  const mockMessages: ChatMessage[] = [
    { role: 'user', content: 'Olá! Pode me indicar um livro?' },
  ];

  const mockBooks = [
    {
      id: '1',
      title: 'Dom Casmurro',
      authors: ['Machado de Assis'],
      genres: ['Romance'],
      available: true,
      synopsis: 'História de Bentinho e Capitu.',
      loanCount: 5,
      createdAt: { seconds: 123456, nanoseconds: 0 },
    },
  ] as unknown as BookWithStats[];

  it('deve enviar a requisição corretamente para a Cloud Function e retornar a resposta', async () => {
    const mockReply = 'Olá! Recomendo Dom Casmurro 📚';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: mockReply }),
    } as Response);

    const reply = await bookChatService.sendMessage(mockMessages, mockBooks, 'João');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = (global.fetch as jest.Mock).mock.calls[0];
    expect(callUrl).toContain('bookChat');
    expect(callOptions.method).toBe('POST');
    expect(JSON.parse(callOptions.body)).toEqual({
      messages: mockMessages,
      books: mockBooks,
      studentName: 'João',
    });
    expect(reply).toBe(mockReply);
  });

  it('deve utilizar a URL customizada de REACT_APP_BOOK_CHAT_FUNCTION_URL quando definida', async () => {
    process.env.REACT_APP_BOOK_CHAT_FUNCTION_URL = 'https://custom-domain.com/bookChat';

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'Resposta' }),
    } as Response);

    await bookChatService.sendMessage(mockMessages, mockBooks);

    const [callUrl] = (global.fetch as jest.Mock).mock.calls[0];
    expect(callUrl).toBe('https://custom-domain.com/bookChat');
  });

  it('deve lançar erro com a mensagem da API quando a requisição falhar', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Todos os modelos gratuitos estão indisponíveis no momento.' }),
    } as Response);

    await expect(
      bookChatService.sendMessage(mockMessages, mockBooks)
    ).rejects.toThrow('Todos os modelos gratuitos estão indisponíveis no momento.');
  });

  it('deve lançar erro quando a resposta não contiver reply', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(
      bookChatService.sendMessage(mockMessages, mockBooks)
    ).rejects.toThrow('Resposta vazia do assistente.');
  });
});
