const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }],
  },
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^tools/(.*)$': '<rootDir>/tools/$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: false,
}

module.exports = config;
