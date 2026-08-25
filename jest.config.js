const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // mongodb-memory-server needs extra time to download/boot an in-memory
  // MongoDB instance on first run, plus buffer for real DB round-trips.
  testTimeout: 60000,
};

module.exports = createJestConfig(customJestConfig);