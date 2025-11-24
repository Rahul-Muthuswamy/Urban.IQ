# Frontend-Backend Integration Guide

This guide explains how to properly integrate and test the `frontend_new` with the backend.

## Prerequisites

1. **Backend Requirements:**
   - Python 3.8+
   - PostgreSQL database running
   - Backend dependencies installed (`pip install -r requirements.txt`)
   - Environment variables configured (`.env` file)

2. **Frontend Requirements:**
   - Node.js 18+
   - npm/yarn/pnpm installed

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Ensure your .env file is configured with:
# - DATABASE_URI (PostgreSQL connection string)
# - SECRET_KEY (Flask secret key)
# - CLOUDINARY credentials (optional)

# Run the backend server
python run.py
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend_new directory
cd frontend_new

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5174`

## Integration Architecture

### API Communication

The frontend communicates with the backend in two ways:

1. **Development Mode (with Vite proxy):**
   - Frontend runs on `http://localhost:5174`
   - API calls to `/api/*` are proxied to `http://localhost:5000/api/*`
   - Configured in `vite.config.js`
   - Uses relative URLs (empty baseURL)

2. **Production Mode:**
   - Frontend built and served statically
   - API calls go directly to `http://localhost:5000`
   - Uses absolute URLs

### CORS Configuration

The backend CORS is configured to allow:
- `http://localhost:5173` (old frontend)
- `http://localhost:5174` (frontend_new)
- `http://localhost:5000` (backend)
- `http://localhost:3000` (alternative port)

### Session Management

- **Session-based authentication** using Flask-Login
- Cookies are set with:
  - `SameSite=None` (for cross-origin)
  - `Secure=False` (for localhost development)
  - `HttpOnly=True` (for security)
- Frontend sends cookies with `withCredentials: true`

## Testing the Integration

### 1. Test Authentication Flow

```bash
# 1. Start backend
cd backend
python run.py

# 2. Start frontend (in another terminal)
cd frontend_new
npm run dev

# 3. Open browser to http://localhost:5174
# 4. Navigate to /signup and create an account
# 5. Navigate to /login and login
# 6. Check that you're redirected to /home
# 7. Verify user menu shows your username
```

### 2. Test API Endpoints

Open browser console and check for API calls:

```javascript
// Should see logs like:
// [API] GET /api/user
// [API] GET /api/posts/all
// [API] GET /api/threads
```

### 3. Test Post Feed

1. Navigate to `/home`
2. Verify posts load from `/api/posts/all`
3. Test filters (Today/Week/Month/All)
4. Test sorting (Hot/New/Top)
5. Test voting (upvote/downvote)
6. Test comments (click comment button)

### 4. Test Communities

1. Check left sidebar loads communities from `/api/threads`
2. Click on a community to filter posts
3. Verify posts update to show community-specific posts

## Troubleshooting

### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 'http://localhost:5174' has been blocked by CORS policy
```

**Solution:**
1. Verify backend CORS includes `http://localhost:5174` in `backend/threaddit/__init__.py`
2. Check that `supports_credentials=True` is set
3. Restart backend server

### Issue: Cookies Not Being Sent

**Symptoms:**
- User appears logged out after refresh
- API calls return 401 Unauthorized

**Solution:**
1. Verify `withCredentials: true` in `frontend_new/src/api.js`
2. Check browser DevTools > Application > Cookies
3. Verify cookie domain is set correctly (should be `localhost`)
4. Check that `SESSION_COOKIE_SAMESITE` is set to `None` in backend

### Issue: API Calls Failing

**Symptoms:**
- Network errors in console
- 404 Not Found errors

**Solution:**
1. Verify backend is running on `http://localhost:5000`
2. Check Vite proxy configuration in `vite.config.js`
3. Verify API endpoint URLs match backend routes
4. Check backend logs for errors

### Issue: Proxy Not Working

**Symptoms:**
- API calls go to wrong URL
- 404 errors on `/api/*` routes

**Solution:**
1. Verify Vite proxy is configured in `vite.config.js`
2. Check that `baseURL` in `api.js` is empty string in development
3. Restart Vite dev server
4. Check Vite console for proxy errors

## Development Workflow

### Recommended Workflow

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   python run.py
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend_new
   npm run dev
   ```

3. **Terminal 3 - Database (if needed):**
   ```bash
   # PostgreSQL commands or pgAdmin
   ```

### Hot Reload

- **Frontend:** Vite automatically reloads on file changes
- **Backend:** Flask debug mode reloads on Python file changes
- **Note:** Backend restart may be needed for some changes (e.g., CORS config)

## API Endpoints Reference

### Authentication
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `GET /api/user/logout` - Logout user
- `GET /api/user` - Get current user

### Posts
- `GET /api/posts/<feed_name>` - Get posts (home/all/popular)
- `GET /api/posts/thread/<tid>` - Get posts for community
- `GET /api/post/<pid>` - Get single post

### Communities
- `GET /api/threads` - Get all communities
- `GET /api/threads/search?name=...` - Search communities
- `POST /api/subthread/create` - Create community

### Reactions
- `PUT /api/reactions/post/<post_id>` - Add reaction
- `PATCH /api/reactions/post/<post_id>` - Update reaction
- `DELETE /api/reactions/post/<post_id>` - Remove reaction

### Comments
- `GET /api/comments/post/<pid>` - Get comments
- `POST /api/comments` - Create comment

## Environment Variables

### Backend (.env)
```env
DATABASE_URI=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key-here
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend
No environment variables needed. Configuration is in:
- `vite.config.js` - Vite/proxy settings
- `src/api.js` - API base URL

## Production Deployment

For production:

1. **Build frontend:**
   ```bash
   cd frontend_new
   npm run build
   ```

2. **Update backend static folder:**
   - Update `static_folder` in `backend/threaddit/__init__.py` to point to `frontend_new/dist`
   - Or serve frontend separately (recommended)

3. **Update CORS:**
   - Add production frontend URL to CORS origins
   - Set `SESSION_COOKIE_SECURE=True` for HTTPS

4. **Update API base URL:**
   - Set `baseURL` in `frontend_new/src/api.js` to production backend URL

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] User session persists after refresh
- [ ] Posts load on home page
- [ ] Filters work (Today/Week/Month/All)
- [ ] Sorting works (Hot/New/Top)
- [ ] Voting works (upvote/downvote)
- [ ] Comments load and display
- [ ] Communities sidebar loads
- [ ] Community filtering works
- [ ] User menu displays correctly
- [ ] Logout works
- [ ] No CORS errors in console
- [ ] No cookie errors in console
- [ ] API calls show in Network tab

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend terminal for errors
3. Check Network tab in DevTools
4. Verify all prerequisites are met
5. Review this integration guide


