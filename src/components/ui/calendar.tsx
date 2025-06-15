// components/ui/calendar.tsx
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

import { cn } from '../../lib/utils' // your classNames util if using shadcn-style setup

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <DayPicker
      className={cn("p-3 bg-white rounded-lg shadow-md", className)}
      {...props}
    />
  )
}

export default Calendar
