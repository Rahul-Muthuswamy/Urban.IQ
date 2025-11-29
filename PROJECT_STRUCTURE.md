# 📁 Urban.IQ Project Structure

A simple visual guide to the project organization.

---

## 🗂️ Root Directory

```
Urban.IQ/
│
├── 📁 backend/                    # Python Flask Backend
├── 📁 frontend_new/               # React Frontend
├── 📁 assets/                     # Images & Logos
├── 📄 README.md                   # Main Documentation
├── 📄 LICENSE                     # License File
└── 📄 PROJECT_ANALYSIS_REPORT.md  # Detailed Analysis
```

---

## 🔧 Backend Structure

```
backend/
│
├── 📁 threaddit/                  # Main Application Package
│   │
│   ├── 📄 __init__.py             # Flask App Setup
│   ├── 📄 config.py               # Configuration
│   ├── 📄 models.py               # Shared Models
│   ├── 📄 rag_adapter.py          # RAG Service Adapter
│   │
│   ├── 📁 auth/                   # Authentication
│   │   ├── routes.py              # Login, Signup, Password
│   │   ├── oauth_routes.py        # GitHub OAuth
│   │   └── decorators.py          # Permission Decorators
│   │
│   ├── 📁 users/                  # User Management
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 subthreads/             # Communities
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 posts/                  # Posts
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 comments/               # Comments
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── utils.py
│   │
│   ├── 📁 reactions/              # Voting System
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 messages/               # Private Messages
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 reports/                # Content Reporting
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── schemas.py
│   │
│   ├── 📁 moderation/             # Moderation Tools
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 events/                 # Events/Meetups
│   │   ├── models.py
│   │   └── routes.py
│   │
│   ├── 📁 chatbot/                # AI Chat Assistant
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── config.py
│   │
│   └── 📁 rag/                    # RAG Service (FastAPI)
│       ├── app_main.py
│       ├── rag_retriever.py
│       ├── cosmo_embedded.py
│       ├── start_rag_service.py
│       └── 📁 docs/               # Election Data JSON
│           ├── candidate_list.json
│           ├── faq.json
│           ├── impt_data.json
│           ├── polling_locations_clean.json
│           └── proposal_one.json
│
├── 📁 migrations/                 # Database Migrations
│   └── add_events_tables.sql
│
├── 📁 venv/                       # Python Virtual Environment
├── 📄 requirements.txt            # Python Dependencies
├── 📄 schema.sql                  # Database Schema
├── 📄 run.py                      # Application Entry Point
├── 📄 start_rag_service.bat       # Windows RAG Service Script
└── 📄 start_rag_service.sh        # Linux/Mac RAG Service Script
```

---

## 🎨 Frontend Structure

