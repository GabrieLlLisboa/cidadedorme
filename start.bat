@echo off
REM Script de teste local para Cidade Dorme (Windows)

echo.
echo  Iniciando Cidade Dorme...
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ em https://nodejs.org
    pause
    exit /b 1
)

echo V Node.js detectado
node -v

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm nao encontrado!
    pause
    exit /b 1
)

echo V npm detectado
npm -v
echo.

REM Instalar dependências se node_modules não existir
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
    echo.
)

REM Iniciar servidor
echo Iniciando servidor...
echo.
echo ============================================
echo   Cidade Dorme esta rodando!
echo ============================================
echo.
echo   Acesse: http://localhost:3000
echo.
echo   Pressione Ctrl+C para parar
echo.
echo ============================================
echo.

call npm start
