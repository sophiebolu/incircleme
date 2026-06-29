// Mobile test runner — jest-expo preset handles the RN/Expo transform + native-module mocks.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Pure-logic + a ScreenStates render smoke; transformIgnorePatterns comes from the preset.
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
