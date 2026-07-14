import sqlite3
import json

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check raw message data for the most recent real session
sid = 'ses_0a0abfe71ffebQpfg0AOx17UxB'

c.execute("""
    SELECT id, time_created, data FROM message 
    WHERE session_id = ?
    ORDER BY time_created
    LIMIT 5
""", (sid,))
msgs = c.fetchall()

for m in msgs:
    print(f"\nMessage ID: {m[0]}")
    try:
        data = json.loads(m[2])
        role = data.get('role', '?')
        print(f"  Role: {role}")
        content = data.get('content')
        if isinstance(content, str):
            print(f"  Content (str): {content[:200]}")
        elif isinstance(content, list):
            print(f"  Content (list, {len(content)} items):")
            for j, part in enumerate(content[:3]):
                if isinstance(part, dict):
                    ptype = part.get('type', '?')
                    if ptype == 'text':
                        print(f"    [{j}] text: {part.get('text', '')[:200]}")
                    elif ptype == 'tool_use':
                        print(f"    [{j}] tool_use: {part.get('name', '?')}")
                    else:
                        print(f"    [{j}] {ptype}: {str(part)[:200]}")
                else:
                    print(f"    [{j}] non-dict: {str(part)[:100]}")
        else:
            print(f"  Content (other): {str(content)[:200]}")
    except Exception as e:
        print(f"  Error parsing: {e}")
        print(f"  Raw: {m[2][:200]}")

conn.close()
