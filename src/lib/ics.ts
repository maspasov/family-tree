/**
 * Builds a standard .ics (iCalendar) file with one yearly-recurring all-day
 * event per birthday — no account, no API, no OAuth. Works with any calendar
 * app (Google Calendar, Apple Calendar, Outlook...) via its own import.
 */
import type { Person } from '../model/person'
import { fullName } from '../model/person'

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function hasBirthdays(people: Person[]): boolean {
  return people.some((p) => p.birthMonthDay)
}

export function buildBirthdaysIcs(people: Person[]): string {
  const now = new Date()
  const stamp = `${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  const year = now.getFullYear()

  const events = people
    .filter((p) => p.birthMonthDay)
    .map((p) => {
      const [month, day] = p.birthMonthDay!.split('-').map(Number)
      const start = `${year}${pad2(month)}${pad2(day)}`
      const endDate = new Date(Date.UTC(year, month - 1, day + 1))
      const end = `${endDate.getUTCFullYear()}${pad2(endDate.getUTCMonth() + 1)}${pad2(endDate.getUTCDate())}`
      return [
        'BEGIN:VEVENT',
        `UID:ft-birthday-${p.id}@rodoslovno-durvo`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        'RRULE:FREQ=YEARLY',
        `SUMMARY:${icsEscape(`Рожден ден: ${fullName(p)}`)}`,
        'END:VEVENT',
      ].join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rodoslovno durvo//Brusarite//BG',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Брусарите — Родословно дърво',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
