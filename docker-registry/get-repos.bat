@echo off

set REG_URL=http://registry.handy:45000

if "%1"=="tags" (
	if "%~2"== "" (
		echo "Missing Repository Name"
		exit
	) else (
		curl "%REG_URL%/v2/%2/tags/list" | jq.exe .tags
	)
) else (
    curl -s "%REG_URL%/v2/_catalog" | jq.exe .repositories
)
