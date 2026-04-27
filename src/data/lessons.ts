export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface LessonStep {
  id: number;
  type: "listen" | "speak" | "quiz" | "match" | "write";
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

export interface LessonData {
  id: string;
  title: string;
  titleAr: string;
  steps: LessonStep[];
  xpReward: number;
}

export const lessonsData: Record<string, LessonData> = {
  u1: {
    id: "u1",
    title: "Տառեր և ձայնավորներ",
    titleAr: "الحروف والحركات الأساسية",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "بِ",
        armenian: "բի",
        transliteration: "bi",
        meaning: "Ընտրեք ճիշտ շարժումը (bi)",
        options: [
          { text: "بَ", correct: false },
          { text: "بِ", correct: true },
          { text: "بُ", correct: false },
          { text: "بْ", correct: false },
        ],
      },
      {
        id: 2,
        type: "quiz",
        arabic: "تُ",
        armenian: "թու",
        transliteration: "tu",
        meaning: "Ընտրեք ճիշտ շարժումը (tu)",
        options: [
          { text: "تَ", correct: false },
          { text: "تِ", correct: false },
          { text: "تُ", correct: true },
          { text: "تْ", correct: false },
        ],
      },
      {
        id: 3,
        type: "quiz",
        arabic: "ثَ",
        armenian: "սա",
        transliteration: "tha",
        meaning: "Ընտրեք ճիշտ շարժումը (tha)",
        options: [
          { text: "ثَ", correct: true },
          { text: "ثِ", correct: false },
          { text: "ثُ", correct: false },
          { text: "ثْ", correct: false },
        ],
      },
      {
        id: 4,
        type: "listen",
        arabic: "مَكْتَب",
        armenian: "գրասեղան",
        transliteration: "maktab",
        highlightChar: "مَـ",
        hint: "م + ك + ت + ب = مكتب",
      },
      {
        id: 5,
        type: "listen",
        arabic: "سَيَّارَة",
        armenian: "մեքենա",
        transliteration: "sayyāra",
        highlightChar: "سَـ",
        hint: "س + ي + ا + ر + ة = سيارة",
      },
    ],
  },
  u2: {
    id: "u2",
    title: "Երկարացումներ (ա, ու, ի)",
    titleAr: "المدود",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "بَا",
        armenian: "բաա",
        transliteration: "bā",
        meaning: "Լրացրեք համապատասխան երկարացումը (بَ) - با",
        options: [
          { text: "بَا", correct: true },
          { text: "بُو", correct: false },
          { text: "بِي", correct: false },
        ],
      },
      {
        id: 2,
        type: "quiz",
        arabic: "بُو",
        armenian: "բուու",
        transliteration: "bū",
        meaning: "Լրացրեք համապատասխան երկարացումը (بُ) - بو",
        options: [
          { text: "بَا", correct: false },
          { text: "بُو", correct: true },
          { text: "بِي", correct: false },
        ],
      },
      {
        id: 3,
        type: "listen",
        arabic: "بَاب",
        armenian: "դուռ",
        transliteration: "bāb",
        hint: "Այս բառն ունի երկարացում (مد ا)",
        highlightChar: "بَا",
      },
      {
        id: 4,
        type: "listen",
        arabic: "نُور",
        armenian: "լույս",
        transliteration: "nūr",
        hint: "Այս բառն ունի երկարացում (مد و)",
        highlightChar: "نُو",
      },
      {
        id: 5,
        type: "quiz",
        arabic: "نُور",
        armenian: "լույս",
        transliteration: "nūr",
        meaning: "Արդյո՞ք այս բառն ունի երկարացում:",
        options: [
          { text: "Այո", correct: true },
          { text: "Ոչ", correct: false },
        ],
      },
      {
        id: 6,
        type: "quiz",
        arabic: "بِنْت",
        armenian: "աղջիկ",
        transliteration: "bint",
        meaning: "Արդյո՞ք այս բառն ունի երկարացում:",
        options: [
          { text: "Այո", correct: false },
          { text: "Ոչ", correct: true },
        ],
      },
    ],
  },
  u3: {
    id: "u3",
    title: "Թանուին",
    titleAr: "التنوين",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "كِتَابٌ",
        armenian: "գիրք (անորոշ, ուղղական)",
        transliteration: "kitābun",
        meaning: "Ընտրեք ճիշտ թանուինը (رفع)",
        options: [
          { text: "كِتَابٌ", correct: true },
          { text: "كِتَاباً", correct: false },
          { text: "كِتَابٍ", correct: false },
        ],
      },
      {
        id: 2,
        type: "quiz",
        arabic: "كِتَاباً",
        armenian: "գիրք (անորոշ, հայցական)",
        transliteration: "kitāban",
        meaning: "Ընտրեք ճիշտ թանուինը (نصب)",
        options: [
          { text: "كِتَابٌ", correct: false },
          { text: "كِتَاباً", correct: true },
          { text: "كِتَابٍ", correct: false },
        ],
      },
      {
        id: 3,
        type: "listen",
        arabic: "طَالِبٌ",
        armenian: "ուսանող (անորոշ, ուղղական)",
        transliteration: "ṭālibun",
        highlightChar: "بٌ",
      },
      {
        id: 4,
        type: "quiz",
        arabic: "بَيْتٌ",
        armenian: "տուն (انորոշ, ուղղական)",
        transliteration: "baytun",
        meaning: "Ո՞ր տեսակի թանուին է տեղադրված בֵּיתٌ-ում",
        options: [
          { text: "tنوين الرفع (ٌ)", correct: true },
          { text: "tنوين النصب (ً)", correct: false },
          { text: "tنوين الجر (ٍ)", correct: false },
        ],
      },
    ],
  },
  u4: {
    id: "u4",
    title: "Իրաբ",
    titleAr: "الإعراب",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "هَذَا طَالِبٌ",
        armenian: "Սա ուսանող է:",
        transliteration: "hādhā ṭālibun",
        meaning: "Ընտրեք ճիշտ վերջավորությունը:",
        options: [
          { text: "طَالِبٌ", correct: true },
          { text: "طَالِباً", correct: false },
          { text: "طَالِبٍ", correct: false },
        ],
      },
      {
        id: 2,
        type: "quiz",
        arabic: "فِي البَيْتِ",
        armenian: "Տան մեջ:",
        transliteration: "fi l-bayti",
        meaning: "Ընտրել ճիշտ տարբերակը (في...",
        options: [
          { text: "البَيْتِ", correct: true },
          { text: "البَيْتُ", correct: false },
          { text: "البَيْتَ", correct: false },
        ],
      },
      {
        id: 3,
        type: "listen",
        arabic: "رَأَيْتُ طَالِباً",
        armenian: "Ես տեսա մի ուսանողի:",
        transliteration: "ra'aytu ṭāliban",
        highlightChar: "باً",
      },
    ],
  },
  u5: {
    id: "u5",
    title: "Թվեր 1-10",
    titleAr: "الأعداد من 1 إلى 10",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "listen",
        arabic: "وَاحِد",
        armenian: "մեկ (1)",
        transliteration: "wāḥid",
        highlightChar: "و",
      },
      {
        id: 2,
        type: "listen",
        arabic: "اثْنَان",
        armenian: "երկու (2)",
        transliteration: "ithnān",
        highlightChar: "ا",
      },
      {
        id: 3,
        type: "quiz",
        arabic: "ثَلَاثَة",
        armenian: "երեք (3)",
        transliteration: "thalātha",
        meaning: "Ո՞ր թիվն է ثَلَاثَة:",
        options: [
          { text: "3", correct: true },
          { text: "4", correct: false },
          { text: "8", correct: false },
        ],
      },
      {
        id: 4,
        type: "quiz",
        arabic: "ثَمَانِيَة",
        armenian: "ութ (8)",
        transliteration: "thamāniya",
        meaning: "Ո՞ր թիվն է ثَمَانِيَة:",
        options: [
          { text: "6", correct: false },
          { text: "8", correct: true },
          { text: "10", correct: false },
        ],
      },
      {
        id: 5,
        type: "quiz",
        arabic: "عِنْدِي ثَلَاثَةُ كُتُبٍ",
        armenian: "Ես ունեմ երեք գիրք",
        transliteration: "ʿindī thalāthatu kutubin",
        meaning: "Ընտրեք ճիշտ տարբերակը՝ ثَلَاثَةُ ...",
        options: [
          { text: "كِتَاب", correct: false },
          { text: "كُتُبٍ", correct: true },
        ],
      },
    ],
  },
  u6: {
    id: "u6",
    title: "Բայեր և դերանուններ",
    titleAr: "أفعال أساسية وضمائر",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "أَنَا أَدْرُسُ فِي الجَامِعَة",
        armenian: "Ես սովորում եմ համալսարանում",
        transliteration: "anā adrusu fi l-jāmiʿa",
        meaning: "Ընտրեք ճիշտ բայը (أَنَا ...)",
        options: [
          { text: "أَدْرُسُ", correct: true },
          { text: "أَشْرَبُ", correct: false },
        ],
      },
      {
        id: 2,
        type: "quiz",
        arabic: "هُوَ يَدْرُسُ فِي الجَامِعَة",
        armenian: "Նա (արական) սովորում է համալսարանում",
        transliteration: "huwa yadrusu fi l-jāmiʿa",
        meaning: 'Ինչպե՞ս է փոխվում "يكتب" բայը "أنت" (դու) դերանվան հետ:',
        options: [
          { text: "أَكْتُبُ", correct: false },
          { text: "تَكْتُبُ", correct: true },
          { text: "يَكْتُبُ", correct: false },
          { text: "نَكْتُبُ", correct: false },
        ],
      },
      {
        id: 3,
        type: "listen",
        arabic: "أَنَا كَتَبْتُ أَمْس",
        armenian: "Ես գրեցի երեկ",
        transliteration: "anā katabtu ams",
      },
      {
        id: 4,
        type: "quiz",
        arabic: "أَنَا دَرَسْتُ أَمْس",
        armenian: "Ես սովորեցի երեկ",
        transliteration: "anā darastu ams",
        meaning:
          'Լրացրեք "دَرَسَ" բայի ճիշտ ձևը أَنَا (ես) դերանվան համար (անցյալ)',
        options: [
          { text: "دَرَسْتُ", correct: true },
          { text: "دَرَسَ", correct: false },
          { text: "أَدْرُسُ", correct: false },
        ],
      },
    ],
  },
  u7: {
    id: "u7",
    title: "Ծանոթություն և նախադասություններ",
    titleAr: "التعارف وجمل بسيطة",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "quiz",
        arabic: "اِسْمِي أَحْمَد",
        armenian: "Իմ անունն է Ահմեդ",
        transliteration: "ismī Aḥmad",
        meaning: "Կազմեք նախադասություն՝ اسمي /أحمد",
        options: [
          { text: "اِسْمِي أَحْمَد", correct: true },
          { text: "أَحْمَد اِسْمِي", correct: false },
        ],
      },
      {
        id: 2,
        type: "listen",
        arabic: "أَنَا مِن أَرْمِينِيَا",
        armenian: "Ես Հայաստանից եմ:",
        transliteration: "anā min Armīniyā",
      },
      {
        id: 3,
        type: "quiz",
        arabic: "مَا اسْمُكَ؟",
        armenian: "Ի՞նչ է քո անունը:",
        transliteration: "mā smuka?",
        meaning:
          "Ավարտեք երկխոսությունը։ — السَّلَامُ عَلَيْكُم — وَعَلَيْكُمُ السَّلَام. ...؟",
        options: [
          { text: "مَا اسْمُكَ؟", correct: true },
          { text: "كَيْفَ حَالُك؟", correct: false },
        ],
      },
      {
        id: 4,
        type: "quiz",
        arabic: "هَذِهِ جَامِعَة",
        armenian: "Սա համալսարան է (իգական):",
        transliteration: "hādhihī jāmiʿa",
        meaning: "Ընտրեք ճիշտ ցուցական դերանունը (هذا / هذه) – .... جَامِعَة",
        options: [
          { text: "هَذَا", correct: false },
          { text: "هَذِهِ", correct: true },
        ],
      },
    ],
  },
  u8: {
    id: "u8",
    title: "Ժամանակ",
    titleAr: "الوقت",
    xpReward: 50,
    steps: [
      {
        id: 1,
        type: "listen",
        arabic: "يَوْمُ السَّبْت",
        armenian: "Շաբաթ օր:",
        transliteration: "yawmu s-sabt",
      },
      {
        id: 2,
        type: "quiz",
        arabic: "يَوْمُ الأَحَد",
        armenian: "Կիրակի օրը:",
        transliteration: "yawmu l-aḥad",
        meaning: "Ո՞ր օրն է հաջորդում Շաբաթվան (السبت):",
        options: [
          { text: "يَوْمُ الأَحَد", correct: true },
          { text: "يَوْمُ الاِثْنَيْن", correct: false },
          { text: "يَوْمُ الجُمُعَة", correct: false },
        ],
      },
      {
        id: 3,
        type: "quiz",
        arabic: "شَهْرُ يَنَايِر",
        armenian: "Հունվար ամիս",
        transliteration: "shahru yanāyir",
        meaning: "Ընտրեք 1-ին ամիսը (հունվար)",
        options: [
          { text: "أَبْرِيل", correct: false },
          { text: "يَنَايِر", correct: true },
          { text: "أَغُسْطُس", correct: false },
        ],
      },
      {
        id: 4,
        type: "quiz",
        arabic: "السَّاعَةُ الثَّالِثَةُ وَالنِّصْف",
        armenian: "Ժամը 3:30",
        transliteration: "as-sāʿatu th-thālithatu wa n-niṣf",
        meaning: "Ընտրեք 3:30-ը արտահայտող ճիշտ տարբերակը։",
        options: [
          { text: "السَّاعَةُ الثَّالِثَةُ وَالنِّصْف", correct: true },
          { text: "السَّاعَةُ الثَّالِثُ وَالنِّصْف", correct: false },
        ],
      },
    ],
  },
};
