---
applyTo: ".github/workflows/**/*.yml,.github/workflows/**/*.yaml"
---

# GitHub Actions Workflow Instructions

These instructions apply when creating or editing GitHub Actions workflow files for the NODE_ANGULAR project.

## General Rules

- Keep YAML indentation consistent and readable.
- Use clear names for workflows, jobs, and steps.
- Explain when the workflow runs by reviewing the `on` section.
- Use minimum required permissions.
- Prefer `permissions: contents: read` unless a workflow needs more access.
- Do not write secrets, tokens, passwords, or credentials directly in workflow files.
- Use GitHub Secrets through the `secrets` context when sensitive values are required.
- Avoid unrelated workflow changes.

## Project Structure Rules

- Backend validation must target `backend-gestion`.
- Frontend validation must target `frontend-gestion`.
- Keep backend and frontend validation in separate jobs when possible.
- Review each folder's `package.json` before choosing npm commands.
- Use only scripts that exist in the corresponding `package.json`.

## Node.js Rules

- Use `actions/checkout@v4`.
- Use `actions/setup-node@v4`.
- Prefer Node.js 20 for CI unless the project explicitly requires another version.
- Use `npm ci` when a `package-lock.json` file exists.
- Use `npm install` only when lock files are not available.

## Backend Workflow Rules

- Set the backend job working directory to `backend-gestion`.
- Install backend dependencies before validation.
- Prefer existing backend scripts such as `npm run lint`, `npm test`, or `npm run build` when available.
- If tests are not suitable for CI, include a basic validation step that still checks the backend project.

## Frontend Workflow Rules

- Set the frontend job working directory to `frontend-gestion`.
- Install frontend dependencies before validation.
- Prefer existing frontend scripts such as `npm run build` or `npm test` when available.
- For Angular projects, validate that the build command matches the script defined in `package.json`.

## Documentation Rules

- Add comments only when they clarify non-obvious workflow behavior.
- Keep workflow files practical and concise.
- When suggesting workflow changes, mention how to validate the workflow locally or through a pull request.
