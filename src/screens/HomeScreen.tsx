import React, { useState } from 'react';
import { Star, Lock, Check, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AboutModal from '../components/AboutModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeStatus = 'completed' | 'current' | 'locked';

interface LessonNodeProps {
  title: string;
  status: NodeStatus;
  onClick: () => void;
  isRight?: boolean;
  color?: UnitColor;
}

interface UnitSectionProps {
  title: string;
  subtitle: string;
  progress: string;
  color: UnitColor;
  children: React.ReactNode;
}

type UnitColor = 'green' | 'blue' | 'purple' | 'orange';

// ─── Color Maps ───────────────────────────────────────────────────────────────

const COLOR_MAP: Record<
  UnitColor,
  {
    header: string;
    headerBorder: string;
    headerText: string;
    nodeBg: string;
    nodeShadow: string;
    currentRing: string;
    currentText: string;
    progressBadge: string;
    progressText: string;
    pathDone: string;
  }
> = {
  green: {
    header: 'bg-green-50 border-green-200',
    headerBorder: 'border-l-4 border-l-green-500',
    headerText: 'text-green-700',
    nodeBg: 'bg-green-500',
    nodeShadow: 'shadow-[0_4px_0_#15803d]',
    currentRing: 'ring-4 ring-green-200 border-green-500',
    currentText: 'text-green-500',
    progressBadge: 'bg-green-100 text-green-700',
    progressText: 'text-green-600',
    pathDone: 'bg-green-400',
  },
  blue: {
    header: 'bg-blue-50 border-blue-200',
    headerBorder: 'border-l-4 border-l-blue-500',
    headerText: 'text-blue-700',
    nodeBg: 'bg-blue-500',
    nodeShadow: 'shadow-[0_4px_0_#1d4ed8]',
    currentRing: 'ring-4 ring-blue-200 border-blue-500',
    currentText: 'text-blue-500',
    progressBadge: 'bg-blue-100 text-blue-700',
    progressText: 'text-blue-600',
    pathDone: 'bg-blue-400',
  },
  purple: {
    header: 'bg-purple-50 border-purple-200',
    headerBorder: 'border-l-4 border-l-purple-500',
    headerText: 'text-purple-700',
    nodeBg: 'bg-purple-500',
    nodeShadow: 'shadow-[0_4px_0_#7e22ce]',
    currentRing: 'ring-4 ring-purple-200 border-purple-500',
    currentText: 'text-purple-500',
    progressBadge: 'bg-purple-100 text-purple-700',
    progressText: 'text-purple-600',
    pathDone: 'bg-purple-400',
  },
  orange: {
    header: 'bg-orange-50 border-orange-200',
    headerBorder: 'border-l-4 border-l-orange-500',
    headerText: 'text-orange-700',
    nodeBg: 'bg-orange-500',
    nodeShadow: 'shadow-[0_4px_0_#c2410c]',
    currentRing: 'ring-4 ring-orange-200 border-orange-500',
    currentText: 'text-orange-500',
    progressBadge: 'bg-orange-100 text-orange-700',
    progressText: 'text-orange-600',
    pathDone: 'bg-orange-400',
  },
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({
  onStartLesson,
}: {
  onStartLesson: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 relative">
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      
      {/* ── Header ── */}
      <div className="bg-green-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('home.title')}</h1>
              <p className="text-green-200 text-sm mt-0.5">{t('home.subtitle')}</p>
            </div>
            <button 
              onClick={() => setShowAboutModal(true)}
              className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="About the App"
            >
              <HelpCircle size={18} className="text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* XP pill */}
            <div className="bg-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-yellow-300">⚡</span>
              <span>240 XP</span>
            </div>
            {/* Streak pill */}
            <div className="bg-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-orange-300">🔥</span>
              <span>14</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: '28%' }}
          />
        </div>
        <p className="text-green-200 text-xs mt-1.5">{t('home.lessons_completed')}</p>
      </div>

      <div className="p-5 space-y-8">
        {/* ── Unit 1 ── */}
        <UnitSection
          title={t('home.unit1.title')}
          subtitle={t('home.unit1.subtitle')}
          progress="1/1"
          color="green"
        >
          <LessonNode title={t('home.node.u1')} status="completed" onClick={() => onStartLesson('u1')} color="green" />
        </UnitSection>

        {/* ── Unit 2 ── */}
        <UnitSection
          title={t('home.unit2.title')}
          subtitle={t('home.unit2.subtitle')}
          progress="1/1"
          color="blue"
        >
          <LessonNode title={t('home.node.u2')} status="completed" onClick={() => onStartLesson('u2')} isRight color="blue" />
        </UnitSection>

        {/* ── Unit 3 ── */}
        <UnitSection
          title={t('home.unit3.title')}
          subtitle={t('home.unit3.subtitle')}
          progress="0/1"
          color="purple"
        >
          <LessonNode
            title={t('home.node.u3')}
            status="current"
            onClick={() => onStartLesson('u3')}
            color="purple"
          />
        </UnitSection>

        {/* ── Unit 4 ── */}
        <UnitSection
          title={t('home.unit4.title')}
          subtitle={t('home.unit4.subtitle')}
          progress="0/1"
          color="orange"
        >
          <LessonNode title={t('home.node.u4')} status="locked" onClick={() => onStartLesson('u4')} isRight color="orange" />
        </UnitSection>

        {/* ── Unit 5 ── */}
        <UnitSection
          title={t('home.unit5.title')}
          subtitle={t('home.unit5.subtitle')}
          progress="0/1"
          color="green"
        >
          <LessonNode title={t('home.node.u5')} status="locked" onClick={() => onStartLesson('u5')} color="green" />
        </UnitSection>

        {/* ── Unit 6 ── */}
        <UnitSection
          title={t('home.unit6.title')}
          subtitle={t('home.unit6.subtitle')}
          progress="0/1"
          color="blue"
        >
          <LessonNode title={t('home.node.u6')} status="locked" onClick={() => onStartLesson('u6')} isRight color="blue" />
        </UnitSection>

        {/* ── Unit 7 ── */}
        <UnitSection
          title={t('home.unit7.title')}
          subtitle={t('home.unit7.subtitle')}
          progress="0/1"
          color="purple"
        >
          <LessonNode title={t('home.node.u7')} status="locked" onClick={() => onStartLesson('u7')} color="purple" />
        </UnitSection>

        {/* ── Unit 8 ── */}
        <UnitSection
          title={t('home.unit8.title')}
          subtitle={t('home.unit8.subtitle')}
          progress="0/1"
          color="orange"
        >
          <LessonNode title={t('home.node.u8')} status="locked" onClick={() => onStartLesson('u8')} isRight color="orange" />
        </UnitSection>

        {/* ── Unit 9 ── */}
        <UnitSection
          title={t('home.unit9.title')}
          subtitle={t('home.unit9.subtitle')}
          progress="0/1"
          color="green"
        >
          <LessonNode title={t('home.node.u9')} status="locked" onClick={() => onStartLesson('u9')} color="green" />
        </UnitSection>

        {/* ── Unit 10 ── */}
        <UnitSection
          title={t('home.unit10.title')}
          subtitle={t('home.unit10.subtitle')}
          progress="0/1"
          color="blue"
        >
          <LessonNode title={t('home.node.u10')} status="locked" onClick={() => onStartLesson('u10')} isRight color="blue" />
        </UnitSection>

        {/* ── Unit 11 ── */}
        <UnitSection
          title={t('home.unit11.title')}
          subtitle={t('home.unit11.subtitle')}
          progress="0/1"
          color="purple"
        >
          <LessonNode title={t('home.node.u11')} status="locked" onClick={() => onStartLesson('u11')} color="purple" />
        </UnitSection>

        {/* ── Unit 12 ── */}
        <UnitSection
          title={t('home.unit12.title')}
          subtitle={t('home.unit12.subtitle')}
          progress="0/1"
          color="orange"
        >
          <LessonNode title={t('home.node.u12')} status="locked" onClick={() => onStartLesson('u12')} isRight color="orange" />
        </UnitSection>
      </div>
    </div>
  );
}

