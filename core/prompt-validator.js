/**
 * Prompt Validator Module
 * Validates user inputs for security threats and policy violations
 */

class PromptValidator {
  constructor() {
    this.maxLength = 5000;
    this.minLength = 1;
    this.bannedPatterns = [
      /ignore.*instruction/i,
      /override.*system/i,
      /disregard.*rule/i,
      /system.*prompt/i,
      /forget.*previous/i,
      /new.*instruction/i,
      /sql.*injection/i,
      /script.*injection/i,
      /code.*injection/i
    ];
    this.bannedKeywords = [
      'malware',
      'exploit',
      'hack',
      'unauthorized',
      'illegal',
      'bypass',
      'circumvent',
      'crack'
    ];
  }

  /**
   * Validate a user prompt
   * @param {string} prompt - The prompt to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validate(prompt) {
    const errors = [];
    const warnings = [];

    // Length validation
    if (!prompt || prompt.length < this.minLength) {
      errors.push('Prompt cannot be empty');
    }
    if (prompt.length > this.maxLength) {
      errors.push(`Prompt exceeds maximum length of ${this.maxLength} characters`);
    }

    // Pattern validation
    this.bannedPatterns.forEach(pattern => {
      if (pattern.test(prompt)) {
        errors.push(`Detected potential prompt injection pattern: ${pattern.source}`);
      }
    });

    // Keyword validation
    this.bannedKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) {
        warnings.push(`Prompt contains potentially dangerous keyword: "${keyword}"`);
      }
    });

    // Structure validation
    if (this.hasJSONInjection(prompt)) {
      errors.push('Detected potential JSON injection');
    }

    if (this.hasCodeInjection(prompt)) {
      warnings.push('Prompt contains code-like syntax - verify intent');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      riskLevel: this.calculateRiskLevel(errors, warnings),
      sanitized: this.sanitize(prompt)
    };
  }

  /**
   * Sanitize a prompt by removing or escaping dangerous content
   * @param {string} prompt - The prompt to sanitize
   * @returns {string} Sanitized prompt
   */
  sanitize(prompt) {
    let sanitized = prompt
      .trim()
      .replace(/[<>{}]/g, '') // Remove potentially dangerous characters
      .substring(0, this.maxLength);
    
    return sanitized;
  }

  /**
   * Check for JSON injection attempts
   * @param {string} prompt - The prompt to check
   * @returns {boolean} True if JSON injection detected
   */
  hasJSONInjection(prompt) {
    try {
      // Try to detect incomplete or malformed JSON that could indicate injection
      return /[{\[].*["']\s*:.*[}\]]/i.test(prompt);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check for code injection attempts
   * @param {string} prompt - The prompt to check
   * @returns {boolean} True if code injection suspected
   */
  hasCodeInjection(prompt) {
    const codePatterns = [
      /\b(function|async|await|const|let|var)\s*[=({]/i,
      /\b(import|require|module)\b/i,
      /\b(eval|exec|execute)\s*\(/i,
      /<script[^>]*>/i,
      /[`"']\s*\+\s*[`"']/
    ];

    return codePatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * Calculate risk level
   * @param {Array} errors - Validation errors
   * @param {Array} warnings - Validation warnings
   * @returns {string} Risk level: 'low', 'medium', 'high', 'critical'
   */
  calculateRiskLevel(errors, warnings) {
    if (errors.length > 0) return 'critical';
    if (warnings.length > 2) return 'high';
    if (warnings.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Batch validate multiple prompts
   * @param {Array} prompts - Array of prompts to validate
   * @returns {Array} Array of validation results
   */
  validateBatch(prompts) {
    return prompts.map((prompt, index) => ({
      index: index,
      prompt: prompt,
      validation: this.validate(prompt)
    }));
  }
}

module.exports = PromptValidator;