import React, { useState, useEffect, useRef } from 'react';
import { getAiAppRecommendation } from '../services/api';
import { App } from '../types';

interface AiAssistantModalProps {
  apps: App[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ apps, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Habari! Mimi ni msaidizi wako wa AI. Niulize chochote kuhusu programu zetu na nitakusaidia kupata unachotafuta.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAiAppRecommendation(input, apps);
      const modelMessage: Message = { role: 'model', text: aiResponse };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Failed to get AI recommendation", error);
      const errorMessage: Message = { role: 'model', text: 'Samahani, kuna tatizo la mtandao. Jaribu tena.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-assistant-title">
      <div 
        className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {/* Sparkle Icon */}
              <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            </span>
            <h2 id="ai-assistant-title" className="text-xl font-bold text-text-primary">Msaidizi wa AI</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none" aria-label="Funga">&times;</button>
        </header>

        <main className="p-4 sm:p-6 flex-grow overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-100 text-text-primary rounded-bl-none'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-slate-100 text-text-primary rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 border-t border-slate-200 flex-shrink-0 bg-white">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Andika ujumbe wako..."
              className="w-full px-4 py-3 rounded-full bg-slate-100 text-text-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Ujumbe kwa Msaidizi wa AI"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-white rounded-full p-3 hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex-shrink-0" aria-label="Tuma Ujumbe">
              {/* Send Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .95.826L11.25 8.25l-5.607 1.77a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .95.826l3.296-1.048a.75.75 0 0 0 .421-.352l7.234-10.128a.75.75 0 0 0-.14-1.042L3.105 2.289Z" /></svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default AiAssistantModal;