// ─── UnitSection ──────────────────────────────────────────────────────────────

function UnitSection({ title, subtitle, progress, color, children }: UnitSectionProps) {
  const { t } = useLanguage();
  const theme = COLOR_MAP[color];
  const [done, total] = progress.split('/').map(Number);
  const isComplete = done === total;

  return (
    <div>
      {/* Section header card */}
      <div
        className={`rounded-2xl border px-4 py-3 mb-5 ${theme.header} ${theme.headerBorder}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-bold ${theme.headerText}`}>{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="text-xs bg-white border border-green-300 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                ✓ {t('home.completed')}
              </span>
            )}
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${theme.progressBadge}`}
            >
              {progress}
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-2 bg-white/60 rounded-full h-1.5">
          <div
            className={`${theme.nodeBg} rounded-full h-1.5 transition-all duration-700`}
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Zigzag path */}
      <div className="relative flex flex-col items-center gap-7">
        {/* Vertical guide line */}
        <div className="absolute top-8 bottom-8 w-1.5 bg-gray-200 rounded-full -z-10" />

        {React.Children.map(children, (child) => child)}
      </div>
    </div>
  );
}

// ─── LessonNode ───────────────────────────────────────────────────────────────

function LessonNode({
  title,
  status,
  onClick,
  isRight = false,
  color = 'green',
}: LessonNodeProps) {
  const { t } = useLanguage();
  const theme = COLOR_MAP[color];

  // Button appearance
  const buttonClass = (() => {
    switch (status) {
      case 'completed':
        return `${theme.nodeBg} ${theme.nodeShadow} text-white active:shadow-none active:translate-y-1`;
      case 'current':
        return `bg-white border-2 ${theme.currentRing} ${theme.currentText} animate-bounce`;
      case 'locked':
        return 'bg-gray-200 text-gray-400 shadow-[0_4px_0_#d1d5db] cursor-not-allowed';
    }
  })();

  const icon = (() => {
    switch (status) {
      case 'completed':
        return <Check strokeWidth={3} size={26} />;
      case 'current':
        return <Star fill="currentColor" size={26} />;
      case 'locked':
        return <Lock size={20} />;
    }
  })();

  return (
    <div
      className={`relative flex items-center w-full ${
        isRight ? 'justify-end pr-[15%]' : 'justify-start pl-[15%]'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={status !== 'locked' ? onClick : undefined}
          disabled={status === 'locked'}
          aria-label={`${title} – ${status}`}
          className={`
            w-[60px] h-[60px] rounded-full flex items-center justify-center
            transition-transform duration-150
            hover:scale-105 active:scale-95
            ${buttonClass}
          `}
          style={status === 'current' ? { animationDuration: '2.5s' } : undefined}
        >
          {icon}
        </button>

        <span
          className={`text-[11px] font-bold text-center leading-tight max-w-[80px] ${
            status === 'locked' ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {title}
        </span>

        {/* "START" badge on current node */}
        {status === 'current' && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${theme.progressBadge}`}
          >
            {t('home.start')}
          </span>
        )}
      </div>
    </div>
  );
}