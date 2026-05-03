/**
 * SpeechSetupScreen — شاشة إعداد الصوت
 * - Demande explicitement Google Speech comme moteur TTS
 * - Test audio réel (lecture d'un mot arabe)
 * - Test microphone avec visualisation du niveau sonore en temps réel
 * - Bloque la progression jusqu'à confirmation des deux tests
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2, Mic, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Settings, Waves,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onDone: () => void;
}

type StepId    = 'audio' | 'micro' | 'done';
type TestState = 'idle' | 'testing' | 'ok' | 'fail';
type Platform  = 'android' | 'ios' | 'desktop';

// ─── Détection de la plateforme ──────────────────────────────────────────────
function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua))              return 'android';
  if (/iPhone|iPad|iPod/i.test(ua))     return 'ios';
  return 'desktop';
}

// ─── Traductions ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'إعداد الصوت والميكروفون',
    subtitle: 'خطوتان قبل البدء',
    stepAudio: 'الصوت',
    stepMic: 'الميكروفون',
    stepDone: 'جاهز',

    // Étape 1 - Audio
    audioTitle: '🔊 اختبار الصوت',
    audioDesc: 'يستخدم التطبيق Google Text-to-Speech لقراءة الكلمات العربية. يجب تثبيت حزمة الصوت العربي من Google.',
    googleRequired: 'محرك Google مطلوب',
    googleRequiredDesc: 'تأكد من اختيار Google Text-to-Speech كمحرك افتراضي في إعدادات جهازك.',
    testAudioBtn: '▶ اختبر الصوت الآن',
    testingAudio: 'جارٍ تشغيل الصوت…',
    audioOk: '✓ الصوت يعمل بشكل صحيح',
    audioFail: '✗ لم يُسمع صوت',
    retryBtn: 'أعد الاختبار',
    audioRequired: 'يجب أن يعمل الصوت للمتابعة.',
    audioSkipWarning: 'بدون صوت، لن تتمكن من سماع النطق العربي الصحيح.',
    continueAnyway: 'متابعة رغم ذلك',
    nextBtn: 'التالي',

    guideAndroid: [
      '① الإعدادات → إمكانية الوصول → تحويل النص إلى كلام',
      '② اختر "Google Text-to-Speech" كمحرك مفضّل',
      '③ اضغط ⚙️ → "تثبيت بيانات الصوت" → العربية',
      '④ انتظر اكتمال التنزيل ثم أعد الاختبار',
    ],
    guideIos: [
      '① الإعدادات → إمكانية الوصول → المحتوى المنطوق',
      '② اضغط "الأصوات" → اختر "العربية"',
      '③ حمّل أي صوت عربي (يوصى بـ Maged أو Tarik)',
      '④ ارجع وأعد الاختبار',
    ],
    guideDesktop: [
      '① تأكد من رفع مستوى الصوت في جهازك',
      '② استخدم Chrome أو Edge للحصول على أفضل دعم للعربية',
      '③ تحقق من إعدادات الصوت في المتصفح (لا صامت)',
    ],

    // Étape 2 - Micro
    micTitle: '🎙️ اختبار الميكروفون',
    micDesc: 'بعض التمارين تطلب منك النطق بصوت عالٍ. التطبيق يحتاج إذن الوصول إلى الميكروفون.',
    micPermBtn: 'السماح بالوصول إلى الميكروفون',
    micTestBtn: '🎙️ ابدأ اختبار الصوت (5 ثوانٍ)',
    micTesting: 'استمر في الكلام…',
    micOk: '✓ الميكروفون يعمل بشكل صحيح',
    micFail: '✗ تم رفض الإذن أو حدث خطأ',
    micNoSignal: '✗ لم يُرصد أي صوت — تحقق من الميكروفون',
    micFailGuide: 'افتح إعدادات المتصفح وامنح إذن الميكروفون لهذا الموقع.',
    micSkip: 'تخطي (بدون تمارين النطق)',
    micRequired: 'الميكروفون مطلوب لتمارين النطق.',
    speakNow: 'تحدث الآن — يتم رصد صوتك',

    // Étape 3 - Done
    doneTitle: 'أنت جاهز! 🎉',
    doneDesc: 'تم إعداد الصوت والميكروفون. يمكنك تغيير هذه الإعدادات لاحقاً.',
    doneAudio: 'الصوت',
    doneMic: 'الميكروفون',
    startBtn: 'ابدأ التعلم!',
    statusOk: 'يعمل ✓',
    statusFail: 'غير متاح ✗',
    statusSkipped: 'تم التخطي',
  },
  hy: {
    title: 'Ձայնի և խոսափողի կարգավորում',
    subtitle: 'Երկու քայլ մինչ սկսելը',
    stepAudio: 'Ձայն',
    stepMic: 'Խոսափող',
    stepDone: 'Պատրաստ',

    audioTitle: '🔊 Ձայնի ստուգում',
    audioDesc: 'Հավելվածն օգտագործում է Google Text-to-Speech արաբերեն բառեր կարդալու համար։ Անհրաժեշտ է տեղադրել Google-ի արաբական ձայնային փաթեթ։',
    googleRequired: 'Պահանջվում է Google շարժիչ',
    googleRequiredDesc: 'Համոզվեք, որ Google Text-to-Speech-ը ընտրված է որպես կանխադրված շարժիչ ձեր կարգավորումներում։',
    testAudioBtn: '▶ Փորձել հիմա',
    testingAudio: 'Ձայն է նվագում…',
    audioOk: '✓ Ձայնն աշխատում է',
    audioFail: '✗ Ձայն չկա',
    retryBtn: 'Կրկին փորձել',
    audioRequired: 'Ձայնը պետք է աշխատի շարունակելու համար։',
    audioSkipWarning: 'Առանց ձայնի՝ դուք չեք կարողանա լսել ճիշտ արաբական արտասանությունը։',
    continueAnyway: 'Շարունակել այնուամենայնիվ',
    nextBtn: 'Հաջորդ',

    guideAndroid: [
      '① Կարգավորումներ → Հասանելիություն → Խոսք',
      '② Ընտրել "Google Text-to-Speech" որպես նախընտրելի շարժիչ',
      '③ ⚙️ → "Տեղադրել ձայնային տվյալներ" → Արաբերեն',
      '④ Սպասել ներբեռնմանը և կրկին փորձել',
    ],
    guideIos: [
      '① Կարգավորումներ → Հասանելիություն → Խոսվածք',
      '② Ձայներ → Արաբերեն',
      '③ Ներբեռնել ձայն (Maged կամ Tarik)',
      '④ Վերադառնալ և կրկին փորձել',
    ],
    guideDesktop: [
      '① Ստուգել ձեր սարքի ձայնի մակարդակը',
      '② Օգտագործել Chrome կամ Edge լավագույն աջակցության համար',
      '③ Ստուգել դիտարկչի ձայնի կարգավորումները',
    ],

    micTitle: '🎙️ Խոսափողի ստուգում',
    micDesc: 'Որոշ վարժություններ պահանջում են արտասանություն։ Հավելվածը կարիք ունի խոսափողի թույլտվության։',
    micPermBtn: 'Թույլ տալ խոսափողի մուտք',
    micTestBtn: '🎙️ Սկսել ձայնի ստուգումը (5 վ)',
    micTesting: 'Խոսեք հիմա…',
    micOk: '✓ Խոսափողն աշխատում է',
    micFail: '✗ Թույլտվությունը մերժվեց',
    micNoSignal: '✗ Ձայն չի հայտնաբերվել — ստուգել խոսափողը',
    micFailGuide: 'Բացել դիտարկչի կարգավորումները և թույլ տալ խոսափողի մուտքը այս կայքի համար։',
    micSkip: 'Բաց թողնել (առանց արտասանության վարժությունների)',
    micRequired: 'Խոսափողը պահանջվում է արտասանության վարժությունների համար։',
    speakNow: 'Խոսեք — ձայնը հայտնաբերվում է',

    doneTitle: 'Պատրաստ եք! 🎉',
    doneDesc: 'Ձայնն ու խոսափողը կարգավորված են։ Կարող եք փոխել այս կարգավորումները ավելի ուշ։',
    doneAudio: 'Ձայն',
    doneMic: 'Խոսափող',
    startBtn: 'Սկսել սովորել!',
    statusOk: 'Աշխատում է ✓',
    statusFail: 'Հասանելի չէ ✗',
    statusSkipped: 'Բաց թողնված',
  },
};

export default function SpeechSetupScreen({ onDone }: Props) {
  const { language } = useLanguage();
  const tr = T[language === 'ar' ? 'ar' : 'hy'];
  const ar = language === 'ar';

  const [step, setStep]           = useState<StepId>('audio');
  const [audioState, setAudioState] = useState<TestState>('idle');
  const [micState, setMicState]   = useState<TestState>('idle');
  const [micLevel, setMicLevel]   = useState(0);           // 0..100
  const [micPeak, setMicPeak]     = useState(0);
  const [micSkipped, setMicSkipped] = useState(false);
  const [showAudioSkip, setShowAudioSkip] = useState(false);
  const [platform] = useState<Platform>(detectPlatform);

  const fallbackRef     = useRef(false);
  const currentAudio    = useRef<HTMLAudioElement | null>(null);
  const micStreamRef    = useRef<MediaStream | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const rafRef          = useRef<number>(0);
  const micTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pré-chargement des voix
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Nettoyage complet au démontage
  useEffect(() => {
    return () => {
      currentAudio.current?.pause();
      stopMicTest();
    };
  }, []);

  // ─── TTS via serveur (Gemini) ─────────────────────────────────────────────
  const playServerTTS = useCallback((onEnd: (ok: boolean) => void) => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    const audio = new Audio(`/api/tts?text=${encodeURIComponent('مرحباً، كيف حالك؟')}`);
    currentAudio.current = audio;
    audio.onended = () => { currentAudio.current = null; onEnd(true); };
    audio.onerror = () => { currentAudio.current = null; onEnd(false); };
    audio.play().catch(() => onEnd(false));
  }, []);

  // ─── Test Audio ───────────────────────────────────────────────────────────
  const testAudio = useCallback(async () => {
    setAudioState('testing');
    setShowAudioSkip(false);
    fallbackRef.current = false;

    const handleResult = (ok: boolean) => {
      setAudioState(ok ? 'ok' : 'fail');
      if (!ok) setTimeout(() => setShowAudioSkip(true), 1500);
    };

    // 1. Essayer Web Speech (Google voice si disponible)
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith('ar'));

        // Si voix arabe non disponible et voix chargées → fallback serveur
        if (!arabicVoice && voices.length > 0) {
          playServerTTS(handleResult);
          return;
        }

        const utterance = new SpeechSynthesisUtterance('مرحباً، كيف حالك؟');
        utterance.lang    = 'ar-SA';
        utterance.rate    = 0.85;
        utterance.volume  = 1;
        if (arabicVoice) utterance.voice = arabicVoice;

        // Timeout 3s → fallback serveur
        const timeout = setTimeout(() => {
          if (!fallbackRef.current) {
            fallbackRef.current = true;
            window.speechSynthesis.cancel();
            playServerTTS(handleResult);
          }
        }, 3000);

        utterance.onstart = () => clearTimeout(timeout);
        utterance.onend   = () => {
          clearTimeout(timeout);
          if (!fallbackRef.current) handleResult(true);
        };
        utterance.onerror = () => {
          clearTimeout(timeout);
          if (!fallbackRef.current) {
            fallbackRef.current = true;
            playServerTTS(handleResult);
          }
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // fall through to server TTS
      }
    }

    // 2. Fallback direct → serveur Gemini TTS
    playServerTTS(handleResult);
  }, [playServerTTS]);

  // ─── Test Microphone ──────────────────────────────────────────────────────
  const stopMicTest = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (micTimerRef.current) clearTimeout(micTimerRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    analyserRef.current  = null;
    setMicLevel(0);
  }, []);

  const testMic = useCallback(async () => {
    setMicState('testing');
    setMicLevel(0);
    setMicPeak(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setMicState('fail');
      return;
    }

    micStreamRef.current = stream;

    // Analyse du niveau sonore en temps réel
    const audioCtx = new AudioContext();
    const source   = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let maxLevel = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const level = Math.min(100, Math.round(avg * 2.5));
      setMicLevel(level);
      if (level > maxLevel) {
        maxLevel = level;
        setMicPeak(maxLevel);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    // Fin du test après 5 secondes
    micTimerRef.current = setTimeout(() => {
      stopMicTest();
      // Signal détecté si pic > 8 (seuil bas pour éviter les faux négatifs)
      setMicState(maxLevel > 8 ? 'ok' : 'fail');
    }, 5000);
  }, [stopMicTest]);

  // ─── Progression ─────────────────────────────────────────────────────────
  const canNextAudio = audioState === 'ok' || showAudioSkip;
  const canNextMic   = micState === 'ok' || micSkipped || micState === 'fail';

  const guideSteps =
    platform === 'ios'     ? tr.guideIos     :
    platform === 'android' ? tr.guideAndroid :
    tr.guideDesktop;

  const platformLabel =
    platform === 'ios'     ? 'iOS'     :
    platform === 'android' ? 'Android' :
    'Desktop';

  const steps: { id: StepId; label: string }[] = [
    { id: 'audio', label: tr.stepAudio },
    { id: 'micro', label: tr.stepMic   },
    { id: 'done',  label: tr.stepDone  },
  ];
  const currentIdx = steps.findIndex(s => s.id === step);

  const NavIcon = () => ar
    ? <ChevronLeft size={18} />
    : <ChevronRight size={18} />;

  // Couleur de la barre de niveau micro
  const barColor = micLevel > 60 ? '#22c55e' : micLevel > 20 ? '#3b82f6' : '#94a3b8';

  const micResultStatus =
    micState === 'ok'      ? tr.statusOk :
    micSkipped             ? tr.statusSkipped :
    micState === 'fail'    ? tr.statusFail :
    '—';

  return (
    <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Waves size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-bold leading-tight">{tr.title}</h1>
        <p className="text-blue-100 text-sm mt-1">{tr.subtitle}</p>

        {/* Indicateur de progression */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                ${s.id === step   ? 'bg-white text-blue-700'
                : i < currentIdx  ? 'bg-white/40 text-white'
                :                   'bg-white/10 text-white/50'}`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

        {/* ════ ÉTAPE 1 : AUDIO ════ */}
        {step === 'audio' && (
          <>
            {/* Google Speech — bannière obligatoire */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{tr.audioTitle}</h2>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{tr.audioDesc}</p>
                </div>
              </div>
            </div>

            {/* Encart Google obligatoire */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{tr.googleRequired}</p>
                <p className="text-amber-700 text-xs mt-0.5">{tr.googleRequiredDesc}</p>
              </div>
            </div>

            {/* Bouton de test */}
            <button
              onClick={testAudio}
              disabled={audioState === 'testing'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60"
            >
              {audioState === 'testing'
                ? <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /><span>{tr.testingAudio}</span></>
                : tr.testAudioBtn}
            </button>

            {/* Résultat audio */}
            {audioState === 'ok' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                <CheckCircle className="text-green-500 shrink-0" size={22} />
                <p className="text-green-700 font-semibold text-sm">{tr.audioOk}</p>
              </div>
            )}

            {audioState === 'fail' && (
              <>
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
                  <XCircle className="text-red-400 shrink-0" size={22} />
                  <div className="flex-1">
                    <p className="text-red-600 font-semibold text-sm">{tr.audioFail}</p>
                  </div>
                  <button
                    onClick={testAudio}
                    className="text-xs font-bold text-blue-600 underline whitespace-nowrap"
                  >
                    {tr.retryBtn}
                  </button>
                </div>

                {/* Guide de résolution selon la plateforme */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings size={16} className="text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-800 text-sm">
                      {platformLabel} — Google TTS
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {guideSteps.map((line, i) => (
                      <li key={i} className="text-sm text-amber-900 leading-relaxed">{line}</li>
                    ))}
                  </ol>
                </div>

                {/* Option passer quand même (avec avertissement fort) */}
                {showAudioSkip && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs text-gray-500">{tr.audioSkipWarning}</p>
                    <button
                      onClick={() => setStep('micro')}
                      className="text-sm font-semibold text-gray-500 underline"
                    >
                      {tr.continueAnyway}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ════ ÉTAPE 2 : MICROPHONE ════ */}
        {step === 'micro' && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Mic size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{tr.micTitle}</h2>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{tr.micDesc}</p>
                </div>
              </div>
            </div>

            {/* Bouton de test */}
            {micState !== 'ok' && (
              <button
                onClick={testMic}
                disabled={micState === 'testing'}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base
                           flex items-center justify-center gap-2
                           active:scale-95 transition-transform disabled:opacity-60"
              >
                {micState === 'testing'
                  ? <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /><span>{tr.micTesting}</span></>
                  : tr.micTestBtn}
              </button>
            )}

            {/* Visualisation du niveau sonore en temps réel */}
            {micState === 'testing' && (
              <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
                <p className="text-white text-sm font-semibold text-center">{tr.speakNow}</p>
                {/* Barre de niveau */}
                <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{ width: `${micLevel}%`, backgroundColor: barColor }}
                  />
                </div>
                {/* Barres animées style égaliseur */}
                <div className="flex items-end justify-center gap-1 h-10">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const active = (micLevel / 100) * 20 > i;
                    return (
                      <div
                        key={i}
                        className="w-2 rounded-sm transition-all duration-75"
                        style={{
                          height: `${20 + Math.sin(i * 0.8) * 12}px`,
                          backgroundColor: active ? barColor : '#374151',
                          opacity: active ? 1 : 0.3,
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Pic: {micPeak}%
                </p>
              </div>
            )}

            {/* Résultat micro OK */}
            {micState === 'ok' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                <CheckCircle className="text-green-500 shrink-0" size={22} />
                <p className="text-green-700 font-semibold text-sm">{tr.micOk}</p>
              </div>
            )}

            {/* Résultat micro FAIL */}
            {micState === 'fail' && (
              <>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl">
                  <XCircle className="text-orange-400 shrink-0" size={22} />
                  <div className="flex-1">
                    <p className="text-orange-700 font-semibold text-sm">
                      {micPeak <= 8 && micPeak > 0 ? tr.micNoSignal : tr.micFail}
                    </p>
                    <p className="text-orange-600 text-xs mt-0.5">{tr.micFailGuide}</p>
                  </div>
                </div>
                <button
                  onClick={testMic}
                  className="w-full py-3 border-2 border-purple-300 text-purple-600 rounded-2xl font-bold text-sm"
                >
                  {tr.retryBtn}
                </button>
              </>
            )}
          </>
        )}

        {/* ════ ÉTAPE 3 : TERMINÉ ════ */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center py-6 gap-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{tr.doneTitle}</h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">{tr.doneDesc}</p>
            </div>

            {/* Résumé des tests */}
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Volume2 size={16} />
                  <span>{tr.doneAudio}</span>
                </div>
                <span className={`text-sm font-semibold ${audioState === 'ok' ? 'text-green-600' : 'text-orange-500'}`}>
                  {audioState === 'ok' ? tr.statusOk : tr.statusFail}
                </span>
              </div>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mic size={16} />
                  <span>{tr.doneMic}</span>
                </div>
                <span className={`text-sm font-semibold ${
                  micState === 'ok' ? 'text-green-600'
                  : micSkipped      ? 'text-gray-400'
                  : 'text-orange-500'
                }`}>
                  {micResultStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pied de page ── */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 space-y-2">

        {/* Étape 1 → 2 */}
        {step === 'audio' && (
          <button
            onClick={() => setStep('micro')}
            disabled={!canNextAudio || audioState === 'testing'}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all
              ${canNextAudio && audioState !== 'testing'
                ? 'bg-gray-800 text-white active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
          >
            <span>{tr.nextBtn}</span>
            <NavIcon />
          </button>
        )}

        {/* Étape 2 → 3 */}
        {step === 'micro' && (
          <>
            {canNextMic && (
              <button
                onClick={() => setStep('done')}
                disabled={micState === 'testing'}
                className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold text-base
                           flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>{tr.nextBtn}</span>
                <NavIcon />
              </button>
            )}
            {/* Option passer le micro */}
            {micState !== 'ok' && micState !== 'testing' && (
              <button
                onClick={() => { setMicSkipped(true); setStep('done'); }}
                className="w-full py-3 text-gray-400 text-sm font-medium text-center"
              >
                {tr.micSkip}
              </button>
            )}
          </>
        )}

        {/* Étape 3 → app */}
        {step === 'done' && (
          <button
            onClick={onDone}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                       rounded-2xl font-bold text-lg flex items-center justify-center gap-2
                       active:scale-95 transition-transform shadow-lg"
          >
            <span>{tr.startBtn}</span>
            <NavIcon />
          </button>
        )}
      </div>
    </div>
  );
}
