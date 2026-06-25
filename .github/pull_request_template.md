## Summary

<!-- What does this change and why? -->

## Linked issues

<!--
Use a GitHub closing keyword so the issue gets the `awaiting-release` label when
this PR merges into a milestone branch, and auto-closes when the milestone branch
merges to main. e.g. "Closes #123".
-->
Closes #

## Checklist

- [ ] Branched off the target **milestone branch** (`vMAJOR.MINOR.PATCH`) and targets it (not `main`)
- [ ] `make check` passes (lint + typecheck + test, backend and frontend)
- [ ] Updated `CHANGELOG.md` under `## [Unreleased]`
- [ ] Noted any change to the minimum compatible `docker-coredns-sync` version (if the consumed etcd schema is affected)
