import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  HelpCircle, 
  HeartPulse, 
  Menu, 
  X,
  GraduationCap,
  Swords,
  UserCircle
} from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [profile, setProfile] = React.useState({ name: 'শিক্ষার্থী', avatar: '' });

  React.useEffect(() => {
    const updateProgress = () => {
      const saved = localStorage.getItem('edumate_stats');
      if (saved) {
        const stats = JSON.parse(saved);
        const calculated = Math.min((stats.quizzes * 20) + (stats.doubts * 10), 100);
        setProgress(calculated);
      }
    };

    const loadProfile = () => {
      const savedProfile = localStorage.getItem('edumate_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
    };

    updateProgress();
    loadProfile();
    window.addEventListener('storage', () => {
      updateProgress();
      loadProfile();
    });
    const interval = setInterval(updateProgress, 2000);
    return () => {
      window.removeEventListener('storage', updateProgress);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'quiz', label: 'এআই কুইজ', icon: BookOpen },
    { id: 'battle', label: 'ব্যাটেল', icon: Swords },
    { id: 'routine', label: 'রুটিন মেকার', icon: Calendar },
    { id: 'doubt', label: 'ডাউট সলভার', icon: HelpCircle },
    { id: 'wellness', label: 'ওয়েলনেস', icon: HeartPulse },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">এডুমেট</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden border border-slate-200">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={20} />
            )}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col p-6">
            <div className="hidden lg:flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">এডুমেট</span>
              </div>
              <button 
                onClick={() => setView('profile')}
                className={`w-10 h-10 rounded-xl transition-all overflow-hidden border-2 ${currentView === 'profile' ? 'border-indigo-600' : 'border-transparent hover:border-slate-200'}`}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserCircle size={24} />
                  </div>
                )}
              </button>
            </div>

            <nav className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id as AppView);
                      setIsMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">তোমার উন্নতি</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">সাপ্তাহিক লক্ষ্য</span>
                  <span className="text-sm font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};
