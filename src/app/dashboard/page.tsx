"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiCalendar, FiPlus, FiTrash, FiLoader, FiRepeat, FiClock, FiTag, FiEdit, FiZap } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TaskDialog } from "@/components/TaskDialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { TASK_UPDATED_EVENT } from "./layout";

// Task type definition with advanced scheduling properties
type Task = {
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
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const { status } = useSession();
  const router = useRouter();
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [isTaskTitlePopoverOpen, setIsTaskTitlePopoverOpen] = useState(false);
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch tasks with useCallback to avoid recreation on every render
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?completed=false", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch tasks");
      }
      
      const data = await res.json();
      
      // Convert date strings to Date objects
      const formattedTasks = data.tasks.map((task: Task) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        recurrenceEnd: task.recurrenceEnd ? new Date(task.recurrenceEnd) : undefined,
        reminderTime: task.reminderTime ? new Date(task.reminderTime) : undefined,
        createdAt: new Date(task.createdAt),
      }));
    
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tasks on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, fetchTasks]);

  // Listen for task update events
  useEffect(() => {
    // Function to handle task update events
    const handleTaskUpdated = () => {
      console.log("Task updated event received, refreshing tasks");
      fetchTasks();
    };

    // Add event listener
    window.addEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);

    // Clean up the event listener
    return () => {
      window.removeEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);
    };
  }, [fetchTasks]);

  // Function to open edit dialog with task data
  const editTask = (task: Task) => {
    setCurrentTask(task);
    setShowAddDialog(true);
  };

  const handleAddTask = async (data: {
    title: string;
    description?: string;
    dueDate?: Date | null;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    recurrence?: string;
    recurrenceEnd?: string;
    estimatedMinutes?: number;
    reminderTime?: string;
    tags?: string;
    category?: string;
  }) => {
    try {
      // If currentTask exists, we're editing an existing task
      if (currentTask) {
        const res = await fetch(`/api/tasks/${currentTask.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...data,
            dueDate: data.dueDate ? data.dueDate.toISOString() : null,
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to update task");
        }
        
        toast.success("Task updated successfully");
        setCurrentTask(null);
        fetchTasks();
      } else {
        // Create new task (existing code)
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...data,
            dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to create task");
        }
        
        toast.success("Task created successfully");
        
        // Explicitly fetch tasks instead of just refreshing the page
        fetchTasks();
        
        // Also refresh the router
        router.refresh();
      }
      
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId);

      if (!taskToUpdate) return;

      const updatedTask = { ...taskToUpdate, completed: !taskToUpdate.completed };

      // Optimistic update
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          completed: updatedTask.completed,
        }),
      });

      if (!res.ok) {
        // Revert if the API call fails
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === taskId ? taskToUpdate : task))
        );
        
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update task");
      }

      toast.success(`Task ${updatedTask.completed ? "completed" : "reopened"}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      // Optimistic update
      const taskToDelete = tasks.find((task) => task.id === taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        // Revert if the API call fails
        if (taskToDelete) {
          setTasks((currentTasks) => [...currentTasks, taskToDelete]);
        }
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete task");
      }

      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-100 text-blue-800";
      case "NORMAL":
        return "bg-green-100 text-green-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate a complete task
  const generateFullTask = async (customTitle?: string) => {
    try {
      if (!customTitle?.trim()) {
        setIsTaskTitlePopoverOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }
      
      setIsGeneratingTask(true);
      setIsTaskTitlePopoverOpen(false);
      
      // Extract date from title if present
      let extractedDate: Date | null = null;
      let titleWithoutDate = customTitle;
      
      // Common date formats
      const datePatterns = [
        // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        // Month names: "Jan 15", "January 15th", "15th January", etc.
        /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        /(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i,
        // Tomorrow, next week, etc.
        /\b(tomorrow|next week|next month|next friday|next monday|next tuesday|next wednesday|next thursday|next saturday|next sunday)\b/i,
      ];
      
      // Process date patterns
      for (const pattern of datePatterns) {
        const match = customTitle.match(pattern);
        if (match) {
          try {
            if (pattern.toString().includes("tomorrow")) {
              // Handle relative dates
              const lowerCaseMatch = match[0].toLowerCase();
              if (lowerCaseMatch.includes("tomorrow")) {
                extractedDate = new Date();
                extractedDate.setDate(extractedDate.getDate() + 1);
              } else if (lowerCaseMatch.includes("next week")) {
                extractedDate = new Date();
                extractedDate.setDate(extractedDate.getDate() + 7);
              } else if (lowerCaseMatch.includes("next month")) {
                extractedDate = new Date();
                extractedDate.setMonth(extractedDate.getMonth() + 1);
              } else if (lowerCaseMatch.includes("next")) {
                // Handle next [day of week]
                const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                for (let i = 0; i < days.length; i++) {
                  if (lowerCaseMatch.includes(days[i])) {
                    extractedDate = new Date();
                    const today = extractedDate.getDay();
                    const daysUntilNextDay = (i - today + 7) % 7 || 7; // If today, then next week
                    extractedDate.setDate(extractedDate.getDate() + daysUntilNextDay);
                    break;
                  }
                }
              }
            } else if (pattern.toString().includes("Jan")) {
              // Handle month name patterns
              const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
              const monthAbbreviations = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
              
              let monthIndex = -1;
              let day = 0;
              
              if (pattern.toString().includes("\\s+(\\d{1,2})")) {
                // Pattern: Month Day
                const monthName = match[1].toLowerCase();
                
                // Find month index
                monthIndex = monthAbbreviations.findIndex(m => monthName.startsWith(m));
                if (monthIndex === -1) {
                  monthIndex = monthNames.findIndex(m => monthName.startsWith(m));
                }
                
                day = parseInt(match[2], 10);
              } else {
                // Pattern: Day Month
                const monthName = match[2].toLowerCase();
                
                // Find month index
                monthIndex = monthAbbreviations.findIndex(m => monthName.startsWith(m));
                if (monthIndex === -1) {
                  monthIndex = monthNames.findIndex(m => monthName.startsWith(m));
                }
                
                day = parseInt(match[1], 10);
              }
              
              if (monthIndex !== -1 && day > 0) {
                extractedDate = new Date();
                // If the date is in the past for this year, assume next year
                extractedDate.setMonth(monthIndex);
                extractedDate.setDate(day);
                
                if (extractedDate < new Date()) {
                  extractedDate.setFullYear(extractedDate.getFullYear() + 1);
                }
              }
            } else {
              // Handle numeric date formats
              let month = parseInt(match[1], 10);
              let day = parseInt(match[2], 10);
              let year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
              
              // If year is 2 digits, convert to 4 digits
              if (year < 100) {
                year += year < 50 ? 2000 : 1900;
              }
              
              // Validate and adjust month/day if needed (for international format)
              if (month > 12) {
                // If first number > 12, it's likely DD/MM format
                const temp = month;
                month = day;
                day = temp;
              }
              
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                extractedDate = new Date(year, month - 1, day);
              }
            }
            
            // Remove the date from the title if a date was found
            if (extractedDate) {
              titleWithoutDate = customTitle.replace(match[0], "").trim();
              // Clean up any remaining "on", "by", "due" words
              titleWithoutDate = titleWithoutDate.replace(/\b(on|by|due|date)\b/gi, "").trim();
              break;
            }
          } catch (e) {
            console.error("Date parsing error:", e);
          }
        }
      }
      
      // Generate a relevant description based on the title keywords
      let description = "";
      const lowercaseTitle = titleWithoutDate.toLowerCase();
      
      if (lowercaseTitle.includes("meet") || lowercaseTitle.includes("call") || lowercaseTitle.includes("discussion")) {
        description = `Prepare for the "${titleWithoutDate}" by creating a detailed agenda, sending calendar invitations to all required participants, and gathering any necessary pre-meeting materials. During the meeting, take comprehensive notes and identify action items. Follow up with a summary and track progress on assigned tasks.`;
      } else if (lowercaseTitle.includes("report") || lowercaseTitle.includes("document") || lowercaseTitle.includes("write")) {
        description = `Create a comprehensive report on "${titleWithoutDate}". Begin with an outline of key sections, gather all relevant data and references, and organize content logically. Include an executive summary, detailed analysis, and clear recommendations. Format professionally with appropriate graphs or visuals, and proofread thoroughly before submission.`;
      } else if (lowercaseTitle.includes("review") || lowercaseTitle.includes("feedback") || lowercaseTitle.includes("assess")) {
        description = `Conduct a thorough review of "${titleWithoutDate}". Create a structured evaluation framework with clear criteria. Examine all aspects critically, noting both strengths and areas for improvement. Provide specific, actionable feedback supported by examples, and prioritize recommendations based on impact.`;
      } else if (lowercaseTitle.includes("present") || lowercaseTitle.includes("speech") || lowercaseTitle.includes("talk")) {
        description = `Prepare and deliver a compelling presentation on "${titleWithoutDate}". Develop a clear narrative structure with a strong opening and conclusion. Create visually engaging slides that support your key points without overwhelming them. Practice your delivery focusing on timing, clarity, and engagement. Prepare responses for anticipated questions and test all technical equipment beforehand.`;
      } else if (lowercaseTitle.includes("research") || lowercaseTitle.includes("study") || lowercaseTitle.includes("investigate")) {
        description = `Conduct comprehensive research on "${titleWithoutDate}". Define specific questions or hypotheses to investigate, identify reliable information sources, and document your methodology. Analyze findings critically, looking for patterns and insights. Create a structured summary of key findings with supporting evidence and identify areas for further investigation.`;
      } else if (lowercaseTitle.includes("plan") || lowercaseTitle.includes("strategy") || lowercaseTitle.includes("roadmap")) {
        description = `Develop a detailed plan for "${titleWithoutDate}". Begin by defining clear, measurable objectives and success criteria. Break down the implementation into specific phases with milestones, required resources, and owners. Identify potential risks and mitigation strategies. Create a timeline with dependencies and critical path analysis. Include a process for monitoring progress and making adjustments.`;
      } else if (lowercaseTitle.includes("design") || lowercaseTitle.includes("create") || lowercaseTitle.includes("develop")) {
        description = `Design and develop "${titleWithoutDate}" with a user-centered approach. Begin with requirements gathering and user research to understand needs and constraints. Create conceptual designs or prototypes for early feedback. Develop iteratively, incorporating stakeholder input at each stage. Test thoroughly before finalizing, and document your process and decisions for future reference.`;
      } else if (lowercaseTitle.includes("email") || lowercaseTitle.includes("message") || lowercaseTitle.includes("contact")) {
        description = `Compose a clear and effective communication regarding "${titleWithoutDate}". Outline the key messages you need to convey, considering your audience and desired outcome. Draft your message with a logical structure, beginning with the main purpose, followed by supporting details. Include specific actions required from recipients, relevant deadlines, and your contact information for follow-up questions. Review for clarity, tone, and completeness before sending.`;
      } else if (lowercaseTitle.includes("update") || lowercaseTitle.includes("upgrade") || lowercaseTitle.includes("improve")) {
        description = `Update or improve "${titleWithoutDate}" by first assessing its current state and identifying specific areas for enhancement. Research best practices and gather input from stakeholders or users. Develop a prioritized list of changes based on impact and effort required. Implement improvements systematically, testing each change to ensure it achieves the desired outcome. Document all modifications for future reference.`;
      } else if (lowercaseTitle.includes("organize") || lowercaseTitle.includes("arrange") || lowercaseTitle.includes("schedule")) {
        description = `Organize "${titleWithoutDate}" by establishing clear objectives and defining the scope. Create a comprehensive checklist of all required elements and tasks. Develop a logical structure or timeline, assign responsibilities if others are involved, and secure necessary resources. Set up tracking systems to monitor progress, and build in contingency plans for potential complications. Communicate relevant information to all parties involved.`;
      } else if (lowercaseTitle.includes("learn") || lowercaseTitle.includes("study") || lowercaseTitle.includes("course")) {
        description = `Create a structured learning plan for "${titleWithoutDate}". Identify specific topics to master and learning objectives. Gather recommended resources such as books, courses, tutorials or documentation. Break down the material into manageable sections and establish a realistic study schedule. Include practical exercises to reinforce concepts, and set up a system to track your progress and test your understanding.`;
      } else if (lowercaseTitle.includes("fix") || lowercaseTitle.includes("repair") || lowercaseTitle.includes("solve")) {
        description = `Address the issues with "${titleWithoutDate}" by first thoroughly diagnosing the root causes. Document the specific symptoms and when they occur. Research potential solutions and best practices. Develop a systematic approach to implementing repairs, testing each change incrementally. Verify that all problems have been resolved through comprehensive testing, and document the solution for future reference.`;
      } else if (lowercaseTitle.includes("analyze") || lowercaseTitle.includes("evaluate") || lowercaseTitle.includes("examine")) {
        description = `Conduct a detailed analysis of "${titleWithoutDate}". Define the specific aspects to evaluate and establish appropriate analytical methods. Gather all necessary data from reliable sources, ensuring it's complete and accurate. Apply structured analytical techniques to identify patterns, trends, and insights. Document your methodology, findings, and recommendations in a clear, logical format.`;
      } else {
        // Fallback for general tasks
        description = `Complete "${titleWithoutDate}" by first breaking it down into specific, actionable steps. Prioritize these components based on importance and dependencies. Identify any resources, information, or assistance you'll need. Set interim milestones to track progress, allocate appropriate time for each phase, and build in review points to ensure quality. Document your process and any decisions made for future reference.`;
      }
      
      // Priority options
      const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
      
      // Set priority based on title keywords
      let priority = "NORMAL";
      if (lowercaseTitle.includes("urgent") || lowercaseTitle.includes("asap") || lowercaseTitle.includes("emergency") || lowercaseTitle.includes("immediately")) {
        priority = "URGENT";
      } else if (lowercaseTitle.includes("important") || lowercaseTitle.includes("high") || lowercaseTitle.includes("critical") || lowercaseTitle.includes("priority")) {
        priority = "HIGH";
      } else if (lowercaseTitle.includes("low") || lowercaseTitle.includes("whenever") || lowercaseTitle.includes("if time")) {
        priority = "LOW";
      }
      
      // Category options with more specific categories
      const categories = ["Work", "Meetings", "Research", "Projects", "Documentation", "Personal", "Learning", "Admin", "Communication"];
      
      // Determine category based on title keywords
      let category = "Work"; // Default
      if (lowercaseTitle.includes("meet") || lowercaseTitle.includes("call") || lowercaseTitle.includes("discussion")) {
        category = "Meetings";
      } else if (lowercaseTitle.includes("research") || lowercaseTitle.includes("study") || lowercaseTitle.includes("learn")) {
        category = "Research";
      } else if (lowercaseTitle.includes("project") || lowercaseTitle.includes("develop") || lowercaseTitle.includes("build")) {
        category = "Projects";
      } else if (lowercaseTitle.includes("document") || lowercaseTitle.includes("report") || lowercaseTitle.includes("write")) {
        category = "Documentation";
      } else if (lowercaseTitle.includes("personal") || lowercaseTitle.includes("my") || lowercaseTitle.includes("self")) {
        category = "Personal";
      } else if (lowercaseTitle.includes("learn") || lowercaseTitle.includes("course") || lowercaseTitle.includes("study")) {
        category = "Learning";
      } else if (lowercaseTitle.includes("admin") || lowercaseTitle.includes("organize") || lowercaseTitle.includes("manage")) {
        category = "Admin";
      } else if (lowercaseTitle.includes("email") || lowercaseTitle.includes("call") || lowercaseTitle.includes("message")) {
        category = "Communication";
      }
      
      // Create a task with smart elements based on title
      const task = {
        title: customTitle,
        description: description,
        priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        dueDate: extractedDate || new Date(Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000), // Use extracted date or random future date
        estimatedMinutes: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        category: category,
        tags: generateTags(titleWithoutDate)
      };
      
      // Create the task
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...task,
          dueDate: task.dueDate.toISOString(),
          recurrence: "NONE"
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to create task");
      }
      
      toast.success(`Task "${task.title}" generated successfully!`);
      
      // Reset the custom title input
      setCustomTaskTitle("");
      
      // Refresh the page to show the new task
      fetchTasks();
      
      // Also manually refresh the router after a slight delay to ensure data consistency
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Error generating task:", error);
      toast.error("Failed to generate task: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGeneratingTask(false);
    }
  };
  
  // Helper function to generate relevant tags from title
  const generateTags = (title: string): string => {
    const words = title.toLowerCase().split(/\s+/);
    const stopWords = ["a", "an", "the", "and", "or", "but", "for", "with", "to", "in", "on", "at", "by"];
    
    // Filter words, remove duplicates and stop words
    const potentialTags = [...new Set(words)]
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 3); // Max 3 tags
    
    return potentialTags.join(',');
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex items-center gap-2">
          <Popover open={isTaskTitlePopoverOpen} onOpenChange={setIsTaskTitlePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                onClick={() => generateFullTask(customTaskTitle)}
                className="flex items-center gap-2"
                variant="outline"
                disabled={isGeneratingTask}
              >
                {isGeneratingTask ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiZap className="h-4 w-4" />
                )}
                Generate Task
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Generate a Task</h4>
                <p className="text-sm text-slate-500">Enter a title for your task and we'll generate the rest.</p>
                <div className="flex gap-2">
                  <Input 
                    ref={inputRef}
                    placeholder="Enter task title..." 
                    value={customTaskTitle}
                    onChange={(e) => setCustomTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customTaskTitle.trim()) {
                        generateFullTask(customTaskTitle);
                      }
                    }}
                  />
                  <Button 
                    onClick={() => generateFullTask(customTaskTitle)}
                    disabled={!customTaskTitle.trim() || isGeneratingTask}
                  >
                    {isGeneratingTask ? <FiLoader className="animate-spin" /> : "Generate"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            onClick={() => {
              setCurrentTask(null);
              setShowAddDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <FiPlus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <FiPlus className="h-10 w-10 text-primary p-2 rounded-full bg-primary/10" />
              <p className="text-slate-600">Your inbox is empty. Create your first task!</p>
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={cn("overflow-hidden", task.completed && "opacity-70")}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      id={`task-${task.id}`}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className={cn("text-lg font-medium", task.completed && "line-through text-muted-foreground")}>
                        {task.title}
                      </CardTitle>
                      {task.description && (
                        <p className={cn("text-sm text-slate-600 mt-1", task.completed && "line-through text-muted-foreground")}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        getPriorityColor(task.priority)
                      )}
                    >
                      {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => editTask(task)}>
                        <FiEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                        <FiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {task.dueDate ? (
                    <div className="flex items-center">
                      <FiCalendar className="h-3 w-3 mr-1" />
                      <span>Due: {format(new Date(task.dueDate), "PPP")}</span>
                    </div>
                  ) : (
                    <span>No due date</span>
                  )}
                  
                  {/* Show recurrence info if available */}
                  {task.recurrence && task.recurrence !== "NONE" && (
                    <div className="flex items-center">
                      <FiRepeat className="h-3 w-3 mr-1" />
                      <span>Repeats: {task.recurrence.charAt(0) + task.recurrence.slice(1).toLowerCase()}</span>
                    </div>
                  )}
                  
                  {/* Show estimated time if available */}
                  {task.estimatedMinutes && (
                    <div className="flex items-center">
                      <FiClock className="h-3 w-3 mr-1" />
                      <span>{task.estimatedMinutes} min</span>
                    </div>
                  )}
                  
                  {/* Show category if available */}
                  {task.category && task.category !== "Default" && (
                    <Badge variant="outline" className="rounded-full text-xs font-normal">
                      {task.category}
                    </Badge>
                  )}
                  
                  {/* Show tags if available */}
                  {task.tags && (
                    <div className="flex items-center flex-wrap gap-1">
                      <FiTag className="h-3 w-3" />
                      {task.tags.split(',').map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <span className="ml-auto">Created: {format(new Date(task.createdAt), "PP")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Task Dialog - for both Add and Edit */}
      <TaskDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setCurrentTask(null);
        }}
        onSubmit={handleAddTask}
        task={currentTask}
      />
    </div>
  );
} 