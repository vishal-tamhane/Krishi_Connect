import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane, faSpinner, faRobot, faLeaf,
  faMicrophone, faImage
} from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from '../context/AppContext';
import { fetchFieldData } from '../services/dataService';

import './AIAssistant.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

const SUGGESTIONS = [
  "Current weather and forecast",
  "Soil health tips",
  "Crop price in market",
  "Best fertilizer schedule",
  "How to prevent pests?",
  "Water usage advice"
];

const AIAssistant = () => {
  const { selectedField, fields } = useAppContext();
  const [fieldData, setFieldData] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'नमस्ते, किसान मित्र! 👋 I am AgriSense AI, your smart farming companion. How can I assist your fields today?',
      timestamp: new Date().toISOString(),
      isIntroduction: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const aiPrompt = `You are Fasal AI, a comprehensive agricultural assistant for Indian farmers.
    Your expertise covers weather predictions, crop management, market trends, field analytics, and general farming advice.
    Provide practical, actionable advice that considers local agricultural conditions in India.
    Focus exclusively on agricultural topics. If asked about non-farming topics, politely redirect
    the conversation to agricultural subjects you can assist with.
    Keep responses concise, respectful, and tailored for farmers who may have varying levels of technical knowledge.
    Always prioritize sustainable farming practices and techniques that are accessible to small and medium-scale farmers.
    Current date: September 24, 2025.`;

  useEffect(() => {
    const loadFieldData = async () => {
      if (selectedField) {
        try {
          const data = await fetchFieldData(selectedField);
          setFieldData(data);
        } catch (error) {
          setFieldData(null);
        }
      } else {
        setFieldData(null);
      }
    };
    loadFieldData();
  }, [selectedField]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callGroqAPI = async (userPrompt) => {
    try {
      let contextPrompt = aiPrompt;
      if (fieldData) {
        const fieldDataSummary = `
          Current Field Context:
          Selected Field: ${fieldData.name}
          Location: ${fieldData.location}
          Size: ${fieldData.size} acres
          Crop: ${fieldData.crop || fieldData.mainCrop || 'None'}
          Soil Type: ${fieldData.soilType || 'Unknown'}
          Coordinates: ${JSON.stringify(fieldData.coordinates)}
        `;
        contextPrompt += `\n\n${fieldDataSummary}`;
      }

      const recentMessages = messages
        .filter(msg => !msg.isIntroduction)
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const payload = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: contextPrompt },
          ...recentMessages,
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      };

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Error calling Groq API';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Unexpected response format from Groq API');
      }

      return {
        text: data.choices[0].message.content,
        icon: faRobot
      };
    } catch (error) {
      let errorMsg = "I'm having trouble connecting to my knowledge base at the moment. Please try again later or ask another question.";
      if (error.message.includes("decommissioned") || error.message.includes("deprecated")) {
        errorMsg += " (Error: The AI model being used is no longer available. Our team has been notified.)";
      } else if (error.message.includes("API key")) {
        errorMsg += " (Error: There seems to be an issue with API authentication. Our team has been notified.)";
      } else if (error.message.includes("rate limit")) {
        errorMsg += " (Error: We've reached our usage limit. Please try again in a few minutes.)";
      }
      return {
        text: errorMsg,
        icon: faRobot
      };
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageCopy = message;
    setMessage('');
    setIsLoading(true);

    try {
      const response = await callGroqAPI(messageCopy);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toISOString(),
        icon: response.icon
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'I apologize, but I encountered an issue processing your request. Please try again later.',
        timestamp: new Date().toISOString(),
        icon: faRobot
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Suggestion quick-reply handler
  const handleSuggestion = (sugg) => {
    setMessage(sugg);
  };

  return (
    <div className="flex flex-col h-[100vh] bg-gradient-to-br from-white to-blue-50 relative">
      {/* --- Assistant Header --- */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-3 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-5">
          <div className="bg-white p-2 sm:p-3 rounded-full shadow-md flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=98&h=98&facepad=2"
              alt=""
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center truncate">Fasal AI</h1>
            <p className="text-xs sm:text-sm text-blue-50 truncate">Smart farming, personalized insights</p>
          </div>
        </div>
      </div>

      {/* --- Main Chat Window --- */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto p-2 xs:p-3 sm:p-6">
          {/* Quick Action Suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map((sugg) => (
              <button
                key={sugg}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-green-200 transition shadow"
                onClick={() => handleSuggestion(sugg)}
                type="button"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faLeaf} className="mr-1" /> {sugg}
              </button>
            ))}
          </div>

          {/* Message Bubbles */}
          <div className="space-y-4 chat-container pb-10">
            {messages.filter(msg => !msg.isIntroduction).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`
                    max-w-[85%] rounded-xl
                    ${msg.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-lg'
                      : 'bg-white border-l-4 border-blue-400 text-gray-800 rounded-tl-none shadow-md'
                    }
                    px-4 py-3
                    transition-all
                  `}
                >
                  {/* Bot icon row */}
                  {msg.icon && msg.sender === 'bot' && (
                    <div className="flex items-center mb-1 text-blue-600 gap-2">
                      <FontAwesomeIcon icon={msg.icon} className="text-base" />
                      <span className="text-xs">Fasal AI</span>
                    </div>
                  )}
                  <div className="text-xs sm:text-base break-words whitespace-pre-line">{msg.text}</div>
                  <div className={`text-[11px] sm:text-xs mt-2 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-l-4 border-blue-400 rounded-xl shadow-md px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faSpinner} className="text-blue-600 animate-spin" />
                    </div>
                    <div className="flex gap-1 animate-pulse">
                      <span className="bg-blue-200 w-1.5 h-1.5 rounded-full" />
                      <span className="bg-blue-200 w-1.5 h-1.5 rounded-full" />
                      <span className="bg-blue-200 w-1.5 h-1.5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* --- Input Section --- */}
      <div className="p-3 bg-white border-t border-gray-200 shadow-inner sticky bottom-0 z-10">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">          
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask about farming, crops, weather…"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            aria-label="Send message"
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-3 flex items-center justify-center shadow-lg transition hover:scale-105 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
