# Azure Resource Setup Script for Urban.IQ (PowerShell)
# This script creates all necessary Azure resources for deployment
# Usage: .\azure-setup.ps1

$ErrorActionPreference = "Stop"

# ============================================================
# CONFIGURATION - Customize these values
# ============================================================

$RESOURCE_GROUP_NAME = "urbaniq-rg"
$LOCATION = "eastus"  # Change to your preferred Azure region
$ACR_NAME = "urbaniqacr"  # Must be globally unique, lowercase, 5-50 alphanumeric
$APP_SERVICE_PLAN_NAME = "urbaniq-plan"
$FRONTEND_APP_NAME = "urbaniq-frontend"  # Must be globally unique
$BACKEND_APP_NAME = "urbaniq-backend"    # Must be globally unique
$SKU = "B1"  # Basic tier, change to S1, P1V2, etc. for production

# GitHub repository for service principal (optional)
$GITHUB_ORG = ""  # e.g., "your-org" or leave empty if using personal account
$GITHUB_REPO = "Urban.IQ"  # Your repository name
$GITHUB_BRANCH = "main"  # Your main branch name

# ============================================================
# SCRIPT START
# ============================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Urban.IQ Azure Resource Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:"
Write-Host "  Resource Group: $RESOURCE_GROUP_NAME"
Write-Host "  Location: $LOCATION"
Write-Host "  ACR Name: $ACR_NAME"
Write-Host "  Frontend App: $FRONTEND_APP_NAME"
Write-Host "  Backend App: $BACKEND_APP_NAME"
Write-Host ""
$confirm = Read-Host "Continue with these settings? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
Write-Host "Checking Azure login status..." -ForegroundColor Cyan
try {
    $account = az account show 2>$null | ConvertFrom-Json
} catch {
    Write-Host "Please log in to Azure..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}

$SUBSCRIPTION_ID = $account.id
Write-Host "Using subscription: $SUBSCRIPTION_ID" -ForegroundColor Green
Write-Host ""

# ============================================================
# 1. CREATE RESOURCE GROUP
# ============================================================

Write-Host "1. Creating Resource Group..." -ForegroundColor Cyan
az group create `
    --name $RESOURCE_GROUP_NAME `
    --location $LOCATION `
    --output none | Out-Null

Write-Host "✓ Resource Group created: $RESOURCE_GROUP_NAME" -ForegroundColor Green
Write-Host ""

# ============================================================
# 2. CREATE AZURE CONTAINER REGISTRY (ACR)
# ============================================================

Write-Host "2. Creating Azure Container Registry..." -ForegroundColor Cyan
$acrExists = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP_NAME --query "name" -o tsv 2>$null

if (-not $acrExists) {
    az acr create `
        --resource-group $RESOURCE_GROUP_NAME `
        --name $ACR_NAME `
        --sku Basic `
        --admin-enabled true `
        --output none | Out-Null
    
    Write-Host "✓ ACR created: $ACR_NAME" -ForegroundColor Green
} else {
    Write-Host "✓ ACR already exists: $ACR_NAME" -ForegroundColor Yellow
}

$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP_NAME --query "loginServer" -o tsv
Write-Host "  Login Server: $ACR_LOGIN_SERVER" -ForegroundColor Gray
Write-Host ""

# ============================================================
# 3. CREATE APP SERVICE PLAN
# ============================================================

Write-Host "3. Creating App Service Plan..." -ForegroundColor Cyan
az appservice plan create `
    --name $APP_SERVICE_PLAN_NAME `
    --resource-group $RESOURCE_GROUP_NAME `
    --location $LOCATION `
    --is-linux `
    --sku $SKU `
    --output none | Out-Null

Write-Host "✓ App Service Plan created: $APP_SERVICE_PLAN_NAME" -ForegroundColor Green
Write-Host ""

# ============================================================
# 4. CREATE FRONTEND APP SERVICE
# ============================================================

