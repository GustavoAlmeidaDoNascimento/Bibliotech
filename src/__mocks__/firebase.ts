// Mock básico do Firebase para testes
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: false, data: () => null })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
    })),
    orderBy: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
      })),
    })),
    get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
  })),
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ exists: false, data: () => null })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  })),
  query: jest.fn((ref) => ref),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
  getDoc: jest.fn(() => Promise.resolve({ exists: false, data: () => null })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  orderBy: jest.fn((field) => ({ field })),
  where: jest.fn((field, operator, value) => ({ field, operator, value })),
  limit: jest.fn((count) => ({ count })),
};

export const db = mockFirestore;

export const initializeApp = jest.fn(() => ({}));
export const getFirestore = jest.fn(() => mockFirestore);

