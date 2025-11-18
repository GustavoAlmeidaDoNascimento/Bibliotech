import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock do usuário
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User'
} as any;

// Mock do AuthContext
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

// Mock do TagsContext
const mockTagsContext = {
  tags: [],
  loading: false,
  getTagsByIds: jest.fn(() => []),
  addTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
  refreshTags: jest.fn()
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  // Mock dos contextos usando jest.mock no arquivo de teste
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