Write-Host "4. Creating Frontend App Service..." -ForegroundColor Cyan
az webapp create `
    --resource-group $RESOURCE_GROUP_NAME `
    --plan $APP_SERVICE_PLAN_NAME `
    --name $FRONTEND_APP_NAME `
    --deployment-container-image-name "${ACR_LOGIN_SERVER}/urbaniq-frontend:latest" `
    --output none | Out-Null

Write-Host "✓ Frontend App Service created: $FRONTEND_APP_NAME" -ForegroundColor Green
Write-Host "  URL: https://${FRONTEND_APP_NAME}.azurewebsites.net" -ForegroundColor Gray
Write-Host ""

# Configure frontend app settings
Write-Host "Configuring Frontend App Settings..." -ForegroundColor Cyan
$acrUsername = az acr credential show --name $ACR_NAME --query "username" -o tsv
$acrPassword = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP_NAME `
    --name $FRONTEND_APP_NAME `
    --settings `
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false `
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_LOGIN_SERVER}" `
        DOCKER_REGISTRY_SERVER_USERNAME=$acrUsername `
        DOCKER_REGISTRY_SERVER_PASSWORD=$acrPassword `
        VITE_API_BASE_URL="https://${BACKEND_APP_NAME}.azurewebsites.net" `
    --output none | Out-Null

az webapp deployment container config `
    --name $FRONTEND_APP_NAME `
    --resource-group $RESOURCE_GROUP_NAME `
    --enable-cd true `
    --output none | Out-Null

Write-Host "✓ Frontend configured" -ForegroundColor Green
Write-Host ""

# ============================================================
# 5. CREATE BACKEND APP SERVICE
# ============================================================

Write-Host "5. Creating Backend App Service..." -ForegroundColor Cyan
az webapp create `
    --resource-group $RESOURCE_GROUP_NAME `
    --plan $APP_SERVICE_PLAN_NAME `
    --name $BACKEND_APP_NAME `
    --deployment-container-image-name "${ACR_LOGIN_SERVER}/urbaniq-backend:latest" `
    --output none | Out-Null

Write-Host "✓ Backend App Service created: $BACKEND_APP_NAME" -ForegroundColor Green
Write-Host "  URL: https://${BACKEND_APP_NAME}.azurewebsites.net" -ForegroundColor Gray
Write-Host ""

# Configure backend app settings
Write-Host "Configuring Backend App Settings..." -ForegroundColor Cyan
Write-Host "⚠️  WARNING: You must set DATABASE_URI and SECRET_KEY manually in Azure Portal!" -ForegroundColor Yellow
Write-Host ""

az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP_NAME `
    --name $BACKEND_APP_NAME `
    --settings `
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false `
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_LOGIN_SERVER}" `
        DOCKER_REGISTRY_SERVER_USERNAME=$acrUsername `
        DOCKER_REGISTRY_SERVER_PASSWORD=$acrPassword `
        PORT=8000 `
        WEBSITES_PORT=8000 `
    --output none | Out-Null

az webapp deployment container config `
    --name $BACKEND_APP_NAME `
    --resource-group $RESOURCE_GROUP_NAME `
    --enable-cd true `
    --output none | Out-Null

Write-Host "✓ Backend configured" -ForegroundColor Green
Write-Host ""

# ============================================================
# 6. CONFIGURE CORS ON BACKEND
# ============================================================

Write-Host "6. Configuring CORS on Backend..." -ForegroundColor Cyan
$FRONTEND_URL = "https://${FRONTEND_APP_NAME}.azurewebsites.net"
az webapp cors add `
    --resource-group $RESOURCE_GROUP_NAME `
    --name $BACKEND_APP_NAME `
    --allowed-origins $FRONTEND_URL `
    --output none | Out-Null

Write-Host "✓ CORS configured to allow: $FRONTEND_URL" -ForegroundColor Green
Write-Host ""

# ============================================================
# SUMMARY
# ============================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Group: $RESOURCE_GROUP_NAME"
Write-Host "ACR: $ACR_LOGIN_SERVER"
Write-Host "Frontend: https://${FRONTEND_APP_NAME}.azurewebsites.net"
Write-Host "Backend: https://${BACKEND_APP_NAME}.azurewebsites.net"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Build and push Docker images to ACR"
Write-Host "2. Set environment variables in Azure Portal:"
Write-Host "   - Backend: DATABASE_URI, SECRET_KEY, etc."
Write-Host "   - Frontend: VITE_API_BASE_URL (already set)"
Write-Host "3. Update backend CORS origins if needed"
Write-Host "4. Configure GitHub Actions secrets"
Write-Host "5. Deploy using GitHub Actions or manually"
Write-Host ""
Write-Host "To build and push images manually:" -ForegroundColor Cyan
Write-Host "  az acr build --registry $ACR_NAME --image urbaniq-backend:latest ./backend"
Write-Host "  az acr build --registry $ACR_NAME --image urbaniq-frontend:latest ./frontend_new"
Write-Host ""


