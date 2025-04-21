import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// POST - Advanced search and filter tasks
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
    
    // Extract search/filter criteria
    const {
      searchTerm,
      priority,
      completed,
      dueBefore,
      dueAfter,
      category,
      tags,
      recurrence,
      estimatedTimeLT,
      estimatedTimeGT,
    } = body;

    // Build the where clause
    const where: any = { userId: user.id };
    
    // Full text search on title and description
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }
    
    // Priority filter
    if (priority) {
      where.priority = priority;
    }
    
    // Completion status
    if (completed !== undefined) {
      where.completed = completed;
    }
    
    // Category filter
    if (category) {
      where.category = category;
    }
    
    // Recurrence type filter
    if (recurrence) {
      where.recurrence = recurrence;
    }
    
    // Tags filter (comma-separated list)
    if (tags) {
      // For each tag, check if it's contained in the tags field
      const tagArray = tags.split(',').map((tag: string) => tag.trim());
      
      // This creates a filter that checks if any of the tags are contained within the task's tags field
      const tagConditions = tagArray.map((tag: string) => ({
        tags: { contains: tag },
      }));
      
      // Add tag conditions to the where clause
      where.OR = [...(where.OR || []), ...tagConditions];
    }
    
    // Due date range
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      
      if (dueBefore) {
        where.dueDate.lt = new Date(dueBefore);
      }
      
      if (dueAfter) {
        where.dueDate.gt = new Date(dueAfter);
      }
    }
    
    // Estimated time filters
    if (estimatedTimeLT || estimatedTimeGT) {
      where.estimatedMinutes = {};
      
      if (estimatedTimeLT) {
        where.estimatedMinutes.lt = estimatedTimeLT;
      }
      
      if (estimatedTimeGT) {
        where.estimatedMinutes.gt = estimatedTimeGT;
      }
    }

    // Get filtered tasks
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
    console.error("Error searching tasks:", error);
    return NextResponse.json(
      { error: "Failed to search tasks" },
      { status: 500 }
    );
  }
} 