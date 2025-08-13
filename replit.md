# SWIVL - Creative Inspiration App

SWIVL is an interactive creative inspiration app that generates personalized ideas from text prompts and images using AI. The application presents ideas in a swipeable card interface, allowing users to explore, save, and chain creative concepts together. Built with a modern full-stack architecture featuring React frontend, Express backend, and AI-powered content generation.

## Recent Updates
- **Endless Idea Flow**: Fixed continuous idea generation system with early prefetch at 15 cards (prevents running out), emergency prefetch at 3 cards, increased batch size to 25 ideas per prompt, multiple safety checks to ensure truly endless flow, disabled fallbacks to old/random ideas
- **AI Prompt Structure**: Updated all input types (text, voice, image, drawing) to generate structured 9-idea responses with specific categories: 3 unusual business concepts, 2 creative plays/sitcoms, 2 food recipes, 2 fine art projects - presented in random order
- **Logo Implementation**: Added beautiful concentric circle logo throughout the site (header, landing page, footer) 
- **Sidebar Enhancements**: Widened sidebar to max-w-xl (576px) with rounded top-right corner, scrollable content, vertical button layout for mobile cards, and Palette icons
- **UI Refinements**: Color selector positioned above trash button in mobile view with smaller, stacked layout, color dropdowns show group names instead of color names (e.g., "Group 2" instead of "Seafoam Green")

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
- **PostgreSQL Database**: Full database integration with Drizzle ORM and Neon hosting
- **File Upload Support**: Integration ready for cloud storage services like Google Cloud Storage and AWS S3
- **Development Hot Reload**: Vite integration for seamless full-stack development

## Data Management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Shared Schema**: Common TypeScript types between frontend and backend
- **Zod Validation**: Runtime type checking and input validation
- **Database Implementation**: Full schema with ideas, saved ideas, user authentication, and metadata storage

## AI Integration
- **Mistral 7B**: Primary model for fast and cost-effective text-based creative idea generation via Hugging Face (FREE)
- **Web Speech API**: Client-side browser speech-to-text - completely free and works offline (replaces server-side transcription)
- **Hugging Face BLIP**: Image-to-text analysis for uploaded images (FREE)
- **Llama 2**: Alternative text generation model for fallback scenarios (FREE)
- **Structured Responses**: Text parsing with template fallbacks for reliable outputs
- **Enhanced Prompts**: All AI requests use "give me unique ideas that avoid the obvious for..." prefix for better creativity
- **Zero-Cost Voice Input**: Browser-native speech recognition eliminates need for external speech-to-text APIs

## Key Features
- **Swipeable Card Interface**: Mobile-first gesture controls for idea exploration
- **Idea Chaining**: Link related ideas together for inspiration threads
- **Save System**: Personal collection of favorite creative concepts
- **Infinite Canvas**: Drag-and-drop organization system for saved ideas with zoom and pan controls
- **Multi-Modal Input**: Support for text prompts, image uploads, voice recording, and drawing pad
- **Drawing Pad**: Interactive canvas for sketching ideas that get analyzed by AI
- **Voice Input**: Browser-native Web Speech API with real-time transcription and timer display
- **Keyboard Navigation**: Desktop arrow key controls for card swiping
- **Responsive Design**: Optimized for mobile and desktop experiences

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting
- **Hugging Face**: Complete AI infrastructure - Mistral 7B for text generation, Whisper for speech-to-text, BLIP for image analysis (all FREE)
- **Google Cloud Storage**: File storage and management (configured)
- **AWS S3**: Alternative file storage option (via Uppy integration)
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload handling with multiple provider support