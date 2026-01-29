@echo off
chcp 65001 >nul
echo ========================================
echo  OMNIXIUS: сохранение и пуш на GitHub
echo ========================================
cd /d "%~dp0"

echo.
echo 1. Статус репозитория...
git status --short

echo.
echo 2. Добавляем backend, frontend, docker-compose, .gitignore, отчёт, скрипт...
git add backend/ frontend/ docker-compose.yml .gitignore docs/TECH_REPORT_REBOOT.md SAVE_AND_PUSH.bat

echo.
echo 3. Коммит...
git commit -m "Reboot: backend (Rust Axum L1/L3/L4) + frontend (Next.js 14) + docker-compose + tech report"

if errorlevel 1 (
    echo Коммит не выполнен (возможно, нечего коммитить или ошибка).
    pause
    exit /b 1
)

echo.
echo 4. Пуш на origin...
git push origin master

if errorlevel 1 (
    echo Пуш не выполнен. Проверьте: git remote -v, логин/токен GitHub.
    pause
    exit /b 1
)

echo.
echo Готово. Изменения отправлены на GitHub.
pause
