const localStorageMock = {
  clear: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}
global.localStorage = localStorageMock
