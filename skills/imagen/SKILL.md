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
- The tool always requests `b64_json` and writes a local image file.
- When using `dall-e-3`, only these sizes are allowed: `1024x1024`, `1024x1792`, `1792x1024`.
