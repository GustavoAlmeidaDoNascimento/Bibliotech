import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import Students from './Students';
import { AuthContext } from '../../contexts/AuthContext';
import { TagsContext } from '../../contexts/TagsContext';

// Mock dos contextos
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User'
} as any;

const mockAuthContext = {
  currentUser: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  authState: {
    data: mockUser,
    status: 'success' as const,
    error: null
  }
};

const mockTagsContext = {
  tags: [],
  loading: false,
  getTagsByIds: jest.fn(() => []),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
  getTagById: jest.fn(),
  genres: [],
  addGenre: jest.fn(),
  removeGenre: jest.fn(),
  capitalizeTag: jest.fn()
};

// Mock do useInfiniteScroll
jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useInfiniteScroll: jest.fn(() => ({
    hasMore: false,
    loadMore: jest.fn()
  }))
}));

// Mock do Firebase
jest.mock('../../config/firebase', () => ({
  db: require('../../__mocks__/firebase').db
}));

// Mock do studentIndexService
jest.mock('../../services/studentIndexService', () => ({
  studentIndexService: {
    upsertEntry: jest.fn(() => Promise.resolve())
  }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext as any}>
      <TagsContext.Provider value={mockTagsContext as any}>
        {ui}
      </TagsContext.Provider>
    </AuthContext.Provider>
  );
};

describe('Students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    renderWithProviders(<Students />);
    
    await waitFor(() => {
      expect(screen.getByText(/alunos/i)).toBeInTheDocument();
    });
  });

  it('should render filter section', async () => {
    renderWithProviders(<Students />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar por nome/i)).toBeInTheDocument();
    });
  });

  it('should render register student button', async () => {
    renderWithProviders(<Students />);
    
    await waitFor(() => {
      const registerButton = screen.getByRole('link', { name: /registrar aluno/i });
      expect(registerButton).toBeInTheDocument();
    });
  });

  it('should toggle filters visibility', async () => {
    renderWithProviders(<Students />);
    
    await waitFor(() => {
      const toggleButton = screen.getByRole('button', { name: /ocultar filtros|mostrar filtros/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });
});

