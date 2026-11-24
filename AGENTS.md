# Agent Rules — Docologie Book Club

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
