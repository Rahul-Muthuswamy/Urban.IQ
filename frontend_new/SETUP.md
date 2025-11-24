# Setup Guide - Urban.IQ Signup Page

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend_new
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:5174`
   - Navigate to `/signup` to see the signup page

## Features Implemented

### ✅ Signup Page
- **Left Panel**: Auto-sliding carousel with 3 images and inspirational quotes
- **Right Panel**: Glassmorphism signup form with smooth animations
- **Responsive**: Mobile-first design that adapts to all screen sizes
- **Animations**: Buttery smooth transitions using Framer Motion
- **Brand Colors**: Primary (#84cc16) and Accent (#10b981)

### 🎨 Design Elements
- Apple "Liquid Glass" aesthetic
- Glassmorphism effects on inputs and panels
- Smooth fade and slide transitions
- Focus glow effects on inputs
- Hover elevation on buttons
- Parallax background elements

### 📱 Responsive Behavior
- **Desktop**: Two-column layout (carousel left, form right)
- **Mobile**: Carousel on top, form below
- Touch-friendly interactions
- Optimized typography scaling

## Assets

The signup page uses images from `/public/assets/`:
- `1_rem_bg.png` - Used as logo placeholder
- `2_remove_bg.png` - Carousel slide 2
- `3_remove_bg.png` - Carousel slide 3
- `4_remove_bg.png` - Available for future use

**Note**: Replace `1_rem_bg.png` with your actual logo file when ready.

## Backend Integration

The signup form is configured to work with your existing backend:
- **API Endpoint**: `http://localhost:5000/api/user/register`
- **Method**: POST
- **Payload**: `{ username, email, password }`
- **Response**: User object on success

Make sure your backend is running on port 5000 before testing registration.

## Customization

### Change Carousel Quotes
Edit `src/pages/Signup.jsx` - modify the `carouselSlides` array.

### Adjust Animation Speed
Edit transition durations in component files (default: 0.6s - 1.2s).

### Modify Colors
Update `tailwind.config.js` - change `primary` and `accent` color values.

## Next Steps

After testing the signup page, you can:
1. Create the login page (similar design)
2. Add form validation enhancements
3. Implement social login (GitHub button is ready)
4. Add Terms & Conditions page
5. Create additional pages following the same design system


