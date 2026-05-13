# Design: Email Workflow Node

## Overview

The Email node will be added to the existing workflow editor.

Before implementation, the current node structure must be reviewed in:

```text
frontend-gestion/src/app/pages/workflows/workflow-editor/
```

The implementation should follow the same patterns used by existing nodes.

## Node Properties

The Email node should support:

- `to`
- `subject`
- `message`

## Frontend Behavior

The Email node should appear as an available node type in the workflow editor.

When selected, the properties panel should allow editing:

- Recipient email
- Subject
- Message

## Backend Behavior

No backend behavior is required in this first version.

Real email sending can be implemented later in a separate specification.

## Validation

The change should be validated with:

```powershell
cd frontend-gestion
npm run build
```
