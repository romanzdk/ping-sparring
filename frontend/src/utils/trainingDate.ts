import type { Training } from '../types'

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? '?'
}

export function getDayShort(dayOfWeek: number): string {
  return DAY_SHORT[dayOfWeek] ?? '?'
}

/** Time string without seconds (HH:mm). Accepts API format HH:mm or HH:mm:ss. */
export function formatTimeNoSeconds(t: string | undefined): string {
  if (!t) return ''
  const s = String(t)
  return s.length >= 5 ? s.substring(0, 5) : s
}

/** Day of week 0=Monday..6=Sunday from ISO date string. */
function dayOfWeekFromDate(isoDate: string): number {
  const d = new Date(isoDate)
  return (d.getDay() + 6) % 7
}

/**
 * For one_time: concrete date + day abbrev e.g. "15. 3. 2025 (So)".
 * For recurring: full day name e.g. "Pondělí".
 */
export function formatTrainingDateLabel(training: Training): string {
  if ((training.schedule_type ?? 'recurring') === 'one_time' && training.session_date) {
    const d = new Date(training.session_date)
    const day = d.getDate()
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const abbrev = getDayShort(dayOfWeekFromDate(training.session_date))
    return day + '. ' + month + '. ' + year + ' (' + abbrev + ')'
  }
  return getDayName(training.day_of_week)
}

/**
 * Day abbreviation only. For one_time with session_date uses that date's weekday.
 */
export function getTrainingDayShort(training: Training): string {
  if ((training.schedule_type ?? 'recurring') === 'one_time' && training.session_date) {
    return getDayShort(dayOfWeekFromDate(training.session_date))
  }
  return getDayShort(training.day_of_week)
}
