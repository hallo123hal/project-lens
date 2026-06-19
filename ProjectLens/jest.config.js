module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@forge/api$': '<rootDir>/src/test/__mocks__/@forge/api.ts',
    '^@forge/resolver$': '<rootDir>/src/test/__mocks__/@forge/resolver.ts',
  },
};
