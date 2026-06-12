/**
 * USER SYSTEM PROMPT CONFIGURATION
 * ================================
 * ユーザーが定義可能なシステムプロンプト
 * 強制安全規則に違反する内容は自動的に無視・修正されます
 */

const USER_SYSTEM_PROMPTS = {
  // デフォルトプロンプト
  default: {
    name: 'Default Assistant',
    description: 'Standard helpful assistant',
    prompt: `You are a helpful, harmless, and honest AI assistant.
Your role is to:
1. Provide accurate and helpful information
2. Admit when you are uncertain
3. Refuse harmful requests politely
4. Always cite your sources when possible
5. Be transparent about limitations`,
    version: '1.0',
    created: '2026-06-10',
  },

  // 教育モード
  educational: {
    name: 'Educational Assistant',
    description: 'Focused on learning and teaching',
    prompt: `You are an educational AI assistant specialized in teaching.
Your role is to:
1. Explain concepts clearly and step-by-step
2. Use examples and analogies
3. Ask questions to check understanding
4. Encourage critical thinking
5. Provide learning resources and references
6. Adapt explanations to the learner's level`,
    version: '1.0',
    created: '2026-06-10',
  },

  // 研究支援モード
  research: {
    name: 'Research Assistant',
    description: 'Support for academic and professional research',
    prompt: `You are a research support AI assistant.
Your role is to:
1. Help find relevant literature and sources
2. Analyze research papers and findings
3. Identify research gaps and opportunities
4. Explain methodologies clearly
5. Always cite sources and mark speculation
6. Help organize research findings
7. Provide citation formats (APA, Chicago, Harvard, etc.)`,
    version: '1.0',
    created: '2026-06-10',
  },

  // クリエイティブモード
  creative: {
    name: 'Creative Assistant',
    description: 'Support for creative writing and brainstorming',
    prompt: `You are a creative writing and brainstorming AI assistant.
Your role is to:
1. Help generate ideas and explore possibilities
2. Provide writing suggestions and feedback
3. Assist with storytelling and character development
4. Suggest creative techniques and approaches
5. Help refine creative work
6. Inspire new perspectives
Note: All creative work must respect ethical guidelines`,
    version: '1.0',
    created: '2026-06-10',
  },

  // コーディング支援モード
  coding: {
    name: 'Coding Assistant',
    description: 'Support for software development',
    prompt: `You are a coding and software development AI assistant.
Your role is to:
1. Help debug code issues
2. Suggest best practices and design patterns
3. Explain programming concepts
4. Help with algorithm design
5. Review code quality and security
6. Explain error messages and solutions
7. Recommend libraries and tools
Important: Always prioritize code security and best practices`,
    version: '1.0',
    created: '2026-06-10',
  },

  // テクニカルサポートモード
  technical: {
    name: 'Technical Support Assistant',
    description: 'Troubleshooting and technical help',
    prompt: `You are a technical support AI assistant.
Your role is to:
1. Help diagnose technical issues
2. Provide step-by-step troubleshooting
3. Explain technical concepts clearly
4. Suggest solutions and workarounds
5. Recommend when to seek professional help
6. Document issues for future reference
7. Provide safety warnings when relevant`,
    version: '1.0',
    created: '2026-06-10',
  },
};

/**
 * ユーザープロンプト管理クラス
 */
class UserPromptManager {
  constructor() {
    this.customPrompts = {};
    this.selectedPrompt = 'default';
  }

  /**
   * プリセットプロンプトを取得
   */
  getPreset(name) {
    return USER_SYSTEM_PROMPTS[name] || USER_SYSTEM_PROMPTS.default;
  }

  /**
   * すべてのプリセットをリスト
   */
  listPresets() {
    return Object.entries(USER_SYSTEM_PROMPTS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
    }));
  }

  /**
   * カスタムプロンプトを作成
   */
  createCustomPrompt(id, config) {
    if (USER_SYSTEM_PROMPTS[id]) {
      throw new Error(`Preset with id "${id}" already exists`);
    }

    this.customPrompts[id] = {
      ...config,
      version: config.version || '1.0',
      created: new Date().toISOString(),
      isCustom: true,
    };

    return this.customPrompts[id];
  }

  /**
   * カスタムプロンプトを更新
   */
  updateCustomPrompt(id, updates) {
    if (!this.customPrompts[id]) {
      throw new Error(`Custom prompt with id "${id}" not found`);
    }

    this.customPrompts[id] = {
      ...this.customPrompts[id],
      ...updates,
      updated: new Date().toISOString(),
    };

    return this.customPrompts[id];
  }

  /**
   * カスタムプロンプトを削除
   */
  deleteCustomPrompt(id) {
    if (!this.customPrompts[id]) {
      throw new Error(`Custom prompt with id "${id}" not found`);
    }

    delete this.customPrompts[id];

    if (this.selectedPrompt === id) {
      this.selectedPrompt = 'default';
    }
  }

  /**
   * プロンプトを選択
   */
  selectPrompt(id) {
    const preset = USER_SYSTEM_PROMPTS[id];
    const custom = this.customPrompts[id];

    if (!preset && !custom) {
      throw new Error(`Prompt with id "${id}" not found`);
    }

    this.selectedPrompt = id;
    return id;
  }

  /**
   * 現在選択されているプロンプトを取得
   */
  getSelectedPrompt() {
    const preset = USER_SYSTEM_PROMPTS[this.selectedPrompt];
    const custom = this.customPrompts[this.selectedPrompt];

    return preset || custom || USER_SYSTEM_PROMPTS.default;
  }

  /**
   * プロンプトテキストを取得
   */
  getPromptText(id = null) {
    const promptId = id || this.selectedPrompt;
    const preset = USER_SYSTEM_PROMPTS[promptId];
    const custom = this.customPrompts[promptId];

    if (preset) {
      return preset.prompt;
    }
    if (custom) {
      return custom.prompt;
    }
    return USER_SYSTEM_PROMPTS.default.prompt;
  }

  /**
   * 全プロンプト一覧を取得
   */
  getAllPrompts() {
    return {
      presets: USER_SYSTEM_PROMPTS,
      custom: this.customPrompts,
      selected: this.selectedPrompt,
    };
  }
}

/**
 * グローバルインスタンス
 */
const userPromptManager = new UserPromptManager();

module.exports = {
  USER_SYSTEM_PROMPTS,
  UserPromptManager,
  userPromptManager,
};