@echo off
echo ======================================
echo Azure Login and Docker Build/Push
echo ======================================

echo.
echo [1/6] Logging into Azure...
az login

echo.
echo [2/6] Logging into Azure Container Registry...
az acr login --name baloc

echo.
echo [3/6] Building Frontend Docker Image...
docker build -t baloc.azurecr.io/frontend:v7 ./frontend

echo.
echo [4/6] Pushing Frontend to ACR...
docker push baloc.azurecr.io/frontend:v7

echo.
echo [5/6] Building Backend Docker Image...
docker build -t baloc.azurecr.io/backend:v7 ./backend

echo.
echo [6/6] Pushing Backend to ACR...
docker push baloc.azurecr.io/backend:v7

echo.
echo ======================================
echo All tasks completed successfully!
echo ======================================
pause
