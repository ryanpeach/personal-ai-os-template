/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@personal-ai-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
