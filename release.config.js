/**
 * @type {import('semantic-release').GlobalConfig}
 */
const branch = process.env.GITHUB_REF_NAME
const isMainBranch = branch === "main"

const plugins = [
  "@semantic-release/commit-analyzer",
  "@semantic-release/release-notes-generator",
]

// Only generate changelog file and commit package.json/changelog on the main branch
// This prevents merge conflicts when merging dev -> acc -> main
if (isMainBranch) {
  plugins.push(
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md", "bun.lock"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ]
  )
}

plugins.push("@semantic-release/github")

export default {
  branches: [
    "main",
    { name: "acc", prerelease: "beta" },
    { name: "dev", prerelease: "alpha" },
  ],
  plugins,
}
