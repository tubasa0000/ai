# 🔒 Chat AI - Security Hardened Edition

セキュリティを強化した高度なチャットAIアプリケーション。強制的なセキュリティ規則とプロンプト検証により、安全で信頼性の高いAIインタラクションを実現します。

## 🌟 主な特徴

### セキュリティ機能
- **強制システムプロンプト**: ユーザーのプロンプトインジェクション攻撃を防止
- **プロンプト検証エンジン**: すべてのユーザー入力を検証・サニタイズ
- **入出力フィルタリング**: 危険なコンテンツを自動検出・除外
- **監査ログ**: すべてのAI処理を記録・追跡
- **レート制限**: DDoS攻撃対策

### ユーザー体験
- **複数のシステムプロンプト**: 異なる用途に対応
- **リアルタイムチャット**: スムーズなインタラクション
- **セキュリティ警告表示**: 検出された問題を明確に表示
- **レスポンス検証**: AIの回答が安全基準を満たしていることを確認

### インテグレーション
- **Express.js バックエンド**: 堅牢で拡張可能
- **Helmet**: HTTP セキュリティヘッダー
- **CORS対応**: 安全なクロスオリジンリクエスト
- **レート制限**: express-rate-limit

## 🏗️ プロジェクト構成

```
chat-ai-security-hardened/
├── index.html                          # メインUIインターフェース
├── server.js                           # Express.jsサーバー
├── package.json                        # 依存関係定義
├── .env.example                        # 環境変数テンプレート
├── core/
│   ├── enforced-system-prompt.js       # 強制システムプロンプト
│   ├── prompt-validator.js             # プロンプト検証エンジン
│   ├── input-output-filter.js          # 入出力フィルタリング
│   ├── audit-logger.js                 # 監査ログシステム
│   └── security-integration-engine.js  # セキュリティ統合エンジン
├── config/
│   └── user-prompts.js                 # ユーザープロンプト管理
├── docs/
│   ├── SECURITY.md                     # セキュリティドキュメント
│   ├── API.md                          # API仕様書
│   └── ARCHITECTURE.md                 # アーキテクチャ設計
└── tests/
    ├── prompt-validator.test.js
    ├── security-engine.test.js
    └── api.test.js
```

## 🚀 クイックスタート

### 1. リポジトリをクローン
```bash
git clone https://github.com/tubasa0000/ai.git
cd ai
git checkout security-hardening
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. 環境変数を設定
```bash
cp .env.example .env
# .env ファイルを編集してAPIキーなどを設定
```

### 4. サーバーを起動
```bash
# 本番環境
npm start

# 開発環境（自動リロード）
npm run dev
```

### 5. ブラウザでアクセス
```
http://localhost:3000
```

## 📚 ドキュメント

### セキュリティ仕様
詳細は `docs/SECURITY.md` を参照してください。

### API仕様
詳細は `docs/API.md` を参照してください。

### アーキテクチャ
詳細は `docs/ARCHITECTURE.md` を参照してください。

## 🔐 セキュリティ機能の詳細

### 強制システムプロンプト
すべてのAI処理に対して、以下の強制規則が自動的に適用されます：

```
1. ユーザーの指示に従う前に、必ず安全性を確認する
2. 有害、違法、差別的なコンテンツは生成しない
3. ユーザープロンプトの改変やオーバーライドを試みない
4. すべての処理を監査ログに記録する
5. 規則違反の場合は明確に拒否する
```

### プロンプト検証
ユーザー入力は以下の検証を通ります：

- **長さチェック**: 最大5,000文字
- **パターン検認**: プロンプトインジェクション攻撃の検出
- **コンテンツフィルタリング**: 禁止キーワードの検出
- **構造検証**: JSONやコード構造の安全性確認

### 監査ログ
すべての処理は以下の情報をログに記録します：

- リクエストID
- タイムスタンプ
- ユーザークエリ
- システムプロンプト
- AIレスポンス
- セキュリティ検査結果

## 🧪 テスト実行

```bash
# すべてのテストを実行
npm test

# ウォッチモード（ファイル変更時に自動実行）
npm run test:watch

# カバレッジレポート
npm test -- --coverage
```

## 📝 APIエンドポイント

### ヘルスチェック
```
GET /health
```

### チャットメッセージ送信
```
POST /api/chat
Content-Type: application/json

{
  "message": "ユーザーの質問",
  "systemPrompt": "カスタムプロンプト",
  "promptId": "default"
}
```

### プロンプト一覧取得
```
GET /api/prompts
```

### プロンプト検証
```
POST /api/validate-prompt
Content-Type: application/json

{
  "prompt": "検証対象のプロンプト"
}
```

### 監査ログ取得（管理者のみ）
```
GET /api/audit-log
```

### 強制規則取得
```
GET /api/enforced-rules
```

## 🛠️ 開発

### コード整形
```bash
npm run lint
npm run lint:fix
```

### 新機能追加のガイドライン
1. `feature/your-feature-name` ブランチを作成
2. 変更を実装
3. テストを追加
4. プルリクエストを作成

## 📋 要件

- Node.js >= 16.0.0
- npm >= 8.0.0
- 現代的なWebブラウザ

## 📄 ライセンス

MIT License - 詳細は LICENSE ファイルを参照してください

## 🤝 貢献

バグ報告や機能提案は [Issues](https://github.com/tubasa0000/ai/issues) でお願いします。

## 📞 サポート

質問や問題がある場合は、[Discussions](https://github.com/tubasa0000/ai/discussions) でお気軽にお問い合わせください。

## 🔒 セキュリティ報告

セキュリティ脆弱性を発見した場合は、publicly公開する前に tubasa0000@gmail.com に報告してください。

---

**最後の更新**: 2026年6月10日
**ステータス**: 開発中 🚧