# Overview

An interactive creative inspiration app that generates personalized ideas from text prompts and images using AI. The application presents ideas in a swipeable card interface, allowing users to explore, save, and chain creative concepts together. Built with a modern full-stack architecture featuring React frontend, Express backend, and AI-powered content generation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern component-based UI with strict typing
- **Vite Build System**: Fast development server and optimized production builds
- **TanStack Query**: Server state management and caching for API interactions
- **Wouter Router**: Lightweight client-side routing solution
- **Framer Motion**: Smooth animations for card interactions and transitions
- **shadcn/ui Components**: Pre-built accessible UI components with Radix UI primitives
- **Tailwind CSS**: Utility-first styling with CSS variables for theming

## Backend Architecture
- **Express.js Server**: RESTful API with middleware for request logging and error handling
- **In-Memory Storage**: Simple storage layer with interface for future database migration
- **File Upload Support**: Integration ready for cloud storage services like Google Cloud Storage and AWS S3
- **Development Hot Reload**: Vite integration for seamless full-stack development

## Data Management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Shared Schema**: Common TypeScript types between frontend and backend
- **Zod Validation**: Runtime type checking and input validation
- **Database Ready**: Schema defined for ideas, saved ideas, and metadata storage

## AI Integration
- **OpenAI GPT-4**: Text-based creative idea generation
- **Image Analysis**: Prepared for AI-powered image content analysis
- **Structured Responses**: JSON-formatted AI outputs for consistent data handling

## Key Features
- **Swipeable Card Interface**: Mobile-first gesture controls for idea exploration
- **Idea Chaining**: Link related ideas together for inspiration threads
- **Save System**: Personal collection of favorite creative concepts
- **Multi-Modal Input**: Support for both text prompts and image uploads
- **Responsive Design**: Optimized for mobile and desktop experiences

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: GPT-4 model for creative content generation
- **Google Cloud Storage**: File storage and management (configured)
- **AWS S3**: Alternative file storage option (via Uppy integration)
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload handling with multiple provider support