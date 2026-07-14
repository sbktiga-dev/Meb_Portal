import sqlite3
import json

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check parts for the most recent real session
sid = 'ses_0a0abfe71ffebQpfg0AOx17UxB'

c.execute("""
    SELECT p.id, p.message_id, p.time_created, p.data 
    FROM part p 
    JOIN message m ON m.id = p.message_id
    WHERE p.session_id = ? AND json_extract(m.data, '$.role') = 'user'
    ORDER BY p.time_created
    LIMIT 10
""", (sid,))
parts = c.fetchall()

print(f"=== USER PARTS for {sid} ===")
for p in parts:
    print(f"\nPart ID: {p[0]}")
    try:
        data = json.loads(p[3])
        ptype = data.get('type', '?')
        print(f"  Type: {ptype}")
        if ptype == 'text':
            text = data.get('text', '')
            print(f"  Text: {text[:400]}")
        elif ptype == 'tool':
            tool = data.get('tool', '?')
            state = data.get('state', {})
            inp = state.get('input', {})
            print(f"  Tool: {tool}")
            if 'content' in inp:
                print(f"  Input content: {str(inp['content'])[:200]}")
        else:
            print(f"  Data: {str(data)[:300]}")
    except Exception as e:
        print(f"  Error: {e}")
        print(f"  Raw: {p[3][:200]}")

conn.close()
