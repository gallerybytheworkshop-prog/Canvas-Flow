# CanvasFlow roadmap

- [x] Email/password auth (login, sign-up, logout, session persistence, board gated) — done, no DB changes
- [x] Workspaces page + per-workspace boards page
- [x] Per-board canvas persistence via `canvas_objects` (load on open, debounced batched saves, local-first)
- [ ] Database schema changes — ON HOLD per user instruction (existing tables used as-is)
- [ ] Signed-in browser test of board persistence — blocked: no test session available for this Supabase project
