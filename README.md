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

## Migration status

The Codex GitHub Actions workflow has been removed from this migration branch. Base44 runtime services are being replaced in controlled stages; the legacy SDK remains until authentication, member data access, backend functions, and integrations have independent equivalents. Do not deploy this branch or remove the remaining SDK until those replacements and existing-member data reconciliation are verified.
