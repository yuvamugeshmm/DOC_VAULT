# Setup and Run Script for Student Document Store
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Student Document Store - Setup & Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists in backend
$backendEnvPath = "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "Creating backend/.env file..." -ForegroundColor Yellow
    @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student_document_store
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars_required
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath $backendEnvPath -Encoding utf8
    Write-Host "✓ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "✓ backend/.env exists" -ForegroundColor Green
}

# Check backend node_modules
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies exist" -ForegroundColor Green
}

# Check frontend node_modules
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies exist" -ForegroundColor Green
}

# Create users if needed
Write-Host ""
Write-Host "Checking database setup..." -ForegroundColor Yellow
Set-Location backend
node scripts/checkSetup.js
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  1. Open a terminal and run: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Open another terminal and run: cd frontend && npm run dev" -ForegroundColor White
Write-Host "  3. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Student: ID=STU001, Password=student123" -ForegroundColor White
Write-Host "  Admin: ID=admin, Password=admin123" -ForegroundColor White
Write-Host ""
