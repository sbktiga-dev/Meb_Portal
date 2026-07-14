import sqlite3
import json
import time

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'
PROJECT_ID = '9aa2a87c-1313-4598-962c-b63247307aa7'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get last 7 days of sessions
now_ms = int(time.time() * 1000)
seven_days_ms = 7 * 24 * 60 * 60 * 1000
cutoff = now_ms - seven_days_ms

print(f"=== SESSIONS SINCE {time.strftime('%Y-%m-%d', time.localtime(cutoff/1000))} ===")
c.execute("""
    SELECT id, time_created, title 
    FROM session 
    WHERE project_id = ? AND time_created > ?
    ORDER BY time_created DESC
""", (PROJECT_ID, cutoff))
sessions = c.fetchall()
for s in sessions:
    ts = s[1] / 1000
    dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(ts))
    print(f"  {s[0]} | {dt} | {s[2][:80] if s[2] else '(no title)'}")

# For each real (non-checkpoint-writer) session, check user messages for durable keywords
print("\n=== SEARCHING USER MESSAGES FOR DURABLE KEYWORDS ===")
for s in sessions:
    sid = s[0]
    title = s[2] or ''
    # Skip checkpoint-writer sessions
    if title.startswith('checkpoint-writer'):
        continue
    
    # Get user messages
    c.execute("""
        SELECT time_created, data FROM message 
        WHERE session_id = ? AND json_extract(data, '$.role') = 'user'
        ORDER BY time_created
    """, (sid,))
    user_msgs = c.fetchall()
    
    for msg in user_msgs:
        try:
            msg_data = json.loads(msg[1])
            text = ''
            if isinstance(msg_data.get('content'), str):
                text = msg_data['content']
            elif isinstance(msg_data.get('content'), list):
                for part in msg_data['content']:
                    if isinstance(part, dict) and part.get('type') == 'text':
                        text += part.get('text', '')
            
            # Check for durable keywords
            keywords = ['всегда', 'никогда', 'запомни', 'правило', 'решение', 'решил', 
                       'decision', 'decided', 'repeat', 'again', 'every time', 'workflow',
                       'ошибка', 'проблема', 'fixed', 'fix', 'bug', 'fixing',
                       'архитектура', 'паттерн', 'pattern', 'запрещено', 'нельзя',
                       'только так', 'только через', 'обязательно']
            
            text_lower = text.lower()
            for kw in keywords:
                if kw in text_lower:
                    preview = text[:200].replace('\n', ' ')
                    dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(msg[0]/1000))
                    print(f"\n  [{s[0]}] {dt}: '{kw}' in user msg:")
                    print(f"    \"{preview}\"")
                    break  # one hit per message is enough
        except:
            pass

conn.close()
