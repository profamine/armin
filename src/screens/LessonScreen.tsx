import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Turtle,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Star,
  Trophy,
  Heart,
  Zap,
  RotateCcw,
  BookOpen,
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  Clock,
  Hash,
  type LucideIcon,
} from 'lucide-react';

// ===== Types =====
interface LessonStep {
  id: number;
  type: 'listen' | 'speak' | 'quiz' | 'match' | 'write';
  arabic: string;
  armenian: string;
  transliteration: string;
  hint?: string;
  hintIcon?: string;
  highlightIndex?: number;
  highlightChar?: string;
  audio?: string;
  options?: QuizOption[];
  meaning?: string;
}

interface QuizOption {
  text: string;
  correct: boolean;
}

interface LessonData {
  id: string;
  title: string;
  titleAr: string;
  steps: LessonStep[];
  xpReward: number;
}

// ===== Lesson Data =====
const lessonData: LessonData = {
  id: 'greetings-1',
  title: 'Ողջույններ - التحيات',
  titleAr: 'التحيات الأساسية',
  xpReward: 50,
  steps: [
    {
      id: 1,
      type: 'listen',
      arabic: 'السَّلَامُ عَلَيْكُم',
      armenian: 'Խաղաղություն ձեզ',
      transliteration: 'As-salāmu ʿalaykum',
      hint: 'Ուշադրություն դարձրեք ع տառին',
      highlightChar: 'عَـ',
      meaning: 'Խաղաղություն ձեզ (peace be upon you)',
    },
    {
      id: 2,
      type: 'speak',
      arabic: 'السَّلَامُ عَلَيْكُم',
      armenian: 'Խաղաղություն ձեզ',
      transliteration: 'As-salāmu ʿalaykum',
      hint: 'Արտասանեք հստակ և բարձրաձայն',
      meaning: 'Խաղաղություն ձեզ',
    },
    {
      id: 3,
      type: 'quiz',
      arabic: 'السَّلَامُ عَلَيْكُم',
      armenian: 'Խաղաղություն ձեզ',
      transliteration: 'As-salāmu ʿalaykum',
      meaning: 'Ի՞նչ է նշանակում «السَّلَامُ عَلَيْكُم»:',
      options: [
        { text: 'Բարի լույս', correct: false },
        { text: 'Խաղաղություն ձեզ', correct: true },
        { text: 'Շնորհակալություն', correct: false },
        { text: 'Ցտեսություն', correct: false },
      ],
    },
    {
      id: 4,
      type: 'listen',
      arabic: 'وَعَلَيْكُمُ السَّلَام',
      armenian: 'Եվ ձեզ խաղաղություն',
      transliteration: 'Wa ʿalaykumu s-salām',
      hint: 'Սկսվում է «و» (և) տառով',
      highlightChar: 'وَ',
      meaning: 'Եվ ձեզ խաղաղություն (and upon you peace)',
    },
    {
      id: 5,
      type: 'speak',
      arabic: 'وَعَلَيْكُمُ السَّلَام',
      armenian: 'Եվ ձեզ խաղաղություն',
      transliteration: 'Wa ʿalaykumu s-salām',
      hint: 'Պատասխանեք ողջույնին',
      meaning: 'Եվ ձեզ խաղաղություն',
    },
    {
      id: 6,
      type: 'quiz',
      arabic: 'مَرْحَبًا',
      armenian: 'Բարև',
      transliteration: 'Marḥaban',
      meaning: 'Ի՞նչ է նշանակում «مَرْحَبًا»:',
      options: [
        { text: 'Բարի գիշեր', correct: false },
        { text: 'Ինչպե՞ս ես', correct: false },
        { text: 'Բարև', correct: true },
        { text: 'Խնդրեմ', correct: false },
      ],
    },
    {
      id: 7,
      type: 'listen',
      arabic: 'كَيْفَ حَالُك',
      armenian: 'Ինչպե՞ս ես',
      transliteration: 'Kayfa ḥāluk',
      hint: 'ح տառը արտասանվում է կոկորդից',
      highlightChar: 'حَـ',
      meaning: 'Ինչպե՞ս ես (How are you?)',
    },
    {
      id: 8,
      type: 'speak',
      arabic: 'كَيْفَ حَالُك',
      armenian: 'Ինչպե՞ս ես',
      transliteration: 'Kayfa ḥāluk',
      hint: 'Հարցրեք «ك» և «ف» տառերով',
      meaning: 'Ինչպե՞ս ես',
    },
  ],
};

