import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import Dashboard from './Dashboard';

// Mock do useDashboardCache
jest.mock('../../hooks/useDashboardCache', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    stats: null,
    loading: false,
    reload: jest.fn()
  }))
}));

// Mock do useCacheInvalidation
jest.mock('../../hooks/useCacheInvalidation', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    invalidateCache: jest.fn()
  }))
}));

// Mock do useIncrementalSync
jest.mock('../../hooks/useIncrementalSync', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sync: jest.fn()
  }))
}));

// Mock do useLazySection
jest.mock('../../hooks/useLazySection', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isVisible: true,
    ref: { current: null }
  }))
}));

// Mock do useFeatureBlock
jest.mock('../../hooks/useFeatureBlocks', () => ({
  __esModule: true,
  useFeatureBlock: jest.fn(() => ({
    isVisible: false,
    isDismissed: false,
    dismiss: jest.fn()
  }))
}));

// Mock do Firebase
jest.mock('../../config/firebase', () => ({
  db: require('../../__mocks__/firebase').db
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('should render metrics section', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/métricas de desempenho/i)).toBeInTheDocument();
    });
  });
});

