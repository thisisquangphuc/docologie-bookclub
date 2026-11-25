# Voting Architecture

The book voting app is a buildless GitHub Pages entry point. `voting.html` owns the voting page shell and loads the native ES module at `assets/js/voting/app.js`. The root `index.html` requires members to select a roster name before entering the lobby; `admin.html` links to Voting in admin mode. The lobby advertises voting only after the host opens voting.

## Module ownership

- `assets/js/voting/config.js` — Firebase configuration and initialization, admin query detection, and per-tab client identity.
- `assets/js/voting/session-service.js` — Realtime Database subscriptions and writes for roster, books, ballots, session settings, and history.
- `assets/js/voting/i18n.js` — English and German language selection and text.
- `assets/js/voting/views.js` — Member and admin markup, escaping, and rendering from application state.
- `assets/js/voting/app.js` — Route setup, local UI state, event delegation, input validation, and session workflows.
- `assets/css/voting.css` — Page-level styles that are not utility classes.

The app uses relative imports and paths, so it works from a GitHub Pages project subpath. It requires no package manager, bundler, or build step. Firebase access belongs in the voting service; keep workshop state in the separate `/debate_sessions` namespace.

Closing voting stores the final ballots under `/session_ballots/{sessionId}` and sets `settings.locked` in the same database update. Reopening and closing again replaces that session's snapshot. Result preparation reads the saved snapshot, so later changes to `/current_ballots` do not change the prepared ranking. Starting the next session clears `/current_ballots` but retains the saved session ballots.
The wildcard draw uses a Firebase transaction to claim the draw and another transaction to commit its one winner. History uses the session ID as its key so completing results again after a network interruption does not create a second archive entry or add bonus points twice.

## Merge boundaries

Keep voting implementation changes in `assets/js/voting/` and its feature stylesheet. Keep workshop implementation changes in `assets/js/debate/` and `assets/css/debate.css`. Root HTML files should remain small entry points. When a feature needs a link from another page, add only that integration link in the owning view and avoid moving or reformatting unrelated entry-point markup.
