---
name: deploy-yandex
description: Деплой МебПортала на Yandex Cloud VM. Git pull, build, pm2 restart. Включает fallback через SCP при ошибках git push.
---

# Deploy to Yandex Cloud — МебПортал

Деплой приложения на Yandex Cloud VM. Два метода: SSH (основной) и SCP (fallback).

## Когда использовать

- После коммита изменений в `main` ветку
- При необходимости обновить продакшен
- При ошибке GitHub Actions (Connection reset)

## Информация о сервере

- **VM**: `compute-vm-2-2-20-ssd-1783603878308` (zone: ru-central1-d)
- **IP**: `81.26.178.60`
- **Домен**: `mebportal.online` (SSL через Let's Encrypt)
- **SSH**: `ssh ubuntu@81.26.178.60`
- **PM2 процесс**: `mebportal`
- **Директория проекта**: `/home/ubuntu/Meb_Portal`
- **DATABASE_URL**: `postgresql://mebportal:mebportal2026@localhost:5432/mebportal`

## Метод 1: SSH деплой (основной)

### Шаг 1: Коммит и пуш

```bash
git add -A
git commit -m "fix: описание изменений"
git push origin main
```

### Шаг 2: SSH деплой на сервер

```bash
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$env:USERPROFILE\.ssh\id_ed25519" ubuntu@81.26.178.60 "cd /home/ubuntu/Meb_Portal && git fetch origin && git reset --hard origin/main && npm install && npx prisma generate && rm -rf .next && npm run build 2>&1 | tail -20 && pm2 restart mebportal && echo DEPLOY_OK"
```

**Что делает**:
1. `git fetch origin` — забрать изменения
2. `git reset --hard origin/main` — сбросить к main
3. `npm install` — установить зависимости
4. `npx prisma generate` — сгенерировать PrismaClient
5. `rm -rf .next` — очистить кэш билда
6. `npm run build` — собрать проект
7. `pm2 restart mebportal` — перезапустить приложение

### Шаг 3: Проверка

```bash
ssh ubuntu@81.26.178.60 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
```

**Ожидаемый результат**: `200`

```bash
Invoke-WebRequest -Uri "https://mebportal.online" -UseBasicParsing -TimeoutSec 15 | Select-Object StatusCode
```

**Ожидаемый результат**: StatusCode 200

## Метод 2: SCP деплой (fallback)

Используй когда GitHub push падает с `Connection reset`.

### Шаг 1: Скопировать файлы на сервер

```bash
# Пример: копирование конкретных файлов
scp -i "$env:USERPROFILE\.ssh\id_ed25519" "путь/к/файлу.ts" ubuntu@81.26.178.60:/tmp/имя_файла.ts
```

### Шаг 2: Применить на сервере

```bash
ssh ubuntu@81.26.178.60 "cp /tmp/имя_файла.ts /home/ubuntu/Meb_Portal/src/app/путь/к/файлу.ts"
```

### Шаг 3: Билд и рестарт

```bash
ssh ubuntu@81.26.178.60 "cd /home/ubuntu/Meb_Portal && npx prisma generate && rm -rf .next && npm run build 2>&1 | tail -20 && pm2 restart mebportal"
```

## Миграции БД (если изменена schema.prisma)

```bash
ssh ubuntu@81.26.178.60 "cd /home/ubuntu/Meb_Portal && npx prisma db push"
```

**Важно**: `prisma db push` для продакшена (не `prisma migrate dev`).

## Решение проблем

### PM2 падает в цикле重启

```bash
ssh ubuntu@81.26.178.60 "cd /home/ubuntu/Meb_Portal && pm2 stop mebportal && rm -rf .next && npm run build 2>&1 | tail -20 && pm2 restart mebportal"
```

### SSH зависает (OOM VM)

Перезагрузить VM через Yandex Cloud Console → `yc compute instance restart --name compute-vm-2-2-20-ssd-1783603878308`

### Build падает с OOM

```bash
ssh ubuntu@81.26.178.60 "cd /home/ubuntu/Meb_Portal && NODE_OPTIONS='--max-old-space-size=1536' npm run build"
```

### Git cannot lock ref

```bash
git remote prune origin
git fetch origin
```

## Важные замечания

- **`npm install --production` НЕ использовать** — ломает билд (tailwindcss/devDeps)
- **`.next` директория теряется при reboot** — всегда делаем `rm -rf .next` перед билдом
- **Время билда**: ~3-5 минут на 2GB VM
- **nginx SSL только на домен** — bare IP `81.26.178.60` возвращает 404
- **PM2 startup НЕ настроен** — после reboot VM нужно делать `pm2 restart mebportal`
