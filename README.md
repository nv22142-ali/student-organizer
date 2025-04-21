# Task Management App with Advanced Scheduling

A modern task management application built with Next.js, Prisma, and Next-Auth.

## Features

### Basic Task Management
- Create, edit, and delete tasks
- Mark tasks as complete
- Set priorities (Low, Normal, High, Urgent)
- Add descriptions and due dates

### Advanced Scheduling Features
- **Recurring Tasks**: Set tasks to repeat daily, on weekdays, weekly, biweekly, monthly, or yearly
- **Task End Dates**: Specify when recurring tasks should stop repeating
- **Time Estimation**: Add time estimates to tasks to better plan your day
- **Reminders**: Set reminder times for important tasks
- **Categorization**: Organize tasks into custom categories
- **Tagging**: Add multiple tags to tasks for flexible organization

### Task Filtering & Search
- Filter tasks by multiple criteria:
  - Priority level
  - Due date ranges
  - Categories
  - Tags
  - Completion status
  - Recurrence type
  - Estimated time

### Analytics & Productivity Metrics
- View task completion rates
- Track productivity trends over time
- Analyze time spent on different categories of tasks
- Monitor overdue tasks and upcoming deadlines

## Technology Stack

- **Frontend**: Next.js with React
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Chakra UI

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Advanced Features
- `GET /api/tasks/recurring` - Get all recurring tasks
- `POST /api/tasks/recurring` - Generate next occurrence of a recurring task
- `POST /api/tasks/search` - Advanced search and filtering
- `GET /api/tasks/analytics` - Get productivity metrics and analytics

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Schema

The application uses SQLite with Prisma ORM. The schema defines the following models:

- **User**: User account information
- **Task**: Task data with advanced scheduling features
  - Basic: title, description, dueDate, completed, priority
  - Advanced: recurrence, recurrenceEnd, estimatedMinutes, reminderTime, tags, category

## License

MIT
