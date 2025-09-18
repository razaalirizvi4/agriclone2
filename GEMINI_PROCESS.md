# Gemini Task Execution Process

This document outlines the standardized process I will follow for executing tasks within this project. The purpose is to ensure clarity, traceability, and a consistent workflow.

## The Process

1.  **Task Identification**: I will first identify the task to be performed, either from a user request or from a project document (like `doc/baseline-setup.md`).

2.  **Log Initiation**: Before starting any task, I will create or update a log file in the `/log` directory. The log entry will be marked with an `IN PROGRESS` status.

3.  **Execution**: I will execute the task using the necessary tools (`run_shell_command`, `write_file`, etc.).

4.  **Notification**: Upon completion of a task, I will notify you that it is done.

5.  **Log Completion**: After notifying you, I will update the log entry status to `COMPLETED` or `FAILED`.

## Log Format

All logs will be placed in the `/log` directory. The format for a log entry is as follows:

```
TASK_ID: [Unique ID for the task]
TASK: [Name of the Task]
FILE: [File being modified or created, if any]
TIMESTAMP: [YYYY-MM-DD HH:MM:SS]
STATUS: [IN PROGRESS | COMPLETED | FAILED]
---
```

## User Prompt Logging

All user prompts will be logged in date-specific Markdown files within the `/prompts` directory. Each file will be named `YYYY-MM-DD.md` and will contain a chronological list of prompts received on that date. This ensures a complete and traceable record of all interactions.