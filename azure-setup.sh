#!/bin/bash
# Azure Resource Setup Script for Urban.IQ
# This script creates all necessary Azure resources for deployment
# Usage: ./azure-setup.sh

set -e  # Exit on error

# ============================================================
# CONFIGURATION - Customize these values
# ============================================================

RESOURCE_GROUP_NAME="urbaniq-rg"
LOCATION="eastus"  # Change to your preferred Azure region
ACR_NAME="urbaniqacr"  # Must be globally unique, lowercase, 5-50 alphanumeric
APP_SERVICE_PLAN_NAME="urbaniq-plan"
FRONTEND_APP_NAME="urbaniq-frontend"  # Must be globally unique
BACKEND_APP_NAME="urbaniq-backend"    # Must be globally unique
SKU="B1"  # Basic tier, change to S1, P1V2, etc. for production

# GitHub repository for service principal (optional, for GitHub Actions)
GITHUB_ORG=""  # e.g., "your-org" or leave empty if using personal account
GITHUB_REPO="Urban.IQ"  # Your repository name
GITHUB_BRANCH="main"  # Your main branch name

# ============================================================
# SCRIPT START
# ============================================================

echo "=========================================="
echo "Urban.IQ Azure Resource Setup"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP_NAME"
echo "  Location: $LOCATION"
echo "  ACR Name: $ACR_NAME"
echo "  Frontend App: $FRONTEND_APP_NAME"
echo "  Backend App: $BACKEND_APP_NAME"
echo ""
read -p "Continue with these settings? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if user is logged in
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure..."
    az login
fi

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Using subscription: $SUBSCRIPTION_ID"
echo ""

# ============================================================
# 1. CREATE RESOURCE GROUP
# ============================================================

echo "1. Creating Resource Group..."
az group create \
    --name "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --output none

echo "✓ Resource Group created: $RESOURCE_GROUP_NAME"
echo ""

# ============================================================
# 2. CREATE AZURE CONTAINER REGISTRY (ACR)
# ============================================================

echo "2. Creating Azure Container Registry..."
ACR_EXISTS=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "name" -o tsv 2>/dev/null || echo "")

if [ -z "$ACR_EXISTS" ]; then
    az acr create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$ACR_NAME" \
        --sku Basic \
        --admin-enabled true \
        --output none
    
    echo "✓ ACR created: $ACR_NAME"
else
    echo "✓ ACR already exists: $ACR_NAME"
fi

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "loginServer" -o tsv)
echo "  Login Server: $ACR_LOGIN_SERVER"
echo ""

# ============================================================
# 3. CREATE APP SERVICE PLAN
# ============================================================

echo "3. Creating App Service Plan..."
az appservice plan create \
    --name "$APP_SERVICE_PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --is-linux \
    --sku "$SKU" \
    --output none

echo "✓ App Service Plan created: $APP_SERVICE_PLAN_NAME"
echo ""

# ============================================================
# 4. CREATE FRONTEND APP SERVICE
# ============================================================

echo "4. Creating Frontend App Service..."
az webapp create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --plan "$APP_SERVICE_PLAN_NAME" \
    --name "$FRONTEND_APP_NAME" \
    --deployment-container-image-name "${ACR_LOGIN_SERVER}/urbaniq-frontend:latest" \
    --output none

echo "✓ Frontend App Service created: $FRONTEND_APP_NAME"
echo "  URL: https://${FRONTEND_APP_NAME}.azurewebsites.net"
echo ""

# Configure frontend app settings
echo "Configuring Frontend App Settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$FRONTEND_APP_NAME" \
    --settings \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_LOGIN_SERVER}" \
        DOCKER_REGISTRY_SERVER_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv) \
        DOCKER_REGISTRY_SERVER_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv) \
        VITE_API_BASE_URL="https://${BACKEND_APP_NAME}.azurewebsites.net" \
    --output none

# Enable continuous deployment (optional)
az webapp deployment container config \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --enable-cd true \
    --output none

echo "✓ Frontend configured"
echo ""

# ============================================================
# 5. CREATE BACKEND APP SERVICE
# ============================================================

