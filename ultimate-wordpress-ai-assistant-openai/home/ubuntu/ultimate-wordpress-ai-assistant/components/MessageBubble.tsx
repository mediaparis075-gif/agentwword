
import React from 'react';
import { Message, Sender } from '../types';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isTyping = false }) => {
  const isUser = message.sender === Sender.User;

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg max-w-lg flex items-center space-x-1">
            <span className="typing-dot"></span>
            <span className="typing-dot" style={{animationDelay: '0.2s'}}></span>
            <span className="typing-dot" style={{animationDelay: '0.4s'}}></span>
            <style>{`
                .typing-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background-color: currentColor;
                    border-radius: 50%;
                    animation: typing-bounce 1.2s infinite ease-in-out;
                }
                @keyframes typing-bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col" style={{maxWidth: '80%'}}>
        <div
          className={`px-4 py-3 rounded-2xl whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
          }`}
        >
          {message.text}
        </div>
        <span className={`text-xs mt-1 px-1 ${isUser ? 'text-right' : 'text-left'} text-gray-400`}>
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
