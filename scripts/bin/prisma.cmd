@echo off
set PRISMA_CLI=%~dp0..\..\apps\api\node_modules\prisma\build\index.js
if exist "%PRISMA_CLI%" (
  "%npm_node_execpath%" "%PRISMA_CLI%" %*
  goto :eof
)

"%npm_node_execpath%" "%~dp0..\..\node_modules\prisma\build\index.js" %*
