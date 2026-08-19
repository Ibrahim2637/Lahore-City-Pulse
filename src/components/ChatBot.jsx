import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, HelpCircle } from 'lucide-react';
import { generateChatbotResponse } from '../utils/chatbotEngine';

export default function ChatBot({ civicData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Assalamu Alaikum! I am the Lahore Civic Pulse Assistant. How can I help you find data today? Try asking about Petrol, AQI, Gold rates, or Literacy rates! 🌸",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const reply = generateChatbotResponse(query, civicData);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickQueries = [
    "What is the AQI?",
    "Petrol rate",
    "Gold price",
    "Literacy rate",
    "Unemployment rate"
  ];

  const handleQuickQuery = (query) => {
    setInputValue(query);
  };

  return (
    <div className="chatbot-container">
      {/* Toggle Button */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span className="chatbot-badge">Help</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title-container">
              <div className="chatbot-avatar-active"></div>
              <div>
                <h4>Lahore Civic Assistant</h4>
                <p>Live Google Sheets Data Agent</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
                {msg.sender === 'bot' ? (
                  <div className="chatbot-icon bot-icon"><Bot size={16} /></div>
                ) : null}
                
                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} style={{ margin: 0, minHeight: '1.2em' }}>
                      {line.startsWith('🔹') || line.startsWith('🟢') || line.startsWith('🌡️') || line.startsWith('💧') || line.startsWith('🌧️') || line.startsWith('☀️') || line.startsWith('⛽') || line.startsWith('⚡') || line.startsWith('🛢️') || line.startsWith('🔥') || line.startsWith('🏆') || line.startsWith('💵') || line.startsWith('🪙') || line.startsWith('💠') || line.startsWith('📈') || line.startsWith('👥') || line.startsWith('🏭') || line.startsWith('💼') || line.startsWith('🛒') || line.startsWith('🎓') || line.startsWith('🎒') || line.startsWith('💉') || line.startsWith('📱') || line.startsWith('🌐') ? (
                        <span>{line}</span>
                      ) : line.includes('**') ? (
                        // Basic bolding parse
                        line.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
                      ) : line.includes('_') ? (
                        line.split('_').map((part, i) => i % 2 === 1 ? <em key={i}>{part}</em> : part)
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                  <span className="chatbot-time">{msg.time}</span>
                </div>

                {msg.sender === 'user' ? (
                  <div className="chatbot-icon user-icon"><User size={16} /></div>
                ) : null}
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message-row bot-row">
                <div className="chatbot-icon bot-icon"><Bot size={16} /></div>
                <div className="chatbot-bubble bot-bubble typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Queries */}
          <div className="chatbot-suggestions">
            {quickQueries.map((q, idx) => (
              <button key={idx} className="suggestion-pill" onClick={() => handleQuickQuery(q)}>
                {q}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <div className="chatbot-input-container">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="chatbot-send" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
