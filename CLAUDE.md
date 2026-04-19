# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BGTools is a static site collection of board game companion tools. Zero-build project — no npm, no bundler, no TypeScript, no test framework. All dependencies loaded from CDN.

## Development

No build or install steps. Edit HTML/JS/CSS files directly and open in browser to test. Push to GitHub triggers auto-deploy via Vercel.

Local API testing requires Vercel CLI: `vercel dev` (serves serverless functions at `/api/*`).

## Architecture

Five single-page apps sharing a common CSS file, each in its own directory:

| App | Purpose |
|-----|---------|
| `/shelf` | Browse BoardGameGeek collection with filtering |
| `/dials` | Track numeric values (health, resources) |
| `/score` | Score calculator with editable players/categories |
| `/roll` | Dice roller supporting expressions like `2d8+4` |
| `/prompts` | Prompt generator for party games |

Each app is a pair of `index.html` + `site.js`. `/shared/site.css` applies globally.

**Stack:** Alpine.js (reactive UI), Bootstrap 5 (CSS), Vanilla JS.

**API:** `/api/bgg.js` is a Vercel serverless function that proxies BGG XML API2 to avoid CORS. Shelf is the only app that calls it.

**Persistence:** Alpine.js state + `localStorage` for user data. Score presets load from a GitHub Gist URL.

**Routing:** `vercel.json` rewrites `/` → `/shelf/`.

## Shelf App (Most Complex)

1. Fetches XML collection from BGG API via `/api/bgg`
2. Parses XML using `fast-xml-parser` (loaded from CDN)
3. Enriches games with expansion metadata in batches of 20
4. Rewrites image URLs through imagekit.io CDN for optimization
5. Renders filtered grid with Masonry layout

## Prompts App

Game prompts are hardcoded in a large `CATEGORIES` object in `site.js`. Adding a new game = adding a new key with an array of prompt strings.
