## Problem and outcome

<!-- What problem does this solve? What changes for a user or maintainer? -->

## Architecture and interface impact

<!-- Affected surfaces, interfaces, seams, data catalogs, routes, or lifecycle behavior. -->

## Verification evidence

<!-- Paste concise results, not only "passed". -->

- `npm run verify`:
- `npm audit --omit=dev --audit-level=critical`:
- `git diff --check`:

## UI evidence

<!-- For UI changes: tested widths, keyboard path, reduced motion, console/overflow, screenshots if useful. Write N/A only when genuinely unrelated. -->

## Final review

- P0:
- P1:
- P2:
- P3:
- Approved exceptions/follow-ups:

## Checklist

- [ ] I read and followed `docs/engineering/CODE_REVIEW_STANDARD.md`.
- [ ] I reviewed the complete diff and affected callers.
- [ ] Shared site facts have one typed source of truth and stable identity keys.
- [ ] New interaction code is instance-scoped and cleans up listeners/observers/frames.
- [ ] Public behavior has regression coverage.
- [ ] New routes/surfaces were added to the relevant test matrices.
- [ ] Keyboard, focus, reduced-motion, responsive, and accessibility behavior were checked where applicable.
- [ ] No generated output, reports, caches, secrets, or unrelated changes are included.
- [ ] No test was skipped or weakened to make CI green.
