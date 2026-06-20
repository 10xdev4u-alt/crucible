// Vitest config for the docs site
export default {
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 5_000,
  },
};
