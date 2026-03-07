# @moss-toolbox/imagen (OpenClaw plugin)

## Credits

Built with assistance from **Moss**, an AI assistant running inside OpenClaw.

Adds an `imagen` skill and an agent tool `image_generate` that generate an image from a text prompt using an OpenAI-compatible Images API (`POST /v1/images/generations`).

## Install (local dev link)

```bash
openclaw plugins install -l /path/to/imagen
```

Restart the OpenClaw Gateway after installing or changing config.

## Quick test

1) Install (local link):

```bash
openclaw plugins install -l /path/to/imagen
```

2) Configure (example):

```json5
{
  // Strongly recommended for Telegram local media allowlist: keep media under workspace.
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
          sendMode: "file",
          // Optional: override. Default is <workspace>/media/imagine
          // outputDir: "media/imagine"
        }
      }
    }
  }
}
```

3) Restart gateway.

4) In chat:

`/imagen a watercolor robot drinking espresso`

## Config

Add this under `plugins.entries.imagen.config` in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      imagen: {
        enabled: true,
        config: {
          // Preferred: read baseUrl/apiKey from models.providers[providerId]
          providerId: "openai",

          // Or override directly:
          // baseUrl: "https://api.openai.com/v1",
          // apiKey: "${OPENAI_API_KEY}",

          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
          // style: "vivid", // optional: vivid | natural

          // file: prefers attachments (best when backend returns b64_json)
          // url: sends the returned URL
          sendMode: "file",

          // Where to write local image files when sendMode=file (or when the API returns b64_json).
          // Default: <agents.defaults.workspace>/media/imagine when set, otherwise ~/.openclaw/media/imagine
          // For Telegram local media allowlist, prefer a path under your agent workspace.
          // outputDir can be absolute, or relative to agents.defaults.workspace (if set), otherwise relative to ~/.openclaw
          // outputDir: "media/imagine"
        }
      }
    }
  }
}
```

If `providerId` is set, the plugin reads:

* `models.providers[providerId].baseUrl`
* `models.providers[providerId].apiKey`

If `apiKey` is missing, the plugin still attempts the request (some backends don't require auth).

## Optional: enable the `image_generate` agent tool

The tool is registered as optional. Enable it for an agent (or globally) via allowlist:

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

- `/imagen` is implemented as a skill (command dispatch -> tool), not a plugin `registerCommand` handler.
- `image_generate` always requests `b64_json` and writes a local file.
- When using `dall-e-3`, only these sizes are allowed: `1024x1024`, `1024x1792`, `1792x1024`.
