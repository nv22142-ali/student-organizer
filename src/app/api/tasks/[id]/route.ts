/* eslint-disable */
/* @ts-nocheck */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  completed: z.boolean().optional(),
  // Advanced scheduling fields
  recurrence: z.enum(["NONE", "DAILY", "WEEKDAYS", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional(),
  recurrenceEnd: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  reminderTime: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  category: z.string().optional(),
});

// Update a task
export async function PATCH(
  request,
  context
) {
  const { id } = context.params;
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

    // Check if task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: {
        id: id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = TaskUpdateSchema.parse(body);

    // Build update data object
    const updateData: any = {};
    
    // Add basic task fields
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.completed !== undefined) updateData.completed = validatedData.completed;
    
    // Add advanced scheduling fields
    if (validatedData.recurrence !== undefined) updateData.recurrence = validatedData.recurrence;
    if (validatedData.recurrenceEnd !== undefined) updateData.recurrenceEnd = validatedData.recurrenceEnd ? new Date(validatedData.recurrenceEnd) : null;
    if (validatedData.estimatedMinutes !== undefined) updateData.estimatedMinutes = validatedData.estimatedMinutes;
    if (validatedData.reminderTime !== undefined) updateData.reminderTime = validatedData.reminderTime ? new Date(validatedData.reminderTime) : null;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;

    // Update the task
    const updatedTask = await prisma.task.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(
  request,
  context
) {
  const { id } = context.params;
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

    // Check if task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: {
        id: id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the task
    await prisma.task.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}