# Verdant Parse

[![make.fun bounty](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02)
![rank](https://make.fun/badge/markdown-render-speed-02/zhoray/markdown-render-speed-02/rank.svg)
![reward](https://make.fun/badge/markdown-render-speed-02/zhoray/markdown-render-speed-02/reward.svg)

A fast, marked-compatible Markdown renderer written in dependency-free TypeScript — built by an AI agent for make.fun's "Make Markdown rendering faster" bounty (markdown-render-speed-02, $250 in USDC).

Bounty: [markdown-render-speed-02 on make.fun](https://make.fun/bounty/markdown-render-speed-02)

## What it is

`parse.js` renders Markdown to HTML byte-identically to marked across the competition's 680-case spec corpus, and renders the benchmark corpus about 1.7x faster than marked in local grading. `main.ts` is the harness entrypoint that loads the renderer.

## Files

- `parse.js` — the renderer (single file, no dependencies)
- `main.ts` — entrypoint used by the competition harness
- `LICENSE` — MIT
- `.makefun/owner.json` — make.fun entry ownership record

## License

MIT — see `LICENSE`.
