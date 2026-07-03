# Leyu Website Content Platform
## System Architecture Document: Leyu Frontend

---

## 1. Executive Summary

The Leyu Frontend is a modern, scalable client-side application built on **Next.js 15** using the **App Router** architecture. It leverages **TypeScript** for type safety and **React 19** for building interactive user interfaces. The system is designed with a **Feature-Based Architecture**, ensuring that each domain (e.g., Projects, Tasks, Users, Reviews) is organized into self-contained modules with clear separation of concerns.

The application serves as a comprehensive content annotation and management platform, supporting multiple user roles (SuperAdmin, ProjectManager, Facilitator, Reviewer) with role-based access control and real-time data synchronization.

---

## 2. Architectural Design Patterns

The system utilizes several key architectural patterns:

### **App Router Pattern (Next.js 15)**
- **File-System Based Routing**: Routes are defined by the folder structure in the `app/` directory
- **Server Components by Default**: Components render on the server unless marked with `"use client"`
- **Nested Layouts**: Shared UI elements across routes using layout components
- **Route Groups**: Organizing routes without affecting URL structure using `(groupName)` folders

### **Component-Based Architecture**
- **Presentational Components**: Pure UI components in `src/components/ui/`
- **Feature Components**: Business logic components in `src/app/components/`
- **Page Components**: Route-level components that compose features

### **State Management Patterns**
- **Server State**: TanStack Query (React Query) for API data fetching and caching
- **Client State**: Zustand for lightweight global state management
- **Form State**: React Hook Form for complex form handling
- **URL State**: Next.js searchParams for shareable application state

### **Data Fetching Patterns**
- **Custom Hooks**: Encapsulated API calls in `src/lib/hooks/`
- **Optimistic Updates**: Immediate UI feedback with background synchronization
- **Infinite Queries**: Pagination and infinite scroll support
- **Mutation Handling**: Consistent error handling and success notifications

---

## 3. Structural Components

### A. The Route System

```
app/
├── (auth)/              # Authentication routes (login, register)
├── (dashboard)/         # Protected dashboard routes
│   ├── superadmin/     # SuperAdmin-specific pages
│   ├── projectmanager/ # Project Manager pages
│   ├── facilitator/    # Facilitator pages
│   └── reviewer/       # Reviewer pages
├── (public)/           # Public-facing pages
├── (shared)/           # Shared route components
└── api/                # API routes (NextAuth, webhooks)
    └── auth/           # NextAuth.js authentication endpoints
```

### B. Component Organization

#### **UI Components** (`src/components/ui/`)
- **Role**: Reusable, styled components built with Radix UI and Tailwind CSS
- **Examples**: Button, Dialog, Table, Input, Select
- **Pattern**: Composition-based with shadcn/ui conventions

#### **Feature Components** (`src/app/components/`)
- **Role**: Domain-specific components containing business logic
- **Organization**: Grouped by feature domain
  - `projectManager/` - Project and task management components
  - `reviewer/` - Review and annotation components
  - `facilitator/` - Task facilitation components
  - `users/` - User management components
  - `layout/` - Layout and navigation components

#### **Page Components** (`src/app/(dashboard)/*/page.tsx`)
- **Role**: Route-level components that compose features
- **Responsibilities**: Data fetching, layout composition, route-specific logic

### C. Data Layer

#### **Custom Hooks** (`src/lib/hooks/`)
- **API Hooks**: Encapsulate TanStack Query operations
  - `useProject.ts` - Project CRUD operations
  - `useMicrotask.ts` - Micro-task management
  - `useReviewer.ts` - Review operations
  - `useFetchUser.ts` - User data fetching
  - `useNotifications.ts` - Real-time notifications

#### **Type Definitions** (`src/app/types/`)
- **project.ts**: Project, Task, MicroTask interfaces
- **global.ts**: Shared types and enums
- **auth.ts**: Authentication-related types

---

## 4. Authentication & Authorization Architecture

### **NextAuth.js Integration**
- **Provider**: Credentials-based authentication
- **Session Strategy**: JWT (JSON Web Tokens)
- **Token Storage**: HTTP-only cookies (configurable for HTTP/HTTPS)
- **Session Duration**: 24 hours with automatic expiration

