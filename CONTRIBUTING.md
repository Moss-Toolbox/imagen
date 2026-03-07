# Contributing

Thanks for contributing!

## Note on AI assistance

This project was built with assistance from **Moss**, an AI assistant running inside OpenClaw.

## Development

- Install the plugin locally (dev link):
  
  ```bash
  openclaw plugins install -l /path/to/imagen
  openclaw gateway restart
  ```

- Update config under `plugins.entries.imagen.config` in `~/.openclaw/openclaw.json`.

## Commit style

- Prefer small, logical commits.
- Avoid committing credentials, tokens, or personal endpoints.

## Testing

Minimal manual test:
- In chat: `/imagen a watercolor robot drinking espresso`
