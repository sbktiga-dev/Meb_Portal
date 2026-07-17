---
description: Остановка dev-сервера на порту 3000
---

# Остановка dev-сервера

Останови dev-сервер Next.js на порту 3000:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Если порт не занят — команда просто ничего не сделает (ErrorAction SilentlyContinue).

После остановки можно запустить новый dev-сервер:
```powershell
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "E:\Код 2 Мебельный портал" -NoNewWindow
```
