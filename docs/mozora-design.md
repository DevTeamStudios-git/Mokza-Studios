# Mozora design direction

Owner direction (2026-11-14): clean, academic, modern, professional. Two matching themes, a bright
uncluttered light mode and a refined charcoal dark mode, with indigo as the primary accent and
restrained orange highlights. The Admin Portal is built around trainers' daily work: cohorts, quizzes,
grading, participation and member progress. M1 turns this into `--mz-*` tokens; this document is the
reference for every screen after that.

## Rules

- Inter for all text; tabular figures for scores and counts.
- 8 px spacing grid. Corner radius 8 px on controls, 12 px on cards. Thin 1 px borders.
- SVG icons only (outline style, 20 px in navigation, 16 px inline). No emoji, no gradients.
- French (Quebec) by default, English available, every string in both dictionaries.
- Status is never colour alone: every chip carries an icon and a word ("À corriger", "Ferme bientôt",
  "En cours").
- WCAG 2.1 AA in both themes, checked by axe in CI.

## Palette (proposal, verified for contrast)

Mozora keeps its own accent tokens (`--mz-*`), so a later redesign of the host website does not move
Mozora's colours. Neutral surfaces and text still derive from the host tokens.

| Token | Light | Dark | Use | Contrast checked |
|---|---|---|---|---|
| `--mz-accent` | `#4F46E5` | `#818CF8` | links, active navigation, focus ring | 6.29 on white; 6.16 on `#12141C` |
| `--mz-accent-solid` | `#4F46E5` | `#4F46E5` | primary button background, white text | 6.29 |
| `--mz-highlight` | `#F97316` | `#FB923C` | icons, fills, progress bars only | 2.80 on white: never as light-mode text |
| `--mz-highlight-text` | `#C2410C` | `#FB923C` | orange text, "À corriger" chip text | 5.18 on white; 4.88 on `#FFF7ED`; 8.12 on dark |
| `--mz-surface` | `#FFFFFF` | `#12141C` | cards | |
| `--mz-text-muted` | `#5B6275` | `#A3A9BA` | secondary text | 6.09 and 7.83 |
| `--mz-success-text` | `#15803D` | `#4ADE80` | "En cours" chip | 4.79 on `#F0FDF4` |

Two corrections to the mockup, found by the contrast check:
- The bright orange used for chip text in light mode (around `#F97316`) fails AA as text (2.80:1).
  Light-mode orange text uses `#C2410C`; the bright orange stays for icons and fills.
- White text on a lighter indigo button (around `#6366F1`) is 4.47:1, just under AA. Primary buttons
  use `#4F46E5` in both themes.

## Admin Portal layout (from the owner's mockup)

Top bar: Mozora wordmark, portal switcher ("Portail formateur"), global search ("Rechercher un
membre, un quiz..."), theme toggle, language menu (FR / EN), initials avatar.

Sidebar, in this order (each item maps to a milestone):

| Item | Milestone |
|---|---|
| Aperçu | M2 |
| Cohortes et membres | M2 |
| Banque de questions | M3 |
| Quiz | M3 |
| Surveillance en direct | M8 |
| À corriger (count badge) | M5 |
| Carnet de notes | M5 |
| Participation | M5 |
| Rapports mensuels | M7 |
| Observations et interventions | M6 |
| Suivis | M6 |
| Paramètres | M8 |

Aperçu (overview) cards: "Ce mois-ci" (this month's quizzes with cohort, status chip, submissions
"32 / 40" and average), "Mes cohortes" (initials badge, member count, progress bar with percentage),
"À corriger" (quizzes with copies waiting and a Corriger button), "À surveiller" (members flagged by
early warnings: unusual results, repeated absence, late on a quiz).

Constraints the mockup must respect when built:
- Members flagged in "À surveiller" are sensitive personal data, possibly about minors: shown only
  to staff allowed by the policy module, never in notifications or logs, and blind mode applies.
- A staff member assigned to an open quiz must not see that quiz in "Ce mois-ci" details or in the
  grading lists until it closes (NO-EXEMPTION rule 4).
- The decorative illustration in the greeting card is optional and must be an SVG with
  `aria-hidden="true"`.

## Relation to the website redesign

The planned website redesign (after Mozora) moves the public site to ivory, charcoal and copper. Mozora
deliberately keeps indigo through its own `--mz-*` tokens. If the owner later wants Mozora to follow
the copper accent, only `--mz-accent` and `--mz-highlight` change.
