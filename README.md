# @moss-toolbox/imagen

[![CI](https://github.com/Moss-Toolbox/imagen/actions/workflows/ci.yml/badge.svg)](https://github.com/Moss-Toolbox/imagen/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@moss-toolbox/imagen)](https://www.npmjs.com/package/@moss-toolbox/imagen)
[![npm downloads](https://img.shields.io/npm/dm/@moss-toolbox/imagen)](https://www.npmjs.com/package/@moss-toolbox/imagen)
[![license](https://img.shields.io/npm/l/@moss-toolbox/imagen)](./LICENSE)

An [OpenClaw](https://openclaw.dev) plugin that generates images from text prompts using any OpenAI-compatible Images API (`POST /v1/images/generations`).

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
| `providerId` | `string` | `"openai"` | Provider id to read `baseUrl`/`apiKey` from `models.providers` |
| `baseUrl` | `string` | — | Override API base URL (with or without `/v1`) |
| `apiKey` | `string` | — | Override API key |
| `model` | `string` | `"dall-e-3"` | Model to use for generation |
| `size` | `string` | `"1024x1024"` | Image size |
| `quality` | `string` | `"standard"` | Image quality |
| `style` | `"vivid" \| "natural"` | — | Optional style hint |
| `sendMode` | `"file" \| "url"` | `"file"` | Return a local file or a remote URL |
| `outputDir` | `string` | `<workspace>/media/imagine` | Directory to store generated images |

If `providerId` is set, the plugin reads `baseUrl` and `apiKey` from `models.providers[providerId]`. If `apiKey` is missing, the plugin still attempts the request (some backends don't require auth).

<details>
<summary>Full config example</summary>

```json5
{
  agents: {
    defaults: {
      workspace: "~/openclaw-workspace"
    }
  },
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          providerId: "openai",
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
          // style: "vivid",
          sendMode: "file",
          // outputDir: "media/imagine"
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
- `image_generate` always requests `b64_json` and writes a local file.
- DALL-E 3 only allows these sizes: `1024x1024`, `1024x1792`, `1792x1024`.
- Requests time out after 90 seconds.

## Credits

Built with assistance from Moss, an AI assistant running inside OpenClaw.

## License

[MIT](./LICENSE)
