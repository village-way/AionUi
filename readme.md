# AionUi Public Build Skeleton

This repository contains the public GitHub Actions entrypoints and bootstrap
script for AionUi builds.

The full application source lives in the private source repository. Trusted
build workflows fetch that source at runtime with the `GH_TOKEN` repository
secret, then run the existing AionUi build pipeline.

## Required Secret

- `GH_TOKEN`: token with read access to the private source repository. Release
  jobs also use this token for tag/release operations that require `repo` and
  `workflow` scopes.

Optional workflow variables:

- `AIONUI_SOURCE_REPO_URL`: private source repository URL. Defaults to
  `https://github.com/village-way/zhanlu-work.git`.
- `AIONUI_SOURCE_REF`: source branch, tag, or commit override.
