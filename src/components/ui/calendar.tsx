"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)} // Increased padding for Figma spacing
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6", // More vertical breathing room
        caption: "flex justify-between pt-1 relative items-center px-2", // "Justify between" for a wider header
        caption_label: "text-base font-semibold text-slate-900 dark:text-slate-100", // Slightly larger font
        nav: "flex items-center space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }), // Using ghost variant for a cleaner look
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 rounded-full"
        ),
        nav_button_previous: "", 
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex mb-2", // Added margin to separate days from dates
        head_cell:
          "text-slate-400 w-10 font-medium text-[0.8rem] uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full aria-selected:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
        ),
        day_selected:
          "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white rounded-full shadow-md",
        day_today: "bg-slate-100 text-slate-900 font-bold",
        day_outside: "text-slate-300 opacity-50",
        day_disabled: "text-slate-200 opacity-50",
        day_range_middle:
          "aria-selected:bg-indigo-50 aria-selected:text-indigo-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }