# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BGTools is a static site collection of board game companion tools. Frontend remains zero-build with no bundler or TypeScript. Serverless API uses `fast-xml-parser` from npm; no test framework.

## Development

No frontend build steps. Run `npm ci` to install API dependency. Edit HTML/JS/CSS files directly and open in browser to test. Push to GitHub triggers auto-deploy via Vercel.

Local API testing requires Vercel CLI: `vercel dev` (serves serverless functions at `/api/*`).

## Architecture

Five single-page apps sharing a common CSS file, each in its own directory:

| App | Purpose |
|-----|---------|
| `/shelf` | Browse BoardGameGeek collection with filtering |
| `/dials` | Track numeric values (health, resources) |
| `/score` | Score calculator with editable players/categories |
| `/prompts` | Prompt generator for party games |

Each app is a pair of `index.html` + `site.js`. `/_shared/site.css` applies globally.

**Stack:** Alpine.js (reactive UI), Bootstrap 5 (CSS), Vanilla JS.

**API:** `/api/{games,expansions,details}.js` validate their own parameters and build fixed BGG URLs. They share `api/_shared/bgg.js` for fetching, up to 4 retries, and XML-to-JSON conversion. Shelf is the only app that calls them.

**Persistence:** Alpine.js state + `localStorage` for user data. Score presets load from a GitHub Gist URL.

**Routing:** `vercel.json` rewrites `/` → `/shelf/`.

## Shelf App (Most Complex)

1. Fetches games, expansions, and details from BGG via dedicated `/api/*` routes
2. Receives JSON converted from BGG XML by the shared server-side proxy
3. Enriches games with expansion metadata in batches of 20
4. Rewrites image URLs through imagekit.io CDN for optimization
5. Renders filtered grid with Masonry layout

## Dials App

Presets and their categories, items, and metrics are defined in `dials/site.js`. Alpine Persist stores the active sheet in local storage, and the PubSub SDK synchronizes changes between clients.

## Score App

`score/site.js` manages editable players, categories, and scores. Game presets load from a GitHub Gist; selecting one updates categories and clears player scores.

## Prompts App

Game prompts live one per line in `prompts/data/*.txt`. `prompts/site.js` maps game names to files and fetches a game's prompts when selected.
