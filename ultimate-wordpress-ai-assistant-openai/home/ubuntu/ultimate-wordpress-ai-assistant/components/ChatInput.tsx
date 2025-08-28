
import React, { useState, useRef, useEffect, useCallback } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const MicIcon = ({ isListening }: { isListening: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : ''}`}>
      <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
      <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75A.75.75 0 0 1 6 10.5Z" />
    </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
        setText(transcript);
    }
  }, [transcript]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleVoiceToggle = () => {
      if (isListening) {
          stopListening();
      } else {
          setText('');
          startListening();
      }
  };

  return (
    <div className="flex items-end space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyPress={handleKeyPress}
        placeholder="Écrivez votre message ou utilisez le micro..."
        className="flex-1 bg-transparent resize-none outline-none p-2 max-h-40"
        rows={1}
      />
      {browserSupportsSpeechRecognition && (
        <button onClick={handleVoiceToggle} className="p-2 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors">
            <MicIcon isListening={isListening} />
        </button>
      )}
      <button onClick={handleSubmit} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:bg-indigo-400" disabled={!text.trim()}>
        <SendIcon />
      </button>
    </div>
  );
};

export default ChatInput;
