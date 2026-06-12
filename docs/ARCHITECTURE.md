# 🏗️ Architecture Documentation

## System Overview

The Chat AI Security Hardened Edition is built on a multi-layered security architecture that ensures safe AI interactions through enforced rules, validation, and monitoring.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js API Server                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          HTTP Security Headers (Helmet)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      CORS + Rate Limiting Middleware               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│           Security Integration Engine                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 1: Input Filtering                           │  │
│  │  ├─ Content sanitization                            │  │
│  │  ├─ Escape sequence removal                         │  │
│  │  ├─ Special character filtering                     │  │
│  │  └─ Dangerous pattern detection                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 2: Prompt Validation                         │  │
│  │  ├─ Length validation                               │  │
│  │  ├─ Pattern matching                                │  │
│  │  ├─ Keyword filtering                               │  │
│  │  └─ Structure validation                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 3: Enforced Rules Check                      │  │
│  │  ├─ Safety verification                             │  │
│  │  ├─ Harmful content detection                       │  │
│  │  ├─ Prompt injection prevention                     │  │
│  │  ├─ Privacy protection check                        │  │
│  │  └─ Rule violation logging                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 4: Output Filtering                          │  │
│  │  ├─ Prompt leakage detection                        │  │
│  │  ├─ Dangerous content check                         │  │
│  │  ├─ Executable code detection                       │  │
│  │  └─ Policy violation check                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 5: Audit Logging                             │  │
│  │  ├─ Request logging                                 │  │
│  │  ├─ Security event logging                          │  │
│  │  ├─ Violation logging                               │  │
│  │  └─ Analytics & reporting                           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Service / LLM Integration                   │
│  (OpenAI, Claude, Llama, or custom model)                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Core Security Modules

#### EnforcedSystemPrompt
**Location**: `core/enforced-system-prompt.js`

**Responsibility**: Manage and enforce system-level security rules

**Key Methods**:
```javascript
- getSystemPrompt()              // Get enforced system prompt
- getEnforcedRules()             // List all rules
- getRulesByPriority(priority)   // Filter by priority
- validateAgainstRules(message)  // Check for violations
- generateResponseTemplate()     // Create safe response
```

**Data Structure**:
```javascript
enforcedRules = [
  {
    id: string,
    rule: string,
    priority: number (1=critical, 2=important),
    description: string
  }
]
```

#### PromptValidator
**Location**: `core/prompt-validator.js`

**Responsibility**: Validate user inputs against security policies

**Key Methods**:
```javascript
- validate(prompt)              // Validate a single prompt
- sanitize(prompt)              // Clean a prompt
- validateBatch(prompts)        // Validate multiple prompts
- hasJSONInjection(prompt)      // Detect JSON attacks
- hasCodeInjection(prompt)      // Detect code attacks
```

**Validation Levels**:
- Length validation
- Pattern matching
- Keyword filtering
- Structure validation

#### InputOutputFilter
**Location**: `core/input-output-filter.js`

**Responsibility**: Filter and sanitize inputs and outputs

**Key Methods**:
```javascript
- filterInput(input)             // Filter user input
- filterOutput(output)           // Filter AI output
- makeSafe(content, isOutput)    // Create safe version
- containsPromptLeakage(text)    // Detect prompt exposure
- containsExecutableCode(text)   // Detect code patterns
```

**Dangerous Content Categories**:
- Malicious software
- Security exploits
- Unauthorized access
- Web attacks
- Network attacks
- Sensitive data
- Hate speech
- Illegal activity

#### AuditLogger
**Location**: `core/audit-logger.js`

**Responsibility**: Log all interactions and security events

**Key Methods**:
```javascript
- logInteraction(entry)          // Log normal interaction
- logSecurityEvent(event)        // Log security event
- logRequest(request)            // Log request approval/denial
- logViolation(violation)        // Log rule violation
- readRecentLogs(type, lines)    // Read log history
- getSecuritySummary()           // Get summary report
```

**Log File Structure**:
```
./logs/
├── audit.log           # All interactions
└── security.log        # Security events only
```

#### SecurityIntegrationEngine
**Location**: `core/security-integration-engine.js`

**Responsibility**: Orchestrate all security modules

**Key Methods**:
```javascript
- processRequest(message, context)    // Process user request
- processResponse(response, context)  // Process AI response
- getSystemPrompt()                   // Get enforced prompt
- getEnforcedRules()                  // Get all rules
- getSecurityReport()                 // Get full report
```

### 2. Express.js Server

**Location**: `server.js`

**Responsibilities**:
- Handle HTTP requests
- Apply middleware (Helmet, CORS, Rate Limiting)
- Route requests to security engine
- Return formatted responses
- Log errors

**Middleware Stack**:
```
1. Helmet           - HTTP security headers
2. CORS             - Cross-origin protection
3. Rate Limiter     - DDoS protection
4. Request ID       - Tracing
5. Body Parser      - JSON parsing
6. Security Routes  - Custom logic
```

## Data Flow

### Request Processing Flow

