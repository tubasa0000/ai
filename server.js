/**
 * BACKEND SERVER - Express.js
 * ================================
 * セキュリティエンジンを統合したバックエンドサーバー
 * すべてのAI処理はこのサーバーを通す
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { securityEngine } = require('./core/security-integration-engine');
const { userPromptManager } = require('./config/user-prompts');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== セキュリティミドルウェア =====

// ヘルメット：セキュリティヘッダーを設定
app.use(helmet());

// CORS設定
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// レート制限：DDoS対策
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 15分間に100リクエストまで
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// リクエストボディパーサー
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// ===== ロギング =====
function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}

app.use(logRequest);

// ===== ルート =====

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    security: 'enforced'
  });
});

/**
 * チャットメッセージ処理
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemPrompt, promptId } = req.body;

    // バリデーション
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid message',
        details: 'Message must be a non-empty string'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: 'Message too long',
        details: 'Maximum 5000 characters'
      });
    }

    // プロンプト処理
    let finalSystemPrompt = systemPrompt;
    if (promptId) {
      finalSystemPrompt = userPromptManager.getPromptText(promptId);
    }

    // セキュリティエンジンを通してプロンプト処理
    const inputResult = await securityEngine.processInput({
      userSystemPrompt: finalSystemPrompt,
      userQuery: message,
      context: { promptId }
    });

    // AI処理（この部分は実際のAI APIに置き換える）
    const aiResponse = await callAIService(inputResult.prompt);

    // セキュリティエンジンを通して回答検証
    const responseResult = await securityEngine.processResponse({
      response: aiResponse,
      requestId: inputResult.metadata.requestId,
      userQuery: message
    });

    // 成功レスポンス
    res.json({
      success: true,
      message: responseResult.safeResponse,
      metadata: {
        requestId: inputResult.metadata.requestId,
        safe: responseResult.metadata.safe,
        issues: responseResult.metadata.issues,
        references: responseResult.metadata.references
      }
    });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * システムプロンプト一覧取得
 * GET /api/prompts
 */
app.get('/api/prompts', (req, res) => {
  try {
    const prompts = userPromptManager.listPresets();
    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error in /api/prompts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * プロンプト詳細取得
 * GET /api/prompts/:id
 */
app.get('/api/prompts/:id', (req, res) => {
  try {
    const prompt = userPromptManager.getPreset(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json({
      success: true,
      prompt
    });
  } catch (error) {
    console.error('Error in /api/prompts/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * プロンプト検証
 * POST /api/validate-prompt
 */
app.post('/api/validate-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid prompt',
        details: 'Prompt must be a non-empty string'
      });
    }

    const { PromptValidator } = require('./core/enforced-system-prompt');
    const validationResult = await PromptValidator.validateUserPrompt(prompt);

    res.json({
      success: true,
      isValid: validationResult.isValid,
      violations: validationResult.violations,
      sanitized: validationResult.sanitized
    });

  } catch (error) {
    console.error('Error in /api/validate-prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 監査ログ取得（管理者のみ）
 * GET /api/audit-log
 */
app.get('/api/audit-log', (req, res) => {
  // 本来はここに認証チェックが必要
  try {
    const auditLog = securityEngine.getAuditLog();
    res.json({
      success: true,
      auditLog
    });
  } catch (error) {
    console.error('Error in /api/audit-log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 監査ログクリア（管理者のみ）
 * POST /api/audit-log/clear
 */
app.post('/api/audit-log/clear', (req, res) => {
  // 本来はここに認証チェックが必要
  try {
    securityEngine.clearLogs();
    res.json({
      success: true,
      message: 'Audit logs cleared'
    });
  } catch (error) {
    console.error('Error in /api/audit-log/clear:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 強制規則取得
 * GET /api/enforced-rules
 */
app.get('/api/enforced-rules', (req, res) => {
  try {
    const { ENFORCED_SYSTEM_RULES } = require('./core/enforced-system-prompt');
    res.json({
      success: true,
      rules: ENFORCED_SYSTEM_RULES
    });
  } catch (error) {
    console.error('Error in /api/enforced-rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 静的ファイル配信 =====
app.use(express.static('public'));

// ===== 404ハンドラー =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// ===== エラーハンドラー =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== AI サービス呼び出し =====
/**
 * 実際のAI APIを呼び出す
 * 実装例：OpenAI API
 */
async function callAIService(prompt) {
  try {
    // 実装例：OpenAI API呼び出し
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [
    //       { role: 'system', content: prompt }
    //     ]
    //   })
    // });
    // const data = await response.json();
    // return data.choices[0].message.content;

    // デモ用：ダミーレスポンス
    return 'これはAIからの回答です。強制安全規則に準拠した安全な回答が提供されます。';
  } catch (error) {
    console.error('AI service error:', error);
    throw new Error('Failed to get AI response');
  }
}

// ===== サーバー起動 =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🔒 Chat AI Security Hardened Edition  ║
║                                        ║
║  Server running on port ${PORT}              ║
║  Security: ENFORCED                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}          ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;