@echo off

set REG_URL=http://registry.handy:45000

if "%1"=="tags" (
	if "%~2"== "" (
		echo "Missing Repository Name"
		exit
	) else (
		curl -s "%REG_URL%/v2/%2/tags/list" | jq .tags
	)
) else (
    curl -s "%CATALOG%/v2/_catalog" | jq .repositories
)
