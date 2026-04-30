/**
 * SpeechSetupScreen — شاشة إعداد الصوت (تظهر مرة واحدة عند أول تشغيل)
 * توجّه المستخدم لتفعيل Speech Synthesis & Recognition على جهازه
 */

import React, { useState, useEffect } from 'react';
import { Volume2, Mic, CheckCircle, XCircle, ChevronRight, Smartphone, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onDone: () => void;
}

type StepId = 'synthesis' | 'recognition' | 'done';
type TestState = 'idle' | 'testing' | 'ok' | 'fail';

export default function SpeechSetupScreen({ onDone }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [step, setStep] = useState<StepId>('synthesis');
  const [ttsState, setTtsState]   = useState<TestState>('idle');
  const [micState, setMicState]   = useState<TestState>('idle');
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS]         = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsAndroid(/Android/i.test(ua));
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));

    // تحميل الأصوات مسبقاً
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ─── اختبار TTS ───────────────────────────────────────────────────────────
  const testTTS = () => {
    if (!('speechSynthesis' in window)) {
      setTtsState('fail');
      return;
    }
    window.speechSynthesis.cancel();
    setTtsState('testing');

    const utterance = new SpeechSynthesisUtterance('مرحباً');
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onend   = () => setTtsState('ok');
    utterance.onerror = () => setTtsState('fail');

    // تشغيل مباشر (synchronous) — ضروري للموبايل
    window.speechSynthesis.speak(utterance);

    // timeout احتياطي
    setTimeout(() => {
      setTtsState(s => s === 'testing' ? 'fail' : s);
    }, 5000);
  };

  // ─── اختبار Mic ───────────────────────────────────────────────────────────
  const testMic = async () => {
    setMicState('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicState('ok');
    } catch {
      setMicState('fail');
    }
  };

  // ─── Translations ─────────────────────────────────────────────────────────
  const T = {
    title:       ar ? 'إعداد الصوت'               : 'Ձայնի կարգավորում',
    subtitle:    ar ? 'خطوة واحدة قبل البدء'       : 'Մեկ քայլ մինչ սկսելը',
    skip:        ar ? 'تخطي'                        : 'Բաց թողնել',
    next:        ar ? 'التالي'                      : 'Հաջորդ',
    done:        ar ? 'ابدأ التعلم!'               : 'Սկսել սովորել!',

    // Step 1 — TTS
    tts_title:   ar ? 'قراءة النصوص (TTS)'         : 'Ձայնային ընթերցում (TTS)',
    tts_desc:    ar ? 'يحتاج التطبيق لقراءة الكلمات العربية بصوت عالٍ. يجب تثبيت حزمة الصوت العربي على جهازك.'
                    : 'Հավելվածը կարդում է արաբերեն բառեր բարձրաձայն։ Անհրաժեշտ է տեղադրել արաբական ձայնային փաթեթ։',
    tts_btn:     ar ? '🔊 اختبر الصوت الآن'         : '🔊 Փորձել հիմա',
    tts_ok:      ar ? 'ممتاز! الصوت يعمل ✓'         : 'Հիանալի! Ձայնն աշխատում է ✓',
    tts_fail:    ar ? 'لم يُسمع صوت — اتبع الخطوات أدناه'
                    : 'Ձայն չկա — հետևեք ստորև բերված քայլերին',

    android_tts: ar ? [
      '① افتح إعدادات الهاتف',
      '② اذهب إلى: إمكانية الوصول ← تحويل النص إلى كلام',
      '③ اختر Google Text-to-Speech كمحرك',
      '④ اضغط ⚙️ ← تثبيت بيانات الصوت ← العربية',
      '⑤ ارجع وأعد الاختبار',
    ] : [
      '① Բացել Կարգավորումներ',
      '② Մատչելիություն → Խոսք',
      '③ Ընտրել Google TTS',
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

    // Step 2 — Mic
    mic_title:   ar ? 'الميكروفون (للنطق)'          : 'Խոսափողն (արտասանության համար)',
    mic_desc:    ar ? 'بعض التمارين تطلب منك النطق. التطبيق يحتاج إذن استخدام الميكروفون.'
                    : 'Որոշ վարժություններ պահանջում են արտասանություն։ Հավելվածը կարիք ունի խոսափողի թույլտվության։',
    mic_btn:     ar ? '🎙️ اطلب إذن الميكروفون'       : '🎙️ Թույլ տալ',
    mic_ok:      ar ? 'الميكروفون جاهز ✓'             : 'Խոսափողը պատրաստ է ✓',
    mic_fail:    ar ? 'تم رفض الإذن — يمكنك المتابعة بدون النطق'
                    : 'Հրաժարվեց — կարող եք շարունակել առանց արտասանության',
    mic_skip:    ar ? 'تخطي هذه الخطوة'              : 'Բաց թողնել այս քայլը',

    // Step 3 — Done
    done_title:  ar ? 'أنت جاهز! 🎉'                 : 'Պատրա՛ст եք! 🎉',
    done_desc:   ar ? 'يمكنك دائماً تغيير هذه الإعدادات لاحقاً من إعدادات هاتفك.'
                    : 'Կարող եք միշտ փոխել այս կարգավորումները ձեր հեռախոսի Կարգավորումներից։',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const StateIcon = ({ state }: { state: TestState }) => {
    if (state === 'ok')      return <CheckCircle className="text-green-500" size={22} />;
    if (state === 'fail')    return <XCircle className="text-red-400" size={22} />;
    if (state === 'testing') return <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />;
    return null;
  };

  const Steps: { id: StepId; icon: React.ReactNode; label: string }[] = [
    { id: 'synthesis',   icon: <Volume2 size={14} />, label: 'TTS' },
    { id: 'recognition', icon: <Mic size={14} />,     label: ar ? 'ميكروفون' : 'Mic' },
    { id: 'done',        icon: <CheckCircle size={14} />, label: ar ? 'جاهز' : 'Պատրաст' },
  ];

  const currentIdx = Steps.findIndex(s => s.id === step);

  return (
    <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">{T.title}</h1>
        <p className="text-blue-100 text-sm mt-1">{T.subtitle}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {Steps.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all
              ${s.id === step ? 'bg-white text-blue-700' : i < currentIdx ? 'bg-white/40 text-white' : 'bg-white/10 text-white/50'}`}>
              {s.icon}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Step 1: TTS ── */}
        {step === 'synthesis' && (
          <>
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Volume2 className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{T.tts_title}</h2>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.tts_desc}</p>
            </div>

            {/* Test button */}
            <button
              onClick={testTTS}
              disabled={ttsState === 'testing'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            >
              {ttsState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.tts_btn}
            </button>

            {/* Result */}
            {(ttsState === 'ok' || ttsState === 'fail') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl ${ttsState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                <StateIcon state={ttsState} />
                <p className={`text-sm font-medium ${ttsState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {ttsState === 'ok' ? T.tts_ok : T.tts_fail}
                </p>
              </div>
            )}

            {/* Guide for fail */}
            {ttsState === 'fail' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">
                    {isIOS ? 'iOS' : 'Android'} — {ar ? 'خطوات التفعيل' : 'Ակտիվացման քայլեր'}
                  </span>
                </div>
                <ol className="space-y-2">
                  {(isIOS ? T.ios_tts : T.android_tts).map((line, i) => (
                    <li key={i} className="text-sm text-amber-900 leading-relaxed">{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Microphone ── */}
        {step === 'recognition' && (
          <>
            <div className="bg-purple-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mic className="text-purple-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.mic_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.mic_desc}</p>
            </div>

            <button
              onClick={testMic}
              disabled={micState === 'testing' || micState === 'ok'}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            >
              {micState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.mic_btn}
            </button>

            {(micState === 'ok' || micState === 'fail') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl ${micState === 'ok' ? 'bg-green-50' : 'bg-orange-50'}`}>
                <StateIcon state={micState} />
                <p className={`text-sm font-medium ${micState === 'ok' ? 'text-green-700' : 'text-orange-700'}`}>
                  {micState === 'ok' ? T.mic_ok : T.mic_fail}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('done')}
              className="w-full py-3 text-gray-400 text-sm underline"
            >
              {T.mic_skip}
            </button>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{T.done_title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{T.done_desc}</p>

            {/* Summary */}
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Volume2 size={16} /><span>{T.tts_title}</span>
                </div>
                <StateIcon state={ttsState === 'idle' ? 'fail' : ttsState} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mic size={16} /><span>{T.mic_title}</span>
                </div>
                <StateIcon state={micState === 'idle' ? 'fail' : micState} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 space-y-3">
        {step !== 'done' && (
          <button
            onClick={onDone}
            className="w-full py-2 text-gray-400 text-sm"
          >
            {T.skip}
          </button>
        )}

        {step === 'synthesis' && (
          <button
            onClick={() => setStep('recognition')}
            className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span>{T.next}</span>
            <ChevronRight size={18} />
          </button>
        )}

        {step === 'recognition' && micState === 'ok' && (
          <button
            onClick={() => setStep('done')}
            className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span>{T.next}</span>
            <ChevronRight size={18} />
          </button>
        )}

        {step === 'done' && (
          <button
            onClick={onDone}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
          >
            <span>{T.done}</span>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
