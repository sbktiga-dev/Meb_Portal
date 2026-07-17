---
description: Проверка доступности сайта mebportal.online и локального dev-сервера
---

# Проверка сайта

Проверь доступность сайта МебПортала:

1. **Продакшен**: `Invoke-WebRequest -Uri "https://mebportal.online" -UseBasicParsing -TimeoutSec 15 | Select-Object StatusCode, StatusDescription`
   - Ожидаемый: 200 OK
   - Если 404: проверь nginx конфиг и SSL сертификат
   - Если timeout: проверь что VM работает в Yandex Cloud Console

2. **Локальный dev-сервер**: Проверь порт 3000
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
   ```
   - Если порт занят: dev-сервер уже запущен
   - Если порт свободен: запусти `Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "E:\Код 2 Мебельный портал" -NoNewWindow`

3. **PM2 статус на сервере**:
   ```bash
   ssh ubuntu@158.160.210.47 "pm2 status"
   ```
   - Процесс `mebportal` должен быть `online`
