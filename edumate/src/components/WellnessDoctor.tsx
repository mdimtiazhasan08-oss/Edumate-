import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Loader2, 
  Heart, 
  Sparkles,
  User,
  Bot,
  X,
  HeartPulse
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { wellnessCounselor } from '../services/ai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface WellnessDoctorProps {
  onBack: () => void;
}

export const WellnessDoctor: React.FC<WellnessDoctorProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "হ্যালো! আমি তোমার এআই ওয়েলনেস মেন্টর। তুমি আজ কেমন বোধ করছো? পরীক্ষার চাপ, পড়াশোনায় মনোযোগের অভাব বা যেকোনো বিষয়ে কথা বলতে চাইলে আমি এখানে আছি। ❤️" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await wellnessCounselor(userMessage, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "দুঃখিত, আমি এই মুহূর্তে সংযোগ করতে পারছি না। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করো।" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-100">
            <HeartPulse className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">এডুমেট ওয়েলনেস</h2>
            <p className="text-slate-500 text-xs">তোমার মানসিক প্রশান্তি আমাদের লক্ষ্য</p>
          </div>
        </div>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-5 md:p-8 rounded-3xl shadow-md text-lg md:text-xl leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="prose prose-indigo max-w-none md:prose-lg">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm">
                <Loader2 className="animate-spin text-rose-500" size={24} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-10 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="তোমার মনের কথা এখানে লেখো..."
              className="flex-1 p-6 md:p-8 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-rose-500 text-xl md:text-2xl shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`
                p-6 md:p-8 rounded-3xl transition-all
                ${!input.trim() || isLoading 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-200'}
              `}
            >
              <Send size={32} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
