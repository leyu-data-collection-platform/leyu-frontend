# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy environment files and package files

COPY package*.json ./
RUN pnpm install



# Copy the rest of the app and build
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time by
# Next.js, not read at container runtime -- so they must be passed in here
# as build args, not just as a container/service runtime env var. Override
# both with --build-arg when building the image for your deployment.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

RUN pnpm run build

#ENV NODE_ENV production
# Copy environment files and necessary files from builder stage


EXPOSE 3000

CMD ["pnpm", "start"]