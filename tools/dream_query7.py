import sqlite3
import json
import time

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get user messages from ses_0a5c58c82ffeWjdaJ4UpN06ekv (July 13 session)
sid = 'ses_0a5c58c82ffeWjdaJ4UpN06ekv'

c.execute("""
    SELECT p.id, p.message_id, p.time_created, p.data 
    FROM part p 
    JOIN message m ON m.id = p.message_id
    WHERE p.session_id = ? AND json_extract(m.data, '$.role') = 'user'
    ORDER BY p.time_created
""", (sid,))
parts = c.fetchall()

print(f"=== USER PARTS for {sid} (Остатки по плану) ===")
for i, p in enumerate(parts):
    try:
        data = json.loads(p[3])
        ptype = data.get('type', '?')
        if ptype == 'text':
            text = data.get('text', '')
            if text.strip():
                dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(p[2]/1000))
                print(f"\n  [{i+1}] {dt}: {text[:400]}")
    except:
        pass

# Also check assistant messages for key decisions
print(f"\n\n=== ASSISTANT PARTS with design decisions ===")
c.execute("""
    SELECT p.id, p.message_id, p.time_created, p.data 
    FROM part p 
    JOIN message m ON m.id = p.message_id
    WHERE p.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY p.time_created
""", (sid,))
parts = c.fetchall()

for i, p in enumerate(parts):
    try:
        data = json.loads(p[3])
        ptype = data.get('type', '?')
        if ptype == 'text':
            text = data.get('text', '')
            # Look for decision-related content
            if any(kw in text.lower() for kw in ['решил', 'решили', 'решение', 'итого', 'резюме', 'результат', 'деплой', 'задеплоен', 'готово', 'зафиксировал']):
                dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(p[2]/1000))
                print(f"\n  [{i+1}] {dt}: {text[:400]}")
    except:
        pass

# Check commit history via tool calls
print(f"\n\n=== GIT TOOL CALLS ===")
c.execute("""
    SELECT p.time_created, p.data 
    FROM part p 
    JOIN message m ON m.id = p.message_id
    WHERE p.session_id = ? AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'bash'
    ORDER BY p.time_created
""", (sid,))
tools = c.fetchall()

for t in tools:
    try:
        data = json.loads(t[1])
        state = data.get('state', {})
        inp = state.get('input', {})
        cmd = inp.get('command', '')
        if 'git' in cmd.lower() and ('commit' in cmd.lower() or 'push' in cmd.lower()):
            dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(t[0]/1000))
            print(f"\n  {dt}: {cmd[:200]}")
    except:
        pass

conn.close()
