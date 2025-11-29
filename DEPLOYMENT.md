# 🚀 Urban.IQ Azure Deployment Guide

Complete guide for deploying Urban.IQ to Azure App Service using Docker and GitHub Actions CI/CD.

---

## 📋 Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** installed and configured
   ```bash
   az login
   az account set --subscription "Your-Subscription-Name"
   ```
3. **Docker** installed locally (for local testing)
4. **GitHub Repository** with access to set secrets
5. **PostgreSQL Database** (Azure Database for PostgreSQL or external)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │ Build & Push │              │ Build & Push │        │
│  │  Backend     │              │  Frontend    │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                              │                │
│         └──────────┬───────────────────┘                │
│                    ▼                                    │
│              Azure Container Registry                   │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐          ┌──────────────┐
│   Backend    │          │   Frontend   │
│  App Service │          │  App Service │
│   (Port 8000)│          │   (Port 80)  │
└──────┬───────┘          └──────┬───────┘
       │                         │
       └──────────┬──────────────┘
                  ▼
         PostgreSQL Database
```

---

## 📦 Phase 1: Local Docker Testing

### 1.1 Build Docker Images Locally

```bash
# Build backend
cd backend
docker build -t urbaniq-backend:latest .
cd ..

# Build frontend
cd frontend_new
docker build -t urbaniq-frontend:latest .
cd ..
```

### 1.2 Test with Docker Compose

1. **Update `docker-compose.yml`** with your environment variables:
   ```yaml
   environment:
     DATABASE_URI: postgresql://user:password@host:5432/dbname
     SECRET_KEY: your-secret-key
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Access applications:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

4. **View logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

---

## ☁️ Phase 2: Azure Resource Setup

### 2.1 Run Azure Setup Script

**Windows:**
```powershell
.\azure-setup.ps1
```

**Linux/Mac:**
```bash
chmod +x azure-setup.sh
./azure-setup.sh
```

### 2.2 Customize Configuration

Before running, edit the script variables:

```bash
RESOURCE_GROUP_NAME="urbaniq-rg"        # Your resource group
LOCATION="eastus"                        # Azure region
ACR_NAME="urbaniqacr"                    # Must be globally unique
FRONTEND_APP_NAME="urbaniq-frontend"     # Must be globally unique
BACKEND_APP_NAME="urbaniq-backend"       # Must be globally unique
```

### 2.3 What the Script Creates

1. ✅ Resource Group
2. ✅ Azure Container Registry (ACR)
3. ✅ App Service Plan (Linux)
4. ✅ Frontend App Service
5. ✅ Backend App Service
6. ✅ CORS configuration
7. ✅ Service Principal for GitHub Actions (optional)

---

## 🔐 Phase 3: Configure Environment Variables

### 3.1 Backend App Service

Navigate to: **Azure Portal → App Services → urbaniq-backend → Configuration**

Add these **Application Settings**:

| Setting | Value | Required |
|---------|-------|----------|
| `DATABASE_URI` | `postgresql://user:pass@host:5432/dbname` | ✅ Yes |
| `SECRET_KEY` | Generate a secure random string | ✅ Yes |
| `CLOUDINARY_NAME` | Your Cloudinary cloud name | ⚠️ Optional |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | ⚠️ Optional |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | ⚠️ Optional |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ⚠️ Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | ⚠️ Optional |
| `GITHUB_REDIRECT_URI` | `https://urbaniq-backend.azurewebsites.net/api/auth/github/callback` | ⚠️ Optional |
| `PORT` | `8000` | ✅ Yes (already set) |
| `WEBSITES_PORT` | `8000` | ✅ Yes (already set) |

### 3.2 Frontend App Service

Navigate to: **Azure Portal → App Services → urbaniq-frontend → Configuration**

Verify these settings (should be auto-configured):

| Setting | Value |
|---------|-------|
| `VITE_API_BASE_URL` | `https://urbaniq-backend.azurewebsites.net` |

