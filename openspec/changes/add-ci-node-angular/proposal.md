# Proposal: Add CI Workflow for NODE_ANGULAR

## Summary

Add a GitHub Actions continuous integration workflow for the NODE_ANGULAR project.

The workflow will validate the two main applications in this repository:

- `backend-gestion`
- `frontend-gestion`

## Motivation

The project currently contains a backend built with Node.js and NestJS, and a frontend built with Angular. A CI workflow helps verify that both parts of the project can install dependencies and pass basic validation when changes are pushed or opened as pull requests.

This change also demonstrates the Spec Driven Development workflow: the CI implementation is documented first through an OpenSpec proposal, design, and task list before creating the actual workflow file.

## Scope

This change will add a GitHub Actions workflow in:

```text
.github/workflows/ci.yml
```

The workflow should:

- Run on pushes to `main`.
- Run on pull requests targeting `main`.
- Validate `backend-gestion`.
- Validate `frontend-gestion`.
- Use Node.js 20.
- Use minimum permissions with `contents: read`.
- Use package scripts that already exist in each `package.json`.

## Out of Scope

This change will not:

- Deploy the backend or frontend.
- Configure production secrets.
- Modify backend or frontend source code.
- Add new tests.
- Change package scripts.

## Expected Result

After implementation, GitHub Actions should be able to run a CI workflow that validates the backend and frontend separately.
