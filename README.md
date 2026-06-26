# 🪜 SADARI — *Climb your luck.*

A modern, single-file **ladder game** (Amidakuji / Ghost Leg) for the whole world.
Pick a number of players, draw the ladder, and watch the animated paths decide everyone's fate.

**Live:** open [`index.html`](index.html) in any browser — no build, no dependencies.

## Features

- 👥 **Up to 30 players**, with an optional name-entry step
- 🎚️ **Adjustable complexity** slider (rung density)
- ▶️ **Animated ladder climbing** — run one by one, all at once, pause/resume, or reset
- 🎨 **Result-colored paths & table** — same result, same color
- 🔢 **Sort results** by player or by value (ascending / descending)
- 🌍 **8 languages**: 한국어 · English · 日本語 · 中文 · Español · Deutsch · Русский · Português
- 💱 **Currency-aware** money mode with a switchable currency dropdown (KRW, USD, EUR, JPY, CNY, GBP, RUB, BRL)

### Result modes
| Mode | What it does |
|------|--------------|
| 🎯 Win / Lose | Set the number of losers; the rest win |
| 👥 Teams | Split players evenly into N teams |
| 💰 Money split | Auto-distribute a total amount in currency units, low-variance, with losers as “nothing” |

## Tech

Pure HTML + CSS + Canvas + vanilla JavaScript in a **single file**. No frameworks, no network calls.

## License

MIT
