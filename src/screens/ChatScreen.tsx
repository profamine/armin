import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Languages,
  ChevronDown,
  Smile,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  X,
  MessageCircle,
  Lightbulb,
  GraduationCap,
  Clock,
  Trash2,
  Settings,
  Info,
} from 'lucide-react';

// ===== Types =====
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  translation?: string;
  transliteration?: string;
  isTyping?: boolean;
  rating?: 'up' | 'down' | null;
  corrections?: string[];
  vocabulary?: VocabWord[];
  audioPlaying?: boolean;
  type?: 'text' | 'quiz' | 'tip' | 'correction';
}

interface VocabWord {
  arabic: string;
  armenian: string;
  transliteration: string;
}

interface QuickReply {
  text: string;
  arabic: string;
}

// ===== AI Response Logic =====
const aiResponses: Record<string, { text: string; translation?: string; transliteration?: string; vocabulary?: VocabWord[]; type?: string }> = {
  'مرحبا': {
    text: 'مرحباً! كيف حالك اليوم؟',
    translation: 'Բարև! Ինչպե՞ս ես այսօր:',
    transliteration: 'Marhaba! Kayf halak alyawm?',
    vocabulary: [
      { arabic: 'مرحباً', armenian: 'Բարև', transliteration: 'Marhaba' },
      { arabic: 'كيف حالك', armenian: 'Ինչպե՞ս ես', transliteration: 'Kayf halak' },
    ],
  },
};

const getAIResponse = (userMessage: string): Omit<Message, 'id' | 'timestamp'> => {
  const lowerMsg = userMessage.toLowerCase().trim();

  if (lowerMsg.includes('مرحبا') || lowerMsg.includes('سلام') || lowerMsg.includes('باrev') || lowerMsg.includes('բարև')) {
    return {
      sender: 'ai',
      text: 'وعليكم السلام! كيف حالك اليوم؟ 😊\n\nԲարև ձեզ! Ինչպե՞ս եք այսօր:',
      translation: 'Բարև ձեզ! Ինչպե՞ս եք այսօր:',
      transliteration: "Wa'alaykum assalam! Kayf halak alyawm?",
      vocabulary: [
        { arabic: 'السلام عليكم', armenian: 'Խաղաղություն ձեզ', transliteration: 'Assalamu alaykum' },
        { arabic: 'كيف حالك', armenian: 'Ինչպե՞ս ես', transliteration: 'Kayf halak' },
        { arabic: 'اليوم', armenian: 'Այսօր', transliteration: 'Alyawm' },
      ],
      type: 'text',
    };
  }

  if (lowerMsg.includes('شكرا') || lowerMsg.includes('շնորհակալություն') || lowerMsg.includes('merci')) {
    return {
      sender: 'ai',
      text: 'عفواً! أنت تتعلم بسرعة! 🌟\n\nԽնդրեմ! Դուք արագ եք սովորում!',
      translation: 'Խնդրեմ! Դուք արագ եք սովորում!',
      transliteration: "'Afwan! Anta tata'allam bisur'a!",
      vocabulary: [
        { arabic: 'عفواً', armenian: 'Խնդրեմ', transliteration: "'Afwan" },
        { arabic: 'تتعلم', armenian: 'Սովորում ես', transliteration: "Tata'allam" },
        { arabic: 'بسرعة', armenian: 'Արագ', transliteration: "Bisur'a" },
      ],
      type: 'text',
    };
  }

  if (lowerMsg.includes('quiz') || lowerMsg.includes('test') || lowerMsg.includes('քննություն') || lowerMsg.includes('امتحان')) {
    return {
      sender: 'ai',
      text: "📝 هيا نختبر معلوماتك!\n\nما معنى كلمة 'كتاب' بالأرمنية؟\n\nأ) Տուն\nب) Գիրք\nج) Մարդ\nد) Դպրոց",
      translation: 'Եկեք ստուգենք ձեր գիտելիքները:\n\nԻ՞նչ է նշանակում «գիրք» բառը հայերեն:',
      type: 'quiz',
    };
  }

  if (lowerMsg.includes('help') || lowerMsg.includes('օգնություն') || lowerMsg.includes('مساعدة')) {
    return {
      sender: 'ai',
      text: '🎓 يمكنني مساعدتك في:\n\n1️⃣ تعلم كلمات جديدة\n2️⃣ تصحيح القواعد\n3️⃣ اختبارات قصيرة\n4️⃣ محادثة حرة\n5️⃣ ترجمة جمل\n\nماذا تريد أن تتعلم اليوم؟',
      translation: 'Ես կարող եմ օգնել ձեզ՝\n1️⃣ սովորել նոր բառեր\n2️⃣ ուղղել քերականությունը\n3️⃣ կարճ թեստեր\n4️⃣ ազատ զրույց\n5️⃣ թարգմանել նախադասություններ\n\nԻ՞նչ եք ուզում սովորել այսօր:',
      type: 'tip',
    };
  }

  // Default responses
  const defaults = [
    {
      text: 'ممتاز! استمر في التعلم! 📚\n\nهل تريد أن نتعلم كلمات جديدة أم نمارس المحادثة؟',
      translation: 'Գերազանց է: Շարունակեք սովորել: Ուզու՞մ եք նոր բառեր սովորել, թե՞ զրուցել:',
      transliteration: 'Mumtaz! Istamirr fi al-ta\'allum!',
      vocabulary: [
        { arabic: 'ممتاز', armenian: 'Գերազանց', transliteration: 'Mumtaz' },
        { arabic: 'استمر', armenian: 'Շարունակիր', transliteration: 'Istamirr' },
        { arabic: 'التعلم', armenian: 'Սովորել', transliteration: "Al-ta'allum" },
      ],
    },
    {
      text: 'جيد جداً! 👏 لقد استخدمت الجملة بشكل صحيح.\n\nدعنا نتعلم المزيد!',
      translation: 'Շատ լավ: Դուք ճիշտ օգտագործեցիք նախադասությունը: Եկեք ավելին սովորենք:',
      transliteration: 'Jayyid jiddan!',
    },
    {
      text: "💡 نصيحة اليوم:\nفي اللغة العربية، الفعل يأتي قبل الفاعل.\nمثال: 'ذهب الولد' وليس 'الولد ذهب'\n\nԱրաբերենում բայը գալիս է ենթակայից առաջ:",
      translation: 'Արաբերենում բայը գալիս է ենթակայից առաջ:',
      type: 'tip',
    },
    {
      text: '🔤 كلمة جديدة:\n\nسعادة (sa\'ada) = Երջանկություն\n\nمثال: أشعر بالسعادة اليوم\n(Ես այսօր երջանիկ եմ զգում)',
      translation: 'Նոր բառ՝ Երջանկություն',
      vocabulary: [
        { arabic: 'سعادة', armenian: 'Երջանկություն', transliteration: "Sa'ada" },
        { arabic: 'أشعر', armenian: 'Զգում եմ', transliteration: "Ash'ur" },
      ],
    },
  ];

  return {
    sender: 'ai',
    ...defaults[Math.floor(Math.random() * defaults.length)],
    type: 'text',
  };
};

