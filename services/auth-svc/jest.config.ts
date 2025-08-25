import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  projects: [
    {
      displayName: 'unit',
      roots: ['<rootDir>/src'],
      testMatch: ['**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1',
      },
    },
    {
      displayName: 'e2e',
      roots: ['<rootDir>/test'],
      testMatch: ['**/*.e2e-spec.ts'],
      // ⬇️ головне: e2e в один воркер
      maxWorkers: 1,
      setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
      globalSetup: '<rootDir>/test/global-setup.js',
      globalTeardown: '<rootDir>/test/global-teardown.js',
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1',
      },
    },
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  clearMocks: true,
  // Enable global setup and teardown
  globalSetup: '<rootDir>/test/global-setup.js',
  globalTeardown: '<rootDir>/test/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
};

export default config;
