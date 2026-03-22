import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QuizGenerator } from './components/QuizGenerator';
import { RoutineMaker } from './components/RoutineMaker';
import { DoubtSolver } from './components/DoubtSolver';
import { WellnessDoctor } from './components/WellnessDoctor';
import { Battle } from './components/Battle';
import { Profile } from './components/Profile';
import { AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [initialBattleId, setInitialBattleId] = useState<string | null>(null);

  // Study Time and Streak Tracking
  useEffect(() => {
    // Check for battle ID in URL (both query param and hash for compatibility)
    const url = new URL(window.location.href);
    let battleId = url.searchParams.get('battle');
    
    // Check hash if not in query params
    if (!battleId && url.hash.startsWith('#battle=')) {
      battleId = url.hash.split('=')[1];
    }

    if (battleId) {
      setInitialBattleId(battleId);
      setCurrentView('battle');
      
      // Clean up URL without reload to prevent "Page Not Found" on refresh
      // Use replaceState with just the origin and pathname
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }

    // 1. Streak Tracking
    const lastVisit = localStorage.getItem('edumate_last_visit');
    const today = new Date().toDateString();
    const statsStr = localStorage.getItem('edumate_stats');
    let stats = statsStr ? JSON.parse(statsStr) : { quizzes: 0, doubts: 0, studyHours: 0, streak: 0 };

    if (lastVisit !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastVisit === yesterday.toDateString()) {
        stats.streak += 1;
      } else if (!lastVisit) {
        stats.streak = 1;
      } else {
        stats.streak = 1; // Reset if missed a day
      }
      localStorage.setItem('edumate_last_visit', today);
      localStorage.setItem('edumate_stats', JSON.stringify(stats));
    }

    // 2. Study Time Tracking (updates every 10 seconds for better feedback)
    const timer = setInterval(() => {
      const currentStatsStr = localStorage.getItem('edumate_stats');
      let currentStats = currentStatsStr ? JSON.parse(currentStatsStr) : { quizzes: 0, doubts: 0, studyHours: 0, streak: 0 };
      
      // Add 10 seconds (10/3600 of an hour)
      currentStats.studyHours = parseFloat((currentStats.studyHours + (10/3600)).toFixed(4));
      localStorage.setItem('edumate_stats', JSON.stringify(currentStats));
      
      // Trigger a storage event for Dashboard to update
      window.dispatchEvent(new Event('storage'));
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const renderView = () => {
    const onBack = () => setCurrentView('dashboard');
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={setCurrentView} />;
      case 'quiz':
        return <QuizGenerator onBack={onBack} />;
      case 'battle':
        return (
          <Battle 
            onBack={() => {
              setInitialBattleId(null);
              onBack();
            }} 
            initialSessionId={initialBattleId || undefined} 
          />
        );
      case 'routine':
        return <RoutineMaker onBack={onBack} />;
      case 'doubt':
        return <DoubtSolver onBack={onBack} />;
      case 'wellness':
        return <WellnessDoctor onBack={onBack} />;
      case 'profile':
        return <Profile onBack={onBack} />;
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
