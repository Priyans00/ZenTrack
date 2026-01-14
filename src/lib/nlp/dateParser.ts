/**
 * Natural Language Date/Time Parser
 * 
 * A robust offline date/time parser for natural language input.
 * No external dependencies - works fully offline.
 * 
 * Supports:
 * - Relative dates: today, tomorrow, yesterday
 * - Weekdays: monday, next tuesday, this friday
 * - Absolute dates: Jan 15, 2026-01-15, 01/15/2026
 * - Times: 6pm, 18:30, 6:30 PM, at noon
 * - Combined: tomorrow at 6pm, next monday 14:00
 */

// =============================================================================
// Types
// =============================================================================

export interface ParsedDateTime {
  date: Date | null;
  time: { hours: number; minutes: number } | null;
  matchedText: string;
  confidence: 'low' | 'medium' | 'high';
}

// =============================================================================
// Constants
// =============================================================================

const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 
  'thursday', 'friday', 'saturday'
];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_ABBREV: Record<string, number> = {
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

// =============================================================================
// Time Parsing
// =============================================================================

/**
 * Parse time from various formats.
 * Supports: 6pm, 6:30pm, 18:30, 6:30 PM, noon, midnight
 */
export function parseTime(input: string): { 
  time: { hours: number; minutes: number } | null; 
  matchedText: string;
} {
  const normalized = input.toLowerCase().trim();
  
  // Special keywords
  if (/\bnoon\b/.test(normalized)) {
    return { time: { hours: 12, minutes: 0 }, matchedText: 'noon' };
  }
  if (/\bmidnight\b/.test(normalized)) {
    return { time: { hours: 0, minutes: 0 }, matchedText: 'midnight' };
  }
  
  // Pattern: 6pm, 6:30pm, 6:30 pm, 06:30pm
  const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const match12 = normalized.match(timePattern);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { time: { hours, minutes }, matchedText: match12[0] };
    }
  }
  
  // Pattern: 18:30, 6:30 (24-hour or ambiguous)
  const time24Pattern = /\b(\d{1,2}):(\d{2})\b/;
  const match24 = normalized.match(time24Pattern);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { time: { hours, minutes }, matchedText: match24[0] };
    }
  }
  
  return { time: null, matchedText: '' };
}

// =============================================================================
// Date Parsing
// =============================================================================

/**
 * Get the next occurrence of a weekday.
 */
function getNextWeekday(dayIndex: number, referenceDate: Date = new Date()): Date {
  const result = new Date(referenceDate);
  result.setHours(0, 0, 0, 0);
  const currentDay = result.getDay();
  let daysToAdd = dayIndex - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Get the weekday occurrence in current week (this monday, this friday).
 */
function getThisWeekday(dayIndex: number, referenceDate: Date = new Date()): Date {
  const result = new Date(referenceDate);
  result.setHours(0, 0, 0, 0);
  const currentDay = result.getDay();
  const diff = dayIndex - currentDay;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Parse relative date expressions.
 */
function parseRelativeDate(input: string, referenceDate: Date = new Date()): {
  date: Date | null;
  matchedText: string;
} {
  const normalized = input.toLowerCase();
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  
  // Today
  if (/\btoday\b/.test(normalized)) {
    return { date: new Date(today), matchedText: 'today' };
  }
  
  // Tomorrow
  if (/\btomorrow\b/.test(normalized)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow, matchedText: 'tomorrow' };
  }
  
  // Yesterday
  if (/\byesterday\b/.test(normalized)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { date: yesterday, matchedText: 'yesterday' };
  }
  
  // In X days
  const inDaysMatch = normalized.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    return { date: future, matchedText: inDaysMatch[0] };
  }
  
  // Next week
  if (/\bnext\s+week\b/.test(normalized)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return { date: nextWeek, matchedText: 'next week' };
  }
  
  // This weekend (Saturday)
  if (/\bthis\s+weekend\b/.test(normalized)) {
    return { date: getNextWeekday(6, referenceDate), matchedText: 'this weekend' };
  }
  
  // Next weekend
  if (/\bnext\s+weekend\b/.test(normalized)) {
    const saturday = getNextWeekday(6, referenceDate);
    saturday.setDate(saturday.getDate() + 7);
    return { date: saturday, matchedText: 'next weekend' };
  }
  
  return { date: null, matchedText: '' };
}

