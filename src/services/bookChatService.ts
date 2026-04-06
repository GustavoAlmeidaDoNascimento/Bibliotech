import { BookWithStats } from './bookRecommendationService';

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY ?? '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODELS = [
  'qwen/qwen3.6-plus:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-12b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.5:free',
  'arcee-ai/trinity-large-preview:free',
];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const buildSystemPrompt = (books: BookWithStats[], studentName?: string): string => {
  const bookList = books
    .map(book => {
      const authors = book.authors?.join(', ') || 'Autor desconhecido';
      const genres = book.genres?.join(', ') || 'Sem categoria';
      const available = book.available ? 'Disponível' : 'Indisponível';
      const synopsis = book.synopsis || book.description || '';
      return `- "${book.title}" por ${authors} | Gêneros: ${genres} | ${available}${synopsis ? ` | Sinopse: ${synopsis.substring(0, 150)}` : ''}`;
    })
    .join('\n');

  const greeting = studentName ? `O aluno se chama ${studentName}.` : '';

  return `Você é a BiblioIA, uma assistente inteligente da biblioteca escolar Bibliotech. ${greeting}
Sua função é ajudar os alunos a descobrir e escolher livros do acervo da biblioteca.

ACERVO DA BIBLIOTECA:
${bookList || 'Nenhum livro cadastrado ainda.'}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro, de forma amigável, animada e acessível para estudantes.
- Use emojis ocasionalmente para tornar a conversa mais divertida 📚.
- Ao recomendar livros, priorize os disponíveis no acervo acima.
- Se o aluno perguntar sobre um livro que não está no acervo, informe gentilmente e sugira alternativas disponíveis.
- Você pode ajudar com: recomendações por gênero/tema, sinopses, autores, listas de leitura e dicas gerais.
- Seja conciso mas útil — respostas entre 2 e 5 parágrafos são ideais.
- Se não tiver livros suficientes no acervo para uma recomendação, diga isso com simpatia.`;
};

const tryModel = async (model: string, body: object): Promise<string | null> => {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bibliotech.tech',
      'X-Title': 'Bibliotech - BiblioIA',
    },
    body: JSON.stringify({ ...body, model }),
  });

  if (!response.ok) {
    console.warn(`Modelo ${model} falhou com status ${response.status}`);
    return null;
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';
  // Remove bloco <think>...</think> que alguns modelos retornam
  const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return clean || null;
};

export const bookChatService = {
  async sendMessage(
    messages: ChatMessage[],
    books: BookWithStats[],
    studentName?: string
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(books, studentName);

    const body = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 800,
      temperature: 0.7,
    };

    for (const model of FREE_MODELS) {
      const content = await tryModel(model, body);
      if (content) return content;
    }

    throw new Error('Todos os modelos gratuitos estão indisponíveis no momento.');
  },
};
