# Public Skeleton Agent Notes

This checkout is intentionally minimal. Do not add application source,
resources, package manifests, lockfiles, tests, or private build configuration
to the public repository.

Implementation changes belong in the private source repository. Public workflow
changes should keep pull requests safe for forks: no private token access and no
private source checkout during `pull_request` events.
