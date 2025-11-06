import React from 'react';
import { ChatMessage } from '../types';

const ChatBubbleComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md p-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export const ChatBubble = React.memo(ChatBubbleComponent);


const ChatLoadingIndicatorComponent: React.FC = () => (
    <div className="flex justify-start mb-4">
        <div className="max-w-md p-3 rounded-2xl bg-slate-200 text-slate-800">
            <div className="flex items-center justify-center gap-1">
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

export const ChatLoadingIndicator = React.memo(ChatLoadingIndicatorComponent);
