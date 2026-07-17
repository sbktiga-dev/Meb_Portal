---
name: build-verify
description: Проверка сборки Next.js проекта — TypeScript, Prisma, билд. Исправление ошибок и повторная проверка.
---

# Build & Verify — МебПортал

Полный цикл проверки сборки проекта МебПортал. Используй после любых изменений в коде, перед деплоем, или при диагностике ошибок.

## Когда использовать

- После изменения кода (новые фичи, исправления багов)
- Перед деплоем на сервер
- При ошибке в CI/CD или на продакшене
- При добавлении/изменении Prisma модели

## Пошаговый процесс

### 1. Prisma Generate (если были изменения schema.prisma)

```bash
npx prisma generate 2>&1
```

**Когда**: Если файл `prisma/schema.prisma` был изменён.
**Ошибка**: Если PrismaClient не сгенерирован, TypeScript выдаст ошибки импорта.

### 2. TypeScript проверка

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 30
```

**Цель**: Найти ошибки типов до сборки.
**Типичные ошибки**:
- `Property 'X' does not exist on type 'Y'` — не хватает поля в интерфейсе
- `Argument of type 'X' is not assignable` — несовпадение типов в Prisma/Zod
- `'authHeader' is possibly 'null'` — нужна проверка на null

### 3. Next.js Build

```bash
npx next build 2>&1 | Select-String -Pattern "Compiled|Failed|Error"
```

**Таймаут**: 180000ms (3 минуты).
**Успех**: Выводит "Compiled successfully" или "Route (app)" с размерами.
**Ошибка**: `Failed to compile` или `Error:` — смотреть строки выше.

### 4. Обработка ошибок

Если build упал:

1. Прочитать ошибку (обычно в последних 20 строках)
2. Найти файл с ошибкой
3. Исправить
4. Повторить шаг 2-3

**Типичные паттерны ошибок МебПортала**:
- `Company не имеет categories` — фильтрация по categories не работает для Company
- `Manufacturer использует name, не companyName` — проверить Prisma схему
- `Specialist user nullable` — `user?: User | null` в интерфейсе
- `@updatedAt без значений` — не добавлять `DateTime @updatedAt` к модели со строками

### 5. Проверка dev-сервера (опционально)

```bash
# Убить существующий процесс на порту 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

```bash
# Запустить dev-сервер
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "E:\Код 2 Мебельный портал" -NoNewWindow
```

### 6. Проверка сайта (опционально)

```bash
Invoke-WebRequest -Uri "https://mebportal.online" -UseBasicParsing -TimeoutSec 15 | Select-Object StatusCode
```

**Ожидаемый результат**: StatusCode 200.

## Важные замечания

- **PowerShell не поддерживает `&&`** — использовать `;` или отдельные команды
- **Dev-сервер запускать через `Start-Process`** чтобы не падал при таймауте bash
- **NODE_OPTIONS**: На 2GB VM может потребоваться `--max-old-space-size=1536`
- **Prisma generate должен запускаться до tsc** — иначе TypeScript не видит типы
- **`.next` директория**: Если build падает с OOM — `rm -rf .next` перед билдом

## Контрольный чеклист перед деплоем

- [ ] `npx prisma generate` — PrismaClient сгенерирован
- [ ] `npx tsc --noEmit` — нет ошибок типов
- [ ] `npx next build` — билд успешен
- [ ] Dev-сервер запускается и работает
- [ ] Основные страницы загружаются (главная, профиль, каталоги)
