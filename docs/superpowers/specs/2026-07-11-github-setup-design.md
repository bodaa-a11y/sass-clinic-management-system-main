# Design Spec: GitHub Repository Setup & Collaboration

This document outlines the design and steps for setting up a private GitHub repository for the SaaS Clinic Management System, clean up the local workspace, and onboard an external GUI engineer.

## Goal
Upload the project to GitHub in a secure, private repository (`sass-clinic-management-system`), keeping the workspace clean and inviting the external GUI engineer (`moabdo038-debug`) as a collaborator.

## Proposed Setup

### 1. Workspace Cleanup & `.gitignore` Configuration
To ensure only necessary codebase assets are pushed to GitHub, the `.gitignore` file will be updated.

#### Changes in `.gitignore`
We will add entries for:
- `.windsurf/` (editor/IDE configuration directory)
- `db_push_output.txt` (Drizzle schema push log files)
- `test-results*` (JSON files containing local test results)
- `tmp-*` (temporary scripts/diagnostic TS files such as `tmp-diag.ts`, `tmp-reset-pass.ts`)

This prevents temporary files and local logs from polluting the shared repository.

### 2. Local Git Actions
1. Stage all relevant modifications and untracked code files (excluding ignored files).
2. Commit with a message: `chore: prepare repository for GUI and collaboration`.
3. Rename the current default branch to `main` (if not already `main` or if named `master`).

### 3. GitHub Repository Creation
1. Use the GitHub MCP server `create_repository` tool:
   - **Name**: `sass-clinic-management-system`
   - **Private**: `true` (Only authorized users can access)
   - **AutoInit**: `false` (We have an existing local repository)
2. Add the created repository as a remote origin:
   - `git remote add origin https://github.com/<owner>/sass-clinic-management-system.git`
3. Push local commits to the `main` branch:
   - `git push -u origin main`

### 4. Collaborator Onboarding
1. Invite `moabdo038-debug` as a collaborator.
2. Provide a direct link to settings in the console so that the owner can easily verify or manually accept/invite via UI:
   `https://github.com/<owner>/sass-clinic-management-system/settings/access`

## Verification Plan
1. Check that the remote repository `sass-clinic-management-system` exists and is private on GitHub.
2. Verify that local uncommitted changes are staged and committed cleanly.
3. Verify that the collaborator invitation has been successfully sent to `moabdo038-debug`.
