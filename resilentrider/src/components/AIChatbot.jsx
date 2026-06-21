import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AIChatbot.css';

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! I\'m your ResilientRider AI assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickActions = [
    { icon: '📊', text: 'Check my earnings', action: 'earnings' },
    { icon: '🛡️', text: 'Insurance status', action: 'insurance' },
    { icon: '📍', text: 'Best zones now', action: 'zones' },
    { icon: '💰', text: 'Apply for loan', action: 'loan' },
  ];

  const botResponses = {
    earnings: 'Your current earnings this week are $892.30, which is 8.2% higher than last week! You\'re doing great! 🎉',
    insurance: 'Your Premium Protection plan is active with $50,000 coverage. Next payment due in 5 days. Everything looks good! ✓',
    zones: 'Based on current demand, I recommend relocating to Downtown District (2.3km away) for +$45/hr potential earnings. 🔥',
    loan: 'You have $2,500 available credit. Would you like to apply for a micro-loan? The process takes less than 5 minutes with instant approval! 💳',
    default: 'I can help you with earnings tracking, insurance information, zone recommendations, and loan applications. What would you like to know?',
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (text = inputValue) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text.toLowerCase());
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (text) => {
    if (text.includes('earning') || text.includes('money') || text.includes('income')) {
      return botResponses.earnings;
    }
    if (text.includes('insurance') || text.includes('coverage') || text.includes('policy')) {
      return botResponses.insurance;
    }
    if (text.includes('zone') || text.includes('location') || text.includes('where')) {
      return botResponses.zones;
    }
    if (text.includes('loan') || text.includes('credit') || text.includes('borrow')) {
      return botResponses.loan;
    }
    return botResponses.default;
  };

  const handleQuickAction = (action) => {
    handleSend(quickActions.find(a => a.action === action).text);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-container"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="chatbot-header">
              <div className="header-info">
                <div className="bot-avatar">🤖</div>
                <div>
                  <h3>AI Assistant</h3>
                  <span className="status-indicator">
                    <span className="status-dot"></span>
                    Online
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="chatbot-messages">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`message ${message.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.type === 'bot' && <div className="message-avatar">🤖</div>}
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">{message.time}</span>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  className="message bot typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="message-avatar">🤖</div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action.action)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{action.icon}</span>
                  <span>{action.text}</span>
                </motion.button>
              ))}
            </div>

            <div className="chatbot-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <motion.button
                className="send-btn"
                onClick={() => handleSend()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!inputValue.trim()}
              >
                ➤
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="chatbot-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { scale: 0 } : { scale: 1 }}
      >
        <span className="trigger-icon">💬</span>
        <span className="notification-badge">AI</span>
      </motion.button>
    </>
  );
}

export default AIChatbot;
