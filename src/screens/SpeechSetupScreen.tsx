/**
 * SpeechSetupScreen — شاشة إعداد الصوت (تظهر مرة واحدة عند أول تشغيل)
 *
 * Étapes :
 *  1. synthesis   — teste Google TTS avec la voix arabe (ar-SA)
 *  2. recognition — demande la permission micro + enregistre 3 s et réécoute
 *  3. done        — résumé + bouton "Commencer"
 *
 * Améliorations vs version précédente :
 *  - "Suivant" accessible même après échec (couleur ambre + icône avertissement)
 *  - Bouton "Ignorer cette étape" visible dans le footer quand le test échoue
 *  - Test micro réel : enregistre 3 s via MediaRecorder puis réécoute l'audio
 *  - Instructions Google TTS/Speech Input détaillées pour Android (ar-SA)
 *  - T.skip et T.mic_skip maintenant réellement affichés
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2, Mic, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Smartphone, Settings, SkipForward,
  PlayCircle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onDone: () => void;
}

type StepId    = 'synthesis' | 'recognition' | 'done';
type TestState = 'idle' | 'testing' | 'ok' | 'fail';
type Platform  = 'android' | 'ios' | 'desktop';

export default function SpeechSetupScreen({ onDone }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [step,        setStep]       = useState<StepId>('synthesis');
  const [ttsState,    setTtsState]   = useState<TestState>('idle');
  const [micState,    setMicState]   = useState<TestState>('idle');
  const [recState,    setRecState]   = useState<TestState>('idle');
  const [platform,    setPlatform]   = useState<Platform>('desktop');
  const [recAudioURL, setRecAudioURL] = useState<string | null>(null);

  const fallbackTriggeredRef = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua))               setPlatform('android');
    else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else                                   setPlatform('desktop');

    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // ─── Helpers voix ────────────────────────────────────────────────────────
  const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) return resolve(voices);
      const handler = () => {
        resolve(window.speechSynthesis.getVoices());
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
    });

  // ─── TTS via serveur (fallback) ──────────────────────────────────────────
  const playServerTTS = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent('\u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0643\u064a\u0641 \u062d\u0627\u0644\u0643\u061f')}`);
    audio.onended = () => setTtsState('ok');
    audio.onerror = () => setTtsState('fail');
    audio.play().catch(() => setTtsState('fail'));
  }, []);

  // ─── Test TTS Google ar-SA ───────────────────────────────────────────────
  const testTTS = useCallback(async () => {
    setTtsState('testing');
    fallbackTriggeredRef.current = false;

    if (!('speechSynthesis' in window)) { playServerTTS(); return; }

    try {
      window.speechSynthesis.cancel();
      const voices = await getVoicesAsync();

      // Priorité : voix Google arabe → toute voix arabe → fallback serveur
      const arabicVoice =
        voices.find(v => v.lang.startsWith('ar') && /google/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('ar'));

      if (!arabicVoice && voices.length > 0) { playServerTTS(); return; }

      const utterance  = new SpeechSynthesisUtterance('\u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0643\u064a\u0641 \u062d\u0627\u0644\u0643\u061f');
      utterance.lang   = 'ar-SA';
      utterance.rate   = 0.85;
      utterance.volume = 1;
      if (arabicVoice) utterance.voice = arabicVoice;

      const timeout = setTimeout(() => {
        if (!fallbackTriggeredRef.current) {
          fallbackTriggeredRef.current = true;
          playServerTTS();
        }
      }, 3500);

      utterance.onstart = () => clearTimeout(timeout);
      utterance.onend   = () => { clearTimeout(timeout); if (!fallbackTriggeredRef.current) setTtsState('ok'); };
      utterance.onerror = () => {
        clearTimeout(timeout);
        if (!fallbackTriggeredRef.current) { fallbackTriggeredRef.current = true; playServerTTS(); }
      };
      window.speechSynthesis.speak(utterance);
    } catch { playServerTTS(); }
  }, [playServerTTS]);

  // ─── Phase 1 : Permission microphone ─────────────────────────────────────
  const requestMic = useCallback(async () => {
    setMicState('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicState('ok');
    } catch { setMicState('fail'); }
  }, []);

  // ─── Phase 2 : Enregistrement réel 3 secondes via MediaRecorder ──────────
  const testRecording = useCallback(async () => {
    setRecState('testing');
    setRecAudioURL(null);
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setRecAudioURL(URL.createObjectURL(blob));
        setRecState('ok');
      };
      recorder.onerror = () => { stream.getTracks().forEach(t => t.stop()); setRecState('fail'); };

      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 3000);
    } catch { setRecState('fail'); }
  }, []);

  // ─── Traductions ──────────────────────────────────────────────────────────
  const T = {
    title:    ar ? '\u0625\u0639\u062f\u0627\u062f \u0627\u0644\u0635\u0648\u062a'         : 'Ձայնի կարգավորում',
    subtitle: ar ? '\u062e\u0637\u0648\u0629 \u0648\u0627\u062d\u062f\u0629 \u0642\u0628\u0644 \u0627\u0644\u0628\u062f\u0621' : 'Մեկ քայլ մինչ սկսելը',
    skip:     ar ? '\u062a\u062e\u0637\u064a \u0627\u0644\u0625\u0639\u062f\u0627\u062f'    : 'Բաց թողնել կարգավորումը',
    next:     ar ? '\u0627\u0644\u062a\u0627\u0644\u064a'                                  : 'Հաջordeel',
    done:     ar ? '\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u0639\u0644\u0645!'          : 'Սկusell սovoreels!',

    tts_title: ar ? '\u0642\u0631\u0627\u0621\u0629 \u0639\u0631\u0628\u064a\u0629 (Google TTS \u2014 ar-SA)' : 'Արաb. ձaynayntchum (Google TTS)',
    tts_desc:  ar
      ? '\u064a\u062d\u062a\u0627\u062c \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0644\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0628\u0635\u0648\u062a \u0639\u0627\u0644\u064d. \u064a\u062c\u0628 \u062a\u0641\u0639\u064a\u0644 Google Text-to-Speech \u0645\u0639 \u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629 (ar-SA).'
      : 'Հavelvats@ karik uni Google TTS-i araberen dzaynayin pataketi.',
    tts_btn:   ar ? '\ud83d\udd0a \u0627\u062e\u062a\u0628\u0631 \u0627\u0644\u0635\u0648\u062a \u0627\u0644\u0639\u0631\u0628\u064a \u0627\u0644\u0622\u0646' : '🔊 Փordzell hima',
    tts_ok:    ar ? '\u0645\u0645\u062a\u0627\u0632! \u0627\u0644\u0635\u0648\u062a \u0627\u0644\u0639\u0631\u0628\u064a \u064a\u0639\u0645\u0644 \u2713'    : 'Հianali! Dzayn@ ashxatum e ✓',
    tts_fail:  ar ? '\u0644\u0645 \u064a\u064f\u0633\u0645\u0639 \u0635\u0648\u062a \u2014 \u0627\u062a\u0628\u0639 \u0627\u0644\u062e\u0637\u0648\u0627\u062a' : 'Dzayn chi — heteveq qaylerine',
    tts_warn:  ar ? '\u0633\u062a\u064f\u0633\u062a\u062e\u062f\u0645 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062e\u0627\u062f\u0645 \u0643\u0628\u062f\u064a\u0644' : 'Ksogutagurvei server@ orogvutyun',

    android_tts: ar ? [
      '\u2460 \u0627\u0641\u062a\u062d \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0647\u0627\u062a\u0641',
      '\u2461 \u0627\u0630\u0647\u0628 \u0625\u0644\u0649: \u0625\u0645\u0643\u0627\u0646\u064a\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u2190 \u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0646\u0635 \u0625\u0644\u0649 \u0643\u0644\u0627\u0645',
      '\u2462 \u0627\u062e\u062a\u0631 "Google Text-to-Speech" \u0643\u0627\u0644\u0645\u062d\u0631\u0643 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a',
      '\u2463 \u0627\u0636\u063a\u0637 \u2699\ufe0f \u2190 "\u062a\u062b\u0628\u064a\u062a \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0635\u0648\u062a"',
      '\u2464 \u0627\u062e\u062a\u0631 "\u0627\u0644\u0639\u0631\u0628\u064a\u0629 (\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629)" \u0648\u062d\u0645\u0651\u0644 \u0627\u0644\u062d\u0632\u0645\u0629',
      '\u2465 \u0627\u0631\u062c\u0639 \u0648\u0623\u0639\u062f \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631',
    ] : [
      '① Backel kaghavadrumner',
      '② Matcheliunyun → Google TTS',
      '③ Entrkel araberen lezun',
      '④ Nerbernel dzaynayin pacet',
      '⑤ Veradardnal ev krkni pordzel',
    ],

    ios_tts: ar ? [
      '\u2460 \u0627\u0641\u062a\u062d \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
      '\u2461 \u0625\u0645\u0643\u0627\u0646\u064a\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u2190 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0645\u0646\u0637\u0648\u0642',
      '\u2462 \u0627\u0636\u063a\u0637 "\u0627\u0644\u0623\u0635\u0648\u0627\u062a" \u062b\u0645 "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"',
      '\u2463 \u062d\u0645\u0651\u0644 \u0635\u0648\u062a \u0639\u0631\u0628\u064a (\u064a\u064f\u0646\u0635\u062d \u0628\u0640 Maged)',
      '\u2464 \u0627\u0631\u062c\u0639 \u0648\u0623\u0639\u062f \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631',
    ] : [
      '① Backel Kaghavadrumner',
      '② Matcheliunyun → Khosvatk',
      '③ Dzayner → Araberen',
      '④ Nerbernal araberen dzayn',
      '⑤ Veradardnal ev krkni pordzel',
    ],

    desktop_tts: ar ? [
      '\u2460 \u062a\u0623\u0643\u062f \u0645\u0646 \u0631\u0641\u0639 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0635\u0648\u062a',
      '\u2461 \u062c\u0631\u0651\u0628 \u0645\u062a\u0635\u0641\u062d Chrome \u0623\u0648 Edge',
      '\u2462 \u062a\u062d\u0642\u0642 \u0645\u0646 \u0623\u0630\u0648\u0646\u0627\u062a \u0627\u0644\u0635\u0648\u062a \u0641\u064a \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d',
    ] : [
      '① Stugel dzayni makadardk',
      '② Pordzel Chrome kam Edge',
      '③ Stgkel dzayni thuyltvrutyunner',
    ],

    mic_title: ar ? '\u0627\u0644\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646 \u2014 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u062a\u0633\u062c\u064a\u0644' : 'Microphone — Dzaynagruthyan thuyltvrutyan',
    mic_desc:  ar
      ? '\u064a\u062d\u062a\u0627\u062c \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646 \u0644\u062a\u0642\u064a\u064a\u0645 \u0646\u0637\u0642\u0643 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629. \u0627\u0636\u063a\u0637 "\u0627\u0644\u0633\u0645\u0627\u062d" \u0639\u0646\u062f \u0638\u0647\u0648\u0631 \u0627\u0644\u0646\u0627\u0641\u0630\u0629.'
      : 'Haveluats@ karik uni xosofooli thuyltvrutyan hamar. Sgmel "Thuyltatrel":',
    mic_btn:   ar ? '\ud83c\udfa4 \u0627\u0637\u0644\u0628 \u0625\u0630\u0646 \u0627\u0644\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646' : '🎙️ Thuyltatrel',
    mic_ok:    ar ? '\u0625\u0630\u0646 \u0627\u0644\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646 \u0645\u0645\u0646\u0648\u062d \u2713'        : 'Xosofooli thuyltvrutyan ✓',
    mic_fail:  ar ? '\u062a\u0645 \u0631\u0641\u0636 \u0627\u0644\u0625\u0630\u0646 \u2014 \u062a\u062d\u0642\u0642 \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d' : 'Merzhvets — stgkel duylerchey kaghavadrumner',
    mic_skip:  ar ? '\u062a\u062e\u0637\u064a (\u0644\u0646 \u064a\u0645\u0643\u0646 \u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0646\u0637\u0642)' : 'Bac thoughtl (arjanvum che ardasanvutyune)',

    rec_title:   ar ? '\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 (\u0663 \u062b\u0648\u0627\u0646\u064d)' : 'Dzaynagruthyan test (3 vrkyan)',
    rec_desc:    ar
      ? '\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0648\u062a\u062d\u062f\u0651\u062b \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629. \u0633\u064a\u064f\u0633\u062c\u0651\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0663 \u062b\u0648\u0627\u0646\u064d \u062b\u0645 \u064a\u064f\u0639\u064a\u062f \u062a\u0634\u063a\u064a\u0644\u0647\u0627 \u0644\u0643 \u0644\u0644\u062a\u062d\u0642\u0642.'
      : 'Sgmel knopy ev xoses araberen. Haveluatsy kgranagri 3 vrkyan vor stugek vor mirophone-@ ashxatum e.',
    rec_btn:     ar ? '\u23fa \u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 (\u0663 \u062b\u0648\u0627\u0646\u064d)' : '⏺ Sksel dzaynagruthyun (3 vk.)',
    rec_testing: ar ? '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u0633\u062c\u064a\u0644\u2026 \u062a\u062d\u062f\u0651\u062b \u0627\u0644\u0622\u0646 \ud83c\udfa4' : 'Grangrvum e... xoses hima 🎙️',
    rec_ok:      ar ? '\u062a\u0645 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u2713 \u2014 \u0647\u0644 \u0633\u0645\u0639\u062a \u0635\u0648\u062a\u0643\u061f' : 'Dzaynagruthyune katarvel e ✓ — lushetsinke dzaydz?',
    rec_fail:    ar ? '\u0641\u0634\u0644 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u2014 \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646' : 'Dzaynagruthyune chapvets',
    rec_skip:    ar ? '\u062a\u062e\u0637\u064a \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u2192'                                                                        : 'Bac thoughtl testy →',

    done_title: ar ? '\u0623\u0646\u062a \u062c\u0627\u0647\u0632! \ud83c\udf89' : 'Patrastem eq! 🎉',
    done_desc:  ar
      ? '\u064a\u0645\u0643\u0646\u0643 \u062f\u0627\u0626\u0645\u0627\u064b \u062a\u063a\u064a\u064a\u0631 \u0647\u0630\u0647 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0644\u0627\u062d\u0642\u0627\u064b \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0647\u0627\u062a\u0641\u0643.'
      : 'Duk karoly eq misht kherkey kaghavadrumner@ dzez telefoniy midjotov.',

    warn_partial: ar
      ? '\u0628\u0639\u0636 \u0627\u0644\u0645\u064a\u0632\u0627\u062a \u0642\u062f \u062a\u0639\u0645\u0644 \u0628\u0635\u0648\u0631\u0629 \u0645\u062d\u062f\u0648\u062f\u0629. \u064a\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0625\u0639\u062f\u0627\u062f \u0644\u0627\u062f\u064b\u0627.'
      : 'Orinakhi funktsianery karox en siamavorabar ashxatel. Karoly eq verakargavel heto.',
  };

  // ─── Icône de statut ─────────────────────────────────────────────────────
  const StateIcon = ({ state }: { state: TestState }) => {
    if (state === 'ok')      return <CheckCircle className="text-green-500 shrink-0" size={22} />;
    if (state === 'fail')    return <XCircle className="text-red-400 shrink-0" size={22} />;
    if (state === 'testing') return (
      <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
    );
    return <div className="w-5 h-0.5 bg-gray-300 rounded shrink-0" />;
  };

  // ─── Steps indicator ─────────────────────────────────────────────────────
  const Steps: { id: StepId; icon: React.ReactNode; label: string }[] = [
    { id: 'synthesis',   icon: <Volume2 size={14} />,     label: 'TTS' },
    { id: 'recognition', icon: <Mic size={14} />,         label: ar ? '\u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646' : 'Mic' },
    { id: 'done',        icon: <CheckCircle size={14} />, label: ar ? '\u062c\u0627\u0647\u0632' : 'Պatrastem' },
  ];
  const currentIdx = Steps.findIndex(s => s.id === step);
  const NavChevron = () => ar ? <ChevronLeft size={18} /> : <ChevronRight size={18} />;

  const ttsGuide = platform === 'ios' ? T.ios_tts : platform === 'android' ? T.android_tts : T.desktop_tts;
  const platformLabel = platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : ar ? '\u0627\u0644\u0645\u062a\u0635\u0641\u062d' : 'Desktop';

  // On autorise "Suivant" si état = ok OU fail (pas seulement ok)
  const canProceedTTS = ttsState === 'ok' || ttsState === 'fail';
  const canProceedMic =
    (micState === 'ok' && (recState === 'ok' || recState === 'fail')) ||
    micState === 'fail';

  return (
    <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>

      {/* En-tête */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">{T.title}</h1>
        <p className="text-blue-100 text-sm mt-1">{T.subtitle}</p>

        <div className="flex items-center justify-center gap-2 mt-5">
          {Steps.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all
                ${s.id === step   ? 'bg-white text-blue-700'
                : i < currentIdx  ? 'bg-white/40 text-white'
                :                   'bg-white/10 text-white/50'}`}
            >
              {s.icon}<span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

        {/* ══════════════════════════════════════════════════════════════
            Étape 1 : Google TTS ar-SA
           ══════════════════════════════════════════════════════════════ */}
        {step === 'synthesis' && (
          <>
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Volume2 className="text-blue-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.tts_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.tts_desc}</p>
            </div>

            <button
              onClick={testTTS}
              disabled={ttsState === 'testing'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60"
            >
              {ttsState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.tts_btn}
            </button>

            {(ttsState === 'ok' || ttsState === 'fail') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl ${ttsState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                <StateIcon state={ttsState} />
                <p className={`text-sm font-medium ${ttsState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {ttsState === 'ok' ? T.tts_ok : T.tts_fail}
                </p>
              </div>
            )}

            {/* Avertissement : peut continuer malgré l'échec */}
            {ttsState === 'fail' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-xs leading-relaxed">{T.tts_warn}</p>
              </div>
            )}

            {/* Guide d'installation */}
            {ttsState === 'fail' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-800 text-sm">
                    {platformLabel} — {ar ? '\u062a\u0641\u0639\u064a\u0644 Google TTS \u0627\u0644\u0639\u0631\u0628\u064a' : 'Google TTS araberen aktiv.'}
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

        {/* ══════════════════════════════════════════════════════════════
            Étape 2 : Microphone + enregistrement réel
           ══════════════════════════════════════════════════════════════ */}
        {step === 'recognition' && (
          <>
            {/* Phase 1 : Permission micro */}
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
              onClick={requestMic}
              disabled={micState === 'testing' || micState === 'ok'}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60"
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

            {/* Phase 2 : Test d'enregistrement réel (seulement si micro ok) */}
            {micState === 'ok' && (
              <>
                <div className="h-px bg-gray-100" />

                <div className="bg-indigo-50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <PlayCircle className="text-indigo-600" size={20} />
                    </div>
                    <h2 className="font-bold text-gray-800">{T.rec_title}</h2>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{T.rec_desc}</p>
                </div>

                <button
                  onClick={testRecording}
                  disabled={recState === 'testing' || recState === 'ok'}
                  className={`w-full py-4 rounded-2xl font-bold text-base
                              flex items-center justify-center gap-2
                              active:scale-95 transition-transform disabled:opacity-60
                              ${recState === 'testing' ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}
                >
                  {recState === 'testing' ? T.rec_testing : T.rec_btn}
                </button>

                {(recState === 'ok' || recState === 'fail') && (
                  <div className={`flex items-start gap-3 p-4 rounded-2xl ${recState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <StateIcon state={recState} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${recState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                        {recState === 'ok' ? T.rec_ok : T.rec_fail}
                      </p>
                      {recState === 'ok' && recAudioURL && (
                        <audio src={recAudioURL} controls className="mt-2 w-full h-8 rounded-lg" />
                      )}
                    </div>
                  </div>
                )}

                {recState === 'idle' && (
                  <button onClick={() => setRecState('fail')} className="w-full text-center text-xs text-gray-400 underline py-1">
                    {T.rec_skip}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            Étape 3 : Terminé
           ══════════════════════════════════════════════════════════════ */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{T.done_title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{T.done_desc}</p>

            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Volume2 size={16} /><span>{T.tts_title}</span></div>
                <StateIcon state={ttsState} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Mic size={16} /><span>{T.mic_title}</span></div>
                <StateIcon state={micState} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600"><PlayCircle size={16} /><span>{T.rec_title}</span></div>
                <StateIcon state={recState} />
              </div>
            </div>

            {(ttsState === 'fail' || micState === 'fail' || recState === 'fail') && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-start w-full">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-xs leading-relaxed">{T.warn_partial}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 space-y-2">

        {step === 'synthesis' && (
          <>
            <button
              onClick={() => setStep('recognition')}
              disabled={!canProceedTTS}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                canProceedTTS
                  ? ttsState === 'ok'
                    ? 'bg-gray-800 text-white active:scale-95'
                    : 'bg-amber-500 text-white active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {ttsState === 'fail' && <AlertTriangle size={16} />}
              <span>{T.next}</span>
              <NavChevron />
            </button>
            <button onClick={onDone} className="w-full text-center text-xs text-gray-400 underline py-1 flex items-center justify-center gap-1">
              <SkipForward size={12} />{T.skip}
            </button>
          </>
        )}

        {step === 'recognition' && (
          <>
            <button
              onClick={() => setStep('done')}
              disabled={!canProceedMic}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                canProceedMic
                  ? (micState === 'ok' && recState === 'ok')
                    ? 'bg-gray-800 text-white active:scale-95'
                    : 'bg-amber-500 text-white active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {micState === 'fail' && <AlertTriangle size={16} />}
              <span>{T.next}</span>
              <NavChevron />
            </button>
            {(micState === 'idle' || micState === 'fail') && (
              <button onClick={() => setStep('done')} className="w-full text-center text-xs text-gray-400 underline py-1 flex items-center justify-center gap-1">
                <SkipForward size={12} />{T.mic_skip}
              </button>
            )}
          </>
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
