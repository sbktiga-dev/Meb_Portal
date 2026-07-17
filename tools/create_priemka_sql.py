import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'E:\Код 2 Мебельный портал\gost_priemka.json', 'r', encoding='utf-8') as f:
    g = json.load(f)

content_json = json.dumps(g['content'], ensure_ascii=False).replace("'", "''")
title = g['title'].replace("'", "''")
desc = 'Методы испытаний мебельных изделий. Порядок приёмки'.replace("'", "''")
cat = g['category']

sql = """INSERT INTO "Reference" ("id", "title", "description", "content", "category", "createdAt", "updatedAt") VALUES (md5(random()::text), '{title}', '{desc}', '{content_json}', '{cat}', NOW(), NOW());""".format(
    title=title, desc=desc, content_json=content_json, cat=cat
)

with open(r'E:\Код 2 Мебельный портал\gost_priemka.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print('SQL created')
