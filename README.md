# Vantoris Private Institution

Vantoris Private Institution client platform with a separated operations workspace. The repository name remains a technical identifier; the customer-facing identity is Vantoris Private Institution.

- Repository: https://github.com/iamtheoracle/vantoris-x-money
- Recovery branch: `recovery/merge-vantoris-live`
- Recovery pull request: https://github.com/iamtheoracle/vantoris-x-money/pull/2

## Recovery status

This branch restores the original application entry point, route definitions, authentication context, Base44 client, member and operations screens, shared UI primitives, and the private LLM gateway/proxy files from `The-Oracle-Arc/vantoris-live`.

**This is still a recovery-in-progress branch, not a production release.** The source repository contains substantially more files than have been restored so far. Remaining shared components, Base44 entity/function/workflow definitions, and other supporting modules still need to be recovered and audited. Original source contains no standalone raster card-image assets in its Git tree; visual assets appear to be implemented through components/styles or external references, which should be verified during UI QA.

## Safety and release rules

- Do not merge or deploy until the build, route coverage, authentication and authorization boundaries, backend integrations, and AI gateway have been verified.
- Do not enter live member credentials or payment details into an unverified deployment.
- The recovery UI and code do not establish that any bank, payment processor, or settlement integration is live.
- Never force-push over `main`. Recover through the reviewable pull request and preserve the existing branch history.
- Keep all provider/API secrets server-side in deployment environment variables; never commit secrets to the repository.

## Validation

A GitHub Actions build workflow is included at `.github/workflows/recovery-build.yml`. Check the pull request's latest workflow run for the current build result. A successful compile alone is not a substitute for security review, integration testing, or end-to-end browser QA.


## Autonomous AI engineering workflow

The repository includes `.github/workflows/ai-engineering-agent.yml`, a manually triggered Codex engineering workflow. It can inspect and modify any relevant repository file, run checks, and publish its changes as a reviewable pull request. It does not push changes to `main` or deploy to production.

### One-time setup

1. In the repository, open **Settings → Secrets and variables → Actions**.
2. Add an Actions secret named `OPENAI_API_KEY` with an API key authorized to use the OpenAI API. Do not put this key in a source file or a `VITE_` variable.
3. Confirm GitHub Actions is enabled and that the workflow's `GITHUB_TOKEN` is permitted to create branches and pull requests under repository Actions settings.
4. Open **Actions → Vantoris AI Engineering Agent → Run workflow**.
5. Keep the base branch at `recovery/merge-vantoris-live`, enter the task, and run it. Review the generated pull request and its checks before merging.

The workflow runs Codex with the `:workspace` permission profile, uses a disposable GitHub-hosted runner, and keeps the repository write token out of the agent step. The agent receives no production deployment permission. Its ability to call external services or verify live integrations is limited by runner network restrictions and available test configuration.

If `OPENAI_API_KEY` is not configured, the workflow cannot run the model and will fail at setup; no AI edits are made. API usage may incur charges under the API account.
