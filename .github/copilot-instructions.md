# GitHub Copilot Instructions for NODE_ANGULAR

## Project Context

This repository is named NODE_ANGULAR and contains two main applications:

- `backend-gestion`: backend application built with Node.js and NestJS.
- `frontend-gestion`: frontend application built with Angular.

The project uses a Spec Driven Development workflow with OpenSpec and AI development rules from LIDR ai-specs.

## General Rules

- Review the project structure before suggesting changes.
- Check both `backend-gestion` and `frontend-gestion` when a change may affect the full application.
- Follow the specifications located in `openspec/`.
- Follow the development rules located in `ai-specs/`.
- Respect the separation between backend and frontend responsibilities.
- Do not modify files without explaining first what should change and why.
- Work step by step and avoid large unrelated changes.
- Keep changes focused on the requested task.
- Document important architectural or workflow changes.
- Suggest tests or validation commands after each relevant change.
- Do not place secrets, passwords, tokens, API keys, or credentials directly in the code.
- Use environment variables or GitHub Secrets when sensitive values are required.

## Backend Rules

- The backend is located in `backend-gestion`.
- Review `backend-gestion/package.json` before suggesting npm commands.
- Prefer existing NestJS patterns already used in the project.
- Keep controllers, services, modules, DTOs, and database logic separated.
- Suggest `npm run lint`, `npm test`, or `npm run build` only when those scripts exist.

## Frontend Rules

- The frontend is located in `frontend-gestion`.
- Review `frontend-gestion/package.json` and `frontend-gestion/angular.json` before suggesting commands.
- Prefer Angular patterns already used in the project.
- Keep components, services, routes, and styles organized according to the existing structure.
- Suggest `npm run build` or `npm test` only when those scripts exist.

## Spec Driven Development Rules

- Before implementing a relevant change, check whether there is an OpenSpec change proposal.
- If no specification exists, suggest creating one before modifying code.
- Use proposals, designs, and task lists to guide implementation.
- Treat specifications as the source of truth for planned changes.
- When implementation differs from the specification, explain the reason clearly.

## GitHub Actions Rules

- Workflow files must be placed in `.github/workflows/`.
- Use clear names for workflows, jobs, and steps.
- Use minimum required permissions.
- Do not hardcode secrets in workflow files.
- Validate backend and frontend separately when possible.
- Use package scripts that actually exist in each `package.json`.
