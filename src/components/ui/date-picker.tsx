"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FiCalendar, FiX } from "react-icons/fi";

interface DatePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  id?: string;
  className?: string;
}

export function DatePicker({ date, setDate, id, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? (
            format(date, "PPP")
          ) : (
            <span>Pick a date</span>
          )}
          {date && (
            <div
              className="ml-auto flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={(e) => {
                e.stopPropagation();
                setDate(null);
              }}
            >
              <FiX className="h-4 w-4" />
            </div>
          )}
          <FiCalendar className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(date) => {
            setDate(date || null);
            setTimeout(() => setIsOpen(false), 0);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 