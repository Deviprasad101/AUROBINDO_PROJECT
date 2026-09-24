@echo off
echo ===================================================
echo     STARTING LOCAL DASHBOARD SERVER (OFFLINE)
echo ===================================================
echo.
echo To access the dashboard from ANOTHER computer on this network,
echo open Google Chrome on that computer and type this exact address:
echo.
echo      http://192.168.1.13:8080
echo.
echo DO NOT close this black window while you are using the dashboard!
echo.
python -m http.server 8080
pause
