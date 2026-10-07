# Sanzu - プロジェクト管理・AIアシスタントAPI

Sanzuは、プロジェクトマネージャー向けのスタンドアロン型REST APIです。Haitaniは外部クライアントであり、このリポジトリには含まれていません。Haitani、モバイルアプリ、Webアプリ、およびAPIツールは、HTTP/JSONを介してSanzuと通信します。

## API v1 (español) — Integración con Haitani

> Ruta oficial: **`/api/v1`**. `/api` sigue funcionando como alias legado. Toda respuesta trae `X-API-Version: v1`.
> Contrato completo, códigos de error y ejemplos: [docs/CONTRATO_HAITANI_SANZU.md](docs/CONTRATO_HAITANI_SANZU.md).

```bash
npm install
cp .env.example .env          # DATABASE_URL (MongoDB) y JWT_SECRET (obligatorio en producción)
npx prisma db push && npm run seed
npm run create-partner-key    # clave X-Api-Key para Haitani (SANZU_API_KEY)
npm run dev
npm test                      # pruebas unitarias e integración de rutas
```

Ejemplos:

```bash
# Login -> JWT
curl -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"manager@sanzu.dev","password":"SanzuDemo123!"}'

# Health, métricas, riesgos y recomendaciones (JWT)
curl localhost:3000/api/v1/projects/$ID/health  -H "Authorization: Bearer $TOKEN"
curl localhost:3000/api/v1/projects/$ID/metrics -H "Authorization: Bearer $TOKEN"
curl "localhost:3000/api/v1/projects/$ID/risks?summary=true" -H "Authorization: Bearer $TOKEN"
curl "localhost:3000/api/v1/projects/$ID/recommendations?live=true" -H "Authorization: Bearer $TOKEN"
curl "localhost:3000/api/v1/projects/$ID/backlog?type=BUG&sprintId=none" -H "Authorization: Bearer $TOKEN"

# Contexto real desde Haitani (API key) -> health, riesgos, problemas, recomendaciones, documentos requeridos
curl -X POST localhost:3000/api/v1/projects/haitani-proj-1/context \
  -H "X-Api-Key: $SANZU_API_KEY" -H 'Content-Type: application/json' \
  -d '{"project":{"name":"Demo","methodology":"SCRUM","phase":"EXECUTION","startDate":"2026-09-13","endDate":"2026-10-24"},
       "tasks":[{"id":1,"title":"API v1","status":"bloqueada","priority":"alta","assignedTo":7}],
       "team":[{"userId":7,"name":"Alberto"}]}'
```

Errores: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }` con los códigos
`BAD_REQUEST 400 · UNAUTHORIZED 401 · INVALID_CREDENTIALS 401 · FORBIDDEN 403 · NOT_FOUND 404 · CONFLICT 409 · VALIDATION_ERROR 422 · INTERNAL_ERROR 500 · AI_SERVICE_ERROR 502`.

## アーキテクチャ

`Haitani → HTTP/REST → Sanzu ルートハンドラー → サービスおよび方法論エンジン → MongoDB / 設定可能な AI プロバイダー`

App RouterはバックエンドAPIの境界としてのみ使用され、フロントエンドアプリケーションは存在しません。

## 機能

bcryptおよびJWTによる認証、プロジェクトメンバーシップの承認、プロジェクト／タスク／チーム／バックログ／スプリント／マイルストーン／リスク／課題の管理、決定論的なメトリクスと健全性スコア、方法論への準拠、推奨事項、文脈に応じたAIアシスタンス、チャット履歴。

サポートされている戦略は、アジャイル、スクラム、カンバン、エクストリーム・プログラミング、リーン、ウォーターフォール、およびハイブリッドです。戦略は `src/methodology/types.ts` に登録されており、ルートハンドラーを書き換えることなく拡張可能です。

## ローカル環境のセットアップ

1. `.env.example` を `.env` にコピーし、`DATABASE_URL` と強力な `JWT_SECRET` を設定します。
2. `npm install` を実行します。
3. `npx prisma generate` を実行します。
4. MongoDB に対して `npx prisma db push` を実行します。
5. デモデータを作成するには `npm run seed` を実行します。
6. `npm run dev` を実行します。

API は `http://localhost:3000` で利用可能です。公開の稼働確認エンドポイントは `GET /api/health` です。検証には `npm test` および `npm run typecheck` を使用してください。

## 認証

`/api/auth/register` および `/api/auth/login` を使用して登録またはログインしてください。返されたトークンを `Authorization: Bearer <token>` として送信してください。パスワードのハッシュは決して返されません。

例: `GET /api/projects/{id}/analysis`、`GET /api/projects/{id}/health`、`GET /api/projects/{id}/metrics`、または `{ 「projectId」: 「...」, 『message』: 「Why is this project behind schedule?」 }` を指定した `POST /api/chatbot/message`。

## ドキュメント

[API_DOCUMENTATION.md](API_DOCUMENTATION.md) および [openapi.yaml](openapi.yaml) を参照してください。Prisma スキーマとシードデータは `prisma/` ディレクトリにあります。MongoDB はリレーショナルマイグレーションを使用しないため、スキーマの反映には `npx prisma db push` を使用します。

## セキュリティと運用

シークレットは環境固有です。API は Zod を使用して入力を検証し、プロジェクトの所有権またはメンバーシップを強制し、機密情報のログ記録を回避し、安全な構造化エラーを返します。アシスタントは Sanzu の独自の決定論的コアで実行されます。プロジェクトデータ、メトリクス、方法論ルール、および質問の意図をローカルで使用し、AI API キー、外部ネットワーク呼び出し、またはプロバイダーの設定は必要ありません。

## 今後の改善点

リフレッシュトークン、ページネーション、監査イベント、長時間実行される AI 分析用のキュー、より詳細な過去のフローメトリクス、および SAFe、PRINCE2、シックスシグマ、Crystal、Scrumban 用のアダプターを追加する予定です。


DeepL.com（無料版）で翻訳しました。
