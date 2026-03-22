import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  RotateCcw,
  Trophy,
  ChevronLeft,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import { generateQuizFromImage } from '../services/ai';
import { QuizQuestion } from '../types';

const correctSound = new Howl({ 
  src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'],
  volume: 0.5
});
const wrongSound = new Howl({ 
  src: ['https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'],
  volume: 0.5
});
const successSound = new Howl({ 
  src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'],
  volume: 0.6
});

interface QuizGeneratorProps {
  onBack: () => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [instruction, setInstruction] = useState('Generate 5 high-quality MCQs from these materials in Bengali.');
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const updateStats = useCallback(() => {
    const saved = localStorage.getItem('edumate_stats');
    const stats = saved ? JSON.parse(saved) : { quizzes: 0, doubts: 0, studyHours: 0, streak: 0 };
    stats.quizzes += 1;
    // Simple streak logic: if last update was today, keep streak, else reset or increment
    // For now, just increment for demo purposes
    stats.streak = Math.max(stats.streak, 1); 
    localStorage.setItem('edumate_stats', JSON.stringify(stats));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: true
  });

  const handleGenerate = async () => {
    if (previews.length === 0 && !pdfUrl) return;
    setIsLoading(true);
    try {
      const base64s = previews.map(p => p.split(',')[1]);
      const questions = await generateQuizFromImage(base64s, pdfUrl, instruction);
      setQuiz(questions);
      successSound.play();
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResult(false);
    } catch (error) {
      console.error(error);
      alert('দুঃখিত, কুইজ তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করো।');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === quiz![currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
      correctSound.play();
    } else {
      wrongSound.play();
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz!.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      updateStats();
      if (score > quiz!.length / 2) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setFiles([]);
    setPreviews([]);
    setPdfUrl('');
    setShowResult(false);
    setScore(0);
    setCurrentQuestionIndex(0);
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl text-center"
      >
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">কুইজ সম্পন্ন হয়েছে!</h2>
        <p className="text-slate-500 mb-8">চমৎকার কাজ করেছো! তোমার পারফরম্যান্স নিচে দেওয়া হলো।</p>
        
        <div className="text-6xl font-black text-indigo-600 mb-8">
          {score} / {quiz?.length}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => {
              setCurrentQuestionIndex(0);
              setScore(0);
              setShowResult(false);
              setSelectedOption(null);
              setIsAnswered(false);
            }}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} /> আবার চেষ্টা করো
          </button>
          <button 
            onClick={resetQuiz}
            className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            নতুন কুইজ তৈরি করো
          </button>
        </div>
      </motion.div>
    );
  }

  if (quiz) {
    const q = quiz[currentQuestionIndex];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setQuiz(null)} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 font-bold transition-colors">
            <ChevronLeft size={20} /> ফিরে যাও
          </button>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            প্রশ্ন {currentQuestionIndex + 1} / {quiz.length}
          </span>
          <div className="flex gap-1">
            {quiz.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  i === currentQuestionIndex ? 'bg-indigo-600' : 
                  i < currentQuestionIndex ? 'bg-emerald-500' : 'bg-slate-200'
                }`} 
              />
            ))}
          </div>
        </div>

        <motion.div 
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">{q.question}</h3>
          
          <div className="space-y-4">
            {q.options.map((option, idx) => {
              const isCorrect = idx === q.correctAnswer;
              const isSelected = idx === selectedOption;
              
              let variant = "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30";
              if (isAnswered) {
                if (isCorrect) variant = "bg-emerald-50 border-emerald-500 text-emerald-700";
                else if (isSelected) variant = "bg-rose-50 border-rose-500 text-rose-700";
                else variant = "bg-white border-slate-100 opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-5 rounded-2xl border-2 text-left font-medium transition-all duration-200 flex items-center justify-between group ${variant}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-rose-500" size={20} />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 pt-8 border-t border-slate-100"
              >
                <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">ব্যাখ্যা</p>
                  <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                </div>
                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {currentQuestionIndex === quiz.length - 1 ? 'কুইজ শেষ করো' : 'পরবর্তী প্রশ্ন'} <ChevronRight size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">এআই কুইজ জেনারেটর</h2>
          <p className="text-slate-500 mt-2">তোমার পড়ার বই বা নোট থেকে কুইজ তৈরি করো।</p>
        </div>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Camera size={32} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">বইয়ের ছবি আপলোড করো</p>
                <p className="text-slate-500">একাধিক ছবি সিলেক্ট করা যাবে</p>
              </div>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="Preview" className="h-24 w-full object-cover rounded-xl shadow-sm" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                পিডিএফ লিঙ্ক (ঐচ্ছিক)
              </label>
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://example.com/book.pdf"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                নির্দেশনা (ঐচ্ছিক)
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="যেমন: ১০টি কঠিন প্রশ্ন তৈরি করো..."
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={(previews.length === 0 && !pdfUrl) || isLoading}
            className={`
              w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3
              ${(previews.length === 0 && !pdfUrl) || isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} /> কুইজ তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <FileText size={24} /> কুইজ শুরু করো
              </>
            )}
          </button>
        </div>

        <div className="hidden lg:block">
          <div className="bg-slate-100 rounded-3xl p-8 h-full flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Sparkles className="text-indigo-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">অনুপ্রেরণা</h3>
            <p className="text-slate-600 italic leading-relaxed">
              "সাফল্য মানেই শেষ নয়, ব্যর্থতা মানেই মৃত্যু নয়; আসল হলো এগিয়ে যাওয়ার সাহস ধরে রাখা।"
            </p>
            <div className="mt-8 space-y-4 text-left">
              <div className="bg-white p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <span className="text-sm font-medium text-slate-700">আজকের টার্গেট: ৩টি কুইজ</span>
              </div>
              <div className="bg-white p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <span className="text-sm font-medium text-slate-700">তোমার স্কোর আগের চেয়ে ১০% বেড়েছে!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
