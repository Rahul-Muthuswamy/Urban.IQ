import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Hero from "./pages/Hero.jsx";
import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";
import Home from "./pages/Home.jsx";
import AIChatPage from "./pages/AIChatPage.jsx";
import CreateCommunity from "./pages/CreateCommunity.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserProfilePage from "./pages/UserProfile/UserProfilePage.jsx";
import PostDetailPage from "./pages/PostDetail/PostDetailPage.jsx";
import CommunityDetailPage from "./pages/CommunityDetail/CommunityDetailPage.jsx";
import MapsPage from "./pages/Maps/MapsPage.jsx";
import SavedPostsPage from "./pages/SavedPosts/SavedPostsPage.jsx";
import FindPage from "./pages/Find/FindPage.jsx";
import ModeratorDashboard from "./pages/Moderator/ModeratorDashboard.jsx";
import InboxPage from "./pages/Inbox/InboxPage.jsx";
import EventsPage from "./pages/Events/EventsPage.jsx";
import EventDetailPage from "./pages/Events/EventDetailPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<AIChatPage />} />
        <Route path="/community/create" element={<CreateCommunity />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/community/:slug" element={<CommunityDetailPage />} />
        <Route path="/t/:slug" element={<CommunityDetailPage />} />
        <Route path="/maps" element={<MapsPage />} />
        <Route path="/saved" element={<SavedPostsPage />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/moderator/dashboard" element={<ModeratorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

