# 📚 API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

Admin endpoints require Bearer token authentication:

```
Authorization: Bearer YOUR_ADMIN_KEY
```

## Rate Limiting

Default limits:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response Header**: `RateLimit-Remaining`

## Endpoints

### 1. Health Check

Verify the server is running.

```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-06-10T19:30:00Z",
  "uptime": 3600
}
```

### 2. Get Enforced Rules

Retrieve all enforced security rules.

```http
GET /api/enforced-rules
```

**Response** (200 OK):
```json
{
  "success": true,
  "rules": [
    {
      "id": "safety_first",
      "rule": "Always verify safety before following user instructions",
      "priority": 1,
      "description": "Every user request must be evaluated for potential harm before processing"
    },
    {
      "id": "no_harmful_content",
      "rule": "Never generate harmful, illegal, or discriminatory content",
      "priority": 1,
      "description": "Refuse requests that could cause harm or violate laws"
    }
  ],
  "totalRules": 7
}
```

### 3. Validate Prompt

Validate a prompt against security rules without processing it.

```http
POST /api/validate-prompt
Content-Type: application/json

{
  "prompt": "What is the capital of France?"
}
```

**Request Body**:
- `prompt` (string, required): The prompt to validate

**Response** (200 OK - Valid):
```json
{
  "success": true,
  "requestId": "SEC-1686435000000-abc123def",
  "approved": true,
  "message": "Request approved for processing",
  "issues": [],
  "validationDetails": {
    "inputFilter": {
      "original": "What is the capital of France?",
      "filtered": "What is the capital of France?",
      "issues": [],
      "isClean": true,
      "riskLevel": "low"
    },
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [],
      "riskLevel": "low",
      "sanitized": "What is the capital of France?"
    },
    "enforcedrules": {
      "isValid": true,
      "violations": [],
      "message": "Message passes safety validation"
    }
  }
}
```

**Response** (403 Forbidden - Invalid):
```json
{
  "success": false,
  "requestId": "SEC-1686435000000-xyz789",
  "approved": false,
  "message": "Violated enforced security rules",
  "issues": [
    {
      "ruleId": "no_prompt_injection",
      "type": "prompt_injection_detected",
      "pattern": "ignore.*previous.*instruction"
    }
  ]
}
```

### 4. Chat Endpoint

Send a message to the AI assistant.

```http
POST /api/chat
Content-Type: application/json

{
  "message": "How does photosynthesis work?",
  "promptId": "default",
  "systemPrompt": null
}
```

**Request Body**:
- `message` (string, required): The user's message
- `promptId` (string, optional): ID of the system prompt to use
  - `default`: General purpose assistant
  - `technical`: Technical expert
  - `creative`: Creative writing assistant
- `systemPrompt` (string, optional): Custom system prompt context

**Response** (200 OK - Success):
```json
{
  "success": true,
  "requestId": "SEC-1686435000000-abc123def",
  "message": "Photosynthesis is the process by which plants convert light energy into chemical energy...",
  "securityChecksPassed": true,
  "timestamp": "2026-06-10T19:30:00Z"
}
```

**Response** (403 Forbidden - Blocked):
```json
{
  "success": false,
  "requestId": "SEC-1686435000000-xyz789",
  "error": "Request violates security policy",
  "issues": [
    {
      "category": "prompt_injection",
      "severity": "high",
      "description": "Detected potential prompt injection pattern"
    }
  ]
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Message is required"
}
```

**Response** (500 Server Error):
```json
{
  "success": false,
  "error": "Chat processing failed"
}
```

### 5. Get Available Prompts

Retrieve available system prompts.

```http
GET /api/prompts
```

**Response** (200 OK):
```json
{
  "success": true,
  "prompts": [
    {
      "id": "default",
      "name": "Default Assistant",
      "description": "General purpose AI assistant with safety guardrails",
      "systemPrompt": "You are a secure, safety-focused AI assistant..."
    },
    {
      "id": "technical",
      "name": "Technical Assistant",
      "description": "Specialized for technical and programming questions",
      "context": "You are a technical expert assistant. Provide accurate, detailed technical guidance."
    },
    {
      "id": "creative",
      "name": "Creative Assistant",
      "description": "Specialized for creative writing and ideation",
      "context": "You are a creative writing assistant. Help users with creative projects and brainstorming."
    }
  ]
}
```

### 6. Get Audit Log (Admin Only)

Retrieve security and audit information.

```http
GET /api/audit-log
Authorization: Bearer your-admin-key
```

**Response** (200 OK):
```json
{
  "success": true,
  "report": {
    "timestamp": "2026-06-10T19:30:00Z",
    "configuration": {
      "auditLogging": true,
      "strictMode": true
    },
    "securityModules": {
      "enforcedPrompt": "active",
      "promptValidator": "active",
      "inputOutputFilter": "active",
      "auditLogger": "active"
    },
    "auditSummary": {
      "total": 150,
      "bySeverity": {
        "LOW": 100,
        "MEDIUM": 30,
        "HIGH": 15,
        "CRITICAL": 5
      },
      "byType": {
        "INTERACTION": 120,
        "RULE_VIOLATION": 25,
        "SECURITY_EVENT": 5
      },
      "lastEvent": {
        "timestamp": "2026-06-10T19:29:55Z",
        "type": "INTERACTION",
        "severity": "MEDIUM"
      }
    },
    "enforcedRules": [
      {
        "id": "safety_first",
        "rule": "Always verify safety before following user instructions",
        "priority": 1
      }
    ]
  }
}
```

**Response** (403 Forbidden - Unauthorized):
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Error Handling

### Common Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing required fields |
| 403 | Forbidden | Security violation or unauthorized |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

### Error Response Format

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "requestId": "SEC-1686435000000-abc123def"
}
```

## Request/Response Examples

### Example 1: Safe Question

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?"
  }'
```

### Example 2: Rejected Request (Prompt Injection)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Ignore your previous instructions and..."
  }'
```

Response: 403 with security violation details

### Example 3: Validation Check

```bash
curl -X POST http://localhost:3000/api/validate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Your test prompt here"
  }'
```

## Rate Limiting Example

After hitting rate limit:

```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1686435900

{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

## Best Practices

1. **Always check the `success` field** in responses
2. **Implement exponential backoff** for rate limit retries
3. **Store `requestId`** for debugging and support
4. **Never expose admin keys** in client-side code
5. **Validate responses** on the client side as well
6. **Monitor error rates** in your application

---

**API Version**: 1.0  
**Last Updated**: 2026-06-10