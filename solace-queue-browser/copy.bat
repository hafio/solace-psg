@echo off
setlocal enabledelayedexpansion

:: Set source and target directories
set "sourceDir=C:\Users\hamly\git\hafio-solace-psg\solace-queue-browser"
set "targetDir=C:\Users\hamly\git\psg-solutions\solace-queue-browser"

:: List of files and/or directories to copy (space-separated)
set "fileList=docker-compose.yaml Dockerfile httpd.conf LICENSE README.md www\utility.html www\css\solace.css"

:: Loop through each item in the list
for %%F in (%fileList%) do (
    echo Copying %%F from %sourceDir% to %targetDir%
    
    :: Check if it's a directory
    if exist "%sourceDir%\%%F\" (
        xcopy "%sourceDir%\%%F" "%targetDir%\%%F" /E /I /Y >nul
    ) else (
        copy "%sourceDir%\%%F" "%targetDir%\%%F" >nul
    )
)

echo Done.
endlocal
