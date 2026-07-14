// Фильтр нецензурной лусикатуры
// Включает обходы через замену букв на похожие символы

const PROFANITY_LIST: string[] = [
  // Базовые слова
  'хуй', 'хуе', 'хуи', 'хуя', 'хую', 'хуем', 'хуев', 'хуёв',
  'пизд', 'пизд', 'пизд', 'пизд', 'пизд', 'пизд',
  'бляд', 'блят', 'бляд', 'блят',
  'еба', 'ёба', 'еба', 'ёба', 'еба', 'ёба', 'еба', 'ёба',
  'ёбн', 'ебн', 'ёбн', 'ебн',
  'наху', 'наху', 'наёб', 'наеб',
  'уеба', 'уёба', 'уеба', 'уёба',
  'сук', 'сука', 'суки', 'сук',
  'жоп', 'жопа', 'жопу', 'жопе',
  'муда', 'мудо', 'муди', 'муда',
  'говн', 'говно', 'говна', 'говном',
  'дерьм', 'дерьмо', 'дерьма', 'дерьмом',
  'сран', 'срать', 'срал', 'сру',
  'пидр', 'пидор', 'пидор', 'пидор', 'пидор',
  'падл', 'падла', 'падлу', 'падлом',
  'манда', 'манду', 'мандой',
  'херн', 'херня', 'херни', 'хернёй',
  'шлюх', 'шлюха', 'шлюху', 'шлюхой',
  'выеб', 'въеб', 'вyeб',
  'заеба', 'зaeба', 'заёба', 'заеба',
  'отеба', 'отёба', 'отъеб',
  'попой', 'попа', 'попу',
];

// Паттерны обхода: буквы → похожие символы
const BYPASS_MAP: Record<string, string[]> = {
  'а': ['а', 'a', '4', '@'],
  'о': ['о', 'o', '0', '()'],
  'е': ['е', 'e', 'э', '3'],
  'у': ['у', 'y', 'у', 'u'],
  'и': ['и', 'i', '1', '!'],
  'с': ['с', 'c', 's', '$'],
  'р': ['р', 'p'],
  'к': ['к', 'k'],
  'н': ['н', 'h'],
  'т': ['т', 't', '7'],
  'в': ['в', 'v'],
  'м': ['м', 'm'],
  'л': ['л', 'l'],
  'д': ['д', 'd'],
  'б': ['б', 'b'],
  'г': ['г', 'g'],
  'з': ['з', 'z'],
  'я': ['я', 'я', '9'],
  'ю': ['ю', 'io'],
  'ё': ['ё', 'e', 'e', 'э'],
  'ж': ['ж', 'zh', 'x'],
  'ц': ['ц', 'c', 'u'],
  'ч': ['ч', 'ch'],
  'ш': ['ш', 'sh', 'w'],
  'щ': ['щ', 'sch', 'w'],
  'э': ['э', 'e', '3'],
  'ы': ['ы', 'y', 'b'],
  'ъ': ['ъ', '`'],
  'ь': ['ь', "'"],
  'й': ['й', 'y', 'i'],
};

// Генерация regex паттерна для обходов
function generateBypassPattern(word: string): RegExp {
  let pattern = '';
  for (const char of word) {
    const alternatives = BYPASS_MAP[char.toLowerCase()];
    if (alternatives && alternatives.length > 0) {
      const chars = [...new Set(alternatives.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))];

      pattern += `(?:${chars.join('|')})`;
    } else {
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(pattern, 'gi');
}

// Создаём массив паттернов один раз
const PROFANITY_PATTERNS: RegExp[] = PROFANITY_LIST.map(word => generateBypassPattern(word));

// Дополнительные паттерны для явных обходов
const EXTRA_PATTERNS: RegExp[] = [
  // Разделители букв: х.у.й, х-у-й, х_у_й
  /х[\s\.\-_*#]{0,2}у[\s\.\-_*#]{0,2}й/gi,
  /п[\s\.\-_*#]{0,2}и[\s\.\-_*#]{0,2}з[\s\.\-_*#]{0,2}д/gi,
  /б[\s\.\-_*#]{0,2}л[\s\.\-_*#]{0,2}я[\s\.\-_*#]{0,2}д/gi,
  /е[\s\.\-_*#]{0,2}б[\s\.\-_*#]{0,2}а/gi,
  /с[\s\.\-_*#]{0,2}у[\s\.\-_*#]{0,2}к/gi,
  /ж[\s\.\-_*#]{0,2}о[\s\.\-_*#]{0,2}п/gi,
];

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  foundWords: string[];
}

export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text) return { hasProfanity: false, foundWords: [] };

  const normalizedText = text
    .toLowerCase()
    .replace(/[^а-яёa-z0-9]/g, '') // Убираем всё кроме букв и цифр
    .replace(/(.)\1+/g, '$1'); // Убираем повторяющиеся буквы (хххуууй → хууй)

  const foundWords: string[] = [];

  // Проверяем базовые паттерны
  for (let i = 0; i < PROFANITY_PATTERNS.length; i++) {
    if (PROFANITY_PATTERNS[i].test(normalizedText)) {
      foundWords.push(PROFANITY_LIST[i]);
    }
    // Сбрасываем lastIndex для глобальных regex
    PROFANITY_PATTERNS[i].lastIndex = 0;
  }

  // Проверяем дополнительные паттерны
  for (const pattern of EXTRA_PATTERNS) {
    if (pattern.test(text.toLowerCase())) {
      foundWords.push('обход через разделители');
    }
    pattern.lastIndex = 0;
  }

  return {
    hasProfanity: foundWords.length > 0,
    foundWords: [...new Set(foundWords)],
  };
}

export const PROFANITY_WARNING = 'Текст содержит нецензурную лексику. Публикация подобного контента запрещена и может привести к блокировке аккаунта.';