/**
 * Parse weekday references (next monday, this friday, tuesday).
 */
function parseWeekdayReference(input: string, referenceDate: Date = new Date()): {
  date: Date | null;
  matchedText: string;
} {
  const normalized = input.toLowerCase();
  
  // Build patterns for all weekdays
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const dayName = WEEKDAYS[i];
    const abbrev = dayName.substring(0, 3);
    
    // "next monday", "next mon"
    const nextPattern = new RegExp(`\\bnext\\s+(${dayName}|${abbrev})\\b`, 'i');
    const nextMatch = normalized.match(nextPattern);
    if (nextMatch) {
      const date = getNextWeekday(i, referenceDate);
      // "Next" means at least 7 days out
      const today = new Date(referenceDate);
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        date.setDate(date.getDate() + 7);
      }
      return { date, matchedText: nextMatch[0] };
    }
    
    // "this monday", "this mon"
    const thisPattern = new RegExp(`\\bthis\\s+(${dayName}|${abbrev})\\b`, 'i');
    const thisMatch = normalized.match(thisPattern);
    if (thisMatch) {
      return { date: getThisWeekday(i, referenceDate), matchedText: thisMatch[0] };
    }
    
    // Just "monday" or "mon" - means next occurrence
    const plainPattern = new RegExp(`\\b(${dayName}|${abbrev})\\b`, 'i');
    const plainMatch = normalized.match(plainPattern);
    if (plainMatch) {
      return { date: getNextWeekday(i, referenceDate), matchedText: plainMatch[0] };
    }
  }
  
  return { date: null, matchedText: '' };
}

/**
 * Parse absolute date formats.
 * Supports: Jan 15, January 15, 2026-01-15, 01/15/2026, 15/01/2026
 */
function parseAbsoluteDate(input: string, referenceDate: Date = new Date()): {
  date: Date | null;
  matchedText: string;
} {
  const normalized = input.toLowerCase();
  const currentYear = referenceDate.getFullYear();
  
  // Month day (Jan 15, January 15th)
  for (const [abbrev, monthIndex] of Object.entries(MONTH_ABBREV)) {
    const fullMonth = MONTHS[monthIndex];
    const pattern = new RegExp(
      `\\b(${fullMonth}|${abbrev})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`,
      'i'
    );
    const match = normalized.match(pattern);
    if (match) {
      const day = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : currentYear;
      const date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime()) && date.getDate() === day) {
        return { date, matchedText: match[0] };
      }
    }
  }
  
  // ISO format: 2026-01-15
  const isoPattern = /\b(\d{4})-(\d{2})-(\d{2})\b/;
  const isoMatch = input.match(isoPattern);
  if (isoMatch) {
    const date = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10)
    );
    if (!isNaN(date.getTime())) {
      return { date, matchedText: isoMatch[0] };
    }
  }
  
  // US format: 01/15/2026 or 1/15/2026
  const usPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;
  const usMatch = input.match(usPattern);
  if (usMatch) {
    const date = new Date(
      parseInt(usMatch[3], 10),
      parseInt(usMatch[1], 10) - 1,
      parseInt(usMatch[2], 10)
    );
    if (!isNaN(date.getTime())) {
      return { date, matchedText: usMatch[0] };
    }
  }
  
  // Day/Month format without year: 15th, 21st
  const dayOnlyPattern = /\b(\d{1,2})(?:st|nd|rd|th)\b/;
  const dayOnlyMatch = normalized.match(dayOnlyPattern);
  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);
    
    // Assume current month, or next month if day has passed
    let date = new Date(currentYear, today.getMonth(), day);
    if (date < today) {
      date.setMonth(date.getMonth() + 1);
    }
    if (!isNaN(date.getTime()) && date.getDate() === day) {
      return { date, matchedText: dayOnlyMatch[0] };
    }
  }
  
  return { date: null, matchedText: '' };
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse date and time from natural language input.
 * Returns the parsed datetime and the matched text for removal from title.
 * 
 * @param input - Natural language input string
 * @param referenceDate - Reference date for relative calculations (default: now)
 * @returns ParsedDateTime with date, time, and matched text
 */
