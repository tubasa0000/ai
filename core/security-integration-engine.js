/**
 * Security Integration Engine
 * Orchestrates all security modules to provide comprehensive protection
 */

const EnforcedSystemPrompt = require('./enforced-system-prompt');
const PromptValidator = require('./prompt-validator');
const InputOutputFilter = require('./input-output-filter');
const AuditLogger = require('./audit-logger');

class SecurityIntegrationEngine {
  constructor(config = {}) {
    this.config = {
      enableAuditLog: config.enableAuditLog !== false,
      enableStrictMode: config.enableStrictMode !== false,
      logDir: config.logDir || './logs',
      ...config
    };

    // Initialize security modules
    this.enforcedPrompt = new EnforcedSystemPrompt();
    this.validator = new PromptValidator();
    this.filter = new InputOutputFilter();
    this.auditLogger = this.config.enableAuditLog ? new AuditLogger(this.config.logDir) : null;
  }

  /**
   * Process a user request through all security layers
   * @param {string} userMessage - The user's message
   * @param {Object} context - Additional context
   * @returns {Object} Security processing result
   */
  processRequest(userMessage, context = {}) {
    const requestId = this.generateRequestId();
    const processResult = {
      requestId: requestId,
      timestamp: new Date().toISOString(),
      stages: {}
    };

    try {
      // Stage 1: Input Filtering
      processResult.stages.inputFilter = this.filter.filterInput(userMessage);
      if (!processResult.stages.inputFilter.isClean && this.config.enableStrictMode) {
        return this.createBlockedResult(requestId, 'Input filtering detected issues', processResult.stages.inputFilter.issues);
      }

      // Stage 2: Prompt Validation
      const filteredMessage = processResult.stages.inputFilter.filtered;
      processResult.stages.validation = this.validator.validate(filteredMessage);
      if (!processResult.stages.validation.isValid) {
        return this.createBlockedResult(requestId, 'Prompt validation failed', processResult.stages.validation.errors);
      }

      // Stage 3: Enforced Rules Check
      processResult.stages.enforcedrules = this.enforcedPrompt.validateAgainstRules(filteredMessage);
      if (!processResult.stages.enforcedrules.isValid) {
        return this.createBlockedResult(requestId, 'Violated enforced security rules', processResult.stages.enforcedrules.violations);
      }

      // All validations passed
      processResult.approved = true;
      processResult.message = 'Request approved for processing';
      processResult.sanitizedInput = filteredMessage;
      processResult.systemPrompt = this.enforcedPrompt.getSystemPrompt();

      // Log approved request
      if (this.auditLogger) {
        this.auditLogger.logRequest({
          requestId: requestId,
          approved: true,
          userMessage: userMessage,
          context: context
        });
      }

      return processResult;
    } catch (error) {
      console.error('Security integration error:', error);
      return this.createBlockedResult(requestId, 'Security processing error', [error.message]);
    }
  }

  /**
   * Process AI response through security filters
   * @param {string} aiResponse - The AI's response
   * @param {Object} requestContext - The request context
   * @returns {Object} Processing result
   */
  processResponse(aiResponse, requestContext = {}) {
    const processResult = {
      timestamp: new Date().toISOString(),
      stages: {}
    };

    try {
      // Stage 1: Output Filtering
      processResult.stages.outputFilter = this.filter.filterOutput(aiResponse);
      
      if (!processResult.stages.outputFilter.isClean) {
        if (this.config.enableStrictMode) {
          return this.createBlockedResult(null, 'Output contains policy violations', processResult.stages.outputFilter.issues);
        }
        // Log warning but allow
        if (this.auditLogger) {
          this.auditLogger.logSecurityEvent({
            type: 'OUTPUT_WARNING',
            severity: 'MEDIUM',
            issues: processResult.stages.outputFilter.issues,
            context: requestContext
          });
        }
      }

      processResult.approved = true;
      processResult.filteredResponse = processResult.stages.outputFilter.filtered;

      // Log response
      if (this.auditLogger) {
        this.auditLogger.logInteraction({
          type: 'RESPONSE',
          original: aiResponse,
          filtered: processResult.filteredResponse,
          issues: processResult.stages.outputFilter.issues,
          context: requestContext
        });
      }

      return processResult;
    } catch (error) {
      console.error('Response processing error:', error);
      return this.createBlockedResult(null, 'Response processing error', [error.message]);
    }
  }

  /**
   * Get the enforced system prompt
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return this.enforcedPrompt.getSystemPrompt();
  }

  /**
   * Get all enforced rules
   * @returns {Array} Array of enforced rules
   */
  getEnforcedRules() {
    return this.enforcedPrompt.getEnforcedRules();
  }

  /**
   * Get security report
   * @returns {Object} Security report
   */
  getSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      configuration: {
        auditLogging: this.config.enableAuditLog,
        strictMode: this.config.enableStrictMode
      },
      securityModules: {
        enforcedPrompt: 'active',
        promptValidator: 'active',
        inputOutputFilter: 'active',
        auditLogger: this.auditLogger ? 'active' : 'inactive'
      },
      auditSummary: this.auditLogger ? this.auditLogger.getSecuritySummary() : null,
      enforcedRules: this.getEnforcedRules()
    };
  }

  /**
   * Create a blocked result
   * @private
   */
  createBlockedResult(requestId, reason, issues = []) {
    const result = {
      requestId: requestId,
      timestamp: new Date().toISOString(),
      approved: false,
      message: reason,
      issues: issues
    };

    // Log violation
    if (this.auditLogger) {
      this.auditLogger.logViolation({
        requestId: requestId,
        reason: reason,
        issues: issues
      });
    }

    return result;
  }

  /**
   * Generate a unique request ID
   * @private
   */
  generateRequestId() {
    return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = SecurityIntegrationEngine;