### 3.3 Generate SECRET_KEY

```python
# Python
import secrets
print(secrets.token_urlsafe(32))

# Or use OpenSSL
openssl rand -base64 32
```

---

## 🔗 Phase 4: Configure GitHub Actions

### 4.1 Create Service Principal (if not done by script)

```bash
# Set variables
ACR_NAME="urbaniqacr"
RESOURCE_GROUP="urbaniq-rg"
SP_NAME="urbaniq-github-actions"

# Get ACR ID
ACR_ID=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role acrpull \
  --scopes $ACR_ID \
  --sdk-auth
```

### 4.2 Add GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CREDENTIALS` | JSON output from service principal | Azure authentication |
| `ACR_NAME` | `urbaniqacr` | Container registry name |
| `REGISTRY` | `urbaniqacr.azurecr.io` | Full registry URL |
| `APP_FRONTEND` | `urbaniq-frontend` | Frontend app service name |
| `APP_BACKEND` | `urbaniq-backend` | Backend app service name |
| `RESOURCE_GROUP` | `urbaniq-rg` | Resource group name |
| `VITE_API_BASE_URL` | `https://urbaniq-backend.azurewebsites.net` | Backend API URL (for frontend build) |

### 4.3 Update Workflow File

The workflow is already configured at `.github/workflows/deploy.yml`.

**Trigger Options:**
- Automatic: Pushes to `main` branch
- Manual: GitHub Actions → Run workflow

---

## 🚢 Phase 5: Deploy

### 5.1 Manual Deployment (First Time)

```bash
# Login to Azure
az login
az acr login --name urbaniqacr

# Build and push backend
az acr build --registry urbaniqacr \
  --image urbaniq-backend:latest \
  ./backend

# Build and push frontend
az acr build --registry urbaniqacr \
  --image urbaniq-frontend:latest \
  ./frontend_new

# Deploy backend
az webapp config container set \
  --name urbaniq-backend \
  --resource-group urbaniq-rg \
  --docker-custom-image-name urbaniqacr.azurecr.io/urbaniq-backend:latest

# Deploy frontend
az webapp config container set \
  --name urbaniq-frontend \
  --resource-group urbaniq-rg \
  --docker-custom-image-name urbaniqacr.azurecr.io/urbaniq-frontend:latest
```

### 5.2 Automatic Deployment (CI/CD)

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to Azure"
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the workflow run
   - Check logs for errors

3. **Verify deployment:**
   - Frontend: https://urbaniq-frontend.azurewebsites.net
   - Backend: https://urbaniq-backend.azurewebsites.net/api/user

---

## 🔍 Phase 6: Verification & Testing

### 6.1 Health Checks

```bash
# Backend health
curl https://urbaniq-backend.azurewebsites.net/

# Frontend
curl https://urbaniq-frontend.azurewebsites.net/
```

### 6.2 Check Logs

**Azure Portal:**
- App Service → Log stream
- App Service → Monitoring → Logs

**Azure CLI:**
```bash
# Backend logs
az webapp log tail --name urbaniq-backend --resource-group urbaniq-rg

# Frontend logs
az webapp log tail --name urbaniq-frontend --resource-group urbaniq-rg
```

### 6.3 Test Application

1. ✅ Visit frontend URL
2. ✅ Test user registration
3. ✅ Test login
4. ✅ Verify API connectivity
5. ✅ Test core features

---

## 🛠️ Troubleshooting

### Issue: Container fails to start

**Check:**
- Environment variables are set correctly
- Database connection string is valid
- Port is set to 8000 (backend)
- Logs in Azure Portal → Log stream

**Fix:**
```bash
# Check app settings
az webapp config appsettings list \
  --name urbaniq-backend \
  --resource-group urbaniq-rg

# View logs
az webapp log tail --name urbaniq-backend --resource-group urbaniq-rg
```

### Issue: Frontend can't connect to backend

**Check:**
- `VITE_API_BASE_URL` is set correctly
- CORS is configured on backend
- Backend URL is accessible

