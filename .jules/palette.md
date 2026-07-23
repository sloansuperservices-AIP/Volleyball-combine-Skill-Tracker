# Palette's UX Journal

## 2026-07-23 - [Icon-Only Buttons and Character Symbol Close Actions Accessibility]
**Learning:** Icon-only or pure character-symbol buttons like "×", "✕", or "🏐" are widely used for close, remove, or trigger actions in dynamic Preact overlays. Without explicit standard attributes, screen readers read these as "multiplication sign", "times", or simply "button", severely impacting accessibility. Adding dual descriptive `aria-label` and `title` attributes instantly corrects screen reader announcements and provides beautiful native tooltips for mouse users.
**Action:** Always inspect custom modal and overlay controls to ensure any symbolic button has descriptive `aria-label` and `title` attributes.
