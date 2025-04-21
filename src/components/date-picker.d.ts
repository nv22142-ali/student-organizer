import { FC } from 'react';

interface DatePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  id?: string;
  className?: string;
}

export const DatePicker: FC<DatePickerProps>; 