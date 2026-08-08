const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
};

// next-intl v4 ships ESM-only (`"type": "module"`), and so does its whole
// runtime dependency tree: next-intl → use-intl → intl-messageformat →
// @formatjs/*, plus @schumitar/icu-type-parser, icu-minify, po-parser and
// negotiator. jest can't parse `export` from node_modules, so every ESM
// package in that tree must be transformed. next/jest *prepends* a default
// `/node_modules/` ignore, so appending to `transformIgnorePatterns` is
// ineffective — we override the whole array with a negative-lookahead
// allowlist (transform everything EXCEPT these ESM packages). Adding a
// future ESM-only dep to this tree means adding its name here too.
// See next-intl#1796.
module.exports = async () => ({
  ...(await createJestConfig(config)()),
  transformIgnorePatterns: ['node_modules/(?!next-intl|use-intl|intl-messageformat|@formatjs|@schumitar|icu-minify|po-parser|negotiator)'],
});