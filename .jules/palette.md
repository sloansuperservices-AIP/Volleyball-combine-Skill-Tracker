## 2026-09-24 - Icon-Only Accessibility Attributes
**Learning:** Icon-only buttons (such as '❌', '💾', '🏐') and modal close buttons rendered via ESM preact/htm templates in `chatbot.js` and `tryouts/index.html` require explicit `aria-label` and `title` attributes to ensure screen reader compatibility and tooltip assistance across desktop and mobile devices.
**Action:** Always verify that interactive icon controls include both `aria-label` and `title` attributes when adding or modifying UI components.
