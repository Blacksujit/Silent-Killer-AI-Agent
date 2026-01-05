# Assistant Startup Notes — SILENT-KILLER

Use this file to quickly load context when resuming work on the SILENT-KILLER project.

1. Where the chat history is stored
   - `backend/docs/chat_history_2026-01-03.md` — primary conversation snapshot.

2. Quick commands to print the history (PowerShell)

```powershell
# print the chat history file
Get-Content d:\2026-Projects\SILENT-KILLER\backend\docs\chat_history_2026-01-03.md -Raw

# run focused unit tests (no external installs required)
$env:PYTHONPATH = 'd:\2026-Projects\SILENT-KILLER'
pytest -q tests/test_rules.py tests/test_normalizer.py tests/test_actions.py tests/test_ranker.py
```

3. Default priorities for the morning session (2026-01-04 AM)
   - Add more ranker unit tests, then implement SQLite action persistence.
   - If disk-space issues prevent `pip install`, run unit tests locally or in CI with sufficient space.

4. Where to find relevant files
   - Ranker: `backend/app/core/ranker.py`
   - Rules: `backend/app/core/rules.py`
   - Actions: `backend/app/core/actions.py`
   - Notebook: `backend/docs/SILENT_KILLER_mvp_flow.ipynb`

5. If you (assistant) are rehydrated into a fresh session, run the quick command above to print the chat history before taking any code edits. That preserves continuity.
