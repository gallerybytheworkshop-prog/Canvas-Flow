# CanvasFlow roadmap

- [x] Email/password auth (login, sign-up, logout, session persistence, board gated) — done, no DB changes
- [ ] Database schema (profiles, workspaces, boards, canvas_objects, comments, activity_logs) — ON HOLD: earlier migration was interrupted; user asked not to modify tables. Revisit when user approves.
- [ ] Full login/logout browser test — blocked: needs a confirmed account; user's Supabase requires email confirmation and user declined confirming the test account via SQL.
