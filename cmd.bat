@echo off
setlocal enabledelayedexpansion

echo ======================================
echo Azure Login and Docker Build/Push
echo ======================================

REM Read version from version.txt (create if not exists)
if not exist version.txt (
    echo 7 > version.txt
)

set /p VERSION=<version.txt
echo Current version: v%VERSION%

echo.
echo [1/6] Checking Azure Login...
call az account show >nul 2>nul
if not errorlevel 1 (
    echo Already logged into Azure. Skipping...
    goto :acr_login
)
echo Not logged in. Logging into Azure...
call az login
if errorlevel 1 (
    echo Error: Azure login failed!
    pause
    exit /b 1
)

:acr_login
echo.
echo [2/6] Logging into Azure Container Registry...
call az acr login --name baloc
if errorlevel 1 (
    echo Error: ACR login failed!
    pause
    exit /b 1
)

echo.
echo [3/6] Building Frontend Docker Image (v%VERSION%)...
docker build -t baloc.azurecr.io/frontend:v%VERSION% ./frontend
if %errorlevel% neq 0 (
    echo Error: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [4/6] Pushing Frontend to ACR...
docker push baloc.azurecr.io/frontend:v%VERSION%
if %errorlevel% neq 0 (
    echo Error: Frontend push failed!
    pause
    exit /b 1
)

echo.
echo [5/6] Building Backend Docker Image (v%VERSION%)...
docker build -t baloc.azurecr.io/backend:v%VERSION% ./backend
if %errorlevel% neq 0 (
    echo Error: Backend build failed!
    pause
    exit /b 1
)

echo.
echo [6/6] Pushing Backend to ACR...
docker push baloc.azurecr.io/backend:v%VERSION%
if %errorlevel% neq 0 (
    echo Error: Backend push failed!
    pause
    exit /b 1
)

REM Increment version and save
set /a NEXT_VERSION=%VERSION%+1
echo %NEXT_VERSION% > version.txt

echo.
echo ======================================
echo All tasks completed successfully!
echo Deployed version: v%VERSION%
echo Next version will be: v%NEXT_VERSION%
echo ======================================
pause

