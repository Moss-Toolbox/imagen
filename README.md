# @moss-toolbox/imagen

[![CI](https://github.com/Moss-Toolbox/imagen/actions/workflows/ci.yml/badge.svg)](https://github.com/Moss-Toolbox/imagen/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@moss-toolbox/imagen)](https://www.npmjs.com/package/@moss-toolbox/imagen)
[![npm downloads](https://img.shields.io/npm/dm/@moss-toolbox/imagen)](https://www.npmjs.com/package/@moss-toolbox/imagen)
[![license](https://img.shields.io/npm/l/@moss-toolbox/imagen)](./LICENSE)

An [OpenClaw](https://openclaw.dev) plugin that generates images from text prompts. Supports multiple providers and endpoint strategies:

- **chat-completions** (default) — `POST /v1/chat/completions`. Works with OpenAI (gpt-4o, gpt-image-1), Google Gemini, and most providers that return images via chat.
- **openai-images** — `POST /v1/images/generations`. The classic DALL-E endpoint.

Provides a `/imagen` chat command and an `image_generate` agent tool.

## Install

```bash
npm install @moss-toolbox/imagen
```

Or install as a local plugin:

```bash
openclaw plugins install -l /path/to/imagen
```

Restart the OpenClaw Gateway after installing or changing config.

## Quick start

1. Configure the plugin in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          providerId: "openai",
          // endpoint: "chat-completions",  // default
          // model: "gpt-4o",              // default for chat-completions
          sendMode: "file",
        }
      }
    }
  }
}
```

2. Restart the gateway.

3. In chat:

```
/imagen a watercolor robot drinking espresso
```

## Configuration

Add the following under `plugins.entries.imagen.config` in `~/.openclaw/openclaw.json`:

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `"chat-completions" \| "openai-images"` | `"chat-completions"` | API strategy to use |
| `providerId` | `string` | `"openai"` | Provider id to read `baseUrl`/`apiKey` from `models.providers` |
| `baseUrl` | `string` | — | Override API base URL (with or without `/v1`) |
| `apiKey` | `string` | — | Override API key |
| `model` | `string` | `"gpt-4o"` / `"dall-e-3"` | Model to use (default depends on endpoint) |
| `size` | `string` | `"1024x1024"` | Image size |
| `quality` | `string` | `"standard"` | Image quality |
| `style` | `"vivid" \| "natural"` | — | Optional style hint (openai-images endpoint) |
| `sendMode` | `"file" \| "url"` | `"file"` | Return a local file or a remote URL |
| `outputDir` | `string` | `<workspace>/media/imagine` | Directory to store generated images |

If `providerId` is set, the plugin reads `baseUrl` and `apiKey` from `models.providers[providerId]`. If `apiKey` is missing, the plugin still attempts the request (some backends don't require auth).

<details>
<summary>Example: OpenAI with chat completions (default)</summary>

```json5
{
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          providerId: "openai",
          model: "gpt-4o",
          sendMode: "file",
        }
      }
    }
  }
}
```

</details>

<details>
<summary>Example: OpenAI DALL-E (legacy images endpoint)</summary>

```json5
{
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          endpoint: "openai-images",
          providerId: "openai",
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
          sendMode: "file",
        }
      }
    }
  }
}
```

</details>

<details>
<summary>Example: Google Gemini</summary>

```json5
{
  models: {
    providers: {
      google: {
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: "YOUR_GOOGLE_API_KEY"
      }
    }
  },
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          providerId: "google",
          model: "gemini-2.0-flash-exp",
          sendMode: "file",
        }
      }
    }
  }
}
```

</details>

## Agent tool

The `image_generate` tool is registered as optional. Enable it for an agent (or globally) via allowlist:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: ["image_generate"]
        }
      }
    ]
  }
}
```

## Notes

- `/imagen` is implemented as a skill (command dispatch → tool), not a plugin `registerCommand` handler.
- Default endpoint is `chat-completions`, which works with most providers out of the box.
- Set `endpoint: "openai-images"` to use the DALL-E `/v1/images/generations` endpoint.
- DALL-E 3 only allows these sizes: `1024x1024`, `1024x1792`, `1792x1024`.
- Requests time out after 90 seconds.

## Testing

This project uses Vitest with two lanes:

- `npm run test` — fast unit tests, safe for CI
- `npm run e2e` — provider-backed local e2e tests, never run in CI by default

Project layout:

- `src/` — production code
- `tests/` — unit tests
- `e2e/` — local-only provider-backed integration tests

### Unit test practices

- Keep unit tests deterministic and free of network calls.
- Prefer testing public behavior over internal implementation details.
- Mock only external boundaries such as provider registries or network clients.
- Use descriptive `describe`/`it` names that document expected behavior.

### Local-only e2e tests

E2E tests are intentionally opt-in and are skipped unless both of the following are true:

1. `IMAGEN_E2E=1`
2. A local `.env.e2e.local` file provides at least one provider target

They are also skipped automatically when `CI=true`.

Set up local e2e testing like this:

```bash
cp .env.example .env.e2e.local
```

Then fill in one or both targets in `.env.e2e.local`:

```dotenv
IMAGEN_E2E=1

IMAGEN_E2E_CHAT_BASE_URL=https://api.openai.com/v1
IMAGEN_E2E_CHAT_API_KEY=your-key
IMAGEN_E2E_CHAT_MODEL=gpt-4o

IMAGEN_E2E_IMAGES_BASE_URL=https://api.openai.com/v1
IMAGEN_E2E_IMAGES_API_KEY=your-key
IMAGEN_E2E_IMAGES_MODEL=dall-e-3
```

Run them locally:

```bash
npm run e2e
```

The `.env.e2e.local` file is ignored by git and should never be committed.

## Credits

Built with assistance from Moss, an AI assistant running inside OpenClaw.

## License

[MIT](./LICENSE)
