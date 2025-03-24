// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  source: ['package.json', 'packages/apps/*/package.json'],
  versionGroups: [
    {
      packages: ['**'],
      dependencies: ['each', 'package', 'name', 'developed', 'in', 'this', 'monorepo'],
      dependencyTypes: ['dev'],
      pinVersion: 'workspace:*',
    },
  ],
}

module.exports = config
