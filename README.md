# Codex-Gemini Bridge MVP v0.1

A review-first context-reduction bridge where Gemini CLI acts as the **Junior Agent** and Codex acts as the **Senior Agent**.

## Core Philosophy
- **Junior (Gemini)**: The Scout. Maps context, reduces noise, identifies risks, and prepares handoffs.
- **Senior (Codex)**: The Surgeon. Performs precise, architecture-aware modifications.
- **Git Diff**: The Judge. Validates the reality of changes.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Install Gemini CLI:
   Make sure `gemini` is in your PATH or configured in `.env`.

3. Start the server:
   ```bash
   npm run dev
   ```

## Usage Flow

### 1. Analyze & Handoff
Submit a task via the dashboard or CLI:
```bash
npm run handoff -- "Create a login form with validation"
```
This generates:
- `.bridge/handoff.json`: Structured analysis.
- `.bridge/senior-prompt.md`: Optimized prompt for the Senior agent.

### 2. Senior Execution
Copy the contents of `.bridge/senior-prompt.md` into Codex. Let Codex perform the changes.

### 3. Review
After Codex modifies the files, review the changes:
```bash
npm run review-diff -- "Create a login form with validation"
```
The Junior will analyze the git diff and flag any regressions or blocking issues.

## Project Structure
- `src/bridge`: Core orchestration and handoff logic.
- `src/junior`: Provider system (Gemini CLI, Mock, etc.).
- `src/senior`: Prompt templates for Senior agents.
- `src/utils`: Shell, Git, and Filesystem utilities.
- `.bridge/skills`: Specialized agent personalities.

## Safety
- **.bridgeignore**: Prevents sending secrets or large node_modules to the Junior.
- **Filesystem Safety**: Restricted to project root.
- **Manual Handoff**: V0.1 prefers manual handoff for safety.

## Roadmap
- [ ] Auto-repair of invalid JSON from Junior.
- [ ] Direct Senior execution integration.
- [ ] Real-time token usage estimator.
