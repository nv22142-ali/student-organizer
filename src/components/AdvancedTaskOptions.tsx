"use client";

import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { cn } from "@/lib/utils";
import { 
  FiCalendar, 
  FiClock, 
  FiRepeat, 
  FiInfo, 
  FiX
} from 'react-icons/fi';

interface AdvancedTaskOptionsProps {
  recurrence: string;
  setRecurrence: (value: string) => void;
  recurrenceEnd: string;
  setRecurrenceEnd: (value: string) => void;
  estimatedMinutes: number | undefined;
  setEstimatedMinutes: (value: number | undefined) => void;
  reminderTime: string;
  setReminderTime: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
}

export default function AdvancedTaskOptions({
  recurrence,
  setRecurrence,
  recurrenceEnd,
  setRecurrenceEnd,
  estimatedMinutes,
  setEstimatedMinutes,
  reminderTime,
  setReminderTime,
  tags,
  setTags,
  category,
  setCategory
}: AdvancedTaskOptionsProps) {
  const [expanded, setExpanded] = useState(false);
  const [tagsArray, setTagsArray] = useState<string[]>(tags ? tags.split(',') : []);
  const [currentTag, setCurrentTag] = useState('');
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [reminderDatePickerOpen, setReminderDatePickerOpen] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    recurrenceEnd ? new Date(recurrenceEnd) : undefined
  );
  const [selectedReminderDate, setSelectedReminderDate] = useState<Date | undefined>(
    reminderTime ? new Date(reminderTime) : undefined
  );
  const [reminderTimeValue, setReminderTimeValue] = useState<string>(
    reminderTime ? new Date(reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""
  );
  
  // Update recurrenceEnd when selectedEndDate changes
  const handleEndDateChange = (date: Date | undefined) => {
    setSelectedEndDate(date);
    if (date) {
      setRecurrenceEnd(date.toISOString().split('T')[0]);
    } else {
      setRecurrenceEnd('');
    }
  };
  
  // Update reminderTime when reminder date or time changes
  const handleReminderDateChange = (date: Date | undefined) => {
    setSelectedReminderDate(date);
    updateReminderDateTime(date, reminderTimeValue);
  };
  
  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setReminderTimeValue(timeValue);
    updateReminderDateTime(selectedReminderDate, timeValue);
  };
  
  const updateReminderDateTime = (date: Date | undefined, time: string) => {
    if (!date || !time) {
      setReminderTime('');
      return;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setReminderTime(newDate.toISOString());
  };
  
  const handleAddTag = () => {
    if (currentTag.trim()) {
      const newTags = [...tagsArray, currentTag.trim()];
      setTagsArray(newTags);
      setTags(newTags.join(','));
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tagsArray.filter(tag => tag !== tagToRemove);
    setTagsArray(newTags);
    setTags(newTags.join(','));
  };

  if (!expanded) {
    return (
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-2 flex items-center gap-2"
        onClick={() => setExpanded(true)}
      >
        <FiRepeat className="h-4 w-4" />
        Show Advanced Options
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Advanced Scheduling</h3>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
            Hide
          </Button>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          {/* Recurrence Options */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FiRepeat className="h-4 w-4" /> 
              Repeats
            </Label>
            <Select
              value={recurrence}
              onValueChange={setRecurrence}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Does not repeat</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKDAYS">Weekdays</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="BIWEEKLY">Every 2 weeks</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Only show end date if recurrence is not NONE */}
          {recurrence !== 'NONE' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4" /> 
                Ends On
              </Label>
              <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedEndDate && "text-muted-foreground"
                    )}
                  >
                    {selectedEndDate ? (
                      format(selectedEndDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    {selectedEndDate && (
                      <div
                        className="ml-auto flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndDateChange(undefined);
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
                    selected={selectedEndDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                    onDayClick={() => {
                      setTimeout(() => setEndDatePickerOpen(false), 0);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Time Estimate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FiClock className="h-4 w-4" /> 
              Estimated Time (minutes)
              <span className="flex items-center text-xs text-gray-500 gap-1 ml-1">
                <FiInfo className="h-3 w-3" />
                <span>How long will this task take?</span>
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              value={estimatedMinutes || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                setEstimatedMinutes(value);
              }}
              placeholder="Enter minutes"
            />
          </div>
          
          {/* Reminder Time - Calendar + Time input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FiClock className="h-4 w-4" /> 
              Reminder (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover open={reminderDatePickerOpen} onOpenChange={setReminderDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedReminderDate && "text-muted-foreground"
                    )}
                  >
                    {selectedReminderDate ? (
                      format(selectedReminderDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    {selectedReminderDate && (
                      <div
                        className="ml-auto flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReminderDateChange(undefined);
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
                    selected={selectedReminderDate}
                    onSelect={handleReminderDateChange}
                    initialFocus
                    onDayClick={() => {
                      setTimeout(() => setReminderDatePickerOpen(false), 0);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={reminderTimeValue}
                onChange={handleReminderTimeChange}
                disabled={!selectedReminderDate}
                placeholder="Select time"
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Work, Personal, Health, etc."
            />
          </div>
          
          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add tags..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag}>Add</Button>
            </div>
            
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tagsArray.map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <FiX className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Tags help you filter and group related tasks
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 