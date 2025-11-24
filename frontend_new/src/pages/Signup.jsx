import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api.js";
import CarouselPanel from "../components/CarouselPanel.jsx";
import SignupForm from "../components/SignupForm.jsx";

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

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const { mutate: register, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/api/user/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Store user data
      localStorage.setItem("user", JSON.stringify(data));
      // Navigate to home or login page
      navigate("/login");
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || "Registration failed. Please try again." });
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.username || formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms & Conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    register(formData);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
      {/* Left Carousel Panel - Shows on mobile as top section */}
      <CarouselPanel
        slides={carouselSlides}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />

      {/* Right Signup Form Panel */}
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

        <SignupForm
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

