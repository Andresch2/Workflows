# Design: CI Workflow for NODE_ANGULAR

## Overview

The CI workflow will be implemented as a GitHub Actions YAML file located at:

```text
.github/workflows/ci.yml
```

The workflow will contain two independent jobs:

- `backend`
- `frontend`

This separation makes the workflow easier to read and helps identify whether a failure belongs to the backend or the frontend.

## Trigger

The workflow will run on:

- `push` events to the `main` branch.
- `pull_request` events targeting the `main` branch.

## Permissions

The workflow will use minimum permissions:

```yaml
permissions:
  contents: read
```

This is enough for the workflow to check out the repository and run validation commands.

## Runtime

Both jobs will use:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- Node.js `20`

Node.js 20 is selected because it is a stable long-term support version commonly used in CI environments.

## Backend Job

The backend job will run inside:

```text
backend-gestion
```

The backend `package.json` includes these useful scripts:

- `build`
- `lint`
- `test`

The workflow should install dependencies and then run validation using the scripts that already exist.

## Frontend Job

The frontend job will run inside:

```text
frontend-gestion
```

The frontend `package.json` includes these useful scripts:

- `build`
- `test`

For this initial CI example, the build script is the safest validation because it confirms that the Angular project can compile.

## Notes

- The workflow must not include secrets or credentials.
- The workflow must not invent package scripts.
- Backend and frontend validation must remain separate.
- Any future change to CI behavior should update this OpenSpec change or create a new one.
