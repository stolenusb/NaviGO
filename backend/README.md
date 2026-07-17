# Backend Development

## Setup

```bash
composer install
```

## Quality checks

```bash
composer test
composer analyse
composer cs:check
composer cs:fix
```

## Continuous integration

The GitHub Actions workflow runs these checks automatically on pull requests and pushes to `main`/`master`.
