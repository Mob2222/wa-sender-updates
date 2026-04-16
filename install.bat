@echo off
chcp 65001 >nul 2>&1

echo.
echo  ══════════════════════════════════════════════
echo   WhatsApp Sender — Установка с автообновлением
echo  ══════════════════════════════════════════════
echo.

:: ══════════════════════════════════════════════════
:: ЗАПОЛНИТЕ ПЕРЕД ИСПОЛЬЗОВАНИЕМ:
:: ══════════════════════════════════════════════════
set "EXT_ID=CHANGE_ME"
set "UPDATE_XML=https://raw.githubusercontent.com/Mob2222/whatsapp-sender/main/updates.xml"
:: ══════════════════════════════════════════════════
:: EXT_ID     — ID расширения с chrome://extensions
:: UPDATE_XML — URL вашего updates.xml (GitHub raw)
:: ══════════════════════════════════════════════════

if "%EXT_ID%"=="CHANGE_ME" (
    echo  [!] ОШИБКА: Откройте install.bat в блокноте
    echo      и заполните EXT_ID и UPDATE_XML
    echo.
    echo      EXT_ID — загрузите расширение в Chrome один раз,
    echo      откройте chrome://extensions и скопируйте ID
    echo.
    pause
    exit /b 1
)

set "KEY=HKCU\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist"
set "VAL=%EXT_ID%;%UPDATE_XML%"

:: Проверяем, не занят ли слот 1 другим расширением
set "SLOT=1"
for /l %%i in (1,1,20) do (
    reg query "%KEY%" /v %%i >nul 2>&1
    if errorlevel 1 (
        set "SLOT=%%i"
        goto :install
    )
    :: Если наше расширение уже есть — перезаписываем тот же слот
    reg query "%KEY%" /v %%i 2>nul | findstr /c:"%EXT_ID%" >nul 2>&1
    if not errorlevel 1 (
        set "SLOT=%%i"
        goto :install
    )
)

:install
reg add "%KEY%" /v %SLOT% /t REG_SZ /d "%VAL%" /f >nul 2>&1

if errorlevel 1 (
    echo  [!] Ошибка записи в реестр.
    echo.
    pause
    exit /b 1
)

echo  [OK] Расширение зарегистрировано (слот %SLOT%)
echo.
echo  Что дальше:
echo    1. Перезапустите Chrome
echo    2. Расширение установится автоматически
echo    3. Все обновления будут применяться в фоне
echo.
echo  Chrome покажет "Управляется организацией" —
echo  это нормально для управляемых расширений.
echo.
pause
