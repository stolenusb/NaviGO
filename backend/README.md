# Backend Development

## Setup

```bash
composer install
git config core.hooksPath ../.githooks
```

This repo uses a tracked Git hook directory at `../.githooks`.
The `pre-push` hook runs `composer cs:fix` and then `composer cs:check` from the backend directory.

## Quality checks

```bash
composer test
composer analyse
composer cs:check
composer cs:fix
```

## Continuous integration

The GitHub Actions workflow runs these checks automatically on pull requests and pushes to `main`/`master`.
