/**
 * Input/Output Filter Module
 * Filters and sanitizes user inputs and AI outputs for security compliance
 */

class InputOutputFilter {
  constructor() {
    this.dangerousContentPatterns = [
      {
        pattern: /malware|virus|trojan|ransomware/i,
        category: 'malicious_software',
        severity: 'high'
      },
      {
        pattern: /exploit|vulnerability|zero-day/i,
        category: 'security_exploit',
        severity: 'high'
      },
      {
        pattern: /unauthorized access|breach|hack/i,
        category: 'unauthorized_access',
        severity: 'high'
      },
      {
        pattern: /sql injection|xss|csrf/i,
        category: 'web_attack',
        severity: 'high'
      },
      {
        pattern: /ddos|dos attack|botnet/i,
        category: 'network_attack',
        severity: 'high'
      },
      {
        pattern: /credit card|ssn|social security|password/i,
        category: 'sensitive_data',
        severity: 'critical'
      },
      {
        pattern: /discriminat|racist|sexist|hate/i,
        category: 'hate_speech',
        severity: 'high'
      },
      {
        pattern: /illegal|unlawful|contraband|drug/i,
        category: 'illegal_activity',
        severity: 'high'
      }
    ];
  }

  /**
   * Filter user input
   * @param {string} input - User input to filter
   * @returns {Object} Filter result with detected issues
   */
  filterInput(input) {
    const issues = [];
    let filtered = input;

    // Scan for dangerous patterns
    this.dangerousContentPatterns.forEach(config => {
      if (config.pattern.test(input)) {
        issues.push({
          category: config.category,
          severity: config.severity,
          pattern: config.pattern.source
        });
      }
    });

    // Remove excessive special characters
    filtered = this.sanitizeSpecialChars(filtered);

    // Remove potential escape sequences
    filtered = this.removeEscapeSequences(filtered);

    return {
      original: input,
      filtered: filtered,
      issues: issues,
      isClean: issues.length === 0,
      riskLevel: this.calculateRiskLevel(issues)
    };
  }

  /**
   * Filter AI output
   * @param {string} output - AI output to filter
   * @returns {Object} Filter result
   */
  filterOutput(output) {
    const issues = [];
    let filtered = output;

    // Check for unintended model behavior
    if (this.containsPromptLeakage(output)) {
      issues.push({
        category: 'prompt_leakage',
        severity: 'critical',
        description: 'System prompt or internal instructions exposed'
      });
    }

    // Check for dangerous content in output
    this.dangerousContentPatterns.forEach(config => {
      if (config.pattern.test(output)) {
        issues.push({
          category: config.category,
          severity: config.severity,
          pattern: config.pattern.source
        });
      }
    });

    // Check for potential code injection in response
    if (this.containsExecutableCode(output)) {
      issues.push({
        category: 'executable_code',
        severity: 'high',
        description: 'Output contains executable code patterns'
      });
    }

    return {
      original: output,
      filtered: filtered,
      issues: issues,
      isClean: issues.length === 0,
      riskLevel: this.calculateRiskLevel(issues)
    };
  }

  /**
   * Sanitize special characters
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeSpecialChars(text) {
    // Keep alphanumeric, spaces, and common punctuation
    return text
      .replace(/[<>{}\[\]]/g, '') // Remove dangerous brackets
      .replace(/\x00/g, '') // Remove null bytes
      .trim();
  }

  /**
   * Remove escape sequences
   * @param {string} text - Text to process
   * @returns {string} Processed text
   */
  removeEscapeSequences(text) {
    return text
      .replace(/\\x[0-9a-f]{2}/gi, '') // Remove hex escapes
      .replace(/\\u[0-9a-f]{4}/gi, '') // Remove unicode escapes
      .replace(/\\[nrtbf]/g, ' '); // Replace control chars with spaces
  }

  /**
   * Check for prompt leakage
   * @param {string} text - Text to check
   * @returns {boolean} True if prompt leakage detected
   */
  containsPromptLeakage(text) {
    const leakagePatterns = [
      /system.*prompt/i,
      /you.*are.*a/i,
      /you.*were.*told/i,
      /my.*instructions/i,
      /my.*rules/i,
      /follow.*these.*rules/i,
      /enforced.*rules/i
    ];

    return leakagePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check for executable code patterns
   * @param {string} text - Text to check
   * @returns {boolean} True if executable code detected
   */
  containsExecutableCode(text) {
    const codePatterns = [
      /<script[^>]*>.*?<\/script>/is,
      /\b(eval|exec|system|shell_exec)\s*\(/i,
      /import\s+os|from\s+os\s+import/i,
      /require\s*\(['"].*['"]\)/i,
      /`.*\$\{.*\}`/ // Template literals with variables
    ];

    return codePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate risk level
   * @param {Array} issues - Array of detected issues
   * @returns {string} Risk level
   */
  calculateRiskLevel(issues) {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) return 'critical';
    if (highIssues.length > 1) return 'high';
    if (highIssues.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Create a safe version of content
   * @param {string} content - Content to make safe
   * @param {boolean} isOutput - True if filtering output, false for input
   * @returns {string} Safe content
   */
  makeSafe(content, isOutput = false) {
    const result = isOutput ? this.filterOutput(content) : this.filterInput(content);
    return result.filtered;
  }
}

module.exports = InputOutputFilter;