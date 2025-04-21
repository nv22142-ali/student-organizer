"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  FiBarChart2, 
  FiClock, 
  FiCheckSquare, 
  FiAlertTriangle, 
  FiCalendar, 
  FiArrowUp, 
  FiArrowDown, 
  FiLoader, 
  FiActivity,
  FiPieChart,
  FiFlag
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

// Analytics data type
type AnalyticsData = {
  period: string;
  totalTasks: number;
  completedTasksCurrentPeriod: number;
  completedTasksPreviousPeriod: number;
  totalTimeSpent: number;
  tasksByCategory: Array<{
    category: string;
    _count: { id: number };
  }>;
  tasksByPriority: Array<{
    priority: string;
    _count: { id: number };
  }>;
  overdueTasks: number;
  tasksDueSoon: number;
  completionRate: number;
  productivityTrend: number;
  dateRange: {
    start: string;
    end: string;
  };
};

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const { status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch analytics data
  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/analytics?period=${period}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch analytics data");
      }
      
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
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

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <FiArrowUp className="text-green-500" />;
    if (trend < 0) return <FiArrowDown className="text-red-500" />;
    return null;
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FiBarChart2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Progress Analytics</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={period === 'day' ? 'default' : 'outline'} 
            onClick={() => setPeriod('day')}
            size="sm"
          >
            Day
          </Button>
          <Button 
            variant={period === 'week' ? 'default' : 'outline'} 
            onClick={() => setPeriod('week')}
            size="sm"
          >
            Week
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            onClick={() => setPeriod('month')}
            size="sm"
          >
            Month
          </Button>
        </div>
      </div>

      {!analytics ? (
        <div className="text-center p-12 bg-slate-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <FiActivity className="h-10 w-10 text-primary p-2 rounded-full bg-primary/10" />
            <p className="text-slate-600">No analytics data available yet. Complete some tasks to see your progress!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Date range information */}
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <FiCalendar className="h-4 w-4" />
            <span>
              Data for: {format(new Date(analytics.dateRange.start), "PPP")} - {format(new Date(analytics.dateRange.end), "PPP")}
            </span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Completion Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FiCheckSquare className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {analytics.completedTasksCurrentPeriod} of {analytics.totalTasks} tasks completed
                </p>
              </CardContent>
            </Card>

            {/* Productivity Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Productivity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{analytics.productivityTrend}%</span>
                    {getTrendIcon(analytics.productivityTrend)}
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FiActivity className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Compared to previous {period}
                </p>
              </CardContent>
            </Card>

            {/* Time Spent */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Time Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    {analytics.totalTimeSpent} min
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FiClock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  On completed tasks this {period}
                </p>
              </CardContent>
            </Card>

            {/* Tasks Due Soon & Overdue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Attention Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{analytics.overdueTasks + analytics.tasksDueSoon}</div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FiAlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">
                    {analytics.overdueTasks} overdue
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-100">
                    {analytics.tasksDueSoon} due soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks by Category */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FiPieChart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Tasks by Category</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {analytics.tasksByCategory.length === 0 ? (
                  <p className="text-slate-500 text-sm">No category data available</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.tasksByCategory.map((item) => (
                      <div key={item.category || 'uncategorized'} className="flex items-center gap-3">
                        <div className="w-36 truncate text-sm">
                          {item.category || 'Uncategorized'}
                        </div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min(100, (item._count.id / analytics.totalTasks) * 100)}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">{item._count.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks by Priority */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FiFlag className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Tasks by Priority</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {analytics.tasksByPriority.length === 0 ? (
                  <p className="text-slate-500 text-sm">No priority data available</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.tasksByPriority.map((item) => (
                      <div key={item.priority} className="flex items-center gap-3">
                        <div className="w-24 truncate">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              item.priority === 'URGENT' ? 'bg-red-500' :
                              item.priority === 'HIGH' ? 'bg-orange-500' :
                              item.priority === 'NORMAL' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (item._count.id / analytics.totalTasks) * 100)}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">{item._count.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 