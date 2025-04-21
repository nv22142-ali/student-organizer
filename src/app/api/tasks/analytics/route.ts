import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  subWeeks, 
  subMonths 
} from "date-fns";

// GET - Calculate various task analytics and productivity metrics
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First get the user by email
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the date range parameter (default to 'week')
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    
    // Calculate date ranges based on the period
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;
    
    switch(period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        previousStartDate = startOfDay(subDays(now, 1));
        previousEndDate = endOfDay(subDays(now, 1));
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    }
    
    // Metrics to calculate
    // 1. Total tasks
    const totalTasks = await prisma.task.count({
      where: {
        userId: user.id,
      },
    });
    
    // 2. Completed tasks in current period
    const completedTasksCurrentPeriod = await prisma.task.count({
      where: {
        userId: user.id,
        completed: true,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    // 3. Completed tasks in previous period
    const completedTasksPreviousPeriod = await prisma.task.count({
      where: {
        userId: user.id,
        completed: true,
        updatedAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });
    
    // 4. Total estimated time for completed tasks in current period
    const completedTasksWithTime = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: true,
        estimatedMinutes: {
          not: null,
        },
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        estimatedMinutes: true,
      },
    });
    
    const totalTimeSpent = completedTasksWithTime.reduce(
      (total, task) => total + (task.estimatedMinutes || 0), 
      0
    );
    
    // 5. Tasks by category
    const tasksByCategory = await prisma.task.groupBy({
      by: ['category'],
      where: {
        userId: user.id,
      },
      _count: {
        id: true,
      },
    });
    
    // 6. Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        userId: user.id,
      },
      _count: {
        id: true,
      },
    });
    
    // 7. Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        userId: user.id,
        completed: false,
        dueDate: {
          lt: now,
        },
      },
    });
    
    // 8. Tasks due soon (next 48 hours)
    const tasksDueSoon = await prisma.task.count({
      where: {
        userId: user.id,
        completed: false,
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
        },
      },
    });
    
    // 9. Tasks completion rate (current period)
    const allTasksCurrentPeriod = await prisma.task.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    const completionRate = allTasksCurrentPeriod > 0 
      ? Math.round((completedTasksCurrentPeriod / allTasksCurrentPeriod) * 100) 
      : 0;
    
    // 10. Productivity trend (comparison with previous period)
    const productivityTrend = completedTasksPreviousPeriod > 0
      ? Math.round(((completedTasksCurrentPeriod - completedTasksPreviousPeriod) / completedTasksPreviousPeriod) * 100)
      : completedTasksCurrentPeriod > 0 ? 100 : 0;
    
    return NextResponse.json({
      period,
      totalTasks,
      completedTasksCurrentPeriod,
      completedTasksPreviousPeriod,
      totalTimeSpent,
      tasksByCategory,
      tasksByPriority,
      overdueTasks,
      tasksDueSoon,
      completionRate,
      productivityTrend,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Error calculating analytics:", error);
    return NextResponse.json(
      { error: "Failed to calculate analytics" },
      { status: 500 }
    );
  }
} 