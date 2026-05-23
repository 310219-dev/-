module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.js'],
  collectCoverageFrom: ['frontend/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true
};
