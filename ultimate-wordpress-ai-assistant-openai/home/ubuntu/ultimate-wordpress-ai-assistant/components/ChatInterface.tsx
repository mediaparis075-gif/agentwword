
import React, { useRef, useEffect } from 'react';
import { Message, ConnectionStatus, Sender } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import StatusIndicator from './common/StatusIndicator';
import ThemeToggle from './ThemeToggle';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  wpStatus: ConnectionStatus;
  geminiStatus: ConnectionStatus;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, wpStatus, geminiStatus, theme, onToggleTheme }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-screen w-full lg:w-3/4 xl:w-1/2 bg-white dark:bg-gray-800 shadow-2xl rounded-none lg:rounded-2xl">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Assistant IA WordPress</h1>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
                <StatusIndicator status={wpStatus} />
                <span>WordPress</span>
            </div>
             <div className="flex items-center space-x-2 text-sm">
                <StatusIndicator status={geminiStatus} />
                <span>Gemini</span>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <MessageBubble message={{ id: 0, text: '...', sender: Sender.AI, timestamp: ''}} isTyping />}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ChatInput onSendMessage={onSendMessage} />
      </footer>
    </div>
  );
};

export default ChatInterface;