```
frontend_new/
│
├── 📁 src/                        # Source Code
│   │
│   ├── 📄 main.jsx                # Entry Point
│   ├── 📄 App.jsx                 # Root Component & Routing
│   ├── 📄 api.js                  # Axios Configuration
│   ├── 📄 index.css               # Global Styles
│   │
│   ├── 📁 components/             # Reusable Components
│   │   │
│   │   ├── 📄 Navbar.jsx          # Navigation Bar
│   │   ├── 📄 LeftSidebar.jsx     # Community Sidebar
│   │   ├── 📄 FeedCard.jsx        # Post Card
│   │   ├── 📄 EventCard.jsx       # Event Card
│   │   ├── 📄 VoteButtons.jsx     # Voting UI
│   │   ├── 📄 MessageBubble.jsx   # Chat Message
│   │   ├── 📄 FileUploader.jsx    # Image Upload
│   │   ├── 📄 ChatInputBar.jsx    # Chat Input
│   │   ├── 📄 TypingIndicator.jsx # Typing Animation
│   │   ├── 📄 SigninForm.jsx      # Login Form
│   │   ├── 📄 SignupForm.jsx      # Registration Form
│   │   ├── 📄 CommunityForm.jsx   # Community Creation
│   │   ├── 📄 FiltersBar.jsx      # Filter UI
│   │   ├── 📄 Footer.jsx          # Footer
│   │   │
│   │   ├── 📁 posts/              # Post Components
│   │   │   ├── EditPostModal.jsx
│   │   │   ├── DeleteConfirmModal.jsx
│   │   │   ├── ReportPostModal.jsx
│   │   │   └── PostActionMenu.jsx
│   │   │
│   │   ├── 📁 events/             # Event Components
│   │   │   ├── CreateEventModal.jsx
│   │   │   └── EditEventModal.jsx
│   │   │
│   │   ├── 📁 ui/                 # UI Primitives
│   │   │   ├── LiquidGlassCard.jsx
│   │   │   ├── CleanInputField.jsx
│   │   │   ├── CleanAuthCard.jsx
│   │   │   ├── CleanDivider.jsx
│   │   │   └── PeakDivider.jsx
│   │   │
│   │   └── 📁 animated/           # Animated Components
│   │       └── AnimatedLeftPanel.jsx
│   │
│   ├── 📁 pages/                  # Page Components
│   │   │
│   │   ├── 📄 Hero.jsx            # Landing Page
│   │   ├── 📄 Home.jsx            # Main Feed
│   │   ├── 📄 Signin.jsx          # Login Page
│   │   ├── 📄 Signup.jsx          # Registration Page
│   │   ├── 📄 Dashboard.jsx       # User Dashboard
│   │   ├── 📄 AIChatPage.jsx      # AI Assistant Chat
│   │   ├── 📄 CreateCommunity.jsx # Community Creation
│   │   │
│   │   ├── 📁 CommunityDetail/    # Community Pages
│   │   │   ├── CommunityDetailPage.jsx
│   │   │   ├── CommunityFeed.jsx
│   │   │   ├── CommunityHeader.jsx
│   │   │   ├── CommunitySidebar.jsx
│   │   │   ├── CommunityTabs.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CreatePostModal.jsx
│   │   │   ├── EditSubthreadModal.jsx
│   │   │   ├── ManageModsModal.jsx
│   │   │   ├── MoreDropdown.jsx
│   │   │   ├── FloatingActionButton.jsx
│   │   │   └── 📁 __tests__/      # Tests
│   │   │
│   │   ├── 📁 PostDetail/         # Post Detail Pages
│   │   │   ├── PostDetailPage.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CommentsList.jsx
│   │   │   ├── CommentItem.jsx
│   │   │   ├── CommentComposer.jsx
│   │   │   ├── CommentVoteButtons.jsx
│   │   │   ├── ActionsBar.jsx
│   │   │   └── SkeletonLoader.jsx
│   │   │
│   │   ├── 📁 UserProfile/        # User Profile Pages
│   │   │   ├── UserProfilePage.jsx
│   │   │   ├── UserProfileContent.jsx
│   │   │   ├── ProfileSidebar.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── ProfileAvatar.jsx
│   │   │   ├── UpdateProfileModal.jsx
│   │   │   ├── ChangePasswordModal.jsx
│   │   │   ├── ChangePasswordForm.jsx
│   │   │   ├── DeleteAccountModal.jsx
│   │   │   ├── MessageModal.jsx
│   │   │   ├── GlassCard.jsx
│   │   │   ├── InputField.jsx
│   │   │   └── AnimatedButton.jsx
│   │   │
│   │   ├── 📁 Events/             # Events Pages
│   │   │   ├── EventsPage.jsx
│   │   │   └── EventDetailPage.jsx
│   │   │
│   │   ├── 📁 Moderator/          # Moderation Pages
│   │   │   ├── ModeratorDashboard.jsx
│   │   │   ├── ReportedPostCard.jsx
│   │   │   └── DeletePostModal.jsx
│   │   │
│   │   ├── 📁 Maps/               # Maps Page
│   │   │   └── MapsPage.jsx
│   │   │
│   │   ├── 📁 Find/               # Search Pages
│   │   │   ├── FindPage.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   ├── SearchResultItem.jsx
│   │   │   ├── LiveSuggestions.jsx
│   │   │   └── LoadingSkeleton.jsx
│   │   │
│   │   ├── 📁 Inbox/              # Messages Pages
│   │   │   ├── InboxPage.jsx
│   │   │   └── ChatView.jsx
│   │   │
│   │   └── 📁 SavedPosts/         # Saved Posts Page
│   │       └── SavedPostsPage.jsx
│   │
│   ├── 📁 hooks/                  # Custom React Hooks
│   │   ├── useAuth.js             # Authentication Hook
│   │   └── usePWAInstall.js       # PWA Install Hook
│   │
│   └── 📁 utils/                  # Utility Functions
│       └── webSearch.js           # Web Search Integration
│
├── 📁 public/                     # Static Assets
│   ├── 📁 assets/                 # Images
│   │   ├── 1_rem_bg.png
│   │   ├── 2_remove_bg.png
│   │   ├── 3_remove_bg.png
│   │   ├── 4_remove_bg.png
│   │   ├── 5_remove_bg.png
│   │   ├── 6_remove_bg.png
│   │   └── 7_remove_bg.png
│   ├── default-avatar.png
│   ├── manifest.json              # PWA Manifest
│   ├── sw.js                      # Service Worker
│   └── browserconfig.xml
│
├── 📁 dist/                       # Build Output
├── 📁 node_modules/               # Node Dependencies
├── 📄 package.json                # Node Dependencies
├── 📄 package-lock.json           # Dependency Lock
├── 📄 vite.config.js              # Vite Configuration
├── 📄 tailwind.config.js          # Tailwind Configuration
├── 📄 postcss.config.js           # PostCSS Configuration
├── 📄 index.html                  # HTML Template
├── 📄 start-dev.bat               # Windows Dev Script
├── 📄 start-dev.sh                # Linux/Mac Dev Script
├── 📄 README.md                   # Frontend README
└── 📄 PWA_SETUP_INSTRUCTIONS.md   # PWA Setup Guide
```

