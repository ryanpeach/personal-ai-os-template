const path = require('path');

process.env.DATABASE_PATH = path.join(__dirname, 'data', 'test.sqlite');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  globalSetup: '<rootDir>/jest-global-setup.js',
  moduleNameMapper: {
    '^@personal-ai-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
