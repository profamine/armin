/**
 * SpeechSetupScreen — شاشة إعداد الصوت (تظهر مرة واحدة عند أول تشغيل)
 * توجّه المستخدم لتفعيل Speech Synthesis & Recognition على جهازه
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2, Mic, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Smartphone, Settings, SkipForward
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiUrl } from '../apiConfig';

interface Props {
  onDone: () => void;
}

type StepId    = 'synthesis' | 'recognition' | 'done';
type TestState = 'idle' | 'testing' | 'ok' | 'fail' | 'no_sound';

type Platform = 'android' | 'ios' | 'desktop';

export default function SpeechSetupScreen({ onDone }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [step, setStep]       = useState<StepId>('synthesis');
  const [ttsState, setTtsState] = useState<TestState>('idle');
  const [micState, setMicState] = useState<TestState>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [showTtsSkip, setShowTtsSkip] = useState(false);

  // useRef évite les fermetures obsolètes dans les callbacks async
  const fallbackTriggeredRef = useRef(false);

  useEffect(() => {
    if (ttsState === 'fail') {
      const t = setTimeout(() => setShowTtsSkip(true), 1500);
      return () => clearTimeout(t);
    } else {
      setShowTtsSkip(false);
    }
  }, [ttsState]);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua))         setPlatform('android');
    else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else                             setPlatform('desktop');

    if (!('speechSynthesis' in window)) return;

    // Préchargement des voix
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    // Nettoyage pour éviter la fuite mémoire
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // ─── Helpers voix ────────────────────────────────────────────────────────
  const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) return resolve(voices);
      // Les voix ne sont pas encore chargées — on attend l'événement
      const handler = () => {
        resolve(window.speechSynthesis.getVoices());
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      // Délai de sécurité si l'événement ne se déclenche jamais
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
    });

  // ─── TTS via serveur (Google Translate) ─────────────────────────
  const playServerTTS = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent('\u0645\u0631\u062d\u0628\u0627\u064b')}`);
    audio.onended = () => setTtsState('ok');
    audio.onerror = () => setTtsState('fail');
    audio.play().catch(() => setTtsState('fail'));
  }, []);

  // ─── Test TTS ────────────────────────────────────────────────────────────
  const testTTS = useCallback(async () => {
    setTtsState('testing');
    fallbackTriggeredRef.current = false;

    // Create a dummy audio to prime the engine on this user gesture.
    let audioPrimer: HTMLAudioElement | null = null;
    try {
      audioPrimer = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      audioPrimer.play().catch(() => {});
    } catch { }

    const performServerTTS = () => {
      fallbackTriggeredRef.current = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      // Use the primed audio context if possible, or just create a new one
      const audioToPlay = audioPrimer || new Audio();
      audioToPlay.src = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ar&q=${encodeURIComponent('\u0645\u0631\u062d\u0628\u0627\u064b')}`;
      audioToPlay.onended = () => setTtsState('ok');
      audioToPlay.onerror = () => setTtsState('fail');
      audioToPlay.play().catch(() => setTtsState('fail'));
    };

    if (!('speechSynthesis' in window)) {
      performServerTTS();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const voices = await getVoicesAsync();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));

      if (!arabicVoice && voices.length > 0) {
        performServerTTS();
        return;
      }

      const utterance = new SpeechSynthesisUtterance('مرحباً');
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.volume = 1;
      if (arabicVoice) utterance.voice = arabicVoice;

      const timeout = setTimeout(() => {
        if (!fallbackTriggeredRef.current) {
          performServerTTS();
        }
      }, 3000);

      utterance.onstart = () => clearTimeout(timeout);

      utterance.onend = () => {
        clearTimeout(timeout);
        if (!fallbackTriggeredRef.current) setTtsState('ok');
      };

      utterance.onerror = () => {
        clearTimeout(timeout);
        if (!fallbackTriggeredRef.current) {
          performServerTTS();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      performServerTTS();
    }
  }, []);

  // ─── Test Microphone ─────────────────────────────────────────────────────
  const testMic = useCallback(async () => {
    setMicState('testing');
    setMicLevel(0);
    try {
      // Create Context synchronously to prevent it starting in "suspended" state
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let success = false;
      let frameId: number;
      let maxPeak = 0;

      const stopMic = () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(() => {});
        }
        cancelAnimationFrame(frameId);
      };

      const checkVolume = () => {
        if (success) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, (avg / 128) * 100);
        setMicLevel(normalized);
        maxPeak = Math.max(maxPeak, normalized);

        frameId = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();

      setTimeout(() => {
        if (!success) {
          success = true;
          stopMic();
          setMicLevel(0);
          if (maxPeak > 8) {
            setMicState('ok');
          } else {
            setMicState('no_sound');
          }
        }
      }, 5000); // 5 seconds test

    } catch {
      setMicState('fail');
    }
  }, []);

  // ─── Traductions ──────────────────────────────────────────────────────────
  const T = {
    title:    ar ? 'إعداد الصوت'         : 'Ձայնի կարգավորում',
    subtitle: ar ? 'خطوة واحدة قبل البدء' : 'Մեկ քայլ մինչ սկսելը',
    skip:     ar ? 'تخطي'                 : 'Բաց թողնել',
    next:     ar ? 'التالي'               : 'Հաջորդ',
    done:     ar ? 'ابدأ التعلم!'         : 'Սկսել սովորել!',  // ✓ arménien corrigé

    // Étape 1 — TTS
    tts_title: ar ? 'قراءة النصوص (صوت التطبيق)'  : 'Ձայնային ընթերցում (TTS)',
    tts_desc:  ar
      ? 'يحتاج التطبيق لمحرك Google Text-to-Speech لقراءة الكلمات العربية بصوت عالٍ. يرجى تأكيد عمل الصوت للمتابعة.'
      : 'Հավելվածը պահանջում է Google Text-to-Speech՝ արաբերեն բառերը բարձրաձայն կարդալու համար: Խնդրում ենք հաստատել, որ ձայնն աշխատում է:',
    tts_btn:  ar ? '🔊 اختبر الصوت الآن'            : '🔊 Փորձել հիմա',
    tts_ok:   ar ? 'ممتاز! الصوت يعمل ✓'             : 'Հիանալի! Ձայնն աշխատում է ✓',
    tts_fail: ar ? 'لم يُسمع صوت — تأكد من إعداد Google Speech' : 'Ձայն չկա — Ստուգեք Google Speech-ի կարգավորումները',
    tts_skip_btn: ar ? 'تخطي على أي حال (لا ينصح به)' : 'Շարունակել առանց ձայնի (խորհուրդ չի տրվում)',

    android_tts: ar ? [
      '① افتح إعدادات الهاتف > إمكانية الوصول',
      '② اختر "تحويل النص إلى كلام" (Text-to-Speech)',
      '③ تأكد من تثبيت وتحديد "Speech Services by Google"',
      '④ اضغط ⚙️ ← تثبيت بيانات الصوت ← العربية',
      '⑤ ارجع للتطبيق وأعد الاختبار',
    ] : [
      '① Բացել Կարգավորումները > Մատչելիություն',
      '② Ընտրել «Խոսք» (Text-to-Speech)',
      '③ Համոզվել, որ տեղադրված է "Speech Services by Google"',
      '④ Տեղադրել արաբական ձայնային տվյալներ',
      '⑤ Վերադառնալ և կրկին փորձել',
    ],

    ios_tts: ar ? [
      '① افتح الإعدادات',
      '② اذهب إلى: إمكانية الوصول ← المحتوى المنطوق',
      '③ اضغط على "الأصوات" ثم اختر "العربية"',
      '④ حمّل أي صوت عربي',
      '⑤ ارجع وأعد الاختبار',
    ] : [
      '① Բացել Կարգավորումներ',
      '② Մատչելիություն → Խոսվածք',
      '③ Ձայներ → Արաբերեն',
      '④ Ներբեռնել ձայն',
      '⑤ Վերադառնալ և կրկին փորձել',
    ],

    // ✓ NOUVEAU — instructions pour navigateur desktop
    desktop_tts: ar ? [
      '① تأكد من رفع مستوى الصوت في جهازك',
      '② تحقق من أذونات الصوت والميكروفون في المتصفح',
      '③ يفضل استخدام Google Chrome للحصول على الدعم الكامل لأصوات Google'
    ] : [
      '① Ստուգել ձեր սարքի ձայնի մակարդակը',
      '② Ստուգել ձայնի և խոսափողի թույլտվությունները դիտարկչի կարգավորումներում',
      '③ Լավագույն արդյունքի համար օգտագործեք Google Chrome'
    ],

    // Étape 2 — Microphone
    mic_title: ar ? 'الميكروفون (للنطق)'       : 'Խոսափող (արտասանության համար)',
    mic_desc:  ar
      ? 'سجل صوتك لـ 5 ثوانٍ للتحقق من الميكروفون.'
      : 'Փորձարկեք խոսափողը 5 վայրկյան ձայնագրելով:',
    mic_btn:   ar ? '🎙️ ابدأ اختبار الميكروفون (5 ثوانٍ)' : '🎙️ Սկսել փորձարկումը (5 վրկ)',
    mic_ok:    ar ? 'الميكروفون جاهز ✓'        : 'Խոսափողը պատրաստ է ✓',
    mic_fail:  ar
      ? 'تم رفض الإذن — يرجى تفعيله من إعدادات المتصفح للمتابعة'
      : 'Մերժվեց — խնդրում ենք միացնել այն դիտարկչի կարգավորումներից',
    mic_no_sound: ar
      ? 'لم يتم اكتشاف أي صوت! تأكد من أن الميكروفون يعمل.'
      : 'Ձայն չի հայտնաբերվել: Ստուգեք խոսափողը:',
    mic_skip:  ar ? 'تخطي (بدون تمارين النطق)' : 'Բաց թողնել (առանց արտասանության վարժությունների)',

    // Étape 3 — Fin
    done_title: ar ? 'أنت جاهز! 🎉'   : 'Պատրաստ եք! 🎉',
    done_desc:  ar
      ? 'يمكنك دائماً تغيير هذه الإعدادات لاحقاً من إعدادات هاتفك.'
      : 'Դուք կարող եք միշտ փոխել այս կարգավորումները ձեր հեռախոսի կարգավորումներից:',
  };

  // ─── Icône de statut ─────────────────────────────────────────────────────
  const StateIcon = ({ state }: { state: TestState }) => {
    if (state === 'ok')      return <CheckCircle className="text-green-500 shrink-0" size={22} />;
    if (state === 'fail' || state === 'no_sound') return <XCircle className="text-red-400 shrink-0" size={22} />;
    if (state === 'testing') return (
      <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
    );
    return <div className="w-5 h-0.5 bg-gray-300 rounded shrink-0" />;
  };

  // ─── Étapes ──────────────────────────────────────────────────────────────
  const Steps: { id: StepId; icon: React.ReactNode; label: string }[] = [
    { id: 'synthesis',   icon: <Volume2 size={14} />,     label: 'TTS' },
    { id: 'recognition', icon: <Mic size={14} />,         label: ar ? 'ميكروفون' : 'Mic' },
    { id: 'done',        icon: <CheckCircle size={14} />, label: ar ? 'جاهز' : 'Պատրաստ' },
  ];
  const currentIdx = Steps.findIndex(s => s.id === step);

  // ✓ Chevron RTL-aware
  const NavChevron = () => ar
    ? <ChevronLeft size={18} />
    : <ChevronRight size={18} />;

  // ✓ Instructions TTS selon la plateforme
  const ttsGuide =
    platform === 'ios'     ? T.ios_tts :
    platform === 'android' ? T.android_tts :
    T.desktop_tts;

  const platformLabel =
    platform === 'ios'     ? 'iOS' :
    platform === 'android' ? 'Android' :
    ar ? 'المتصفح' : 'Desktop';

  return (
    <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>

      {/* En-tête */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">{T.title}</h1>
        <p className="text-blue-100 text-sm mt-1">{T.subtitle}</p>

        {/* Indicateur de progression */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {Steps.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all
                ${s.id === step        ? 'bg-white text-blue-700'
                : i < currentIdx      ? 'bg-white/40 text-white'
                :                       'bg-white/10 text-white/50'}`}
            >
              {s.icon}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Étape 1 : TTS ── */}
        {step === 'synthesis' && (
          <>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-2">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <h2 className="font-bold text-red-800">{T.tts_title}</h2>
              </div>
              <p className="text-red-700 text-sm leading-relaxed font-medium">{T.tts_desc}</p>
            </div>

            <button
              onClick={testTTS}
              disabled={ttsState === 'testing'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60 mt-4"
            >
              {ttsState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.tts_btn}
            </button>

            {(ttsState === 'ok' || ttsState === 'fail') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl
                ${ttsState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                <StateIcon state={ttsState} />
                <p className={`text-sm font-medium ${ttsState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {ttsState === 'ok' ? T.tts_ok : T.tts_fail}
                </p>
              </div>
            )}

            {ttsState === 'fail' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-800 text-sm">
                    {platformLabel} — {ar ? 'خطوات التفعيل' : 'Ակտիվացման քայլեր'}
                  </span>
                </div>
                <ol className="space-y-2">
                  {ttsGuide.map((line, i) => (
                    <li key={i} className="text-sm text-amber-900 leading-relaxed">{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {/* ── Étape 2 : Microphone ── */}
        {step === 'recognition' && (
          <>
            <div className="bg-purple-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mic className="text-purple-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.mic_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.mic_desc}</p>
            </div>

            <button
              onClick={testMic}
              disabled={micState === 'testing' || micState === 'ok'}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base
                         flex flex-col items-center justify-center gap-1 overflow-hidden relative
                         active:scale-95 transition-transform disabled:opacity-80"
            >
              {micState === 'testing' && (
                <div 
                  className="absolute bottom-0 left-0 h-full bg-purple-800 transition-all duration-100 ease-out" 
                  style={{ width: `${micLevel}%`, opacity: 0.5 }} 
                />
              )}
              <div className="flex items-center gap-2 relative z-10">
                {micState === 'testing'
                  ? <span className="animate-pulse">{ar ? 'تحدث الآن...' : 'Խոսեք հիմա...'}</span>
                  : T.mic_btn}
              </div>
            </button>

            {micState === 'testing' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-2xl flex flex-col items-center gap-3">
                {/* Simulated equalizer visually responsive to micLevel */}
                <div className="flex items-end justify-center gap-1 h-12 w-full">
                  {[...Array(20)].map((_, i) => {
                    const h = Math.max(10, Math.random() * micLevel);
                    return (
                      <div 
                        key={i} 
                        className="w-2 bg-purple-500 rounded-t-sm transition-all duration-75"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
                {/* Progress bar (simulated 5 secs) */}
                <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden flex justify-start">
                  <div className="h-full bg-purple-600 animate-progress" />
                </div>
                <div className="text-sm font-bold text-purple-700">
                  {ar ? 'الذروة الحالية:' : 'Ընթացիկ պիկ.'} {Math.round(micLevel)}%
                </div>
              </div>
            )}

            {(micState === 'ok' || micState === 'fail' || micState === 'no_sound') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl mt-4
                ${micState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                <StateIcon state={micState} />
                <p className={`text-sm font-medium ${micState === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                  {micState === 'ok' ? T.mic_ok : micState === 'fail' ? T.mic_fail : T.mic_no_sound}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Étape 3 : Terminé ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{T.done_title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{T.done_desc}</p>

            {/* Résumé */}
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Volume2 size={16} /><span>{T.tts_title}</span>
                </div>
                <StateIcon state={ttsState} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mic size={16} /><span>{T.mic_title}</span>
                </div>
                <StateIcon state={micState} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 space-y-3">
        {step === 'synthesis' && (
          <div className="space-y-2">
            <button
              onClick={() => setStep('recognition')}
              disabled={ttsState !== 'ok'}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                ttsState !== 'ok'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white active:scale-95'
              }`}
            >
              <span>{T.next}</span>
              <NavChevron />
            </button>
            {showTtsSkip && (
              <div className="pt-2 animate-fade-in">
                <button
                  onClick={() => setStep('recognition')}
                  className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 border border-red-200"
                >
                  <SkipForward size={16} />
                  <span>{T.tts_skip_btn}</span>
                </button>
                <p className="text-center text-xs text-red-600 font-medium px-4 mt-2">
                  {ar ? 'تنبيه: لن تستطيع سماع الكلمات وتجربة التطبيق ستكون ضعيفة.' : 'Ուշադրություն. Դուք չեք կարողանա լսել բառերը:'}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'recognition' && (
          <div className="space-y-2">
            <button
              onClick={() => setStep('done')}
              disabled={micState !== 'ok'}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                micState !== 'ok'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white active:scale-95'
              }`}
            >
              <span>{T.next}</span>
              <NavChevron />
            </button>
            
            {(micState === 'fail' || micState === 'no_sound') && (
              <div className="pt-2">
                <button
                  onClick={() => setStep('done')}
                  className="w-full py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 border border-orange-200"
                >
                  <SkipForward size={16} />
                  <span>{T.mic_skip}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <button
            onClick={onDone}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                       rounded-2xl font-bold text-lg flex items-center justify-center gap-2
                       active:scale-95 transition-transform shadow-lg"
          >
            <span>{T.done}</span>
            <NavChevron />
          </button>
        )}
      </div>
    </div>
  );
}