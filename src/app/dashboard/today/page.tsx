"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import { FiCalendar, FiPlus, FiTrash, FiLoader, FiRepeat, FiClock, FiTag, FiEdit } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TaskDialog } from "@/components/TaskDialog";
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

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
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

      // Filter tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log("Today's date range:", today, "to", tomorrow);
      
      const todayTasks = formattedTasks.filter((task: Task) => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        // Reset time part for comparison
        const taskDateOnly = new Date(taskDate);
        taskDateOnly.setHours(0, 0, 0, 0);
        
        const isTaskToday = taskDateOnly.getTime() === today.getTime();
        
        console.log(
          "Task:", task.title, 
          "Due date:", taskDate, 
          "Normalized date:", taskDateOnly,
          "Is today?", isTaskToday
        );
        
        return isTaskToday;
      });
      
      console.log("Filtered tasks count:", todayTasks.length);
      setTasks(todayTasks);
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
      console.log("Task updated event received in Today page, refreshing tasks");
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
        // Create new task 
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
        fetchTasks();
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

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading today's tasks...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Today's Tasks</h1>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <FiCalendar className="h-10 w-10 text-primary p-2 rounded-full bg-primary/10" />
              <p className="text-slate-600">You have no tasks due today.</p>
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
                  {task.dueDate && (
                    <div className="flex items-center">
                      <FiCalendar className="h-3 w-3 mr-1" />
                      <span>Due: Today {format(new Date(task.dueDate), "p")}</span>
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