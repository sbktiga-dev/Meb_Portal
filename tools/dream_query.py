import sqlite3
import sys

DB_PATH = r'C:\Users\Тигран\.local\share\mimocode\mimocode.db'
PROJECT_ID = '9aa2a87c-1313-4598-962c-b63247307aa7'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. List recent sessions for this project (last 7 days)
print("=== RECENT SESSIONS ===")
c.execute("""
    SELECT id, time_created, title 
    FROM session 
    WHERE project_id = ? 
    ORDER BY time_created DESC 
    LIMIT 15
""", (PROJECT_ID,))
for row in c.fetchall():
    print(f"  {row[0]} | {row[1]} | {row[2]}")

# 2. Get current session id
c.execute("SELECT id FROM session ORDER BY time_created DESC LIMIT 1")
current_session = c.fetchone()
if current_session:
    print(f"\n=== CURRENT SESSION: {current_session[0]} ===")

conn.close()
