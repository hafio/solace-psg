@echo off
setlocal enabledelayedexpansion

:: Set source and target directories
set "sourceDir=C:\Users\hamly\git\hafio-solace-psg\solace-cli-helper"
set "targetDir=C:\Users\hamly\git\cli-config-utility"

:: List of files and/or directories to copy (space-separated)
set "fileList=func.js parseBrokerJsonAndDisplay.js parseClients.js parseCurrentConfig.js parseGatherDiag.js README.md style.css CurrentConfigParser.html SolaceParser.html"

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
