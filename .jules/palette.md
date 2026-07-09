# Palette's Journal - Micro-UX & Accessibility Learnings

## 2024-07-09 - Unicode Character Corruption and Screen Reader Accessibility
**Learning:** This repository's primary application file (`tryouts/index.html`) suffered from widespread character corruption where UTF-8 symbols (em-dashes, emojis) were interpreted as garbled Latin-1 strings. Additionally, several interactive elements used raw emojis without accessible labels, making them unusable for screen reader users and ambiguous for others.

**Action:** Always verify character encoding when editing single-file HTML applications. Convert raw emojis used as buttons into properly labeled `<button>` elements with `aria-label` and `title` attributes to ensure both accessibility and a professional visual experience.
