/**
 * Audit Logger Module
 * Logs all AI interactions for security and compliance purposes
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, 'audit.log');
    this.securityLogFile = path.join(logDir, 'security.log');
    this.initializeLogDirectory();
  }

  /**
   * Initialize log directory if it doesn't exist
   */
  initializeLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log a standard interaction
   * @param {Object} logEntry - The log entry object
   */
  logInteraction(logEntry) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'INTERACTION',
      requestId: this.generateRequestId(),
      ...logEntry
    };

    this.writeLog(this.logFile, entry);
  }

  /**
   * Log a security event
   * @param {Object} securityEvent - The security event object
   */
  logSecurityEvent(securityEvent) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      severity: securityEvent.severity || 'MEDIUM',
      ...securityEvent
    };

    this.writeLog(this.securityLogFile, entry);
    console.warn('[SECURITY]', entry);
  }

  /**
   * Log a request approval/denial
   * @param {Object} requestLog - The request log object
   */
  logRequest(requestLog) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'REQUEST_LOG',
      status: requestLog.approved ? 'APPROVED' : 'DENIED',
      ...requestLog
    };

    this.writeLog(this.logFile, entry);
  }

  /**
   * Log a rule violation
   * @param {Object} violation - The violation object
   */
  logViolation(violation) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'RULE_VIOLATION',
      severity: 'HIGH',
      ...violation
    };

    this.writeLog(this.securityLogFile, entry);
    this.logSecurityEvent(entry);
  }

  /**
   * Write a log entry to file
   * @param {string} filePath - The file path
   * @param {Object} entry - The entry to log
   */
  writeLog(filePath, entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filePath, logLine, 'utf8');
    } catch (error) {
      console.error('Error writing to audit log:', error);
    }
  }

  /**
   * Generate a unique request ID
   * @returns {string} Unique request ID
   */
  generateRequestId() {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Read recent logs
   * @param {string} logType - 'audit' or 'security'
   * @param {number} lines - Number of recent lines to return
   * @returns {Array} Array of log entries
   */
  readRecentLogs(logType = 'audit', lines = 100) {
    const filePath = logType === 'security' ? this.securityLogFile : this.logFile;

    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const logLines = content.trim().split('\n').filter(line => line.length > 0);
      const recentLines = logLines.slice(-lines);

      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line };
        }
      });
    } catch (error) {
      console.error('Error reading audit logs:', error);
      return [];
    }
  }

  /**
   * Get security event summary
   * @returns {Object} Summary of security events
   */
  getSecuritySummary() {
    const logs = this.readRecentLogs('security', 1000);
    const summary = {
      total: logs.length,
      bySeverity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
      },
      byType: {},
      lastEvent: logs[logs.length - 1] || null
    };

    logs.forEach(log => {
      if (log.severity) {
        summary.bySeverity[log.severity]++;
      }
      if (log.type) {
        summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;
      }
    });

    return summary;
  }

  /**
   * Clear old logs (older than specified days)
   * @param {number} daysOld - Remove logs older than this many days
   */
  clearOldLogs(daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const logFiles = [this.logFile, this.securityLogFile];

    logFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);
          
          const recentLines = lines.filter(line => {
            try {
              const entry = JSON.parse(line);
              const timestamp = new Date(entry.timestamp).getTime();
              return timestamp > cutoffTime;
            } catch (e) {
              return true; // Keep lines that can't be parsed
            }
          });

          fs.writeFileSync(filePath, recentLines.join('\n') + '\n', 'utf8');
        }
      } catch (error) {
        console.error(`Error clearing old logs from ${filePath}:`, error);
      }
    });
  }
}

module.exports = AuditLogger;