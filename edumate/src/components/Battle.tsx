import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Users, 
  Copy, 
  Check, 
  Loader2, 
  ChevronLeft, 
  Trophy, 
  Zap, 
  FileText,
  Send,
  Sparkles,
  User,
  Clock,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { generateQuizFromImage } from '../services/ai';
import { QuizQuestion } from '../types';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const correctSound = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'], volume: 0.5 });
const wrongSound = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'], volume: 0.5 });

interface BattleProps {
  onBack: () => void;
  initialSessionId?: string;
}

export const Battle: React.FC<BattleProps> = ({ onBack, initialSessionId }) => {
  const [mode, setMode] = useState<'selection' | 'creating' | 'waiting' | 'joining' | 'active' | 'finished'>('selection');
  const [sessionId, setSessionId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [subject, setSubject] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState<{ [id: string]: number }>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [publicSessions, setPublicSessions] = useState<any[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(15);
  
  const socketRef = useRef<WebSocket | null>(null);
  const myId = useRef(Math.random().toString(36).substr(2, 9));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mode === 'active' && !isAnswered) {
      setTimeLeft(15);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleOptionSelect(-1); // Time out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, mode, isAnswered]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}`);
      socketRef.current = socket;

      socket.onopen = () => {
        setSocketConnected(true);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        // Request public sessions on connect
        socket?.send(JSON.stringify({ type: 'PING' }));

        // Auto-join if initialSessionId is provided
        if (initialSessionId) {
          socket?.send(JSON.stringify({
            type: 'JOIN_SESSION',
            sessionId: initialSessionId.trim().toUpperCase()
          }));
          setMode('joining');
        }
      };

      socket.onclose = () => {
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket?.close();
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'SESSION_CREATED':
            setSessionId(data.sessionId);
            setMode('waiting');
            break;
          case 'BATTLE_START':
            setQuestions(data.payload.questions);
            if (data.payload.sessionId) setSessionId(data.payload.sessionId);
            setMode('active');
            break;
          case 'SCORE_UPDATED':
            setScores(prev => ({ ...prev, ...data.payload }));
            break;
          case 'PUBLIC_SESSIONS':
            setPublicSessions(data.sessions);
            break;
          case 'PONG':
            // Pong received, server is alive
            break;
          case 'ERROR':
            alert(data.message);
            setMode('selection');
            setIsLoading(false);
            break;
        }
      };
    };

    connect();

    const heartbeat = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 20000);

    return () => {
      socket?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(heartbeat);
    };
  }, []);

  useEffect(() => {
    if (initialSessionId && socketConnected) {
      // Small delay to ensure socket is ready for message
      const timer = setTimeout(() => {
        console.log('Auto-joining battle:', initialSessionId);
        joinBattle(initialSessionId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialSessionId, socketConnected]);

  const createBattle = async () => {
    if (!subject && !pdfUrl && images.length === 0) return;
    setIsLoading(true);
    setMode('creating');
    try {
      const savedProfile = localStorage.getItem('edumate_profile');
      const profile = savedProfile ? JSON.parse(savedProfile) : { name: 'শিক্ষার্থী' };
      
      const generated = await generateQuizFromImage(images, pdfUrl, `Generate 5 MCQs about ${subject || 'general knowledge'} in Bengali.`);
      setQuestions(generated);
      const sid = Math.random().toString(36).substr(2, 6).toUpperCase();
      socketRef.current?.send(JSON.stringify({
        type: 'CREATE_SESSION',
        sessionId: sid,
        payload: { 
          questions: generated, 
          subject: subject || (images.length > 0 ? 'Image Practice' : 'PDF Practice'),
          hostName: profile.name
        }
      }));
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || 'ব্যাটেল তৈরি করতে সমস্যা হয়েছে।';
      alert(`Error: ${errorMsg}\n\nদয়া করে আবার চেষ্টা করো। যদি ছবি আপলোড করে থাকো, তবে ছবির সাইজ ছোট করে দেখতে পারো।`);
      setMode('selection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const joinBattle = (id?: string) => {
    const targetId = (id || joinId).trim().toUpperCase();
    if (!targetId || !socketConnected) {
      if (!socketConnected) alert('সার্ভারের সাথে কানেক্ট হচ্ছে, দয়া করে একটু অপেক্ষা করো।');
      return;
    }
    console.log('Joining session:', targetId);
    setMode('joining');
    socketRef.current?.send(JSON.stringify({
      type: 'JOIN_SESSION',
      sessionId: targetId
    }));
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswered(true);
    
    const isCorrect = idx === questions[currentIdx].correctAnswer;
    if (isCorrect) {
      correctSound.play();
      const newScore = (scores[myId.current] || 0) + 1;
      socketRef.current?.send(JSON.stringify({
        type: 'UPDATE_SCORE',
        sessionId: sessionId || joinId.trim().toUpperCase(),
        payload: { [myId.current]: newScore }
      }));
    } else {
      if (idx !== -1) wrongSound.play();
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setMode('finished');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareBattleLink = () => {
    // Use window.location.origin + window.location.pathname for more robust URL
    // This handles the AI Studio preview environment better
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?battle=${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ChevronLeft size={20} /> ফিরে যাও
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bold text-slate-900">এডুমেট ব্যাটেল</h2>
            <div className={`flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${socketConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'}`}>
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {socketConnected ? 'ব্যাটেল সার্ভার কানেক্টেড' : 'সার্ভার ডিসকানেক্টেড (রিফ্রেশ করো)'}
            </div>
          </div>
          <div className="w-20" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-50">
              <Swords size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">ব্যাটেল তৈরি করো</h3>
            <p className="text-slate-500">একটি বিষয় বা পিডিএফ সিলেক্ট করো এবং বন্ধুর সাথে প্র্যাকটিস করো।</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {['পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'গণিত', 'ইংরেজি'].map(s => (
                <button 
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${subject === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-4 text-left">
              <input 
                type="text" 
                placeholder="অন্য বিষয় লেখো..." 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <ImageIcon className="text-slate-400 group-hover:text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-500">ছবি আপলোড</span>
                </label>
                <div className="relative">
                  <input 
                    type="url" 
                    placeholder="পিডিএফ লিঙ্ক" 
                    value={pdfUrl}
                    onChange={e => setPdfUrl(e.target.value)}
                    className="w-full h-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 pr-10 text-sm"
                  />
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>

              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover rounded-xl" />
                      <button 
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={createBattle}
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'ব্যাটেল শুরু করো'}
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-50">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">ব্যাটেল-এ যোগ দাও</h3>
            <p className="text-slate-500">বন্ধুর পাঠানো কোডটি এখানে লেখো এবং লড়াই শুরু করো।</p>
            <input 
              type="text" 
              placeholder="ব্যাটেল কোড (যেমন: ABC123)" 
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-center text-2xl font-black uppercase tracking-widest"
            />
            <button 
              onClick={() => joinBattle()}
              disabled={!socketConnected || !joinId}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {!socketConnected ? 'সার্ভারের জন্য অপেক্ষা...' : 'কোড দিয়ে জয়েন করো'}
            </button>
          </motion.div>
        </div>

        {/* Public Battles List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">সরাসরি জয়েন করো (পাবলিক ব্যাটেল)</h3>
          </div>
          
          {publicSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <Swords size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{session.subject}</p>
                      <p className="text-xs text-slate-500">হোস্ট: {session.hostName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => joinBattle(session.id)}
                    className="px-6 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-md shadow-amber-100"
                  >
                    জয়েন
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Users className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-medium">বর্তমানে কোনো পাবলিক ব্যাটেল নেই।</p>
              <p className="text-xs text-slate-400 mt-1">একটি নতুন ব্যাটেল তৈরি করে বন্ধুদের আমন্ত্রণ জানাও!</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (mode === 'creating' || mode === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Loader2 className="animate-spin text-indigo-600" size={64} />
        <h2 className="text-2xl font-bold text-slate-900">
          {mode === 'creating' ? 'ব্যাটেল তৈরি হচ্ছে...' : 'ব্যাটেল-এ যোগ দিচ্ছি...'}
        </h2>
        <p className="text-slate-500">
          {mode === 'creating' ? 'এআই তোমার জন্য সেরা প্রশ্নগুলো খুঁজে বের করছে।' : 'সার্ভারের সাথে সংযোগ স্থাপন করা হচ্ছে।'}
        </p>
      </div>
    );
  }

  if (mode === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl text-center space-y-8">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Users size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">বন্ধুর জন্য অপেক্ষা করো...</h2>
        <p className="text-slate-500">নিচের কোডটি তোমার বন্ধুর সাথে শেয়ার করো।</p>
        
        <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-indigo-200 flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-5xl font-black text-indigo-600 tracking-[0.5em]">{sessionId}</span>
            <div className="flex gap-2">
              <button 
                onClick={copyCode}
                title="কোড কপি করো"
                className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"
              >
                {copied ? <Check size={24} /> : <Copy size={24} />}
              </button>
              <button 
                onClick={shareBattleLink}
                title="লিঙ্ক কপি করো"
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-sm hover:bg-indigo-700 transition-all"
              >
                <Share2 size={24} />
              </button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 text-left">সরাসরি লিঙ্ক:</p>
            <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-500 break-all text-left font-mono">
              {`${window.location.origin}${window.location.pathname}?battle=${sessionId}`}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 text-left italic">
              * যদি লিঙ্ক কাজ না করে, তবে বন্ধুকে শুধু কোডটি ({sessionId}) দিয়ে জয়েন করতে বলো।
            </p>
          </div>
        </div>
        
        <p className="text-sm text-slate-400">বন্ধু জয়েন করলেই ব্যাটেল শুরু হয়ে যাবে!</p>
      </div>
    );
  }

  if (mode === 'active') {
    const q = questions[currentIdx];
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <User size={16} /> তুমি: {scores[myId.current] || 0}
            </div>
            <div className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <Users size={16} /> প্রতিপক্ষ: {Object.entries(scores).find(([id]) => id !== myId.current)?.[1] || 0}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-slate-400 font-bold text-sm mb-1">
              প্রশ্ন {currentIdx + 1} / {questions.length}
            </div>
            <div className={`text-2xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-indigo-600'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: isAnswered ? '0%' : `${(timeLeft / 15) * 100}%` }}
            transition={{ duration: isAnswered ? 0.3 : 1, ease: 'linear' }}
            className={`h-full ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-indigo-600'}`}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden"
          >
            {isAnswered && selectedOption === -1 && (
              <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="text-center">
                  <Clock size={64} className="text-rose-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-3xl font-black text-rose-600">সময় শেষ!</h3>
                </div>
              </div>
            )}

            <h3 className="text-2xl font-bold text-slate-900 mb-10 leading-tight">{q.question}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`p-6 rounded-2xl border-2 text-left font-medium transition-all duration-200 flex items-center justify-between group ${variant}`}
                >
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-10 pt-10 border-t border-slate-100"
              >
                <button 
                  onClick={nextQuestion}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {currentIdx === questions.length - 1 ? 'ব্যাটেল শেষ করো' : 'পরবর্তী প্রশ্ন'} <Zap size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
  }

  if (mode === 'finished') {
    const myScore = scores[myId.current] || 0;
    const opponentScore = Object.entries(scores).find(([id]) => id !== myId.current)?.[1] || 0;
    const isWinner = myScore > opponentScore;

    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl text-center space-y-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-xl ${isWinner ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
          <Trophy size={64} />
        </div>
        <h2 className="text-4xl font-black text-slate-900">
          {isWinner ? 'তুমি জিতেছো! 🎉' : myScore === opponentScore ? 'ড্র হয়েছে! 🤝' : 'চেষ্টা করো! 💪'}
        </h2>
        
        <div className="flex justify-center gap-12 text-2xl font-bold">
          <div>
            <p className="text-slate-400 text-sm uppercase mb-2">তোমার স্কোর</p>
            <p className="text-indigo-600 text-5xl">{myScore}</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div>
            <p className="text-slate-400 text-sm uppercase mb-2">প্রতিপক্ষ</p>
            <p className="text-rose-500 text-5xl">{opponentScore}</p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          ড্যাশবোর্ড-এ ফিরে যাও
        </button>
      </div>
    );
  }

  return null;
};
