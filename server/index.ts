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
    
    // Check for critical environment variables that could cause deployment failures
    const criticalEnvVars = ['DATABASE_URL'];
    const missingCriticalEnvVars = criticalEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingCriticalEnvVars.length > 0) {
      log(`✗ Critical environment variables missing: ${missingCriticalEnvVars.join(', ')}`);
      log(`These variables are required for the application to function properly in production.`);
      // Don't exit in development mode, but log as error
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing critical environment variables: ${missingCriticalEnvVars.join(', ')}`);
      }
    }
    
    // Optional environment variables with warnings
    if (!process.env.OPENAI_API_KEY) {
      log("Warning: OPENAI_API_KEY not found - AI features will use fallback responses");
    }
    
    // Log environment status for debugging
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Port: ${process.env.PORT || '5000'}`);
    log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
    
    log("Registering routes...");
    let server;
    try {
      server = await registerRoutes(app);
      log("Routes registered successfully");
    } catch (routeError: any) {
      log(`✗ Failed to register routes: ${routeError.message}`);
      throw new Error(`Route registration failed: ${routeError.message}`);
    }

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
      try {
        await setupVite(app, server);
        log("Vite dev server setup complete");
      } catch (viteError: any) {
        log(`✗ Failed to setup Vite dev server: ${viteError.message}`);
        throw new Error(`Vite setup failed: ${viteError.message}`);
      }
    } else {
      log("Setting up static file serving...");
      try {
        serveStatic(app);
        log("Static file serving setup complete");
      } catch (staticError: any) {
        log(`✗ Failed to setup static file serving: ${staticError.message}`);
        throw new Error(`Static file serving setup failed: ${staticError.message}`);
      }
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
    
    // Use a Promise to handle server startup with timeout
    await new Promise<void>((resolve, reject) => {
      const startupTimeout = setTimeout(() => {
        reject(new Error('Server startup timeout - failed to bind to port within 30 seconds'));
      }, 30000);
      
      const serverInstance = server.listen(port, "0.0.0.0", () => {
        clearTimeout(startupTimeout);
        log(`✓ Server successfully started and serving on port ${port}`);
        log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        log(`✓ Server is ready to accept connections`);
        resolve();
      });
      
      serverInstance.on('error', (error) => {
        clearTimeout(startupTimeout);
        reject(error);
      });
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
    
    // Provide specific error handling and recovery suggestions
    if (error.code === 'EADDRINUSE') {
      log(`✗ Port ${process.env.PORT || '5000'} is already in use`);
      log(`Suggestion: Check if another process is using this port or set a different PORT environment variable`);
    } else if (error.code === 'EACCES') {
      log(`✗ Permission denied to bind to port ${process.env.PORT || '5000'}`);
      log(`Suggestion: Use a port number above 1024 or run with appropriate permissions`);
    } else if (error.message.includes('DATABASE_URL')) {
      log(`✗ Database connection issue detected`);
      log(`Suggestion: Ensure DATABASE_URL environment variable is set correctly`);
    } else if (error.message.includes('environment variables')) {
      log(`✗ Environment configuration issue`);
      log(`Suggestion: Check that all required environment variables are set in your deployment`);
    } else if (error.message.includes('timeout')) {
      log(`✗ Server startup timeout`);
      log(`Suggestion: The server failed to start within 30 seconds - check for blocking operations during startup`);
    }
    
    // Log the stack trace in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
      log(`Development mode: Server will not exit to allow debugging`);
      // In development, don't exit so the developer can debug
      return;
    }
    
    // In production, log additional deployment-specific guidance
    log(`Production deployment failed. Common causes:`);
    log(`1. Missing environment variables (DATABASE_URL, etc.)`);
    log(`2. Port binding issues (ensure PORT is correctly set)`);
    log(`3. Database connectivity problems`);
    log(`4. Memory or resource constraints during startup`);
    
    // Exit with error code to indicate failure
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log(`✗ Uncaught Exception: ${error.message}`);
  console.error('Uncaught Exception:', error);
  
  // In production, log additional context
  if (process.env.NODE_ENV === 'production') {
    console.error('This uncaught exception may have caused the deployment to fail');
    console.error('Check your code for unhandled errors and add proper try-catch blocks');
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`✗ Unhandled Rejection at Promise: ${promise}, reason: ${reason}`);
  console.error('Unhandled Rejection:', reason);
  
  // In production, log additional context
  if (process.env.NODE_ENV === 'production') {
    console.error('This unhandled promise rejection may have caused the deployment to fail');
    console.error('Check your async code for missing catch blocks or error handling');
  }
  
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