// ===== Quick Replies =====
const quickReplies: QuickReply[] = [
  { text: 'Բարև', arabic: 'مرحبا' },
  { text: 'Շնորհակալություն', arabic: 'شكراً لك' },
  { text: 'Թեստ', arabic: 'اختبار' },
  { text: 'Օգնություն', arabic: 'مساعدة' },
  { text: 'Նոր բառեր', arabic: 'كلمات جديدة' },
  { text: 'Ուղղում', arabic: 'تصحيح' },
];

// ===== Typing Indicator Component =====
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Vocabulary Card Component =====
function VocabularyCard({ words }: { words: VocabWord[] }) {
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
        <BookOpen size={12} />
        Նոր բառեր / كلمات جديدة
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((word, idx) => (
          <button
            key={idx}
            onClick={() => setFlipped(flipped === idx ? null : idx)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 transform ${
              flipped === idx
                ? 'bg-emerald-500 text-white scale-105 shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {flipped === idx ? (
              <span className="block text-center">
                <span className="block text-sm">{word.armenian}</span>
                <span className="block text-[10px] opacity-80 mt-0.5">{word.transliteration}</span>
              </span>
            ) : (
              <span className="text-sm">{word.arabic}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== Message Bubble Component =====
function MessageBubble({
  message,
  onRate,
  onCopy,
  onSpeak,
}: {
  message: Message;
  onRate: (id: number, rating: 'up' | 'down') => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const isUser = message.sender === 'user';

  const handleCopy = () => {
    onCopy(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = () => {
    switch (message.type) {
      case 'quiz':
        return <GraduationCap size={14} className="text-purple-500" />;
      case 'tip':
        return <Lightbulb size={14} className="text-amber-500" />;
      case 'correction':
        return <Languages size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeBadge = () => {
    switch (message.type) {
      case 'quiz':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 mb-2">
            <GraduationCap size={10} /> QUIZ
          </span>
        );
      case 'tip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-2">
            <Lightbulb size={10} /> TIP
          </span>
        );
      case 'correction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 mb-2">
            <Languages size={10} /> CORRECTION
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0 mb-1">
            <Bot size={16} className="text-white" />
          </div>
        )}
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0 mb-1">
            <User size={16} className="text-white" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          {/* Message Bubble */}
          <div
            className={`relative px-4 py-3 rounded-2xl transition-all duration-200 ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm shadow-md shadow-blue-200'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
            }`}
          >
            {!isUser && getTypeBadge()}
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>

            {/* Translation toggle */}
            {!isUser && message.translation && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                <Languages size={12} />
                {showTranslation ? 'Թաքցնել թարգմանությունը' : 'Տեսնել թարգմանությունը'}
              </button>
            )}

            {showTranslation && message.translation && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">{message.translation}</p>
                {message.transliteration && (
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">{message.transliteration}</p>
                )}
              </div>
            )}

            {/* Vocabulary */}
            {!isUser && message.vocabulary && message.vocabulary.length > 0 && (
              <VocabularyCard words={message.vocabulary} />
            )}
          </div>

          {/* Timestamp & Actions */}
          <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">
              {message.timestamp.toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
                </button>
                <button
                  onClick={() => onSpeak(message.text)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Listen"
                >
                  <Volume2 size={12} className="text-gray-400" />
                </button>
                <button
                  onClick={() => onRate(message.id, 'up')}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${message.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => onRate(message.id, 'down')}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${message.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Chat Screen =====
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '🌟 مرحباً بك في درس اللغة العربية!\n\nأنا معلمك الذكي. يمكنني:\n\n📚 تعليمك كلمات جديدة\n✍️ تصحيح أخطائك\n📝 إعطائك اختبارات\n💬 التحدث معك\n\nمن أين تريد أن نبدأ؟',
      sender: 'ai',
      timestamp: new Date(),
      translation: 'Բարի գալուստ արաբերենի դաս:\n\nԵս քո խելացի ուսուցիչն եմ:',
      transliteration: 'Marhaban bik fi dars al-lugha al-arabiyya!',
      type: 'text',
      vocabulary: [
        { arabic: 'مرحباً', armenian: 'Բարև', transliteration: 'Marhaban' },
        { arabic: 'معلم', armenian: 'Ուսուցիչ', transliteration: "Mu'allim" },
        { arabic: 'اللغة العربية', armenian: 'Արաբերեն', transliteration: 'Al-lugha al-arabiyya' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simulate AI thinking + typing
    const thinkTime = 800 + Math.random() * 1200;
    setTimeout(() => {
      const response = getAIResponse(messageText);
      const aiMsg: Message = {
        id: Date.now() + 1,
        ...response,
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
      setShowQuickReplies(true);
    }, thinkTime);
  };

  const handleRate = (id: number, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, rating } : msg)));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: '🔄 تم مسح المحادثة. هيا نبدأ من جديد!\n\nԶրույցը ջնջված է: Եկեք նորից սկսենք:',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
      },
    ]);
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 max-w-lg mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200/50 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors lg:hidden">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
              <Bot size={22} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              AI Ուսուցիչ
              <Sparkles size={14} className="text-amber-500" />
            </h1>
            <p className="text-[11px] text-green-500 font-medium">Առցանց · Պատրաստ է օգնել</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Phone size={18} className="text-gray-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Video size={18} className="text-gray-500" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleClearChat}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                    Ջնջել զրույցը
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <Settings size={16} className="text-gray-400" />
                    Կարգավորումներ
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <Info size={16} className="text-gray-400" />
                    Օգնություն
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Separator */}
      <div className="flex justify-center py-3">
        <span className="bg-white/80 backdrop-blur-sm text-[11px] text-gray-500 px-3 py-1 rounded-full border border-gray-200/50 shadow-sm flex items-center gap-1.5">
          <Clock size={11} />
          {new Date().toLocaleDateString('hy-AM', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRate={handleRate}
            onCopy={handleCopy}
            onSpeak={handleSpeak}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-36 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all z-20 animate-bounce"
        >
          <ChevronDown size={20} className="text-gray-600" />
        </button>
      )}

      {/* Quick Replies */}
      {showQuickReplies && !isTyping && (
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply.arabic)}
                className="flex-shrink-0 px-3.5 py-2 bg-white border border-emerald-200 rounded-full text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
              >
                <span className="block text-sm">{reply.arabic}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-3 py-3 z-20">
        <div className="flex items-end gap-2">
          <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 mb-0.5">
            <Smile size={22} className="text-gray-400" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="اكتب بالعربية أو بالأرمنية..."
              className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none border border-transparent focus:border-emerald-200 placeholder-gray-400"
              dir="auto"
            />
          </div>
          {input.trim() ? (
            <button
              onClick={() => handleSend()}
              className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 active:scale-95 flex-shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 active:scale-95 flex-shrink-0">
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}