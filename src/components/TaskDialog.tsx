"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { FiCalendar, FiX, FiZap } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import AdvancedTaskOptions from "./AdvancedTaskOptions";
import { toast } from "sonner";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    dueDate?: Date | null;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    // Advanced scheduling fields
    recurrence?: string;
    recurrenceEnd?: string;
    estimatedMinutes?: number;
    reminderTime?: string;
    tags?: string;
    category?: string;
  }) => void;
  task?: {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date | string;
    completed: boolean;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    createdAt: Date | string;
    // Advanced scheduling properties
    recurrence?: string;
    recurrenceEnd?: Date | string;
    estimatedMinutes?: number;
    reminderTime?: Date | string;
    tags?: string;
    category?: string;
  } | null;
}

export function TaskDialog({ open, onOpenChange, onSubmit, task }: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // Advanced scheduling states
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [category, setCategory] = useState<string>("Default");

  // Load task data when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setPriority(task.priority);
      setRecurrence(task.recurrence || "NONE");
      setRecurrenceEnd(task.recurrenceEnd ? new Date(task.recurrenceEnd).toISOString().split('T')[0] : "");
      setEstimatedMinutes(task.estimatedMinutes);
      setReminderTime(task.reminderTime ? new Date(task.reminderTime).toISOString() : "");
      setTags(task.tags || "");
      setCategory(task.category || "Default");
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description: description || undefined,
      dueDate,
      priority,
      // Advanced scheduling fields
      recurrence,
      recurrenceEnd: recurrenceEnd || undefined,
      estimatedMinutes,
      reminderTime: reminderTime || undefined,
      tags: tags || undefined,
      category: category || undefined,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setDueDate(null);
    setPriority("NORMAL");
    setRecurrence("NONE");
    setRecurrenceEnd("");
    setEstimatedMinutes(undefined);
    setReminderTime("");
    setTags("");
    setCategory("Default");
  };

  // Function to generate task description with AI
  const generateDescription = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title first");
      return;
    }

    try {
      setIsGeneratingDescription(true);
      console.log("Generating description for:", title);
      
      // First try the test endpoint to see if API calls are working
      try {
        console.log("Trying test API endpoint first...");
        const testResponse = await fetch("/api/test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: "Testing API" }),
        });
        
        console.log("Test API response status:", testResponse.status);
        const testData = await testResponse.json();
        console.log("Test API response:", testData);
      } catch (testError) {
        console.error("Test API error:", testError);
      }
      
      try {
        // Now try the actual generate-description endpoint
        const response = await fetch("/api/ai/generate-description", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("API error response:", errorData);
          throw new Error(errorData.error || "Failed to generate description");
        }

        const data = await response.json();
        console.log("Generated description:", data);
        setDescription(data.description);
        toast.success("Description generated!");
        
      } catch (apiError) {
        console.error("API error, using fallback:", apiError);
        // Fallback: Generate description without API
        const descriptions = [
          `This task involves ${title.toLowerCase()}. You should approach it systematically by breaking it down into manageable steps.`,
          `For ${title}, you'll need to carefully plan and execute each stage of the process. Consider starting with research.`,
          `${title} requires attention to detail. Make sure you allocate enough time for review and quality checks.`,
          `When working on ${title}, remember to document your progress and any challenges encountered.`,
          `${title} is an important task that contributes to your overall goals. Prioritize it accordingly.`,
        ];
        
        const generatedDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        console.log("Using fallback description:", generatedDescription);
        setDescription(generatedDescription);
        toast.success("Description generated locally!");
      }
      
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the task details below." : "Fill out the form below to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Description (optional)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={generateDescription}
                disabled={isGeneratingDescription || !title.trim()}
                className="flex items-center gap-1"
              >
                {isGeneratingDescription ? (
                  <>Generating...</>
                ) : (
                  <>
                    <FiZap className="h-3 w-3" />
                    AI Generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about your task"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    {dueDate ? (
                      format(dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    {dueDate && (
                      <div
                        className="ml-auto flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDueDate(null);
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
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    onDayClick={() => {
                      setTimeout(() => setDatePickerOpen(false), 0);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "LOW" | "NORMAL" | "HIGH" | "URGENT") => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Advanced Task Options */}
          <div className="pt-2">
            <AdvancedTaskOptions
              recurrence={recurrence}
              setRecurrence={setRecurrence}
              recurrenceEnd={recurrenceEnd}
              setRecurrenceEnd={setRecurrenceEnd}
              estimatedMinutes={estimatedMinutes}
              setEstimatedMinutes={setEstimatedMinutes}
              reminderTime={reminderTime}
              setReminderTime={setReminderTime}
              tags={tags}
              setTags={setTags}
              category={category}
              setCategory={setCategory}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{task ? "Update Task" : "Save Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 