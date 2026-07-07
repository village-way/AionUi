# Public Skeleton Agent Notes

This checkout is intentionally minimal. Do not add application source,
resources, package manifests, lockfiles, tests, or implementation build
configuration to the public repository.

Changes should stay scoped to public workflow, bootstrap, and repository
maintenance files. Pull request checks must remain safe for forks and should not
run package builds during `pull_request` events.
