import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import Books from './Books';

// Mock do useFirestorePagination
jest.mock('../../hooks/useFirestorePagination', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    items: [],
    loading: false,
    hasMore: false,
    loadMore: jest.fn(),
    reload: jest.fn(),
    loadAll: jest.fn(),
    loadAllAndUpdate: jest.fn(),
    totalLoaded: 0
  }))
}));

// Mock do useOptimizedSearch
jest.mock('../../hooks/useOptimizedSearch', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    filters: {},
    filteredBooks: [],
    hasActiveFilters: false,
    isSearching: false,
    updateFilter: jest.fn(),
    clearFilters: jest.fn(),
    addTagFilter: jest.fn(),
    removeTagFilter: jest.fn(),
    filteredCount: 0
  }))
}));

// Mock do useBarcodeGenerator
jest.mock('../../hooks/useBarcodeGenerator', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    generatePDF: jest.fn(),
    isGenerating: false
  }))
}));

// Mock do Firebase
jest.mock('../../config/firebase', () => ({
  db: require('../../__mocks__/firebase').db
}));

describe('Books', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    render(<Books />);
    
    await waitFor(() => {
      expect(screen.getByText(/acervo da biblioteca/i)).toBeInTheDocument();
    });
  });

  it('should render view mode buttons', async () => {
    render(<Books />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /visualização em lista/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /visualização em grade/i })).toBeInTheDocument();
    });
  });

  it('should render register book button', async () => {
    render(<Books />);
    
    await waitFor(() => {
      const registerButton = screen.getByRole('button', { name: /registrar livro/i });
      expect(registerButton).toBeInTheDocument();
    });
  });

  it('should render filter section', async () => {
    render(<Books />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/filtrar por título/i)).toBeInTheDocument();
    });
  });
});