echo "5. Creating Backend App Service..."
az webapp create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --plan "$APP_SERVICE_PLAN_NAME" \
    --name "$BACKEND_APP_NAME" \
    --deployment-container-image-name "${ACR_LOGIN_SERVER}/urbaniq-backend:latest" \
    --output none

echo "✓ Backend App Service created: $BACKEND_APP_NAME"
echo "  URL: https://${BACKEND_APP_NAME}.azurewebsites.net"
echo ""

# Configure backend app settings (template - add your actual values)
echo "Configuring Backend App Settings..."
echo "⚠️  WARNING: You must set DATABASE_URI and SECRET_KEY manually in Azure Portal!"
echo ""

az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$BACKEND_APP_NAME" \
    --settings \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_LOGIN_SERVER}" \
        DOCKER_REGISTRY_SERVER_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv) \
        DOCKER_REGISTRY_SERVER_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv) \
        PORT=8000 \
        WEBSITES_PORT=8000 \
        # Add these manually in Azure Portal:
        # DATABASE_URI=your_postgresql_connection_string
        # SECRET_KEY=your_secret_key
        # CLOUDINARY_NAME=your_cloudinary_name
        # CLOUDINARY_API_KEY=your_cloudinary_key
        # CLOUDINARY_API_SECRET=your_cloudinary_secret
    --output none

# Enable continuous deployment
az webapp deployment container config \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --enable-cd true \
    --output none

echo "✓ Backend configured"
echo ""

# ============================================================
# 6. CONFIGURE CORS ON BACKEND
# ============================================================

echo "6. Configuring CORS on Backend..."
FRONTEND_URL="https://${FRONTEND_APP_NAME}.azurewebsites.net"
az webapp cors add \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$BACKEND_APP_NAME" \
    --allowed-origins "$FRONTEND_URL" \
    --output none

echo "✓ CORS configured to allow: $FRONTEND_URL"
echo ""

# ============================================================
# 7. CREATE SERVICE PRINCIPAL FOR GITHUB ACTIONS
# ============================================================

if [ -n "$GITHUB_ORG" ] || [ -n "$GITHUB_REPO" ]; then
    echo "7. Creating Service Principal for GitHub Actions..."
    
    SP_NAME="urbaniq-github-actions"
    ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "id" -o tsv)
    
    # Create service principal with ACR pull permissions
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role acrpull \
        --scopes "$ACR_ID" \
        --sdk-auth \
        --output json)
    
    echo "✓ Service Principal created"
    echo ""
    echo "=========================================="
    echo "GITHUB SECRETS - Add these to your repository:"
    echo "=========================================="
    echo ""
    echo "AZURE_CREDENTIALS:"
    echo "$SP_OUTPUT" | jq -c
    echo ""
    echo "ACR_NAME: $ACR_NAME"
    echo "REGISTRY: $ACR_LOGIN_SERVER"
    echo "APP_FRONTEND: $FRONTEND_APP_NAME"
    echo "APP_BACKEND: $BACKEND_APP_NAME"
    echo ""
    echo "Go to: https://github.com/$GITHUB_ORG/$GITHUB_REPO/settings/secrets/actions"
    echo ""
else
    echo "7. Skipping Service Principal creation (GITHUB_ORG not set)"
    echo "   You can create it manually later if needed"
    echo ""
fi

# ============================================================
# SUMMARY
# ============================================================

echo "=========================================="
echo "SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "ACR: $ACR_LOGIN_SERVER"
echo "Frontend: https://${FRONTEND_APP_NAME}.azurewebsites.net"
echo "Backend: https://${BACKEND_APP_NAME}.azurewebsites.net"
echo ""
echo "Next Steps:"
echo "1. Build and push Docker images to ACR"
echo "2. Set environment variables in Azure Portal:"
echo "   - Backend: DATABASE_URI, SECRET_KEY, etc."
echo "   - Frontend: VITE_API_BASE_URL (already set)"
echo "3. Update backend CORS origins if needed"
echo "4. Configure GitHub Actions secrets"
echo "5. Deploy using GitHub Actions or manually"
echo ""
echo "To build and push images manually:"
echo "  az acr build --registry $ACR_NAME --image urbaniq-backend:latest ./backend"
echo "  az acr build --registry $ACR_NAME --image urbaniq-frontend:latest ./frontend_new"
echo ""


