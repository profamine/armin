import { LessonData, LessonStep, MatchPair, QuizOption } from './types';

import { u1 } from './lessons/u1';
import { u2 } from './lessons/u2';
import { u3 } from './lessons/u3';
import { u4 } from './lessons/u4';
import { u5 } from './lessons/u5';
import { u6 } from './lessons/u6';
import { u7 } from './lessons/u7';
import { u8 } from './lessons/u8';
import { u9 } from './lessons/u9';
import { u10 } from './lessons/u10';
import { u11 } from './lessons/u11';
import { u12 } from './lessons/u12';

export const lessonsData: Record<string, LessonData> = {
  u1,
  u2,
  u3,
  u4,
  u5,
  u6,
  u7,
  u8,
  u9,
  u10,
  u11,
  u12,
};

export type { LessonData, LessonStep, MatchPair, QuizOption };
