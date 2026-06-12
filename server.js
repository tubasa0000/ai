/**
 * Express.js Server - Security Hardened Chat AI
 * Main application server with integrated security layers
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const SecurityIntegrationEngine = require('./core/security-integration-engine');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Security Engine
const securityEngine = new SecurityIntegrationEngine({
  enableAuditLog: process.env.ENABLE_AUDIT_LOGGING !== 'false',
  enableStrictMode: process.env.ENABLE_SECURITY_ENFORCEMENT !== 'false',
  logDir: process.env.LOG_FILE_PATH || './logs'
});

// ==================== SECURITY MIDDLEWARE ====================

// Helmet - HTTP Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID Middleware
app.use((req, res, next) => {
  req.id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ==================== ROUTES ====================

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Get Enforced Rules
 */
app.get('/api/enforced-rules', (req, res) => {
  try {
    const rules = securityEngine.getEnforcedRules();
    res.json({
      success: true,
      rules: rules,
      totalRules: rules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve enforced rules'
    });
  }
});

/**
 * Validate Prompt
 */
app.post('/api/validate-prompt', (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = securityEngine.processRequest(prompt, { type: 'validation' });

    res.json({
      success: result.approved,
      requestId: result.requestId,
      approved: result.approved,
      message: result.message,
      issues: result.issues || [],
      validationDetails: result.stages
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

/**
 * Chat Endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemPrompt, promptId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Process request through security engine
    const securityResult = securityEngine.processRequest(message, {
      type: 'chat',
      promptId: promptId,
      systemPrompt: systemPrompt
    });

    if (!securityResult.approved) {
      return res.status(403).json({
        success: false,
        requestId: securityResult.requestId,
        error: securityResult.message,
        issues: securityResult.issues
      });
    }

    // Here you would normally call your AI API (OpenAI, etc.)
    // For now, return a placeholder response
    const aiResponse = await generateAIResponse(securityResult.sanitizedInput, systemPrompt);

    // Process response through security filters
    const responseResult = securityEngine.processResponse(aiResponse, {
      requestId: securityResult.requestId,
      userMessage: message
    });

    res.json({
      success: true,
      requestId: securityResult.requestId,
      message: responseResult.filteredResponse,
      securityChecksPassed: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Chat processing failed'
    });
  }
});

/**
 * Get Audit Log (Admin endpoint)
 */
app.get('/api/audit-log', (req, res) => {
  try {
    // In production, this should require authentication
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_KEY;

    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const security = securityEngine.getSecurityReport();
    res.json({
      success: true,
      report: security
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log'
    });
  }
});

/**
 * Get Available Prompts
 */
app.get('/api/prompts', (req, res) => {
  try {
    const prompts = {
      default: {
        id: 'default',
        name: 'Default Assistant',
        description: 'General purpose AI assistant with safety guardrails',
        systemPrompt: securityEngine.getSystemPrompt()
      },
      technical: {
        id: 'technical',
        name: 'Technical Assistant',
        description: 'Specialized for technical and programming questions',
        context: 'You are a technical expert assistant. Provide accurate, detailed technical guidance.'
      },
      creative: {
        id: 'creative',
        name: 'Creative Assistant',
        description: 'Specialized for creative writing and ideation',
        context: 'You are a creative writing assistant. Help users with creative projects and brainstorming.'
      }
    };

    res.json({
      success: true,
      prompts: Object.values(prompts)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prompts'
    });
  }
});

/**
 * 404 Error Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id
  });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate AI Response (Placeholder)
 * In production, this would call OpenAI or another AI service
 */
async function generateAIResponse(userMessage, customSystemPrompt) {
  // Placeholder - In production, integrate with OpenAI API
  return `I received your message: "${userMessage}". This is a placeholder response. In production, this would be replaced with actual AI responses.`;
}

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, () => {
  console.log(`\n🔒 Security Hardened Chat AI Server`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Audit Logging: ${process.env.ENABLE_AUDIT_LOGGING !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`Security Enforcement: ${process.env.ENABLE_SECURITY_ENFORCEMENT !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`\n✅ Server is running on http://localhost:${PORT}`);
  console.log(`📊 Security Report: http://localhost:${PORT}/api/audit-log`);
  console.log(`\n🛡️ Security modules initialized:`);
  console.log(`   - Enforced System Prompt`);
  console.log(`   - Prompt Validator`);
  console.log(`   - Input/Output Filter`);
  console.log(`   - Audit Logger\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;