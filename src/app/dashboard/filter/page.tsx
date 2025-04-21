"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiCalendar, FiRepeat, FiClock, FiTag, FiFilter, FiRefreshCw, FiLoader } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "../../../components/date-picker"; 
import { Label } from "@/components/ui/label";
import { TaskDialog } from "@/components/TaskDialog";
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

export default function FilterPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [dueDateBefore, setDueDateBefore] = useState<Date | null>(null);
  const [dueDateAfter, setDueDateAfter] = useState<Date | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

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
  }, [status, priorityFilter, dueDateBefore, dueDateAfter, showCompleted]);

  // Listen for task update events
  useEffect(() => {
    // Function to handle task update events
    const handleTaskUpdated = () => {
      console.log("Task updated event received in Filter page, refreshing tasks");
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
      
      // Build URL with query parameters
      let url = `/api/tasks?`;
      
      if (priorityFilter) {
        url += `priority=${priorityFilter}&`;
      }
      
      if (dueDateBefore) {
        url += `dueBefore=${dueDateBefore.toISOString()}&`;
      }
      
      if (dueDateAfter) {
        url += `dueAfter=${dueDateAfter.toISOString()}&`;
      }
      
      if (showCompleted !== null) {
        url += `completed=${showCompleted}&`;
      }
      
      // Remove trailing &
      url = url.endsWith("&") ? url.slice(0, -1) : url;
      
      const res = await fetch(url, {
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

  const resetFilters = () => {
    setPriorityFilter(null);
    setDueDateBefore(null);
    setDueDateAfter(null);
    setShowCompleted(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-200";
      case "LOW":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Filter Tasks</h1>
        <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
          <FiRefreshCw className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      {/* Filter options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FiFilter className="mr-2 h-5 w-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={priorityFilter || "ALL"} 
                onValueChange={(value) => setPriorityFilter(value === "ALL" ? null : value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDateAfter">Due After</Label>
              <DatePicker
                id="dueDateAfter"
                date={dueDateAfter}
                setDate={setDueDateAfter}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDateBefore">Due Before</Label>
              <DatePicker
                id="dueDateBefore"
                date={dueDateBefore}
                setDate={setDueDateBefore}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <Checkbox 
              id="showCompleted" 
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked === true)}
            />
            <Label htmlFor="showCompleted">Show completed tasks</Label>
          </div>
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <FiLoader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No tasks match the selected filters</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={cn("overflow-hidden", task.completed && "opacity-70")}>
              <div className="border-l-4 h-full" style={{ 
                borderColor: 
                  task.priority === "URGENT" ? "rgb(220, 38, 38)" :
                  task.priority === "HIGH" ? "rgb(234, 88, 12)" :
                  task.priority === "LOW" ? "rgb(59, 130, 246)" :
                  "rgb(100, 116, 139)"
              }}>
                <CardHeader className="p-4 pb-0">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={task.completed}
                        disabled
                        className="mt-1"
                      />
                      <div className="space-y-1 flex-1">
                        <CardTitle className={cn(
                          "text-lg font-medium break-words",
                          task.completed && "line-through text-slate-500"
                        )}>
                          {task.title}
                        </CardTitle>
                        {task.description && (
                          <div className="text-sm text-slate-500 break-words">
                            {task.description}
                          </div>
                        )}
                        {/* Tags */}
                        {task.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.split(',').map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <FiTag className="h-3 w-3 mr-1" />
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn("font-normal", getPriorityColor(task.priority))}
                      >
                        {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    {task.dueDate && (
                      <div className="flex items-center">
                        <FiCalendar className="h-3 w-3 mr-1" />
                        <span>Due: {format(new Date(task.dueDate), "PP")}</span>
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
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 