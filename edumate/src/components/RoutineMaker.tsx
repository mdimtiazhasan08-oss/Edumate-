import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Coffee,
  School,
  Briefcase,
  X
} from 'lucide-react';
import { generateRoutine } from '../services/ai';
import { UserRoutine, RoutineDay } from '../types';

interface RoutineMakerProps {
  onBack: () => void;
}

export const RoutineMaker: React.FC<RoutineMakerProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [routine, setRoutine] = useState<RoutineDay[] | null>(null);
  const [formData, setFormData] = useState<UserRoutine>({
    schoolTime: { start: '09:00', end: '15:00' },
    tuitionTime: [],
    freeTime: '2 hours',
    studyTime: '4 hours',
    subjects: [
      { name: 'গণিত', difficulty: 'hard' },
      { name: 'পদার্থবিজ্ঞান', difficulty: 'hard' },
      { name: 'ইংরেজি', difficulty: 'medium' }
    ],
    examDate: ''
  });

  const handleAddTuition = () => {
    setFormData(prev => ({
      ...prev,
      tuitionTime: [...prev.tuitionTime, { start: '17:00', end: '18:30' }]
    }));
  };

  const handleRemoveTuition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tuitionTime: prev.tuitionTime.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: '', difficulty: 'medium' }]
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await generateRoutine(formData);
      setRoutine(result);
    } catch (error) {
      console.error(error);
      alert('রুটিন তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    } finally {
      setIsLoading(false);
    }
  };

  if (routine) {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">তোমার সাপ্তাহিক রুটিন</h2>
            <p className="text-slate-500 mt-2">এআই দ্বারা তৈরি তোমার জন্য সেরা পড়ার রুটিন।</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setRoutine(null)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              নতুন তৈরি করো
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {routine.map((day, i) => (
            <motion.div 
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-600 p-4 text-white font-bold text-center">
                {day.day}
              </div>
              <div className="p-4 space-y-4">
                {day.tasks.map((task, idx) => {
                  const Icon = task.type === 'study' ? BookOpen : 
                               task.type === 'school' ? School :
                               task.type === 'tuition' ? Briefcase :
                               task.type === 'break' ? Coffee : Clock;
                  
                  const colors = task.type === 'study' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                task.type === 'school' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                task.type === 'tuition' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                task.type === 'break' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                'bg-slate-50 text-slate-700 border-slate-100';

                  return (
                    <div key={idx} className={`p-3 rounded-2xl border ${colors} flex items-start gap-3`}>
                      <div className="mt-1"><Icon size={18} /></div>
                      <div>
                        <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{task.time}</p>
                        <p className="font-bold text-sm leading-tight">{task.task}</p>
                        {task.subject && <p className="text-xs mt-1 font-medium opacity-80">বিষয়: {task.subject}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-slate-900">স্মার্ট রুটিন মেকার</h2>
          <p className="text-slate-500 mt-2">তোমার পড়ার সময় এবং বিষয় অনুযায়ী একটি পারফেক্ট রুটিন তৈরি করো।</p>
        </div>
        <button onClick={onBack} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === i ? 'bg-indigo-600 text-white' : 
                step > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i}
              </div>
              <span className={`text-sm font-bold hidden sm:block ${step === i ? 'text-slate-900' : 'text-slate-400'}`}>
                {i === 1 ? 'সময়সূচী' : i === 2 ? 'বিষয়সমূহ' : 'লক্ষ্য'}
              </span>
              {i < 3 && <div className="w-12 h-px bg-slate-100 mx-2" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">স্কুল শুরু</label>
                  <input 
                    type="time" 
                    value={formData.schoolTime.start}
                    onChange={(e) => setFormData(p => ({ ...p, schoolTime: { ...p.schoolTime, start: e.target.value } }))}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">স্কুল শেষ</label>
                  <input 
                    type="time" 
                    value={formData.schoolTime.end}
                    onChange={(e) => setFormData(p => ({ ...p, schoolTime: { ...p.schoolTime, end: e.target.value } }))}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">প্রাইভেট / কোচিং</label>
                  <button onClick={handleAddTuition} className="text-indigo-600 text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> নতুন যোগ করো
                  </button>
                </div>
                {formData.tuitionTime.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                    <input 
                      type="time" 
                      value={t.start}
                      onChange={(e) => {
                        const newT = [...formData.tuitionTime];
                        newT[i].start = e.target.value;
                        setFormData(p => ({ ...p, tuitionTime: newT }));
                      }}
                      className="flex-1 bg-white p-2 rounded-lg border-none text-sm"
                    />
                    <span className="text-slate-400">থেকে</span>
                    <input 
                      type="time" 
                      value={t.end}
                      onChange={(e) => {
                        const newT = [...formData.tuitionTime];
                        newT[i].end = e.target.value;
                        setFormData(p => ({ ...p, tuitionTime: newT }));
                      }}
                      className="flex-1 bg-white p-2 rounded-lg border-none text-sm"
                    />
                    <button onClick={() => handleRemoveTuition(i)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">বিষয় এবং কঠিনতা</label>
                <button onClick={handleAddSubject} className="text-indigo-600 text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> নতুন বিষয়
                </button>
              </div>
              <div className="space-y-3">
                {formData.subjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                    <input 
                      type="text" 
                      value={s.name}
                      placeholder="বিষয়ের নাম"
                      onChange={(e) => {
                        const newS = [...formData.subjects];
                        newS[i].name = e.target.value;
                        setFormData(p => ({ ...p, subjects: newS }));
                      }}
                      className="flex-1 bg-white p-3 rounded-xl border-none text-sm"
                    />
                    <select
                      value={s.difficulty}
                      onChange={(e) => {
                        const newS = [...formData.subjects];
                        newS[i].difficulty = e.target.value as any;
                        setFormData(p => ({ ...p, subjects: newS }));
                      }}
                      className="bg-white p-3 rounded-xl border-none text-sm font-medium"
                    >
                      <option value="easy">সহজ</option>
                      <option value="medium">মাঝারি</option>
                      <option value="hard">কঠিন</option>
                    </select>
                    <button onClick={() => handleRemoveSubject(i)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">প্রতিদিন পড়ার লক্ষ্য</label>
                <select 
                  value={formData.studyTime}
                  onChange={(e) => setFormData(p => ({ ...p, studyTime: e.target.value }))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="2 hours">২ ঘণ্টা</option>
                  <option value="4 hours">৪ ঘণ্টা</option>
                  <option value="6 hours">৬ ঘণ্টা</option>
                  <option value="8 hours">৮ ঘণ্টা</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">অবসর / বিনোদন</label>
                <select 
                  value={formData.freeTime}
                  onChange={(e) => setFormData(p => ({ ...p, freeTime: e.target.value }))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1 hour">১ ঘণ্টা</option>
                  <option value="2 hours">২ ঘণ্টা</option>
                  <option value="3 hours">৩ ঘণ্টা</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">পরীক্ষার তারিখ (ঐচ্ছিক)</label>
                <input 
                  type="date" 
                  value={formData.examDate}
                  onChange={(e) => setFormData(p => ({ ...p, examDate: e.target.value }))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 text-slate-500 font-bold flex items-center gap-2 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={20} /> পিছনে যাও
            </button>
          ) : <div />}

          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              পরবর্তী ধাপ <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'রুটিন তৈরি করো'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
