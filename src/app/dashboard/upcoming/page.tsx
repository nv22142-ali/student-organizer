"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, isAfter, isToday, formatDistance } from "date-fns";
import { 
  FiCalendar, 
  FiLoader, 
  FiRepeat, 
  FiClock, 
  FiTag
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TASK_UPDATED_EVENT } from "../layout";

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

export default function UpcomingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

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
      
      // First fetch all incomplete tasks
      const res = await fetch(`/api/tasks?completed=false`, {
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

      // Filter for upcoming tasks (not today, but in the future)
      const upcoming = formattedTasks.filter((task: Task) => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        // Check if the date is after today, but not today
        return !isToday(taskDate) && isAfter(taskDate, new Date());
      });
      
      // Sort by due date (closest first)
      const sortedTasks = upcoming.sort((a: Task, b: Task) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
        return dateA.getTime() - dateB.getTime();
      });
      
      setTasks(sortedTasks);
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
      console.log("Task updated event received in Upcoming page, refreshing tasks");
      fetchTasks();
    };

    // Add event listener
    window.addEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);

    // Clean up the event listener
    return () => {
      window.removeEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);
    };
  }, [fetchTasks]);

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

  // Group tasks by due date
  const groupTasksByDate = (tasks: Task[]) => {
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      const date = new Date(task.dueDate);
      const dateFormatted = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateFormatted]) {
        groups[dateFormatted] = [];
      }
      
      groups[dateFormatted].push(task);
    });
    
    return groups;
  };

  const taskGroups = groupTasksByDate(tasks);
  const sortedDates = Object.keys(taskGroups).sort();

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading upcoming tasks...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FiClock className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Upcoming Tasks</h1>
        </div>
      </div>

      <div className="space-y-8">
        {tasks.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <FiClock className="h-10 w-10 text-primary p-2 rounded-full bg-primary/10" />
              <p className="text-slate-600">You have no upcoming tasks.</p>
            </div>
          </div>
        ) : (
          sortedDates.map(dateString => {
            const date = new Date(dateString);
            const tasksForDate = taskGroups[dateString];
            
            return (
              <div key={dateString} className="space-y-3">
                <div className="sticky top-0 z-10 bg-white py-2">
                  <h2 className="font-semibold text-lg flex items-center">
                    <Badge variant="outline" className="mr-2 py-1 px-3">
                      {format(date, 'EEEE, MMMM d')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistance(date, new Date(), { addSuffix: true })}
                    </span>
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {tasksForDate.map((task) => (
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          {task.dueDate && (
                            <div className="flex items-center">
                              <FiCalendar className="h-3 w-3 mr-1" />
                              <span>Due: {format(new Date(task.dueDate), "PP")} {format(new Date(task.dueDate), "p")}</span>
                            </div>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 