---

## 📦 Key Files Explained

### Backend Key Files

| File | Purpose |
|------|---------|
| `run.py` | Starts the Flask application |
| `requirements.txt` | Python package dependencies |
| `schema.sql` | Database table definitions |
| `threaddit/__init__.py` | Flask app initialization & blueprint registration |
| `threaddit/config.py` | Environment configuration |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `main.jsx` | React app entry point |
| `App.jsx` | Main router & route definitions |
| `api.js` | Axios instance & API configuration |
| `package.json` | Node.js dependencies & scripts |
| `vite.config.js` | Vite build tool configuration |

---

## 🔄 Module Organization

### Backend Modules

1. **auth** → Authentication & OAuth
2. **users** → User management
3. **subthreads** → Communities
4. **posts** → Post creation & management
5. **comments** → Comment system
6. **reactions** → Voting system
7. **messages** → Private messaging
8. **events** → Events/Meetups
9. **reports** → Content reporting
10. **moderation** → Moderation tools
11. **chatbot** → AI chat assistant
12. **rag** → RAG service (separate FastAPI)

### Frontend Pages

1. **Hero** → Landing page
2. **Home** → Main feed
3. **CommunityDetail** → Community pages
4. **PostDetail** → Post detail view
5. **UserProfile** → User profile
6. **Events** → Events listing & details
7. **Moderator** → Moderation dashboard
8. **Maps** → Azure Maps integration
9. **Find** → Search functionality
10. **Inbox** → Private messages
11. **AIChatPage** → AI assistant

---

## 📊 File Count Summary

- **Backend Python Files:** ~50+ files
- **Frontend React Components:** ~100+ files
- **Database Tables:** 12+ tables
- **API Endpoints:** 60+ endpoints
- **Total Lines of Code:** 10,000+ lines

---

## 🚀 Quick Start Paths

### Backend
```
backend/run.py → threaddit/__init__.py → Blueprints
```

### Frontend
```
src/main.jsx → App.jsx → Pages/Components
```

### RAG Service
```
backend/threaddit/rag/app_main.py → FastAPI Application
```

---

## 💡 Understanding the Structure

- **backend/** = Server-side code (Python/Flask)
- **frontend_new/** = Client-side code (React)
- **backend/threaddit/** = Main application package
- **backend/threaddit/rag/** = Separate AI service (FastAPI)
- **src/pages/** = Full page components
- **src/components/** = Reusable UI components

---

**Last Updated:** 2024  
**Total Directories:** 50+  
**Total Files:** 200+


