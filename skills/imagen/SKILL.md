---
name: imagen
command-dispatch: tool
command-tool: image_generate
command-arg-mode: raw
---

# Imagen

Generate an image from a text prompt.

## Usage

In chat, invoke the `imagen` skill and provide the prompt as raw args.

Example:

`/imagen a watercolor robot drinking espresso`

## Notes

- The underlying tool is `image_generate`.
- By default, uses the chat completions API (`/v1/chat/completions`), which works with most providers (OpenAI, Google, etc.).
- Set `endpoint: "openai-images"` in plugin config to use the DALL-E Images API (`/v1/images/generations`) instead.
- When using `openai-images` with `dall-e-3`, only these sizes are allowed: `1024x1024`, `1024x1792`, `1792x1024`.
