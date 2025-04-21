import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  // Advanced scheduling fields
  recurrence: z.enum(["NONE", "DAILY", "WEEKDAYS", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional().default("NONE"),
  recurrenceEnd: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  reminderTime: z.string().optional(),
  tags: z.string().optional(),
  category: z.string().optional(),
});

// Get all tasks for the current user
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priorityFilter = searchParams.get('priority');
    const dueBeforeStr = searchParams.get('dueBefore');
    const dueAfterStr = searchParams.get('dueAfter');
    const completed = searchParams.get('completed');
    const recurrenceType = searchParams.get('recurrence');
    
    // Build the where clause
    const where: any = { userId: user.id };
    
    if (category) {
      where.category = category;
    }
    
    if (priorityFilter) {
      where.priority = priorityFilter;
    }
    
    if (completed !== null) {
      where.completed = completed === 'true';
    }
    
    if (recurrenceType) {
      where.recurrence = recurrenceType;
    }
    
    if (dueBeforeStr) {
      where.dueDate = {
        ...(where.dueDate || {}),
        lt: new Date(dueBeforeStr),
      };
    }
    
    if (dueAfterStr) {
      where.dueDate = {
        ...(where.dueDate || {}),
        gt: new Date(dueAfterStr),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// Create a new task
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
    const validatedData = TaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        priority: validatedData.priority,
        userId: user.id,
        // Advanced scheduling features
        recurrence: validatedData.recurrence,
        recurrenceEnd: validatedData.recurrenceEnd ? new Date(validatedData.recurrenceEnd) : null,
        estimatedMinutes: validatedData.estimatedMinutes,
        reminderTime: validatedData.reminderTime ? new Date(validatedData.reminderTime) : null,
        tags: validatedData.tags,
        category: validatedData.category,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
} 