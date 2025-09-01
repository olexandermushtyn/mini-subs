/** @type {import('jest').Config} */
export default {
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.e2e-spec.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' }
};
