@echo off
echo ======================================
echo Docker Cleanup Script
echo ======================================

echo.
echo [1/4] Checking Docker disk usage...
docker system df

echo.
echo [2/4] Removing unused build cache...
docker builder prune -f

echo.
echo [3/4] Removing unused images...
docker image prune -a -f

echo.
echo [4/4] Removing unused containers, networks, volumes...
docker system prune -a -f --volumes

echo.
echo ======================================
echo Cleanup completed!
echo ======================================
echo.
echo Final disk usage:
docker system df

pause
