import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, Plus, Volume2 } from "lucide-react";
import { AudioConfig, SpeechConfig, SpeechRecognizer, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";

export default function AIChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const recognizerRef = useRef(null);
  
  // State management
  const [showMain, setShowMain] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);
  const [animateSub, setAnimateSub] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userLang, setUserLang] = useState("en");
  const [isListening, setIsListening] = useState(false);
  
  // Environment variables (replace with actual values)
  const translatorKey = import.meta.env.VITE_TRANSLATOR_KEY || "your_translator_key";
  const speechKey = import.meta.env.VITE_SPEECH_KEY || "your_speech_key";
  const translatorEndpoint = import.meta.env.VITE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
  const speechRegion = import.meta.env.VITE_SPEECH_REGION || "eastus";
  
  // Language mappings
  const langMap = {
    "en": "en", "hi": "hi", "ta": "ta", "kn": "kn", "es": "es",
    "de": "de", "fr": "fr", "ja": "ja", "pt": "pt", "ru": "ru",
  };
  
  const speechLocaleMap = {
    en: "en-US", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", es: "es-ES",
    de: "de-DE", fr: "fr-FR", ja: "ja-JP", pt: "pt-PT", ru: "ru-RU",
  };

  // Enhanced message sending with translation
  const handleSend = async (event) => {
    if (event) event.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    // Translate to English for RAG
    const translatedInput = await translateToEnglish(input);
    setInput("");

    // Show loading
    setMessages((prev) => [...prev, { role: "bot", text: "__loading__" }]);

    try {
      const response = await fetch("http://localhost:8000/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: translatedInput, k: 3 }),
      });

      const data = await response.json();
      const botResponse = data?.answer || "No response received.";
      
      // Translate back to user's language
      const translatedResponse = await translateToUserLang(botResponse, userLang);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: translatedResponse };
        return updated;
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: "Error fetching response." };
        return updated;
      });
    }
  };

  // Speech Recognition Functions
  const handleStartListening = () => {
    setIsListening(true);
    try {
      const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      speechConfig.speechRecognitionLanguage = mapToSpeechLocale(userLang);

      const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      recognizer.recognized = async (s, e) => {
        if (e.result.text) {
          setInput(e.result.text);
        }
      };

      recognizer.startContinuousRecognitionAsync();
    } catch (error) {
      console.error("Speech recognition error:", error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        recognizerRef.current?.close();
        recognizerRef.current = null;
        setIsListening(false);
      });
    }
  };

  // Language Detection
  const detectLanguage = async (text) => {
    try {
      const response = await fetch(
        `${translatorEndpoint}/detect?api-version=3.0`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": translatorKey,
            "Ocp-Apim-Subscription-Region": speechRegion,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ Text: text }]),
        }
      );
      const data = await response.json();
      return langMap[data[0].language] || "en";
    } catch (error) {
      console.error("Language detection error:", error);
      return "en";
    }
  };

  // Translation Functions
  const translateToEnglish = async (text) => {
    if (userLang === "en") return text;
    try {
      const response = await fetch(
        `${translatorEndpoint}/translate?api-version=3.0&to=en`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": translatorKey,
            "Ocp-Apim-Subscription-Region": speechRegion,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ Text: text }]),
        }
      );
      const data = await response.json();
      return data[0].translations[0].text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const translateToUserLang = async (text, targetLang) => {
    if (targetLang === "en") return text;
    try {
      const response = await fetch(
        `${translatorEndpoint}/translate?api-version=3.0&to=${targetLang}`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": translatorKey,
            "Ocp-Apim-Subscription-Region": speechRegion,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ Text: text }]),
        }
      );
      const data = await response.json();
      return data[0].translations[0].text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const mapToSpeechLocale = (lang) => {
    return speechLocaleMap[lang] || "en-US";
  };

  // Text-to-Speech
  const handleTextToSpeech = async (text) => {
    const lang = await detectLanguage(text);
    try {
      const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
      speechConfig.speechSynthesisLanguage = mapToSpeechLocale(lang);
      const synthesizer = new SpeechSynthesizer(speechConfig);

      synthesizer.speakTextAsync(
        text,
        () => synthesizer.close(),
        (error) => {
          console.error("Speech synthesis error:", error);
          synthesizer.close();
        }
      );
    } catch (error) {
      console.error("TTS error:", error);
    }
  };
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/user");
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 0,
    cacheTime: 0,
  });

  // Initialize animations
  useEffect(() => {
    const t1 = setTimeout(() => setShowMain(true), 200);
    const t2 = setTimeout(() => setShowButtons(true), 800);
    const t3 = setTimeout(() => setAnimateHero(true), 200);
    const t4 = setTimeout(() => setAnimateSub(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user && userError?.response?.status === 401) {
      navigate("/login", { replace: true });
    }
  }, [user, userLoading, userError, navigate]);

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <Navbar />
      <img src='/assets/7_remove_bg.png' alt='urban_iq' className='fixed top-0 left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 ml-5'></img>

      {/* Enhanced CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap');
        
        .ai-text {
          background: linear-gradient(90deg, #84cc16 0%, #10b891 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .nanum-font {
          font-family: 'Nanum Myeongjo', serif;
        }
        .ai-input {
          border-radius: 12.5px;
          border: 2px solid rgba(0, 0, 0, 0.10);
          background: rgba(255, 255, 255, 0.20);
          box-shadow: 0 8px 32px -10px rgba(0, 0, 0, 0.10);
          backdrop-filter: blur(25px);
        }
        .nav-select:hover {
          background: rgba(255, 255, 255, 1);
        }
        .nav-select {
          background: rgba(0, 0, 0, 0.20);
          box-shadow: 0 8px 16px -10px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(25px);
        }

        .bg-button {
          border: 2px solid transparent;
          border-radius: 10px;
          background-image: 
            linear-gradient(to right, #10B981, #84CC16);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          text-align: center;
          cursor: pointer;
        }
        .button-shadow {
          border-radius: 10px;
          background: linear-gradient(89deg, rgba(16, 185, 129, 0.50) 0%, rgba(132, 204, 22, 0.50) 100%);
          filter: blur(10px);
        }
        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
              
        .chat-scroll::-webkit-scrollbar-track {
          background: transparent; 
        }
              
        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(0deg, #333 0%, #666 100%);
          border-radius: 6px;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .typing-dots {
          display: flex;
          align-items: center;
        }
        
        .typing-dots span {
          height: 8px;
          width: 8px;
          background: #84cc16;
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(1) { animation-delay: -0.16s; background: #84cc16; }
        .typing-dots span:nth-child(2) { animation-delay: -0.32s; background: #10b891; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        @keyframes pulseBorder {
          0% { border-color: #10B981; }
          50% { border-color: #84CC16; }
          100% { border-color: #10B981; }
        }

        .ai-input.listening {
          border: 2px solid #84CC16;
          animation: pulseBorder 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Hero Section or Messages */}
      {messages.length === 0 ? (
        <div className="absolute left-1/2 top-[35%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
          <p className={`nanum-font ai-text text-2xl h-[4rem] sm:text-3xl md:text-4xl lg:text-5xl text-center transition-all duration-700 ease-out ${animateHero ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            Understand, Engage and Decide
          </p>
          <p className={`nanum-font ai-text text-2xl h-[4rem] sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6 md:mb-8 mt-2 text-center transition-all duration-700 ease-out ${animateHero ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            with Urban.IQ Assistant
          </p>
          <p className={`text-[12px] sm:text-[14px] md:text-[16px] text-[#222] mb-1 text-center transition-all duration-700 ease-out ${animateSub ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            Meet the AI assistant that informs, educates, and empowers your civic
          </p>
          <p className={`text-[12px] sm:text-[14px] md:text-[16px] text-[#222] text-center transition-all duration-700 ease-out ${animateSub ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            decisions unbiased, accessible, and built for every citizen.
          </p>
        </div>
      ) : (
        <div className="absolute top-0 bottom-48 sm:bottom-56 md:bottom-60 w-full overflow-y-scroll flex justify-center chat-scroll px-4 sm:px-6">
          <div className="w-full sm:w-11/12 md:w-4/5 lg:w-2/3 xl:w-1/2 flex flex-col pl-2">
            <div className="mt-auto"></div>
            <div className="pt-32"></div>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 sm:gap-4 md:gap-5 text-sm sm:text-base items-start ${
                  msg.role === "user"
                    ? "text-transparent w-fit bg-gradient-to-r from-[#84cc16] to-[#10b891] font-medium bg-clip-text animate-fadeInUp mb-2 sm:mb-4 md:mb-6"
                    : "text-[#222] mb-6 sm:mb-8 md:mb-10"
                }`}
              >
                <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-start justify-center flex-shrink-0 pt-1">
                  <img
                    src={
                      msg.role === "user"
                        ? user?.avatar || "/default-avatar.png"
                        : "/assets/5_remove_bg.png"
                    }
                    alt={msg.role === "user" ? "User" : "Urban IQ"}
                    className={
                      msg.role === "user"
                        ? "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full object-cover"
                        : "h-5 w-5 sm:h-6 sm:w-6 object-contain"
                    }
                    onError={(e) => {
                      if (msg.role === "user") {
                        e.target.src = "/default-avatar.png";
                      }
                    }}
                  />
                </div>
                {msg.text === "__loading__" ? (
                  <div className="typing-dots mt-3 space-x-0.5">
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p
                      style={{ whiteSpace: "pre-line" }}
                      className={`break-words ${
                        msg.role === "user"
                          ? "text-base sm:text-lg mt-1.5"
                          : "mt-1"
                      }`}
                    >
                      {msg.text}
                    </p>
                    {msg.role === "bot" && msg.text !== "__loading__" && (
                      <div
                        onClick={() => handleTextToSpeech(msg.text)}
                        className="group ml-0 sm:ml-2 flex items-center gap-2 mt-2 sm:mt-3 text-xs sm:text-sm text-[#333] cursor-pointer hover:text-primary transition-colors"
                      >
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 group-active:scale-95" />
                        <span className="group-active:scale-95">Read aloud</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="pb-5"></div>
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* AI Input Container */}
      <form
        onSubmit={handleSend}
        className={`ai-input fixed h-40 sm:h-44 md:h-48 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] md:w-4/5 lg:w-2/3 xl:w-1/2 bottom-4 sm:bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col justify-between p-2 sm:p-2.5 transition-all duration-700 ease-out
          ${showMain ? "opacity-100 scale-100" : "opacity-0 scale-95"} ${isListening ? "listening" : ""}`}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          className="h-full m-1 sm:m-2 resize-none text-sm sm:text-base text-[#222] placeholder:text-[#555] focus:outline-none bg-transparent"
          placeholder="Ask me anything..."
        />
        <div className="flex items-center justify-between gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setInput("");
              }}
              className={`glass-comm ml-0 sm:ml-1 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 rounded-lg cursor-pointer 
                transition-transform duration-150 ease-out
                ${showButtons ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                active:scale-95`}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-[#333] active:scale-95" />
              <p className="text-xs sm:text-sm text-[#222] active:scale-98 hidden sm:inline">
                New chat
              </p>
            </button>
            <LanguageSelector 
              userLang={userLang} 
              setUserLang={setUserLang} 
              className={showButtons ? "opacity-100 scale-100" : "opacity-0 scale-90"}
            />
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-4">
            {isListening ? (
              <button 
                type="button" 
                onClick={handleStopListening} 
                className="active:scale-95 cursor-pointer text-red-500 text-xl"
                title="Stop listening"
              >
                ⏹
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleStartListening} 
                className={`active:scale-95 cursor-pointer text-[#333] hover:text-primary transition-colors ${showButtons ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                title="Start voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim()}
              className={`relative overflow-visible p-0.5 sm:p-1 transition-transform duration-150 ease-out
                ${showButtons ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="button-shadow absolute inset-0 z-0"></div>
              <div className="bg-button relative z-10 text-xs sm:text-sm px-3 sm:px-4 py-1.5 active:scale-98">
                Send
              </div>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Language Selector Component
const LanguageSelector = ({ userLang, setUserLang, className }) => {
  return (
    <div className={`text-sm ${className}`}>
      <label htmlFor="lang-select" className="mr-2 text-[#333]">🌐 Choose Language:</label>
      <select
        id="lang-select"
        value={userLang}
        onChange={(e) => setUserLang(e.target.value)}
        className="glass-comm py-1.5 px-2 rounded-lg text-xs sm:text-sm focus:outline-none"
      >
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="hi">Hindi</option>
        <option value="ja">Japanese</option>
        <option value="kn">Kannada</option>
        <option value="pt">Portuguese</option>
        <option value="ru">Russian</option>
        <option value="es">Spanish</option>
        <option value="ta">Tamil</option>
      </select>
    </div>
  );
};

