import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Calendar, 
  HelpCircle, 
  HeartPulse, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Trophy,
  MessageSquare,
  Swords
} from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  setView: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  // These should eventually come from a global state or localStorage
  const [userStats, setUserStats] = React.useState({
    quizzes: 0,
    doubts: 0,
    studyHours: 0,
    streak: 0
  });
  const [profile, setProfile] = React.useState({ name: 'শিক্ষার্থী', class: 'শ্রেণী উল্লেখ করো', avatar: '' });

  React.useEffect(() => {
    const loadStats = () => {
      const savedStats = localStorage.getItem('edumate_stats');
      if (savedStats) setUserStats(JSON.parse(savedStats));
    };

    const loadProfile = () => {
      const savedProfile = localStorage.getItem('edumate_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
    };

    loadStats();
    loadProfile();
    
    const handleStorage = () => {
      loadStats();
      loadProfile();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const stats = [
    { label: 'কুইজ সম্পন্ন', value: userStats.quizzes, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'সমাধানকৃত ডাউট', value: userStats.doubts, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'পড়ার সময়', value: `${userStats.studyHours} ঘণ্টা`, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'ধারাবাহিকতা', value: `${userStats.streak} দিন`, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const features = [
    {
      id: 'quiz',
      title: 'এআই কুইজ জেনারেটর',
      desc: 'বইয়ের ছবি বা পিডিএফ থেকে কুইজ তৈরি করো।',
      icon: BookOpen,
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      id: 'doubt',
      title: 'ডাউট সলভার',
      desc: 'যেকোনো কঠিন সমস্যার সহজ সমাধান পাও।',
      icon: HelpCircle,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      id: 'battle',
      title: 'এডুমেট ব্যাটেল',
      desc: 'বন্ধুর সাথে কুইজ লড়াই করো এবং নিজেকে যাচাই করো।',
      icon: Swords,
      color: 'bg-rose-600',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
    {
      id: 'routine',
      title: 'রুটিন মেকার',
      desc: 'পরীক্ষার জন্য সেরা পড়ার রুটিন তৈরি করো।',
      icon: Calendar,
      color: 'bg-amber-600',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      id: 'wellness',
      title: 'ওয়েলনেস কাউন্সিলর',
      desc: 'মানসিক প্রশান্তি এবং পড়াশোনার পরামর্শ।',
      icon: HeartPulse,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  const getMotivation = () => {
    if (userStats.quizzes === 0 && userStats.doubts === 0) {
      return "আজ তোমার প্রথম কুইজ শুরু করো এবং শেখার যাত্রা শুরু করো!";
    }
    if (userStats.streak > 0) {
      return `অসাধারণ! তুমি ${userStats.streak} দিন ধরে নিয়মিত পড়াশোনা করছো।`;
    }
    return "সাফল্যের চাবিকাঠি হলো নিয়মিত অনুশীলন। চলো আজ নতুন কিছু শিখি!";
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">স্বাগতম! 👋</h1>
          <p className="text-slate-500 mt-2 text-lg">আজ তুমি নতুন কী শিখতে চাও?</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.name ? profile.name[0] : 'U'
            )}
          </div>
          <div className="pr-4">
            <p className="font-bold text-slate-900 leading-none">{profile.name}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">{profile.class}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className={`${stat.bg} ${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4`}>
              <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium">{stat.label}</p>
            <p className="text-lg md:text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {features.map((feature, i) => (
          <motion.button
            key={feature.id}
            onClick={() => setView(feature.id as AppView)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="group relative bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all text-left overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 ${feature.lightColor} rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 transition-transform group-hover:scale-150`} />
            
            <div className={`${feature.color} text-white w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 relative z-10 shadow-lg`}>
              <feature.icon className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>

            <div className={`mt-6 md:mt-8 flex items-center gap-2 font-bold ${feature.textColor} relative z-10`}>
              শুরু করো <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="flex-1 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 bg-white/10 rounded-full text-[10px] md:text-sm font-bold backdrop-blur-md">
              <Zap size={16} className="text-amber-400" /> আজকের লক্ষ্য
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{getMotivation()}</h2>
            <p className="text-slate-400 text-sm md:text-lg">তোমার পড়ার লক্ষ্য পূরণ করো এবং নিয়মিত থাকো।</p>
            <div className="w-full h-3 md:h-4 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userStats.quizzes / 5) * 100, 100)}%` }}
                className="h-full bg-indigo-500"
              />
            </div>
          </div>
          <button 
            onClick={() => setView('routine')}
            className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-white text-slate-900 rounded-xl md:rounded-2xl font-bold hover:bg-slate-100 transition-all shrink-0"
          >
            রুটিন দেখো
          </button>
        </div>
      </div>
    </div>
  );
};