### **Role-Based Access Control (RBAC)**
```typescript
Roles:
- SuperAdmin: Full system access
- ProjectManager: Project and task management
- Facilitator: Task execution and contribution
- Reviewer: Review and quality assurance
```

### **Middleware Protection**
- **File**: `src/middleware.ts`
- **Pattern**: `withAuth` wrapper from NextAuth
- **Route Guards**: Automatic redirection based on authentication status and role
- **Public Routes**: `/login`, `/linkForm` (excluded from authentication)

### **Session Management**
- **Client-Side**: `useSession()` hook for accessing user data
- **Server-Side**: `getServerSession()` for API routes and server components
- **Expiry Handling**: Custom hook (`useSessionExpiry.ts`) for automatic logout

---

## 5. Data Architecture

### **API Communication**
- **Base Client**: Axios with interceptors
- **Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL` environment variable
- **Authentication**: Bearer token injection via interceptors
- **Error Handling**: Centralized error transformation and user notifications

### **State Management Layers**

#### **Server State (TanStack Query)**
```typescript
Query Keys Structure:
- ['projects', filters] - Project listings
- ['project', projectId] - Single project
- ['tasks', taskId] - Task details
- ['microtasks', filters] - Micro-task listings
- ['notifications'] - User notifications
```

**Features**:
- Automatic background refetching
- Optimistic updates for mutations
- Cache invalidation strategies
- Stale-while-revalidate pattern

#### **Client State (Zustand)**
- **Use Cases**: UI state, temporary form data, user preferences
- **Pattern**: Minimal global state, prefer local state when possible

### **Form Handling**
- **Library**: React Hook Form
- **Validation**: Zod schema validation
- **Pattern**: Controlled components with validation feedback
- **File Uploads**: FormData with progress tracking

---

## 6. Technology Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js |
| **Language** | TypeScript 5.8 |
| **Framework** | Next.js 15.4 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4.1 |
| **Component Library** | Radix UI + shadcn/ui |
| **State Management** | TanStack Query 5.72 + Zustand 5.0 |
| **Form Handling** | React Hook Form 7.55 + Zod 3.24 |
| **Authentication** | NextAuth.js 4.24 |
| **HTTP Client** | Axios 1.12 |
| **Data Tables** | TanStack Table 8.21 |
| **Charts** | Recharts 3.1 + Chart.js 4.5 |
| **Audio Processing** | WaveSurfer.js 7.9 |
| **Icons** | Lucide React 0.487 |
| **Notifications** | Sonner 2.0 |
| **Date Handling** | date-fns 4.1 |
| **Package Manager** | pnpm |

---

## 7. Request Lifecycle (The Next.js App Router Way)

### **Client-Side Navigation**
1. **User Action**: User clicks a link or submits a form
2. **Middleware**: Checks authentication and authorization
3. **Route Handler**: Next.js resolves the route from file system
4. **Layout Rendering**: Nested layouts render from root to leaf
5. **Page Component**: Fetches data and renders UI
6. **Client Hydration**: React hydrates interactive components
7. **Data Fetching**: TanStack Query fetches and caches data
8. **UI Update**: Component re-renders with fetched data

### **API Route Lifecycle**
1. **Request**: Client sends HTTP request to `/api/*` endpoint
2. **Middleware**: NextAuth validates session
3. **Route Handler**: API route function executes
4. **Backend Call**: Axios sends request to backend API
5. **Response Transform**: Data is transformed to frontend types
6. **Error Handling**: Errors are caught and formatted
7. **Response**: JSON response sent to client
8. **Cache Update**: TanStack Query updates cache

---

## 8. Feature Modules

### **Project Management**
- **Components**: `projectManager/`
- **Features**: 
  - Project CRUD operations
  - Task creation and assignment
  - Micro-task management
  - Contributor assignment
  - Progress tracking and statistics

### **Task Annotation**
- **Components**: `facilitator/`, `reviewer/`
- **Features**:
  - Multi-modal content (text, audio, image)
  - Annotation interfaces
  - Quality review workflows
  - Submission tracking

### **User Management**
- **Components**: `users/`
- **Features**:
  - User CRUD operations
  - Role assignment
  - Profile management
  - Activity logging

### **Base Data Management**
- **Routes**: `superadmin/basedata/`
- **Features**:
  - Language and dialect management
  - Country and region data
  - Annotation types
  - Flag and rejection types

---

## 9. Security & Best Practices

### **Security Measures**
- **Authentication**: JWT-based with secure cookie storage
- **Authorization**: Middleware-enforced role-based access
- **CSRF Protection**: NextAuth built-in CSRF tokens
- **XSS Prevention**: React's automatic escaping + Content Security Policy
- **Environment Variables**: Sensitive data in `.env` files (never committed)
- **API Security**: Bearer token authentication for all backend calls

### **Performance Optimizations**
- **Server Components**: Reduced JavaScript bundle size
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: TanStack Query caching + Next.js static generation
- **Prefetching**: Automatic link prefetching for faster navigation

### **Error Handling**
- **Global Error Boundary**: Catches React errors
- **API Error Handling**: Centralized Axios interceptors
- **User Notifications**: Toast notifications for user feedback
- **Logging**: Console logging in development, structured logging in production

### **Accessibility**
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals and forms

---

## 10. Development Workflow

### **Environment Configuration**
```bash
# Development
.env

# Production
.env.production
```

**Required Variables**:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API endpoint
- `NEXT_PUBLIC_BASE_URL` - Frontend base URL
- `NEXTAUTH_SECRET` - NextAuth encryption secret
- `NEXTAUTH_URL` - NextAuth callback URL

### **Scripts**
```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

### **Code Quality**
- **ESLint**: Code linting with Next.js and React rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks
- **Lint-Staged**: Staged file linting

---

## 11. Deployment Architecture

### **Build Process**
1. **Type Checking**: TypeScript compilation
2. **Linting**: ESLint validation
3. **Build**: Next.js production build
4. **Optimization**: Automatic code splitting and minification
5. **Static Generation**: Pre-rendering static pages

### **Deployment Targets**
- **Docker**: Containerized deployment with Dockerfile
- **Standalone**: Node.js server deployment
- **Static Export**: CDN deployment (if applicable)

### **Environment-Specific Configuration**
- **Development**: Hot reload, detailed error messages
- **Production**: Optimized bundles, error tracking, secure cookies

---

## 12. Key Design Decisions

### **Why Next.js App Router?**
- Server-first architecture for better performance
- Built-in routing and API routes
- Automatic code splitting and optimization
- Excellent TypeScript support

### **Why TanStack Query?**
- Declarative data fetching
- Automatic caching and background updates
- Optimistic updates for better UX
- Built-in loading and error states

### **Why Tailwind CSS?**
- Utility-first approach for rapid development
- Consistent design system
- Small bundle size with purging
- Excellent responsive design support

### **Why NextAuth.js?**
- Industry-standard authentication
- Multiple provider support
- Built-in CSRF protection
- Seamless Next.js integration

---

## 13. Future Considerations

### **Scalability**
- **Micro-frontends**: Potential split into domain-specific apps
- **Edge Deployment**: Leverage edge functions for global performance
- **Progressive Web App**: Offline support and installability

### **Monitoring & Observability**
- **Error Tracking**: Integration with Sentry or similar
- **Analytics**: User behavior tracking
- **Performance Monitoring**: Core Web Vitals tracking
- **Logging**: Structured logging for debugging

### **Testing Strategy**
- **Unit Tests**: Component and hook testing with Jest
- **Integration Tests**: API integration testing
- **E2E Tests**: User flow testing with Playwright
- **Visual Regression**: Screenshot comparison testing

---

## 14. Conclusion

The Leyu Frontend is built with modern web development best practices, emphasizing:
- **Type Safety**: TypeScript throughout the application
- **Performance**: Server-side rendering and optimized bundles
- **Developer Experience**: Hot reload, TypeScript, and clear architecture
- **User Experience**: Fast navigation, optimistic updates, and responsive design
- **Maintainability**: Clear separation of concerns and modular architecture
- **Security**: Authentication, authorization, and secure data handling

This architecture provides a solid foundation for building a scalable, maintainable, and performant content annotation platform.
