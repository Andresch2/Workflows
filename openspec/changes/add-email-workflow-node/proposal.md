# Proposal: Add Email Workflow Node

## Summary

Add a new Email node to the workflow editor.

The Email node will allow users to configure a basic email action inside a workflow.

## Motivation

Workflows often need to notify users or administrators when an event happens. An Email node is a common automation action and helps make the workflow editor more useful.

## Scope

This change will add a new node type called Email in the frontend workflow editor.

The node should include these properties:

- Recipient email
- Subject
- Message

## Out of Scope

This change will not send real emails from the backend yet.
This change will not configure SMTP credentials.
This change will not store secrets in the frontend.

## Expected Result

Users should be able to see and configure an Email node in the workflow editor.
