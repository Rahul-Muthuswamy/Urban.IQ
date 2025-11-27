import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api.js";
import AnimatedLeftPanel from "../components/animated/AnimatedLeftPanel.jsx";
import SigninForm from "../components/SigninForm.jsx";

const carouselSlides = [
  {
    image: "/assets/1_rem_bg.png",
    quote: "Together, we shape the future of our city.",
    author: "Community First",
  },
  {
    image: "/assets/2_remove_bg.png",
    quote: "Your voice matters. Your vote counts.",
    author: "Democracy in Action",
  },
  {
    image: "/assets/3_remove_bg.png",
    quote: "Building bridges, not walls.",
    author: "Unity Through Engagement",
  },
];

export default function Signin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    // T&C removed from Sign In
  });
  const [errors, setErrors] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);

  // Check if user is already logged in
  const { data: currentUser, isLoading: checkingAuth } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/home", { replace: true });
    }
  }, [currentUser, navigate]);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Check for OAuth callback errors or success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      setErrors({ general: `OAuth error: ${error}` });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check if user is logged in (OAuth success)
      // If redirected from OAuth callback and user is authenticated, go to home
      if (currentUser) {
        navigate("/home", { replace: true });
      }
    }
  }, [currentUser, navigate]);

  // Handle GitHub OAuth login
  const handleGitHubLogin = async () => {
    try {
      setErrors({});
      const response = await api.get("/api/auth/github");
      if (response.data?.auth_url) {
        // Redirect to GitHub authorization page
        window.location.href = response.data.auth_url;
      } else {
        setErrors({ general: "Failed to initiate GitHub login. Please try again." });
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setErrors({ 
        general: error.response?.data?.message || "Failed to initiate GitHub login. Please try again." 
      });
    }
  };

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/api/user/login", {
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      // Store user data
      if (data) {
        localStorage.setItem("user", JSON.stringify(data));
      }
      // Invalidate and refetch user query, then navigate
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.setQueryData(["currentUser"], data);
      // Small delay to ensure query is updated
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 100);
    },
    onError: (error) => {
      // Handle 409 - Already logged in (treat as success)
      if (error.response?.status === 409) {
        // User is already logged in, invalidate query and redirect to home
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 100);
        return;
      }
      
      // Handle other errors
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Invalid email or password. Please try again." });
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation - T&C removed from Sign In
    const newErrors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password || formData.password.length < 1) {
      newErrors.password = "Password is required";
    }
    // T&C validation removed for Sign In

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    login(formData);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if already logged in (will redirect)
  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden overscroll-none" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Left Animated Panel - Top on mobile, Left on desktop */}
      <AnimatedLeftPanel
        slides={carouselSlides}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />

      {/* Right Signin Form Panel - Full width mobile, 65% tablet, 50% desktop */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 md:w-[65%] lg:w-1/2 flex items-center justify-center bg-gradient-to-b from-white via-primary/5 to-accent/10 relative overflow-hidden min-h-[calc(100vh-200px)] md:min-h-screen py-4 px-4 sm:py-6 sm:px-6 md:py-8 lg:py-12 safe-area-inset"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <SigninForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onSubmit={handleSubmit}
          isPending={isPending}
          onGitHubLogin={handleGitHubLogin}
        />
      </motion.div>
    </div>
  );
}
