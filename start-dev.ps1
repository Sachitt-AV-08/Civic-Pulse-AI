Start-Process powershell -WorkingDirectory "$PSScriptRoot\backend" -ArgumentList "uvicorn app.main:app --reload --port 8000"
Start-Process powershell -WorkingDirectory "$PSScriptRoot\frontend" -ArgumentList "npm run dev"
Write-Host "Civic Pulse AI backend started on http://localhost:8000"
Write-Host "Civic Pulse AI frontend started on http://localhost:5173"