**Fix:**
```bash
# Add CORS origin
az webapp cors add \
  --resource-group urbaniq-rg \
  --name urbaniq-backend \
  --allowed-origins https://urbaniq-frontend.azurewebsites.net
```

### Issue: Image pull fails

**Check:**
- ACR credentials are correct
- Service principal has `acrpull` role
- Image exists in registry

**Fix:**
```bash
# Check ACR images
az acr repository list --name urbaniqacr

# Check app service container settings
az webapp config container show \
  --name urbaniq-backend \
  --resource-group urbaniq-rg
```

### Issue: Database connection fails

**Check:**
- `DATABASE_URI` is correct
- Database allows Azure IPs
- Firewall rules are configured

**Fix:**
```bash
# Add Azure App Service outbound IPs to database firewall
az webapp show \
  --name urbaniq-backend \
  --resource-group urbaniq-rg \
  --query outboundIpAddresses -o tsv
```

---

## 📊 Monitoring & Maintenance

### Application Insights (Optional)

1. Create Application Insights resource
2. Add instrumentation key to app settings
3. Monitor performance and errors

### Scaling

**Scale Up:**
```bash
az appservice plan update \
  --name urbaniq-plan \
  --resource-group urbaniq-rg \
  --sku P1V2
```

**Scale Out:**
```bash
az appservice plan update \
  --name urbaniq-plan \
  --resource-group urbaniq-rg \
  --number-of-workers 3
```

### Backup

Configure backups in Azure Portal:
- App Service → Backup → Configure

---

## 🔒 Security Checklist

- [ ] SECRET_KEY is strong and unique
- [ ] Database connection uses SSL
- [ ] HTTPS is enforced (automatic in App Service)
- [ ] CORS origins are restricted
- [ ] Environment variables don't contain secrets in code
- [ ] GitHub Actions secrets are configured
- [ ] ACR admin account is disabled (use service principal)
- [ ] Firewall rules are configured
- [ ] Session cookies use Secure flag in production

---

## 📝 Environment Variables Reference

### Backend Required

```bash
DATABASE_URI=postgresql://user:password@host:5432/database
SECRET_KEY=your-secret-key-here
PORT=8000
WEBSITES_PORT=8000
```

### Backend Optional

```bash
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://urbaniq-backend.azurewebsites.net/api/auth/github/callback
```

### Frontend

```bash
VITE_API_BASE_URL=https://urbaniq-backend.azurewebsites.net
```

---

## 🎯 Quick Commands Reference

```bash
# Build and push
az acr build --registry urbaniqacr --image urbaniq-backend:latest ./backend
az acr build --registry urbaniqacr --image urbaniq-frontend:latest ./frontend_new

# View logs
az webapp log tail --name urbaniq-backend --resource-group urbaniq-rg

# Restart app
az webapp restart --name urbaniq-backend --resource-group urbaniq-rg

# Check status
az webapp show --name urbaniq-backend --resource-group urbaniq-rg --query state

# List app settings
az webapp config appsettings list --name urbaniq-backend --resource-group urbaniq-rg

# Update app setting
az webapp config appsettings set \
  --name urbaniq-backend \
  --resource-group urbaniq-rg \
  --settings KEY=VALUE
```

---

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Container Registry Documentation](https://docs.microsoft.com/azure/container-registry/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Docker Documentation](https://docs.docker.com/)

---

## ✅ Deployment Checklist

- [ ] Azure resources created
- [ ] Environment variables configured
- [ ] Database accessible from Azure
- [ ] GitHub secrets configured
- [ ] Docker images built and pushed
- [ ] Apps deployed successfully
- [ ] Health checks passing
- [ ] Frontend can communicate with backend
- [ ] User registration/login works
- [ ] Core features tested
- [ ] Monitoring configured (optional)
- [ ] Backup configured (optional)

---

**Deployment Complete! 🎉**

Your Urban.IQ application should now be live on Azure App Service.

