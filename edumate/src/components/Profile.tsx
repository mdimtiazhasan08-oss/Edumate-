import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, GraduationCap, Target, Save, ChevronLeft, Camera } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    class: '',
    goal: '',
    avatar: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('edumate_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('edumate_profile', JSON.stringify(profile));
    setIsSaved(true);
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          <ChevronLeft size={20} /> ফিরে যাও
        </button>
        <h2 className="text-2xl font-bold text-slate-900">আমার প্রোফাইল</h2>
        <div className="w-20" /> {/* Spacer */}
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8 md:p-12">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 border-4 border-white shadow-lg overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{profile.name || 'শিক্ষার্থী'}</h3>
          <p className="text-slate-500">{profile.class || 'শ্রেণী উল্লেখ করো'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User size={16} /> নাম
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="তোমার নাম লেখো"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={16} /> শ্রেণী/ব্যাচ
            </label>
            <input
              type="text"
              value={profile.class}
              onChange={(e) => setProfile({ ...profile, class: e.target.value })}
              placeholder="যেমন: এসএসসি ২০২৬"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target size={16} /> তোমার লক্ষ্য
            </label>
            <textarea
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              placeholder="তোমার ভবিষ্যৎ লক্ষ্য বা স্বপ্ন কি?"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-lg min-h-[120px] resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className={`
              w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3
              ${isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}
            `}
          >
            {isSaved ? (
              <>সেভ হয়েছে!</>
            ) : (
              <><Save size={24} /> প্রোফাইল সেভ করো</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
