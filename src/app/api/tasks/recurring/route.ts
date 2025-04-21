import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, addYears, isWeekend, setHours, setMinutes } from "date-fns";

// GET - Get all recurring tasks or generate next occurrences
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

    // Get all recurring tasks
    const recurringTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        recurrence: {
          not: "NONE",
        },
      },
    });

    return NextResponse.json({ tasks: recurringTasks });
  } catch (error) {
    console.error("Error fetching recurring tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring tasks" },
      { status: 500 }
    );
  }
}

// POST - Generate next occurrence of a recurring task
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Find the source task
    const sourceTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (!sourceTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (sourceTask.recurrence === "NONE") {
      return NextResponse.json(
        { error: "Task is not recurring" },
        { status: 400 }
      );
    }

    // Check if task has ended
    if (sourceTask.recurrenceEnd && new Date() > sourceTask.recurrenceEnd) {
      return NextResponse.json(
        { error: "Recurring task has ended" },
        { status: 400 }
      );
    }

    // Calculate next date based on recurrence type
    let nextDate = new Date();
    const baseDate = sourceTask.dueDate || new Date();
    
    switch (sourceTask.recurrence) {
      case "DAILY":
        nextDate = addDays(baseDate, 1);
        break;
      case "WEEKDAYS":
        nextDate = addDays(baseDate, 1);
        // Skip weekends
        if (isWeekend(nextDate)) {
          nextDate = addDays(nextDate, isWeekend(nextDate) ? 2 : 0);
        }
        break;
      case "WEEKLY":
        nextDate = addWeeks(baseDate, 1);
        break;
      case "BIWEEKLY":
        nextDate = addWeeks(baseDate, 2);
        break;
      case "MONTHLY":
        nextDate = addMonths(baseDate, 1);
        break;
      case "YEARLY":
        nextDate = addYears(baseDate, 1);
        break;
      default:
        nextDate = addDays(baseDate, 1);
    }

    // Preserve time from original due date if it exists
    if (sourceTask.dueDate) {
      nextDate = setHours(nextDate, sourceTask.dueDate.getHours());
      nextDate = setMinutes(nextDate, sourceTask.dueDate.getMinutes());
    }

    // Create the next occurrence
    const newTask = await prisma.task.create({
      data: {
        title: sourceTask.title,
        description: sourceTask.description,
        dueDate: nextDate,
        priority: sourceTask.priority,
        userId: user.id,
        recurrence: sourceTask.recurrence,
        recurrenceEnd: sourceTask.recurrenceEnd,
        estimatedMinutes: sourceTask.estimatedMinutes,
        reminderTime: sourceTask.reminderTime ? new Date(
          nextDate.getTime() - (sourceTask.dueDate!.getTime() - sourceTask.reminderTime.getTime())
        ) : null,
        tags: sourceTask.tags,
        category: sourceTask.category,
      },
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error generating next recurring task:", error);
    return NextResponse.json(
      { error: "Failed to generate next recurring task" },
      { status: 500 }
    );
  }
} 