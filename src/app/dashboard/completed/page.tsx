"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  FiCalendar, 
  FiTrash, 
  FiLoader, 
  FiClock, 
  FiTag, 
  FiCheck
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
  updatedAt?: Date | string;
  // Advanced scheduling properties
  recurrence?: string;
  recurrenceEnd?: Date | string;
  estimatedMinutes?: number;
  reminderTime?: Date | string;
  tags?: string;
  category?: string;
};

export default function CompletedTasksPage() {
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

  // Fetch tasks
  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status]);

  // Listen for task update events
  useEffect(() => {
    // Function to handle task update events
    const handleTaskUpdated = () => {
      console.log("Task updated event received in Completed page, refreshing tasks");
      fetchTasks();
    };

    // Add event listener
    window.addEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);

    // Clean up the event listener
    return () => {
      window.removeEventListener(TASK_UPDATED_EVENT, handleTaskUpdated);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?completed=true", {
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

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading completed tasks...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FiCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Completed Tasks</h1>
        </div>
        
        {tasks.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => {
              if(confirm("Are you sure you want to delete all completed tasks?")) {
                // This would need a proper bulk delete API endpoint
                toast.error("Bulk delete not implemented yet");
              }
            }}
            className="flex items-center gap-2"
          >
            <FiTrash className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <FiCheck className="h-10 w-10 text-green-600 p-2 rounded-full bg-green-100" />
              <p className="text-slate-600">You have no completed tasks yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className="overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border-green-100 shadow-sm transition-all hover:shadow-md"
              >
                <CardHeader className="p-4 pb-2 border-b border-green-50 bg-green-50/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        id={`task-${task.id}`}
                        className="mt-1 bg-green-100 border-green-200 text-green-600"
                      />
                      <div>
                        <CardTitle className="text-md line-through text-slate-500 font-medium">
                          {task.title}
                        </CardTitle>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-1 line-through">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-100"
                      >
                        Completed
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                        <FiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center">
                      <FiCalendar className="h-3 w-3 mr-1 text-green-600" />
                      <span>Completed on: {format(new Date(task.updatedAt || task.createdAt), "PPP")}</span>
                    </div>
                    
                    {task.estimatedMinutes && (
                      <div className="flex items-center">
                        <FiClock className="h-3 w-3 mr-1 text-green-600" />
                        <span>{task.estimatedMinutes} min</span>
                      </div>
                    )}
                    
                    {task.category && task.category !== "Default" && (
                      <Badge variant="outline" className="rounded-full text-xs font-normal border-green-100 text-green-700">
                        {task.category}
                      </Badge>
                    )}
                    
                    {task.tags && (
                      <div className="flex items-center flex-wrap gap-1 mt-2 border-t border-green-100 pt-2 w-full">
                        <FiTag className="h-3 w-3 text-green-600" />
                        {task.tags.split(',').map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs font-normal bg-green-100 text-green-700"
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
        )}
      </div>
    </div>
  );
} 