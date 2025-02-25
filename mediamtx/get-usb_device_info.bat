@echo off

setlocal EnableDelayedExpansion

set ffmpeg=ffmpeg.exe

where %ffmpeg% 2>nul >nul
if not %errorlevel% == 0 (
	echo "%ffmpeg%" is required. Please install/add to PATH variable
	exit
)

echo List of Video Input Devices available:
ffmpeg.exe -f dshow -list_devices true -i dummy 2>&1 | findstr /c:video > .dev
for /F "tokens=*" %%A in (.dev) do (
	set str=%%A
	echo     !str:~28,-9!
)

echo.

set /p dev="Enter Camera Name to get video info: "
ffmpeg.exe -f dshow -list_options true -i video="%dev%" 2>&1 | findstr /c:dshow > .dev_opt
more +2 .dev_opt > .dev_opts
for /F "tokens=*" %%A in (.dev_opts) do (
	set str=%%A
	echo     !str:~28!
)

del .dev*