import sqlite3
import json
import time

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get user messages from key sessions
sessions_to_check = [
    ('ses_0a0abfe71ffebQpfg0AOx17UxB', 'Настройка страницы Моя Страница'),
    ('ses_0a5c58c82ffeWjdaJ4UpN06ekv', 'Остатки по плану'),
]

for sid, title in sessions_to_check:
    print(f"\n{'='*60}")
    print(f"SESSION: {sid} - {title}")
    print(f"{'='*60}")
    
    c.execute("""
        SELECT time_created, data FROM message 
        WHERE session_id = ? AND json_extract(data, '$.role') = 'user'
        ORDER BY time_created
    """, (sid,))
    user_msgs = c.fetchall()
    
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
            
            if text.strip():
                dt = time.strftime('%Y-%m-%d %H:%M', time.localtime(msg[0]/1000))
                print(f"\n  [{i+1}] {dt}:")
                # Show full text but limit to 600 chars
                display = text[:600]
                print(f"    {display}")
                if len(text) > 600:
                    print(f"    ... ({len(text)} total chars)")
        except Exception as e:
            print(f"  [{i+1}] (error: {e})")

conn.close()
