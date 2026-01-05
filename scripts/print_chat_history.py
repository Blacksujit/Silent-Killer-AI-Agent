import pathlib

p = pathlib.Path('d:/2026-Projects/SILENT-KILLER/backend/docs/chat_history_2026-01-03.md')
if p.exists():
    print(p.read_text())
else:
    print('Chat history file not found:', p)