export function parseDateTime(
  input: string, 
  referenceDate: Date = new Date()
): ParsedDateTime {
  let matchedParts: string[] = [];
  let date: Date | null = null;
  let time: { hours: number; minutes: number } | null = null;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  // Try parsing date in order of specificity
  // 1. Relative dates (today, tomorrow)
  const relativeResult = parseRelativeDate(input, referenceDate);
  if (relativeResult.date) {
    date = relativeResult.date;
    matchedParts.push(relativeResult.matchedText);
    confidence = 'high';
  }
  
  // 2. Weekday references (next monday, this friday)
  if (!date) {
    const weekdayResult = parseWeekdayReference(input, referenceDate);
    if (weekdayResult.date) {
      date = weekdayResult.date;
      matchedParts.push(weekdayResult.matchedText);
      confidence = 'high';
    }
  }
  
  // 3. Absolute dates (Jan 15, 2026-01-15)
  if (!date) {
    const absoluteResult = parseAbsoluteDate(input, referenceDate);
    if (absoluteResult.date) {
      date = absoluteResult.date;
      matchedParts.push(absoluteResult.matchedText);
      confidence = 'high';
    }
  }
  
  // Parse time (can be combined with any date)
  const timeResult = parseTime(input);
  if (timeResult.time) {
    time = timeResult.time;
    matchedParts.push(timeResult.matchedText);
    
    // If we have time but no date, assume today
    if (!date) {
      const today = new Date(referenceDate);
      today.setHours(0, 0, 0, 0);
      
      // If the time has already passed today, assume tomorrow
      const now = new Date();
      if (
        today.toDateString() === now.toDateString() &&
        (time.hours < now.getHours() || 
         (time.hours === now.getHours() && time.minutes <= now.getMinutes()))
      ) {
        today.setDate(today.getDate() + 1);
      }
      
      date = today;
      confidence = 'medium';
    }
  }
  
  // Remove "at" prefix if present with time
  const matchedText = matchedParts
    .filter(Boolean)
    .map(text => {
      // Also match "at 6pm" as a unit
      const atPattern = new RegExp(`\\bat\\s+${escapeRegex(text)}`, 'i');
      const atMatch = input.match(atPattern);
      return atMatch ? atMatch[0] : text;
    })
    .join(' ');
  
  return {
    date,
    time,
    matchedText: matchedText || '',
    confidence: date || time ? confidence : 'low',
  };
}

/**
 * Format parsed date/time to ISO date string (YYYY-MM-DD).
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format parsed time to HH:MM format.
 */
export function formatTime(time: { hours: number; minutes: number }): string {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

/**
 * Combine date and optional time into ISO datetime string.
 */
export function formatISODateTime(
  date: Date, 
  time?: { hours: number; minutes: number } | null
): string {
  const isoDate = formatISODate(date);
  if (time) {
    return `${isoDate}T${formatTime(time)}:00`;
  }
  return `${isoDate}T00:00:00`;
}

/**
 * Format date for human-readable display.
 */
export function formatDisplayDate(
  date: Date, 
  time?: { hours: number; minutes: number } | null
): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  
  let display = date.toLocaleDateString('en-US', options);
  
  // Add relative hint
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays === 0) display = `Today, ${display}`;
  else if (diffDays === 1) display = `Tomorrow, ${display}`;
  else if (diffDays === -1) display = `Yesterday, ${display}`;
  
  // Add time if present
  if (time) {
    const hours = time.hours % 12 || 12;
    const period = time.hours >= 12 ? 'PM' : 'AM';
    const minutes = time.minutes > 0 ? `:${String(time.minutes).padStart(2, '0')}` : '';
    display += ` at ${hours}${minutes} ${period}`;
  }
  
  return display;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove matched date/time text from input string.
 */
export function removeDateTimeFromInput(input: string, matchedText: string): string {
  if (!matchedText) return input;
  
  // Build pattern that matches the text with optional surrounding "at" or "by"
  const patterns = [
    new RegExp(`\\b(at|by|on|before)\\s+${escapeRegex(matchedText)}\\b`, 'gi'),
    new RegExp(`\\b${escapeRegex(matchedText)}\\b`, 'gi'),
  ];
  
  let result = input;
  for (const pattern of patterns) {
    result = result.replace(pattern, ' ');
  }
  
  // Clean up extra whitespace
  return result.replace(/\s+/g, ' ').trim();
}
