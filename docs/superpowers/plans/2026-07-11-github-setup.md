# GitHub Repository Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a private GitHub repository named `sass-clinic-management-system`, commit the current local workspace clean of temporary/logs files, push to GitHub, and add `moabdo038-debug` as a collaborator.

**Architecture:** Configure local `.gitignore` to keep the repo clean, commit all local changes, use the GitHub MCP server to create the private repository, add the remote origin, push, and invite the collaborator.

**Tech Stack:** Git, GitHub API, GitHub MCP Server

## Global Constraints
- Repository must be PRIVATE.
- Collaborator is `moabdo038-debug`.

---

### Task 1: Configure `.gitignore` and Local Workspace Cleanup

**Files:**
- Modify: `d:\all project\sass v\.gitignore`

- [ ] **Step 1: Add cleanup entries to `.gitignore`**
  Modify `.gitignore` to add the following lines at the end:
  ```text
  # IDE & logs
  .windsurf/
  db_push_output.txt
  test-results*
  tmp-*
  ```
- [ ] **Step 2: Verify git status ignores those files**
  Run: `git status --ignored` in the terminal and verify that `.windsurf/`, `db_push_output.txt`, etc., are listed as ignored.
- [ ] **Step 3: Stage and commit `.gitignore`**
  Run:
  ```powershell
  git add .gitignore
  git commit -m "chore: configure .gitignore to exclude IDE files and logs"
  ```
  Expected: Clean commit of `.gitignore` only.

---

### Task 2: Stage and Commit Local Workspace Changes

**Files:**
- Modify: Local git staging

- [ ] **Step 1: Stage all relevant files**
  Run:
  ```powershell
  git add .
  ```
- [ ] **Step 2: Verify git status**
  Run:
  ```powershell
  git status
  ```
  Verify that all actual codebase files are staged, and no temp/ignored files are staged.
- [ ] **Step 3: Commit staged changes**
  Run:
  ```powershell
  git commit -m "chore: prepare repository for GUI and collaboration"
  ```
  Expected: Commits all local changes.
- [ ] **Step 4: Rename local default branch to main**
  Run:
  ```powershell
  git branch -M main
  ```
  Expected: Branch renamed to `main`.

---

### Task 3: Create GitHub Private Repository & Push Code

**Files:**
- Modify: GitHub remote settings

- [ ] **Step 1: Create repository on GitHub via MCP Server**
  Call MCP tool `github-mcp-server/create_repository` with:
  ```json
  {
    "name": "sass-clinic-management-system",
    "private": true,
    "autoInit": false
  }
  ```
  Expected: Success response containing the repository SSH/HTTPS URLs and the owner username.
- [ ] **Step 2: Add remote origin**
  Based on the owner username from Step 1 (let's say `<owner>`), run:
  ```powershell
  git remote add origin https://github.com/<owner>/sass-clinic-management-system.git
  ```
- [ ] **Step 3: Push main branch to GitHub**
  Run:
  ```powershell
  git push -u origin main
  ```
  Expected: Push completed successfully to the private repository.

---

### Task 4: Invite Collaborator

**Files:**
- Modify: Repository Access Settings

- [ ] **Step 1: Invite `moabdo038-debug`**
  Provide the user with a direct web link to invite the collaborator since the GitHub MCP server doesn't support collaborator management:
  ```text
  https://github.com/<owner>/sass-clinic-management-system/settings/access
  ```
  And guide them to add `moabdo038-debug` with Write permissions.
- [ ] **Step 2: Final verification**
  Verify the repository is accessible and private on GitHub.
