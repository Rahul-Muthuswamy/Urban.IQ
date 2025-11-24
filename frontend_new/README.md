# Urban.IQ Frontend (New)

A modern, progressive web application built with React, Vite, Tailwind CSS, and Framer Motion. Features a beautiful "Liquid Glass" UI theme with smooth animations and full compatibility with the existing backend APIs.

## Features

- 🎨 **Liquid Glass UI**: Beautiful glassmorphism design with smooth animations
- 📱 **Progressive Web App**: Installable PWA with service worker and manifest
- ♿ **Accessible**: Screen-reader accessible (NVDA supported), keyboard navigable
- 🎭 **Smooth Animations**: Buttery-smooth transitions using Framer Motion
- 🔄 **Real-time Updates**: Optimistic UI updates with React Query
- 🎯 **Component-based**: Modular, reusable components

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **TanStack Query (React Query)** - Data fetching and caching
- **Axios** - HTTP client
- **React Router** - Client-side routing

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend server running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173` (or the next available port).

## Project Structure

```
frontend_new/
├── public/
│   ├── assets/          # Images and logos
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
├── src/
│   ├── components/     # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── LeftSidebar.jsx
│   │   ├── FeedCard.jsx
│   │   ├── FiltersBar.jsx
│   │   ├── VoteButtons.jsx
│   │   ├── FloatingActionButton.jsx
│   │   ├── Footer.jsx
│   │   └── CarouselPanel.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Signup.jsx
│   │   └── Signin.jsx
│   ├── api.js          # Axios instance configuration
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`. Key endpoints used:

### Posts
- `GET /api/posts/<feed_name>` - Get posts (home/all/popular)
- `GET /api/posts/thread/<tid>` - Get posts for a community
- Query params: `limit`, `offset`, `sortby` (top/hot/new), `duration` (day/week/month/alltime)

### Communities
- `GET /api/threads` - Get all communities (subscribed/all/popular)
- `POST /api/subthread/create` - Create a new community

### Reactions
- `PUT /api/reactions/post/<post_id>` - Add reaction
- `PATCH /api/reactions/post/<post_id>` - Update reaction
- `DELETE /api/reactions/post/<post_id>` - Remove reaction

### Comments
- `GET /api/comments/post/<pid>` - Get comments for a post
- `POST /api/comments` - Create a comment

### Authentication
- `GET /api/user` - Get current user
- `POST /api/user/login` - Login
- `GET /api/user/logout` - Logout

## Environment Variables

No environment variables are required for the frontend. The API base URL is hardcoded to `http://localhost:5000` in `src/api.js`. To change it, edit that file.

## Accessibility

- **Screen Reader Support**: NVDA compatible with proper ARIA attributes
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Visible focus states for all focusable elements
- **Skip Links**: Skip to main content link for screen readers
- **Semantic HTML**: Proper use of semantic HTML elements

## PWA Features

- **Installable**: Can be installed as a standalone app
- **Offline Support**: Basic offline caching via service worker
- **Manifest**: App manifest with icons and theme colors

## Testing

To test the Home page:

1. Ensure the backend is running on `http://localhost:5000`
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:5173/home`
4. If not authenticated, you'll be redirected to `/login`

## Routes

- `/` - Redirects to `/signup`
- `/signup` - User registration page
- `/login` - User login page
- `/home` - Main feed page (requires authentication)

## Brand Colors

- Primary: `#84cc16` (Lime green)
- Accent: `#10b981` (Emerald green)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes

- The app uses session-based authentication with cookies (`withCredentials: true`)
- React Query handles caching and refetching automatically
- Framer Motion provides smooth animations throughout
- Tailwind CSS utilities are used for styling
- Glassmorphism effects are achieved via CSS backdrop-filter

## Troubleshooting

**Posts not loading?**
- Check that the backend is running on `http://localhost:5000`
- Check browser console for API errors
- Verify CORS is configured correctly on the backend

**Authentication issues?**
- Ensure `withCredentials: true` is set in `api.js`
- Check that cookies are being sent/received
- Verify backend session configuration

**PWA not installing?**
- Ensure you're using HTTPS (or localhost)
- Check browser console for service worker errors
- Verify `manifest.json` is accessible

## License

MIT License - See LICENSE file for details
