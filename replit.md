# SWIVL - Creative Inspiration App

SWIVL is an interactive creative inspiration app that generates personalized ideas from text prompts and images using AI. The application presents ideas in a swipeable card interface, allowing users to explore, save, and chain creative concepts together. Built with a modern full-stack architecture featuring React frontend, Express backend, and AI-powered content generation.

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
- **Mistral 7B**: Primary model for fast and cost-effective text-based creative idea generation via Hugging Face
- **OpenAI GPT-4o**: Fallback for text generation and primary for vision/image analysis
- **OpenAI Whisper**: Audio transcription for voice input processing
- **Hugging Face BLIP**: Image-to-text analysis for uploaded images
- **Structured Responses**: JSON-formatted AI outputs with text parsing fallbacks

## Key Features
- **Swipeable Card Interface**: Mobile-first gesture controls for idea exploration
- **Idea Chaining**: Link related ideas together for inspiration threads
- **Save System**: Personal collection of favorite creative concepts
- **Infinite Canvas**: Drag-and-drop organization system for saved ideas with zoom and pan controls
- **Multi-Modal Input**: Support for text prompts, image uploads, voice recording, and drawing pad
- **Drawing Pad**: Interactive canvas for sketching ideas that get analyzed by AI
- **Voice Input**: Real-time speech-to-text with timer display for audio prompts
- **Keyboard Navigation**: Desktop arrow key controls for card swiping
- **Responsive Design**: Optimized for mobile and desktop experiences

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting
- **Hugging Face**: Mistral 7B model for primary text generation and BLIP for image analysis
- **OpenAI API**: GPT-4o for fallback text generation, vision analysis, and Whisper for audio transcription
- **Google Cloud Storage**: File storage and management (configured)
- **AWS S3**: Alternative file storage option (via Uppy integration)
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload handling with multiple provider support