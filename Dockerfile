# Use official Node.js image as the base
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set a dummy DATABASE_URL to allow Prisma to generate the client during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Build the frontend (if using Vite/React)
RUN npm run build

# Expose port (Cloud Run default is 8080)
EXPOSE 8080

# Set environment to production to prevent Vite dev server from starting
ENV NODE_ENV=production

# Start the production server
CMD ["npm", "start"]

