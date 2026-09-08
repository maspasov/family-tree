import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import bgLocale from '@fullcalendar/core/locales/bg'
import { fullName, type Person } from '../model/person'

export interface FamilyCalendarHandle {
  focus: (id: string) => void
}

interface Props {
  people: Person[]
  onSelect: (id: string | null) => void
}

/** One literal event per birthday per year in the visible range — simpler and more robust here than a recurrence-rule plugin for a dataset this small. */
function birthdayEvents(people: Person[], startYear: number, endYear: number): EventInput[] {
  const events: EventInput[] = []
  for (const p of people) {
    if (!p.birthMonthDay) continue
    const [month, day] = p.birthMonthDay.split('-').map(Number)
    for (let year = startYear; year <= endYear; year++) {
      const date = new Date(year, month - 1, day)
      if (date.getMonth() !== month - 1) continue // 29 Feb in a non-leap year — skip rather than roll into March
      events.push({
        id: `${p.id}-${year}`,
        title: fullName(p) || 'Без име',
        start: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        allDay: true,
        extendedProps: { personId: p.id },
      })
    }
  }
  return events
}

export const FamilyCalendar = forwardRef<FamilyCalendarHandle, Props>(function FamilyCalendar(
  { people, onSelect },
  ref,
) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const thisYear = new Date().getFullYear()
  const [range, setRange] = useState({ start: thisYear - 1, end: thisYear + 1 })

  const events = useMemo(() => birthdayEvents(people, range.start, range.end), [people, range])

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const start = arg.start.getFullYear() - 1
    const end = arg.end.getFullYear() + 1
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      onSelect((arg.event.extendedProps.personId as string) ?? null)
    },
    [onSelect],
  )

  useImperativeHandle(ref, (): FamilyCalendarHandle => ({
    focus: (id: string) => {
      const person = people.find((p) => p.id === id)
      if (!person?.birthMonthDay) return
      const [month, day] = person.birthMonthDay.split('-').map(Number)
      const api = calendarRef.current?.getApi()
      api?.gotoDate(new Date(thisYear, month - 1, day))
    },
  }))

  return (
    <div className="ft-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={bgLocale}
        firstDay={1}
        height="100%"
        headerToolbar={{ left: 'prevYear,prev,next,nextYear today', center: 'title', right: '' }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        dayMaxEvents={3}
      />
    </div>
  )
})
