@echo off
setlocal enabledelayedexpansion

set REG_URL=https://registry.hamaster.handy:45443
set SHOW_TAGS=false
set REPO=
set PARM_CA=

:parse_args
if "%~1"=="" goto :run
if "%~1"=="--tags" (
    set SHOW_TAGS=true
    if "%~2"=="" goto :echoUsage
    set REPO=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--CA-cert" (
    set PARM_CA=--cacert %~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--url" (
    set REG_URL=%~2
    shift
    shift
    goto :parse_args
)
goto :echoUsage

:echoUsage
echo Usage: %~nx0 [OPTIONS]
echo OPTIONS:
echo   --tags ^<repo^> : list available tags of Repository
echo   --CA-cert ^<file^> : specify CA certificate file to use for registries using non-public CAs
echo   --url ^<url^> : specify registry url to connect to instead of using configured url
exit /b 1

:run
if "%SHOW_TAGS%"=="true" (
    curl %PARM_CA% --ssl-no-revoke -s "%REG_URL%/v2/%REPO%/tags/list" | jq .tags
) else (
    curl %PARM_CA% --ssl-no-revoke -s "%REG_URL%/v2/_catalog" | jq .repositories
)
