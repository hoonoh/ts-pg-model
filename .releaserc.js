module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogTitle: '# ts-pg-model changelog',
      },
    ],
    '@semantic-release/github',
    '@semantic-release/git',
  ],
};