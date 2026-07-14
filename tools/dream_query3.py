import sqlite3
import json
import time

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'
PROJECT_ID = '9aa2a87c-1313-4598-962c-b63247307aa7'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get all real (non-checkpoint-writer) sessions in last 7 days
now_ms = int(time.time() * 1000)
seven_days_ms = 7 * 24 * 60 * 60 * 1000
cutoff = now_ms - seven_days_ms

c.execute("""
    SELECT id, time_created, title 
    FROM session 
    WHERE project_id = ? AND time_created > ?
    AND (title NOT LIKE 'checkpoint-writer%' OR title IS NULL)
    ORDER BY time_created DESC
""", (PROJECT_ID, cutoff))
sessions = c.fetchall()

for s in sessions:
    sid = s[0]
    ts = s[1] / 1000
    dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(ts))
    title = s[2] or '(no title)'
    
    print(f"\n{'='*60}")
    print(f"SESSION: {sid}")
    print(f"DATE: {dt} | TITLE: {title}")
    print(f"{'='*60}")
    
    # Get user messages
    c.execute("""
        SELECT time_created, data FROM message 
        WHERE session_id = ? AND json_extract(data, '$.role') = 'user'
        ORDER BY time_created
    """, (sid,))
    user_msgs = c.fetchall()
    
    if user_msgs:
        print(f"  User messages ({len(user_msgs)}):")
        for i, msg in enumerate(user_msgs):
            try:
                msg_data = json.loads(msg[1])
                text = ''
                if isinstance(msg_data.get('content'), str):
                    text = msg_data['content']
                elif isinstance(msg_data.get('content'), list):
                    for part in msg_data['content']:
                        if isinstance(part, dict) and part.get('type') == 'text':
                            text += part.get('text', '')
                preview = text[:300].replace('\n', ' ').strip()
                if preview:
                    print(f"    [{i+1}] {preview}")
            except:
                pass
    
    # Get tool calls that created new files (potential durable changes)
    c.execute("""
        SELECT time_created, data FROM part 
        WHERE session_id = ? AND json_extract(data, '$.type') = 'tool'
        AND json_extract(data, '$.tool') IN ('write', 'edit')
        ORDER BY time_created
    """, (sid,))
    writes = c.fetchall()
    
    if writes:
        print(f"  File writes/edits ({len(writes)}):")
        seen = set()
        for w in writes:
            try:
                w_data = json.loads(w[1])
                tool = w_data.get('tool', '?')
                inp = w_data.get('state', {}).get('input', {})
                fp = inp.get('file_path', '?')
                # Only show once per file
                short = fp.split('\\')[-1] if '\\' in fp else fp.split('/')[-1]
                if short not in seen:
                    seen.add(short)
                    print(f"    {tool}: {fp}")
            except:
                pass

conn.close()
