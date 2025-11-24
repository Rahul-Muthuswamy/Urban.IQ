import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api.js";
import CarouselPanel from "../components/CarouselPanel.jsx";
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
    agreeToTerms: false,
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

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/api/user/login", {
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Store user data
      localStorage.setItem("user", JSON.stringify(data));
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      // Navigate to home page
      navigate("/home", { replace: true });
    },
    onError: (error) => {
      // Handle 409 - Already logged in (treat as success)
      if (error.response?.status === 409) {
        // User is already logged in, invalidate query and redirect to home
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        navigate("/home", { replace: true });
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

    // Validation
    const newErrors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password || formData.password.length < 1) {
      newErrors.password = "Password is required";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms & Conditions";
    }

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
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
      {/* Left Carousel Panel */}
      <CarouselPanel
        slides={carouselSlides}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />

      {/* Right Signin Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 bg-gradient-to-br from-primary/10 via-white to-accent/10 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <SigninForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </motion.div>
    </div>
  );
}