```
┌─ User Request
│
├─> Express Server
│   ├─ Helmet (Security Headers)
│   ├─ CORS Check
│   ├─ Rate Limit Check
│   └─ Body Validation
│
├─> Security Integration Engine
│   ├─> Input Filter
│   │   ├─ Sanitize special chars
│   │   ├─ Remove escape sequences
│   │   └─ Detect dangerous patterns
│   │
│   ├─> Prompt Validator
│   │   ├─ Check length
│   │   ├─ Match patterns
│   │   ├─ Filter keywords
│   │   └─ Validate structure
│   │
│   ├─> Enforced Rules
│   │   └─ Check against 7 rules
│   │
│   └─> Audit Logger
│       └─ Log decision
│
├─> Request Approved or Blocked
│
└─> API Response
```

### Response Processing Flow

```
┌─ AI Response
│
├─> Security Integration Engine
│   ├─> Output Filter
│   │   ├─ Detect prompt leakage
│   │   ├─ Check for dangerous content
│   │   ├─ Detect executable code
│   │   └─ Identify violations
│   │
│   └─> Audit Logger
│       ├─ Log response
│       └─ Log any issues
│
├─> Filtered Response
│
└─> API Response to Client
```

## Configuration Management

### Environment Variables

```bash
# Server Configuration
PORT=3000                              # Server port
NODE_ENV=production                    # Environment

# Security Configuration
ENABLE_SECURITY_ENFORCEMENT=true       # Enforce rules
ENABLE_AUDIT_LOGGING=true              # Log events
ADMIN_KEY=your-secure-admin-key        # Admin authentication

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100            # Requests per window

# CORS
ALLOWED_ORIGINS=...                    # Comma-separated origins

# Logging
LOG_FILE_PATH=./logs                   # Log directory
```

## Security Decision Making

### Request Approval Decision Tree

```
User Message
    ↓
Input Filter
├─ CLEAN → Proceed
└─ ISSUES → (Strict Mode: Block | Normal: Warn & Continue)
    ↓
Prompt Validator
├─ VALID → Proceed
└─ ERRORS → Block
    ↓
Enforced Rules
├─ PASS → Approve
└─ VIOLATIONS → Block
    ↓
Request Approved
```

### Response Approval Decision Tree

```
AI Response
    ↓
Output Filter
├─ CLEAN → Proceed
└─ ISSUES → (Strict Mode: Block | Normal: Warn & Log)
    ↓
Filtered Response
    ↓
Response Approved
```

## Performance Considerations

### Caching Strategy

- Rules cached in memory (reloaded on config change)
- Validation patterns pre-compiled
- Log writes asynchronous (non-blocking)

### Optimization

```javascript
// Pattern compilation
const patterns = [/pattern1/, /pattern2/]; // Cached

// Batch validation
if (enableBatchProcessing) {
  validator.validateBatch(messages);
}

// Asynchronous logging
auditLogger.writeLog(filePath, entry); // Non-blocking
```

## Scalability

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic across instances
2. **Centralized Logging**: Use shared log storage
3. **Shared Config**: Use environment variables or config service

### Vertical Scaling

1. **Increase memory** for larger request queues
2. **Adjust rate limits** based on capacity
3. **Optimize patterns** for faster matching

## Monitoring and Observability

### Metrics to Track

```javascript
metrics = {
  requests: {
    total: number,
    approved: number,
    blocked: number,
    rateLimit: number
  },
  security: {
    violations: number,
    injectionAttempts: number,
    dataLeakageAttempts: number
  },
  performance: {
    avgResponseTime: number,
    maxResponseTime: number,
    errorRate: number
  }
}
```

### Health Checks

```bash
# System health
GET /health

# Security status
GET /api/audit-log (requires admin key)

# Rules verification
GET /api/enforced-rules
```

## Extension Points

### Adding Custom Rules

```javascript
// In EnforcedSystemPrompt
this.enforcedRules.push({
  id: 'custom_rule',
  rule: 'Custom rule description',
  priority: 2,
  description: 'Custom implementation'
});
```

### Custom Validators

```javascript
// In PromptValidator
this.customValidators = [
  (prompt) => {
    // Custom validation logic
    return { isValid: true, issues: [] };
  }
];
```

### Custom Filters

```javascript
// In InputOutputFilter
this.customPatterns = [
  {
    pattern: /your-pattern/i,
    category: 'your_category',
    severity: 'high'
  }
];
```

## Testing Strategy

### Unit Tests
- Validator logic
- Filter effectiveness
- Rule enforcement
- Logging functionality

### Integration Tests
- End-to-end request flow
- API responses
- Error handling

### Security Tests
- Injection attack attempts
- Rule bypass attempts
- Data leakage tests
- Performance under load

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18+
- **Security**: Helmet, express-rate-limit, CORS
- **Logging**: fs (native Node.js)
- **Config**: dotenv
- **Testing**: Jest, Supertest

## Future Architecture Enhancements

1. **Microservices**: Split security modules into services
2. **Message Queue**: Async processing with Redis/RabbitMQ
3. **ML Integration**: ML-based threat detection
4. **Distributed Tracing**: OpenTelemetry integration
5. **Graph Database**: Complex relationship analysis
6. **Real-time Analytics**: WebSocket event streaming

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-06-10