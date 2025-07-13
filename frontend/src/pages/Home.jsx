import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Search,
  Mic,
  Copy,
  RefreshCw,
  User,
  Bot,
  X,
  Camera,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";


const MediBotUI = () => {
  // const [API_BASE_URL, setAPIBaseUrl] = useState("");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);


  // // ✅ 1. Get and extract ngrok URL
  // useEffect(() => {
  //   const fetchApiUrl = async () => {
  //     try {
  //       const res = await fetch("http://localhost:8000/get-ngrok-url");
  //       const data = await res.json();
  //       const match = data.url.match(/https:\/\/[a-zA-Z0-9\-]+\.ngrok-free\.app/);
  //       const extractedUrl = match ? match[0] : "";
  //       if (extractedUrl) {
  //         console.log("✅ Extracted backend URL:", extractedUrl);
  //         setAPIBaseUrl(extractedUrl);
  //       } else {
  //         console.error("❌ Could not extract valid ngrok URL from:", data.url);
  //       }
  //     } catch (err) {
  //       console.error("❌ Failed to fetch backend URL:", err);
  //     }
  //   };

  //   fetchApiUrl();
  // }, []);

  // ✅ 2. After URL is set → check API health + set welcome message
  //   useEffect(() => {
  //     const checkApiAndWelcome = async () => {
  //       if (!API_BASE_URL) return;
  //       try {
  //         const res = await axios.get(`${API_BASE_URL}/health`);
  //         setApiConfigured(res.data.google_ai_configured);
  //         console.log("✅ API health check passed");

  //         // ✅ Set bot welcome message only after API is ready
  //         setMessages([
  //           {
  //             id: 1,
  //             text: `🏥 **Welcome to MediBot!**

  // I'm your AI health assistant. Here's how I can help:

  // 📷 Upload a medication image for analysis
  // 💊 Ask about drug info, side effects, or interactions
  // 🩺 Get symptom-based guidance
  // ⚕️ Receive OTC suggestions

  // 💬 Type your question or upload a photo to get started!

  // *Note: Always consult a doctor for medical advice.*`,
  //             sender: "bot",
  //             timestamp: new Date(),
  //             medicationInfo: null,
  //           },
  //         ]);
  //       } catch (err) {
  //         console.error("❌ API health check failed:", err);
  //       }
  //     };

  //     checkApiAndWelcome();
  //   }, [API_BASE_URL]);


  useEffect(() => {
    const checkApiAndWelcome = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/health`);
        setApiConfigured(res.data.google_ai_configured);
        console.log("✅ API health check passed");

        setMessages([
          {
            id: 1,
            text: `🏥 **🏥 **Welcome to MediBot!**

  I'm your AI health assistant. Here's how I can help:

  📷 Upload a medication image for analysis
  💊 Ask about drug info, side effects, or interactions
  🩺 Get symptom-based guidance
  ⚕️ Receive OTC suggestions

  💬 Type your question or upload a photo to get started!

  *Note: Always consult a doctor for medical advice.*`,
            sender: "bot",
            timestamp: new Date(),
            medicationInfo: null,
          },
        ]);
      } catch (err) {
        console.error("❌ API health check failed:", err);
      }
    };

    checkApiAndWelcome();
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 📷 Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (!API_BASE_URL) {
      console.warn("⚠️ API URL not yet loaded.");
      return;
    }

    if (!inputText.trim() && !selectedImage) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      image: imagePreview,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      let imageData = null;
      if (selectedImage) {
        imageData = await convertImageToBase64(selectedImage);
      }

      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputText,
        image_data: imageData,
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: "bot",
        timestamp: new Date(),
        medicationInfo: response.data.medication_info,
        confidence: response.data.confidence,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Error sending message:", error);

      const errorMessage = {
        id: Date.now() + 1,
        text: `❌ Sorry, I encountered an error: ${error.response?.data?.detail || error.message
          }. Please try again or check if the backend server is running.`,
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatMessageContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>")
      .replace(/• /g, "&bull; ");
  };


  const MedicationInfoCard = ({ medicationInfo }) => {
    if (!medicationInfo) return null;

    return (
      <div className="mt-4 p-5 bg-blue-900/40 border border-blue-700 rounded-xl shadow-inner">
        <h4 className="text-base font-semibold text-blue-300 mb-4 tracking-wide">
          📋 Medication Information
        </h4>

        <div className="space-y-3 text-sm leading-relaxed text-gray-100">
          {/* Name */}
          <div>
            <span className="font-medium text-blue-200">🔹 Name:</span>
            <span className="ml-2">{medicationInfo.name}</span>
          </div>

          {/* Purpose */}
          {medicationInfo.purpose && (
            <div>
              <span className="font-medium text-blue-200">🔸 Purpose:</span>
              <span className="ml-2">{medicationInfo.purpose.substring(0, 200)}...</span>
            </div>
          )}

          {/* Dosage */}
          {medicationInfo.dosage && (
            <div>
              <span className="font-medium text-blue-200">💊 Dosage:</span>
              <span className="ml-2">{medicationInfo.dosage.substring(0, 200)}...</span>
            </div>
          )}

          {/* Warnings */}
          {medicationInfo.warnings && (
            <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-sm">
              <span className="font-medium text-red-300">⚠️ Warnings:</span>
              <span className="ml-2 text-red-100">{medicationInfo.warnings.substring(0, 200)}...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const { user } = useUser();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">MediBot</h1>
            <p className="text-xs text-gray-400">AI Medical Assistant</p>
          </div>
          {apiConfigured ? (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          ) : (
            <div
              className="w-2 h-2 bg-yellow-500 rounded-full"
              title="Image analysis unavailable"
            ></div>
          )}
        </div>

        {/* 👤 User profile (Clerk) */}
        {user && (
          <div className="flex items-center space-x-3">
            <img
              src={user.imageUrl}
              alt="User Avatar"
              className="w-8 h-8 rounded-full border border-gray-600"
            />
            <div className="text-sm font-medium text-white">
              {user.fullName || user.username || "User"}
            </div>
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      {showDisclaimer && (
        <div className="bg-red-900/20 border-b border-red-800 p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-200">
                <strong>IMPORTANT MEDICAL DISCLAIMER:</strong> This chatbot
                provides general medical information and should NOT replace
                professional medical advice. Always consult a licensed
                healthcare provider for personalized medical guidance,
                diagnosis, and treatment.
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="p-1 hover:bg-red-800 rounded"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notification */}
      {showNotification && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-gray-300">
                By using MediBot, you agree to our{" "}
                <span className="text-blue-400 underline cursor-pointer">
                  Terms
                </span>{" "}
                and{" "}
                <span className="text-blue-400 underline cursor-pointer">
                  Privacy Policy
                </span>
                . Don't share sensitive personal medical information.{" "}
                <span className="text-blue-400 underline cursor-pointer">
                  Learn more
                </span>
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-4 p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`flex items-start space-x-3 max-w-4xl ${message.sender === "user"
                ? "flex-row-reverse space-x-reverse"
                : ""
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === "bot" ? "bg-blue-600" : "bg-purple-600"
                  }`}
              >
                {message.sender === "bot" ? (
                  <Activity className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 ${message.sender === "user" ? "text-right" : ""
                  }`}
              >
                <div
                  className={`inline-block p-4 rounded-2xl max-w-full ${message.sender === "user"
                    ? "bg-gray-700 text-white"
                    : message.isError
                      ? "bg-red-900/30 border border-red-700 text-red-100"
                      : "bg-gray-800 text-gray-100"
                    }`}
                >
                  {/* Image if present */}
                  {message.image && (
                    <div className="mb-3">
                      <img
                        src={message.image}
                        alt="Uploaded medication"
                        className="max-w-xs rounded-lg border border-gray-600"
                      />
                    </div>
                  )}

                  {/* Message text */}
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.text),
                    }}
                  />

                  {/* Confidence indicator */}
                  {message.confidence && (
                    <div className="mt-2 text-xs text-gray-400">
                      Confidence: {Math.round(message.confidence * 100)}%
                    </div>
                  )}
                </div>

                {/* Medication Info Card */}
                {message.medicationInfo && (
                  <MedicationInfoCard medicationInfo={message.medicationInfo} />
                )}

                {/* Message Actions */}
                {message.sender === "bot" && !message.isError && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => handleCopy(message.text)}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-300">
                    Analyzing your request...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto">
            <div className="relative inline-block bg-gray-800 rounded-lg p-2 border border-gray-600">
              <img
                src={imagePreview}
                alt="Selected medication"
                className="max-h-32 rounded"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-gray-600">
            <div className="flex items-end p-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer mr-2"
                title="Upload medication image"
              >
                <Camera className="w-5 h-5" />
              </label>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about medications, symptoms, or upload an image..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none max-h-32 min-h-[24px]"
                rows="1"
                style={{ lineHeight: "1.5" }}
              />

              <div className="flex items-center space-x-1 ml-2">
                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                  className={`p-2 rounded-lg transition-colors ${inputText.trim() || selectedImage
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-2">
            MediBot provides general medical information only. Always consult
            healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediBotUI;



