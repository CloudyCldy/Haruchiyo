# Sanzu - プロジェクト管理・AIアシスタントAPI

Sanzuは、プロジェクトマネージャー向けのスタンドアロン型REST APIです。Haitaniは外部クライアントであり、このリポジトリには含まれていません。Haitani、モバイルアプリ、Webアプリ、およびAPIツールは、HTTP/JSONを介してSanzuと通信します。

## アーキテクチャ

`Haitani → HTTP/REST → Sanzu ルートハンドラー → サービスおよび方法論エンジン → PostgreSQL / 設定可能な AI プロバイダー`

App RouterはバックエンドAPIの境界としてのみ使用され、フロントエンドアプリケーションは存在しません。

## 機能

bcryptおよびJWTによる認証、プロジェクトメンバーシップの承認、プロジェクト／タスク／チーム／バックログ／スプリント／マイルストーン／リスク／課題の管理、決定論的なメトリクスと健全性スコア、方法論への準拠、推奨事項、文脈に応じたAIアシスタンス、チャット履歴。

サポートされている戦略は、アジャイル、スクラム、カンバン、エクストリーム・プログラミング、リーン、ウォーターフォール、およびハイブリッドです。戦略は `src/methodology/types.ts` に登録されており、ルートハンドラーを書き換えることなく拡張可能です。

## ローカル環境のセットアップ

1. `.env.example` を `.env` にコピーし、`DATABASE_URL` と強力な `JWT_SECRET` を設定します。
2. `npm install` を実行します。
3. `npx prisma generate` を実行します。
4. PostgreSQL に対して `npx prisma migrate dev --name init` を実行します。
5. デモデータを作成するには `npm run seed` を実行します。
6. `npm run dev` を実行します。

API は `http://localhost:3000` で利用可能です。公開の稼働確認エンドポイントは `GET /api/health` です。検証には `npm test` および `npm run typecheck` を使用してください。

## 認証

`/api/auth/register` および `/api/auth/login` を使用して登録またはログインしてください。返されたトークンを `Authorization: Bearer <token>` として送信してください。パスワードのハッシュは決して返されません。

例: `GET /api/projects/{id}/analysis`、`GET /api/projects/{id}/health`、`GET /api/projects/{id}/metrics`、または `{ 「projectId」: 「...」, 『message』: 「Why is this project behind schedule?」 }` を指定した `POST /api/chatbot/message`。

## ドキュメント

[API_DOCUMENTATION.md](API_DOCUMENTATION.md) および [openapi.yaml](openapi.yaml) を参照してください。Prisma スキーマとシードデータは `prisma/` ディレクトリにあります。

## セキュリティと運用

シークレットは環境固有です。API は Zod を使用して入力を検証し、プロジェクトの所有権またはメンバーシップを強制し、機密情報のログ記録を回避し、安全な構造化エラーを返します。OpenAI 互換のプロバイダーを使用する場合は、`AI_API_KEY`、`AI_MODEL`、および `AI_BASE_URL` を設定してください。キーがない場合、アシスタントはネットワーク呼び出しを行わずに、決定論的な結果を返します。

## 今後の改善点

リフレッシュトークン、ページネーション、監査イベント、長時間実行される AI 分析用のキュー、より詳細な過去のフローメトリクス、および SAFe、PRINCE2、シックスシグマ、Crystal、Scrumban 用のアダプターを追加する予定です。


DeepL.com（無料版）で翻訳しました。
