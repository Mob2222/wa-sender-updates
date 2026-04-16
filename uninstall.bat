@echo off
chcp 65001 >nul 2>&1

echo.
echo  WhatsApp Sender — Удаление автоустановки
echo  ══════════════════════════════════════════
echo.

set "EXT_ID=CHANGE_ME"

if "%EXT_ID%"=="CHANGE_ME" (
    echo  [!] Заполните EXT_ID в этом файле
    pause
    exit /b 1
)

set "KEY=HKCU\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist"

:: Найти и удалить слот с нашим расширением
for /l %%i in (1,1,20) do (
    reg query "%KEY%" /v %%i 2>nul | findstr /c:"%EXT_ID%" >nul 2>&1
    if not errorlevel 1 (
        reg delete "%KEY%" /v %%i /f >nul 2>&1
        echo  [OK] Расширение удалено из слота %%i
    )
)

echo.
echo  Перезапустите Chrome для применения.
echo.
pause
