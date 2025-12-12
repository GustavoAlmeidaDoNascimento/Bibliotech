export interface DummyStudent {
  name: string;
  classroom: string;
  contact?: string;
  address?: string;
  shift?: string;
}

export interface DummyBook {
  title: string;
  authors: string;
  publisher?: string;
  genres: string[];
  description?: string;
  codes?: string[];
  quantity?: number;
}

export interface DummyContentPack {
  id: string;
  name: string;
  description: string;
  students: DummyStudent[];
  books: DummyBook[];
}

export const dummyContentPacks: DummyContentPack[] = [
  {
    id: 'filosofia',
    name: 'Filosofia',
    description: 'Grandes filósofos e suas obras clássicas',
    students: [
      { name: 'Sócrates', classroom: '3º Ano A', shift: 'Manhã' },
      { name: 'Platão', classroom: '3º Ano A', shift: 'Manhã' },
      { name: 'Aristóteles', classroom: '3º Ano B', shift: 'Manhã' },
      { name: 'Tales de Mileto', classroom: '2º Ano A', shift: 'Tarde' },
      { name: 'Heráclito', classroom: '2º Ano B', shift: 'Tarde' }
    ],
    books: [
      { 
        title: 'A República', 
        authors: 'Platão', 
        genres: ['Filosofia', 'Clássico'],
        publisher: 'Editora Clássica',
        description: 'Obra fundamental da filosofia política'
      },
      { 
        title: 'O Mito da Caverna', 
        authors: 'Platão', 
        genres: ['Filosofia'],
        publisher: 'Editora Clássica',
        description: 'Alegoria sobre conhecimento e realidade'
      },
      { 
        title: 'Ética a Nicômaco', 
        authors: 'Aristóteles', 
        genres: ['Filosofia', 'Ética'],
        publisher: 'Editora Clássica',
        description: 'Tratado sobre ética e virtude'
      },
      { 
        title: 'Metafísica', 
        authors: 'Aristóteles', 
        genres: ['Filosofia'],
        publisher: 'Editora Clássica',
        description: 'Investigação sobre o ser enquanto ser'
      },
      { 
        title: 'Apologia de Sócrates', 
        authors: 'Platão', 
        genres: ['Filosofia'],
        publisher: 'Editora Clássica',
        description: 'Defesa de Sócrates em seu julgamento'
      }
    ]
  },
  {
    id: 'fisica',
    name: 'Física',
    description: 'Cientistas renomados e obras científicas fundamentais',
    students: [
      { name: 'Albert Einstein', classroom: '3º Ano A', shift: 'Manhã' },
      { name: 'Erwin Schrödinger', classroom: '3º Ano B', shift: 'Manhã' },
      { name: 'Richard Feynman', classroom: '3º Ano A', shift: 'Tarde' },
      { name: 'James Clerk Maxwell', classroom: '2º Ano A', shift: 'Manhã' },
      { name: 'Robert Oppenheimer', classroom: '2º Ano B', shift: 'Tarde' },
      { name: 'Isaac Newton', classroom: '3º Ano B', shift: 'Tarde' },
      { name: 'Marie Curie', classroom: '2º Ano A', shift: 'Tarde' }
    ],
    books: [
      { 
        title: 'A Origem das Espécies', 
        authors: 'Charles Darwin', 
        genres: ['Ciência', 'Biologia'],
        publisher: 'Editora Científica',
        description: 'Fundamento da teoria da evolução'
      },
      { 
        title: 'Princípios Matemáticos da Filosofia Natural', 
        authors: 'Isaac Newton', 
        genres: ['Física', 'Matemática'],
        publisher: 'Editora Científica',
        description: 'Obra fundamental da física clássica'
      },
      { 
        title: 'A Teoria da Relatividade', 
        authors: 'Albert Einstein', 
        genres: ['Física'],
        publisher: 'Editora Científica',
        description: 'Explicação da relatividade especial e geral'
      },
      { 
        title: 'O Que é a Vida?', 
        authors: 'Erwin Schrödinger', 
        genres: ['Física', 'Biologia'],
        publisher: 'Editora Científica',
        description: 'Investigação sobre a natureza da vida'
      },
      { 
        title: 'Física em Seis Lições', 
        authors: 'Richard Feynman', 
        genres: ['Física'],
        publisher: 'Editora Científica',
        description: 'Introdução à física moderna'
      },
      { 
        title: 'Tratado sobre Eletricidade e Magnetismo', 
        authors: 'James Clerk Maxwell', 
        genres: ['Física'],
        publisher: 'Editora Científica',
        description: 'Fundamentos do eletromagnetismo'
      },
      { 
        title: 'Radioatividade', 
        authors: 'Marie Curie', 
        genres: ['Física', 'Química'],
        publisher: 'Editora Científica',
        description: 'Pesquisas sobre radioatividade'
      }
    ]
  },
  {
    id: 'celebridades',
    name: 'Celebridades',
    description: 'Personalidades famosas e best-sellers populares',
    students: [
      { name: 'Kanye West', classroom: '2º Ano A', shift: 'Manhã' },
      { name: 'Jay-Z', classroom: '2º Ano B', shift: 'Manhã' },
      { name: 'Kendrick Lamar', classroom: '3º Ano A', shift: 'Tarde' },
      { name: 'Beyoncé', classroom: '3º Ano B', shift: 'Tarde' },
      { name: 'Justin Bieber', classroom: '2º Ano A', shift: 'Tarde' }
    ],
    books: [
      { 
        title: 'O Poder do Hábito', 
        authors: 'Charles Duhigg', 
        genres: ['Autoajuda'],
        publisher: 'Editora Popular',
        description: 'Por que fazemos o que fazemos na vida e nos negócios'
      },
      { 
        title: 'A Sutil Arte de Ligar o F*da-se', 
        authors: 'Mark Manson', 
        genres: ['Autoajuda'],
        publisher: 'Editora Popular',
        description: 'Uma abordagem contra-intuitiva para viver uma vida boa'
      },
      { 
        title: 'O Código da Vinci', 
        authors: 'Dan Brown', 
        genres: ['Suspense', 'Ficção'],
        publisher: 'Editora Popular',
        description: 'Thriller sobre símbolos e segredos históricos'
      },
      { 
        title: 'Cinquenta Tons de Cinza', 
        authors: 'E. L. James', 
        genres: ['Romance'],
        publisher: 'Editora Popular',
        description: 'Romance erótico best-seller'
      },
      { 
        title: 'A Menina que Roubava Livros', 
        authors: 'Markus Zusak', 
        genres: ['Drama', 'Ficção Histórica'],
        publisher: 'Editora Popular',
        description: 'História sobre uma menina na Alemanha nazista'
      }
    ]
  }
];
