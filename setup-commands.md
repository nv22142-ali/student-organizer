# Setup Commands

After configuring your environment variables (.env file), run these commands to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Create migrations based on the schema
npx prisma migrate dev --name init

# If you want to see your database in the Prisma Studio UI
npx prisma studio
```

# Development

```bash
# Run the development server
npm run dev
```

# Deployment

For deployment, make sure to set up a PostgreSQL database and update your environment variables on your deployment platform.

```bash
# Build for production
npm run build

# Start production server
npm start
``` 