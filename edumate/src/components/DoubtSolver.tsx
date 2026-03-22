import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  X,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { solveDoubt } from '../services/ai';

interface DoubtSolverProps {
  onBack: () => void;
}

export const DoubtSolver: React.FC<DoubtSolverProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && images.length === 0) return;

    setIsLoading(true);
    try {
      const base64s = images.map(img => img.split(',')[1]);
      const result = await solveDoubt(query, base64s);
      setAnswer(result);
      
      // Update stats
      const saved = localStorage.getItem('edumate_stats');
      const stats = saved ? JSON.parse(saved) : { quizzes: 0, doubts: 0, studyHours: 0, streak: 0 };
      stats.doubts += 1;
      localStorage.setItem('edumate_stats', JSON.stringify(stats));
    } catch (error) {
      console.error(error);
      alert('দুঃখিত, সমাধান তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করো।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-slate-900">এআই ডাউট সলভার</h2>
          <p className="text-slate-500 mt-2">যেকোনো সমস্যার তাৎক্ষণিক এবং ধাপে ধাপে সমাধান পাও।</p>
        </div>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="তোমার প্রশ্নটি এখানে লেখো অথবা ছবি আপলোড করো..."
              className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 min-h-[150px] resize-none text-lg"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
                multiple
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <AnimatePresence>
              {images.map((img, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative inline-block"
                >
                  <img src={img} alt="Preview" className="h-24 rounded-xl shadow-md" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={(!query && images.length === 0) || isLoading}
            className={`
              w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3
              ${(!query && images.length === 0) || isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} /> সমাধান করা হচ্ছে...
              </>
            ) : (
              <>
                <Sparkles size={24} /> সমাধান পাও
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {answer && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-slate-100 bg-slate-50/50 p-8"
            >
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-6">
                <MessageSquare size={20} />
                <span>এআই শিক্ষকের ব্যাখ্যা</span>
              </div>
              <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
              <button 
                onClick={() => { setAnswer(null); setQuery(''); setImages([]); }}
                className="mt-8 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                সব মুছে ফেলো এবং নতুন প্রশ্ন করো
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