// ===== Sound Effects (simulated) =====
const playSound = (type: 'correct' | 'wrong' | 'complete' | 'click' | 'speak') => {
  // In a real app, play actual sounds
  if ('vibrate' in navigator) {
    switch (type) {
      case 'correct':
        navigator.vibrate(50);
        break;
      case 'wrong':
        navigator.vibrate([100, 50, 100]);
        break;
      case 'complete':
        navigator.vibrate([50, 30, 50, 30, 50]);
        break;
      default:
        navigator.vibrate(20);
    }
  }
};

// ===== Animated Counter Component =====
function AnimatedCounter({ value, duration = 500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = display;
    const increment = (value - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
}

// ===== Circular Progress Component =====
function CircularProgress({ progress, size = 40, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ===== Particle Effect Component =====
function ParticleExplosion({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * 360;
        const distance = 60 + Math.random() * 100;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const colors = ['🌟', '⭐', '✨', '💫', '🎉', '🎊'];
        const emoji = colors[Math.floor(Math.random() * colors.length)];
        const size = 14 + Math.random() * 16;
        const duration = 0.6 + Math.random() * 0.5;

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 animate-ping"
            style={{
              fontSize: size,
              transform: `translate(${x}px, ${y}px)`,
              animation: `particleFly ${duration}s ease-out forwards`,
              opacity: 0,
            }}
          >
            {emoji}
          </div>
        );
      })}
      <style>{`
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(var(--tx, 50px), var(--ty, -50px)) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ===== Hearts Display =====
function HeartsDisplay({ lives, maxLives = 3 }: { lives: number; maxLives?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLives }).map((_, i) => (
        <Heart
          key={i}
          size={18}
          className={`transition-all duration-300 ${
            i < lives ? 'text-red-500 fill-red-500 scale-100' : 'text-gray-300 scale-90'
          } ${i === lives ? 'animate-pulse' : ''}`}
        />
      ))}
    </div>
  );
}

// ===== Waveform Animation =====
function WaveformAnimation({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            active ? 'bg-gradient-to-t from-red-500 to-red-300' : 'bg-gray-300'
          }`}
          style={{
            height: active ? `${20 + Math.random() * 40}px` : '8px',
            animation: active ? `wave 0.5s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0% { height: 8px; }
          100% { height: ${20 + Math.random() * 40}px; }
        }
      `}</style>
    </div>
  );
}

// ===== Completion Screen =====
function CompletionScreen({
  xpEarned,
  accuracy,
  onContinue,
}: {
  xpEarned: number;
  accuracy: number;
  onContinue: () => void;
}) {
  const [showStars, setShowStars] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const starCount = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowStars(1), 400),
      setTimeout(() => setShowStars(2), 800),
      setTimeout(() => setShowStars(3), 1200),
      setTimeout(() => setShowXP(true), 1600),
      setTimeout(() => setCelebrate(true), 500),
    ];
    playSound('complete');
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-600 z-50 flex flex-col items-center justify-center p-6">
      <ParticleExplosion active={celebrate} />

      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Trophy */}
        <div className="relative">
          <div className="w-28 h-28 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-yellow-300/30">
            <Trophy size={56} className="text-yellow-300 drop-shadow-lg" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={28} className="text-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-md">
            Գերազանց է!
          </h1>
          <p className="text-emerald-100 text-lg">Դուք ավարտեցիք դասը</p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                i <= showStars
                  ? 'scale-100 opacity-100'
                  : 'scale-0 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <Star
                size={i === 2 ? 56 : 44}
                className={`${
                  i <= starCount
                    ? 'text-yellow-300 fill-yellow-300 drop-shadow-lg'
                    : 'text-white/30'
                } ${i === 2 ? '-mt-4' : ''}`}
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        {showXP && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 space-y-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Zap size={20} className="text-yellow-300" />
                  <span className="font-medium">XP վաստակած</span>
                </div>
                <span className="text-2xl font-black text-yellow-300">
                  +<AnimatedCounter value={xpEarned} />
                </span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Target size={20} className="text-emerald-300" />
                  <span className="font-medium">Ճշգրտություն</span>
                </div>
                <span className="text-2xl font-black text-emerald-300">
                  <AnimatedCounter value={accuracy} />%
                </span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Clock size={20} className="text-blue-300" />
                  <span className="font-medium">Ժամանակ</span>
                </div>
                <span className="text-lg font-bold text-blue-300">2:34</span>
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all active:scale-98 shadow-xl shadow-black/10"
            >
              Շարունակել
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Main Lesson Screen =====
export default function LessonScreen({ onBack, lessonId }: { onBack: () => void; lessonId: string | null }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<'excellent' | 'good' | 'poor' | null>(null);
  const [lives, setLives] = useState(3);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);

  const steps = lessonData.steps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handlePlayAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playSound('click');

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(step.arabic);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const handlePlaySlow = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playSound('click');

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(step.arabic);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.4;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handleRecord = () => {
    if (recording) {
      setRecording(false);
      playSound('click');

      setTimeout(() => {
        const rand = Math.random();
        if (rand > 0.5) {
          setFeedback('excellent');
          setXp((prev) => prev + 15);
          setStreak((prev) => prev + 1);
          setCorrectAnswers((prev) => prev + 1);
          playSound('correct');
          if (streak > 0 && (streak + 1) % 3 === 0) {
            setShowStreakBonus(true);
            setXp((prev) => prev + 5);
            setTimeout(() => setShowStreakBonus(false), 2000);
          }
        } else if (rand > 0.25) {
          setFeedback('good');
          setXp((prev) => prev + 8);
          setCorrectAnswers((prev) => prev + 1);
          playSound('correct');
        } else {
          setFeedback('poor');
          setStreak(0);
          playSound('wrong');
          setShakeWrong(true);
          setTimeout(() => setShakeWrong(false), 500);
        }
        setTotalAnswered((prev) => prev + 1);
      }, 1200);
    } else {
      setRecording(true);
      setFeedback(null);
      playSound('speak');
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (quizAnswered) return;
    setSelectedAnswer(index);
    setQuizAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    const isCorrect = step.options![index].correct;
    if (isCorrect) {
      setXp((prev) => prev + 10);
      setStreak((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      playSound('correct');
      if (streak > 0 && (streak + 1) % 3 === 0) {
        setShowStreakBonus(true);
        setXp((prev) => prev + 5);
        setTimeout(() => setShowStreakBonus(false), 2000);
      }
    } else {
      setLives((prev) => Math.max(0, prev - 1));
      setStreak(0);
      playSound('wrong');
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setFeedback(null);
      setSelectedAnswer(null);
      setQuizAnswered(false);
      setShowHint(false);
      setRecording(false);
      playSound('click');
    } else {
      setShowCompletion(true);
    }
  };

  const handleExit = () => {
    if (currentStep > 0) {
      setExitConfirm(true);
    } else {
      onBack();
    }
  };

  const canProceed =
    step.type === 'listen' ||
    feedback === 'excellent' ||
    feedback === 'good' ||
    (step.type === 'quiz' && quizAnswered && step.options![selectedAnswer!]?.correct);

  if (showCompletion) {
    return (
      <CompletionScreen
        xpEarned={xp}
        accuracy={totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 100}
        onContinue={onBack}
      />
    );
  }

  if (lives === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-red-500 to-red-700 z-50 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-400/30 rounded-full flex items-center justify-center mx-auto">
            <Heart size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Կյանքերը սպառվեցին!</h1>
          <p className="text-red-100 text-lg">Մի անհանգստացեք, փորձեք նորից</p>
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                setLives(3);
                setCurrentStep(0);
                setXp(0);
                setStreak(0);
                setCorrectAnswers(0);
                setTotalAnswered(0);
                setFeedback(null);
                setSelectedAnswer(null);
                setQuizAnswered(false);
              }}
              className="w-full py-4 bg-white text-red-600 rounded-2xl font-bold text-lg"
            >
              <RotateCcw size={20} className="inline mr-2" />
              Փորձել նորից
            </button>
            <button onClick={onBack} className="w-full py-4 bg-red-600/50 text-white rounded-2xl font-bold text-lg border border-red-400/30">
              Վերադառնալ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-gray-50 max-w-lg mx-auto relative overflow-hidden">
      {/* Exit Confirmation Modal */}
      {exitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Իսկապե՞ս ուզում եք դուրս գալ:</h3>
              <p className="text-gray-500 text-sm">Ձեր առաջընթացը կկորչի, եթե հիմա դուրս գաք</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  Մնալ
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Դուրս գալ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Bonus Popup */}
      {showStreakBonus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold">
            <Zap size={20} className="text-yellow-200" />
            Streak Bonus! +5 XP
            <Sparkles size={16} className="text-yellow-200" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={22} />
          </button>

          {/* Progress Bar */}
          <div className="flex-1 relative">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400 font-medium">
                {currentStep + 1}/{steps.length}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Lives */}
          <HeartsDisplay lives={lives} />

          {/* XP */}
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-amber-700">
              <AnimatedCounter value={xp} />
            </span>
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 2 && (
          <div className="mt-2 flex justify-center">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in duration-300">
              <Zap size={12} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-700">{streak} Streak! 🔥</span>
            </div>
          </div>
        )}
      </div>

      {/* Step Type Badge */}
      <div className="flex justify-center pt-5 pb-2">
        <div
          className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm ${
            step.type === 'listen'
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : step.type === 'speak'
              ? 'bg-purple-50 text-purple-600 border border-purple-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}
        >
          {step.type === 'listen' && <Volume2 size={16} />}
          {step.type === 'speak' && <Mic size={16} />}
          {step.type === 'quiz' && <BookOpen size={16} />}
          {step.type === 'listen' && 'Լսել և սովորել'}
          {step.type === 'speak' && 'Խոսել'}
          {step.type === 'quiz' && 'Թեստ'}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col px-6 overflow-y-auto ${shakeWrong ? 'animate-shake' : ''}`}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out 2;
          }
        `}</style>

        {/* Instruction */}
        <h2 className="text-lg font-bold text-gray-800 text-center mt-4">
          {step.type === 'listen' && 'Լսեք և կարդացեք'}
          {step.type === 'speak' && 'Արտասանեք այս նախադասությունը'}
          {step.type === 'quiz' && step.meaning}
        </h2>

        {/* Arabic Text Display */}
        {(step.type === 'listen' || step.type === 'speak') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-6">
            {/* Arabic Word Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 w-full text-center">
              <div className="text-5xl font-arabic leading-loose text-gray-900 mb-4" dir="rtl">
                {step.highlightChar
                  ? step.arabic.split('').map((char, i) => {
                      if (step.arabic.substring(i).startsWith(step.highlightChar!)) {
                        return (
                          <span key={i} className="text-red-500 font-bold relative">
                            {char}
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
                          </span>
                        );
                      }
                      return <span key={i}>{char}</span>;
                    })
                  : step.arabic}
              </div>

              {/* Transliteration */}
              {showTransliteration && (
                <p className="text-base text-gray-400 font-mono mb-2">{step.transliteration}</p>
              )}

              {/* Armenian meaning */}
              <p className="text-sm text-gray-500">{step.armenian}</p>

              {/* Toggle transliteration */}
              <button
                onClick={() => setShowTransliteration(!showTransliteration)}
                className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mx-auto transition-colors"
              >
                {showTransliteration ? <EyeOff size={14} /> : <Eye size={14} />}
                {showTransliteration ? 'Թաքցնել տառադարձությունը' : 'Ցույց տալ տառադարձությունը'}
              </button>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-5">
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isPlaying
                    ? 'bg-blue-400 scale-95'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-blue-200'
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-5 bg-white rounded-full animate-pulse" />
                    <div className="w-1 h-7 bg-white rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                ) : (
                  <Play size={30} fill="white" className="text-white ml-1" />
                )}
              </button>
              <button
                onClick={handlePlaySlow}
                disabled={isPlaying}
                className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
                title="Slow"
              >
                <Turtle size={22} />
              </button>
            </div>

            {/* Hint */}
            {step.hint && (
              <div className="w-full">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mx-auto transition-colors"
                >
                  <Lightbulb size={16} />
                  {showHint ? 'Թաքցնել հուշումը' : 'Ցույց տալ հուշումը'}
                </button>
                {showHint && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
                      <Lightbulb size={16} className="text-amber-500 flex-shrink-0" />
                      {step.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recording waveform (for speak step) */}
            {step.type === 'speak' && recording && <WaveformAnimation active={recording} />}
          </div>
        )}

        {/* Quiz Content */}
        {step.type === 'quiz' && step.options && (
          <div className="flex-1 flex flex-col justify-center py-6 space-y-4">
            {/* Arabic word being quizzed */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center mb-4">
              <p className="text-4xl font-arabic text-gray-900" dir="rtl">
                {step.arabic}
              </p>
              <p className="text-sm text-gray-400 mt-2 font-mono">{step.transliteration}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {step.options.map((option, idx) => {
                let optionStyle = 'bg-white border-gray-200 text-gray-800 hover:border-emerald-300 hover:bg-emerald-50';

                if (quizAnswered) {
                  if (option.correct) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200';
                  } else if (idx === selectedAnswer && !option.correct) {
                    optionStyle = 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-200';
                  } else {
                    optionStyle = 'bg-gray-50 border-gray-200 text-gray-400';
                  }
                } else if (idx === selectedAnswer) {
                  optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    disabled={quizAnswered}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all duration-300 flex items-center gap-3 ${optionStyle} ${
                      !quizAnswered ? 'active:scale-[0.98]' : ''
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {String.fromCharCode(1329 + idx)}
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {quizAnswered && option.correct && <CheckCircle size={22} className="text-emerald-500 flex-shrink-0" />}
                    {quizAnswered && idx === selectedAnswer && !option.correct && (
                      <AlertCircle size={22} className="text-red-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Area */}
        <div className="py-4">
          {feedback === 'excellent' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-800">Գերազանց է! 🌟</p>
                <p className="text-xs text-emerald-600 mt-0.5">Շատ լավ արտասանություն +15 XP</p>
              </div>
            </div>
          )}
          {feedback === 'good' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-amber-800">Լավ է! 👍</p>
                <p className="text-xs text-amber-600 mt-0.5">Կարող եք ավելի լավ +8 XP</p>
              </div>
            </div>
          )}
          {feedback === 'poor' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle size={22} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-800">Փորձեք նորից 💪</p>
                <p className="text-xs text-red-600 mt-0.5">Արտասանությունը պարզ չէր</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-4 pb-6 space-y-3">
        {/* Record button for speak steps */}
        {step.type === 'speak' && (
          <div className="flex justify-center pb-2">
            <button
              onClick={handleRecord}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                recording
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white scale-110 ring-4 ring-red-200 animate-pulse'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95 shadow-purple-200'
              }`}
            >
              {recording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>
        )}

        {/* Next / Continue button */}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            canProceed
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentStep < steps.length - 1 ? (
            <>
              Շարունակել
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              Ավարտել դասը
              <Trophy size={20} />
            </>
          )}
        </button>

        {/* Skip for listen steps */}
        {step.type === 'listen' && (
          <button
            onClick={handleNext}
            className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            Բաց թողնել →
          </button>
        )}
      </div>
    </div>
  );
}