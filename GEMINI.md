# GitFlow & Deployment Strategy

## Branching Strategy (GitFlow)
- `main`: Production-ready code. Auto-deploys to `prd` on push/merge.
- `acc`: Acceptance environment branch. Auto-deploys to `acc` on push/merge.
- `dev`: Integration branch for features. Base branch for all feature branches.
- `tst`: Local testing branch for releases.
- `feature/*` / `fix/*`: New features and enhancements. Created from `dev` and merged back to `dev`.
- `release/*`: Preparation for a new production release. 
    - Created from `dev` by picking specific features.
    - Merged into `tst` for local verification.
    - Merged into `acc` to trigger deployment and test on remote.
    - Merged into `main` after acceptance for production deployment.

## Deployment Rules
- **Automatic on Target Branches**: Deployments to `acc` and `main` are triggered automatically on `push` or `merge`.
- **Manual Control via Process**: We control when deployments happen by choosing when to merge a release branch into `acc` or `main`.
- **Cloudflare Build Time**: This structured approach is enforced to conserve limited Cloudflare build time.

## CI/CD Workflows
- `CI` (`ci.yml`): Runs automatically on every Pull Request to any branch. Verifies code quality.
- `Continuous Delivery` (`cd.yml`): Unified pipeline for pushes to `main`, `acc`, and `dev`.
    - Runs quality checks.
    - Handles semantic versioning. To prevent merge conflicts, `CHANGELOG.md` and `package.json` are **only updated and committed on the `main` branch**. `dev` and `acc` will receive pre-release tags but no direct file commits.
    - Deploys the latest code to the respective environment (`acc` or `prd`) if the branch requires it.
- `Lighthouse CI`: 
    - Runs on Pull Requests to `main`.
    - Can be manually triggered via `workflow_dispatch`.
    - Can be run locally using `bun run lhci`.
