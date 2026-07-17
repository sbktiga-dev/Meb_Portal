import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'E:\Код 2 Мебельный портал\gost_19917.json', 'r', encoding='utf-8') as f:
    g1 = json.load(f)
with open(r'E:\Код 2 Мебельный портал\gost_20400.json', 'r', encoding='utf-8') as f:
    g2 = json.load(f)

sql_lines = []
for g in [g1, g2]:
    content_json = json.dumps(g['content'], ensure_ascii=False).replace("'", "''")
    title = g['title'].replace("'", "''")
    desc = 'Общие технические условия для мебельной продукции'.replace("'", "''")
    cat = g['category']
    sql = """INSERT INTO "Reference" ("id", "title", "description", "content", "category", "createdAt", "updatedAt") VALUES (md5(random()::text), '{title}', '{desc}', '{content_json}', '{cat}', NOW(), NOW());""".format(
        title=title, desc=desc, content_json=content_json, cat=cat
    )
    sql_lines.append(sql)

with open(r'E:\Код 2 Мебельный портал\gost_seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print('Created gost_seed.sql with', len(sql_lines), 'INSERT statements')
