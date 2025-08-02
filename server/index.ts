import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Main server initialization with comprehensive error handling
(async () => {
  try {
    log("Starting server initialization...");
    
    // Check for required environment variables
    const requiredEnvVars = ['NODE_ENV'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      log(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    // Optional environment variables with warnings
    if (!process.env.OPENAI_API_KEY) {
      log("Warning: OPENAI_API_KEY not found - AI features will use fallback responses");
    }
    
    log("Registering routes...");
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error handled: ${status} - ${message}`);
      res.status(status).json({ message });
      
      // Don't throw the error in production to prevent crashes
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error:', err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log("Setting up Vite dev server...");
      await setupVite(app, server);
      log("Vite dev server setup complete");
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
      log("Static file serving setup complete");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${process.env.PORT}. Using default port 5000.`);
    }
    
    log(`Attempting to start server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`✓ Server successfully started and serving on port ${port}`);
      log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`✓ Server is ready to accept connections`);
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`✗ Port ${port} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        log(`✗ Permission denied to bind to port ${port}`);
        process.exit(1);
      } else {
        log(`✗ Server error: ${error.message}`);
        console.error('Full server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error: any) {
    log(`✗ Failed to initialize server: ${error.message}`);
    console.error('Full initialization error:', error);
    
    // Log the stack trace in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    // Exit with error code to indicate failure
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log(`✗ Uncaught Exception: ${error.message}`);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`✗ Unhandled Rejection at Promise: ${promise}, reason: ${reason}`);
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
