/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import BottomNav from './components/BottomNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'profile' | 'chat';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const navigateToLesson = useCallback((lessonId: string) => {
    setActiveLesson(lessonId);
    setCurrentScreen('lesson');
  }, []);

  const goBack = useCallback(() => {
    setActiveLesson(null);
    setCurrentScreen('home');
  }, []);

  const showNav = currentScreen !== 'lesson';

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative sm:border-x sm:border-gray-200">
      {currentScreen === 'home'    && <HomeScreen onStartLesson={navigateToLesson} />}
      {currentScreen === 'lesson'  && <LessonScreen onBack={goBack} lessonId={activeLesson} />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'chat'    && <ChatScreen />}

      {showNav && (
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}
    </div>
  );
}