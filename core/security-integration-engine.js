/**
 * SECURITY INTEGRATION ENGINE
 * ================================
 * 強制システムプロンプトとユーザープロンプトを統合管理
 * すべてのAI処理はこのエンジンを通過する必要があります
 */

const {
  ENFORCED_SYSTEM_RULES,
  PromptValidator,
  ResponseValidator,
} = require('./enforced-system-prompt');

class SecurityIntegrationEngine {
  constructor() {
    this.requestLog = [];
    this.auditTrail = [];
  }

  /**
   * ユーザーのシステムプロンプトとクエリを処理
   * @param {object} input
   *   - userSystemPrompt: ユーザーが定義したシステムプロンプト
   *   - userQuery: ユーザーの質問
   *   - context: その他のコンテキスト情報
   * @returns {Promise<object>} {prompt: 最終プロンプト, metadata: {}}
   */
  async processInput(input) {
    const { userSystemPrompt, userQuery, context = {} } = input;
    const requestId = this._generateRequestId();

    console.log(`[${requestId}] Processing input...`);

    // ステップ1: ユーザープロンプト検証
    const validationResult = await PromptValidator.validateUserPrompt(
      userSystemPrompt || ''
    );

    if (!validationResult.isValid) {
      console.warn(`[${requestId}] User prompt violations detected:`, validationResult.violations);
      this._logAuditEvent({
        requestId,
        type: 'PROMPT_VALIDATION_FAILED',
        violations: validationResult.violations,
        timestamp: new Date(),
      });
    }

    // ステップ2: 最終プロンプトの構築
    const finalPrompt = this._buildFinalPrompt(
      validationResult.sanitized || userSystemPrompt || '',
      userQuery,
      context
    );

    // ステップ3: メタデータの記録
    const metadata = {
      requestId,
      userPromptValid: validationResult.isValid,
      violations: validationResult.violations,
      timestamp: new Date().toISOString(),
    };

    this._logRequest({
      requestId,
      userSystemPrompt,
      userQuery,
      finalPrompt,
      metadata,
    });

    return {
      prompt: finalPrompt,
      metadata,
    };
  }

  /**
   * AI回答を処理・検証
   * @param {object} input
   *   - response: AIの生の回答
   *   - requestId: リクエストID
   *   - userQuery: 元のユーザー質問
   * @returns {Promise<object>} {safeResponse: 安全な回答, metadata: {}}
   */
  async processResponse(input) {
    const { response, requestId, userQuery } = input;

    console.log(`[${requestId}] Validating response...`);

    // 回答検証
    const validationResult = await ResponseValidator.validateResponse(
      response,
      userQuery
    );

    if (!validationResult.safe) {
      console.warn(`[${requestId}] Response issues detected:`, validationResult.issues);
      this._logAuditEvent({
        requestId,
        type: 'RESPONSE_VALIDATION_FAILED',
        issues: validationResult.issues,
        timestamp: new Date(),
      });
    }

    // 最終回答の構築
    const safeResponse = this._buildFinalResponse(
      validationResult.sanitized || response,
      validationResult.references
    );

    // メタデータ
    const metadata = {
      requestId,
      safe: validationResult.safe,
      issues: validationResult.issues,
      references: validationResult.references,
      timestamp: new Date().toISOString(),
    };

    this._logAuditEvent({
      requestId,
      type: 'RESPONSE_PROCESSED',
      safe: validationResult.safe,
      timestamp: new Date(),
    });

    return {
      safeResponse,
      metadata,
    };
  }

  /**
   * 最終プロンプトを構築
   * @private
   */
  _buildFinalPrompt(userPrompt, userQuery, context) {
    const enforcedPrompt = ENFORCED_SYSTEM_RULES.MANDATORY_SAFETY_RULES;
    const validationRules = ENFORCED_SYSTEM_RULES.PROMPT_VALIDATION_RULES;
    const responseRules = ENFORCED_SYSTEM_RULES.RESPONSE_VALIDATION_RULES;
    const referenceRules = ENFORCED_SYSTEM_RULES.REFERENCE_RULES;

    return `
${enforcedPrompt}

${validationRules}

${responseRules}

${referenceRules}

${userPrompt ? `【ユーザー定義ルール】\n${userPrompt}\n\n` : ''}【ユーザーの質問】
${userQuery}

${context.additionalInstructions ? `【追加指示】\n${context.additionalInstructions}\n` : ''}`;
  }

  /**
   * 最終回答を構築
   * @private
   */
  _buildFinalResponse(sanitizedResponse, references) {
    let response = sanitizedResponse;

    // 参照情報を追加
    if (references && references.length > 0) {
      response += '\n\n【参照情報】\n';
      references.forEach((ref) => {
        if (ref.url) {
          response += `• ${ref.text}: ${ref.url}\n`;
        } else {
          response += `• ${ref.text}\n`;
        }
      });
    }

    // フッター
    response += `\n\n---\n※本回答は強制安全規則に準拠しています。不適切な内容は自動的に削除・修正されています。`;

    return response;
  }

  /**
   * リクエストをログに記録
   * @private
   */
  _logRequest(data) {
    this.requestLog.push({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 監査イベントをログに記録
   * @private
   */
  _logAuditEvent(event) {
    this.auditTrail.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * リクエストIDを生成
   * @private
   */
  _generateRequestId() {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 監査ログを取得
   */
  getAuditLog() {
    return {
      requestLog: this.requestLog,
      auditTrail: this.auditTrail,
      summary: {
        totalRequests: this.requestLog.length,
        violationCount: this.auditTrail.filter(
          (e) => e.type.includes('FAILED')
        ).length,
      },
    };
  }

  /**
   * ログをクリア
   */
  clearLogs() {
    this.requestLog = [];
    this.auditTrail = [];
  }
}

/**
 * グローバルインスタンス
 */
const securityEngine = new SecurityIntegrationEngine();

module.exports = {
  SecurityIntegrationEngine,
  securityEngine,
};