# Agent Rules — Docologie Book Club

## Debate Workshop Reference

- For any design or content related to the club's debate workshop, consult [DEBATE_WORKSHOP_RULES.md](DEBATE_WORKSHOP_RULES.md) and use it as the source of truth for the rounds, speaking rules, and closing reflection.
- Preserve Round 2, item 3 as unspecified unless the user supplies the missing rule.

## Member View: Clean, Distraction-Free UX

Apply these rules whenever changing the member-facing experience.

### Keep the screen uncluttered

- Do not show permanent instructions, rule explanations, or multi-line rule banners above the book list. Put a small `?` button in the header, labeled `Rules` in English and `Regeln` in German. Open the rules in a modal only when a member asks for them.
- Keep admin controls, session IDs, debug details, and ballot-audit warnings out of the member DOM. Do not render hidden admin-only elements into the member view; render the admin view conditionally for an authorized admin.
- Keep active-voting book cards minimal: show the title, proposer, and only small monochrome `+1` or `Priority` badges when relevant. Hide vote totals during voting, or make their display an explicit admin-controlled option. Do not use progress bars, star ratings, or colorful tags.

### Use a two-step member flow

1. **Identify:** Show one clean, searchable dropdown or autocomplete pill near the top, labeled `Select your name...` / `Namen wählen...`. Require an exact match from the admin-managed roster. Remember the selected member for the current browser session.
2. **Vote:** Let the member tap up to three white book cards, using a subtle black border to show selection, then submit using one sticky black `Cast Vote` / `Stimme abgeben` button at the bottom.

### Make the list easy to scan on mobile

- Preserve generous whitespace: use `p-4` or `p-5` card padding and `space-y-3` vertical spacing.
- Limit each book card to at most two lines of visible text so the shortlist remains easy to scan on a mobile screen.
- Keep the monochrome editorial style and maintain clear keyboard focus states and accessible labels for controls and dialogs.

## Admin Dashboard: Simple by Default

- Call the admin area **Admin Dashboard** and show an `ADMIN MODE` badge in the header. Use muted wine red `#71363C` only for this badge and small admin navigation accents; keep the rest of the interface monochrome.
- Design for a host who may not be comfortable with technical tools. Use plain-language labels, short descriptions, clear current status, and a small number of obvious actions. Avoid exposing database paths, session IDs, implementation terms, or debug details.
- Make the first dashboard tab an **Overview** with the current voting status, participation summary, and the main session actions: close/reopen voting, finalize/show results, and archive/start the next session.
- Put roster and book-pool management in a separate **Books & members** tab. Put detailed ballot audits, duplicate-device warnings, and other infrequent or technical controls in a separate **Advanced** tab.
- Keep the admin view compact and task-focused. Explain consequential actions in plain language and confirm before archiving or deleting data.

## Project Structure and Maintainability

- Keep the GitHub Pages app buildless and use native browser JavaScript modules. Do not grow a feature by putting all markup, styles, data access, state, and event handling into one HTML file or one large script.
- Keep pages at the repository root only when they are independent entry points. Put shared styles in `assets/css/` and feature code under `assets/js/<feature>/`.
- Separate responsibilities: Firebase configuration and initialization, data access, localization, view rendering, and role-specific controllers should have clear ownership and small interfaces. Views render state; services own database access; controllers coordinate user actions and state changes.
- Use relative module and asset paths that work under a GitHub Pages project subpath. Keep the app usable without a bundler or build step.
- Keep feature data namespaced in Firebase. Debate sessions belong under `/debate_sessions`; do not mix debate state with book voting ballots or settings.
- Avoid inline event handlers and implicit global state. Bind accessible controls in the owning module, keep state transitions explicit, validate input at the boundary, and surface database failures in the relevant view.
- Follow existing naming and formatting conventions, preserve EN/DE support, and add documentation beside the relevant feature when it clarifies ownership or operational setup.
- For debate feature routes, data ownership, and module responsibilities, consult `docs/debate-workshop.md` and preserve its separation between host, projection, participant, service, and view code.

## JavaScript and HTML Naming Conventions

- Keep browser code as native ES modules; use two-space indentation, semicolons, and spaces after commas and around object-literal colons, matching the shared modules.
- Use `camelCase` for variables and functions. Use `UPPER_SNAKE_CASE` for exported constants that represent fixed configuration or policy values, following `ROUND_DURATION_MS` and `ADMIN_UID`.
- Use semantic HTML elements for landmarks and content sections. Use `div` for layout-only wrappers.
- Give stable admin and feature sections descriptive, unique `id` values in kebab-case, scoped by feature and role (for example, `admin-member-roster-section`). Use `aria-labelledby` when a section has a visible heading.
- Keep IDs that existing controllers query stable. Use `data-action` for delegated user actions and classes for styling; do not add IDs to anonymous layout wrappers without a concrete selection or accessibility need.
