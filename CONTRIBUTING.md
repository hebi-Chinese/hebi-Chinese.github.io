# Contributing

Hebi Site accepts changes only when they preserve the repository's architecture and pass its repeatable quality gates.

Read [the engineering and code review standard](docs/engineering/CODE_REVIEW_STANDARD.md) before changing code. Coding agents must also read [AGENTS.md](AGENTS.md).

## Development workflow

1. Start from a clean understanding of `git status`; never discard changes you did not create.
2. Describe the problem and observable result in an issue, PRD, or PR body before substantial work.
3. Read `src/data/site.ts`, the relevant surface module, its callers, and existing tests.
4. Implement one complete behavior slice at a time.
5. Add or update tests through the public interface.
6. Review the full diff and run the gates below.
7. Open a pull request using the repository template. Do not push directly to `main`.

## Local setup

Use Node 24 (recorded in `.nvmrc`, also read by both CI workflows). Astro requires Node >=22.12.0 and npm >=9.6.5. With nvm, run `nvm install` and `nvm use` first.

```bash
npm ci
npm run dev
```

## Required verification

```bash
npm run verify
npm audit --omit=dev --audit-level=critical
git diff --check
```

`npm test` builds the site first, then tests the resulting static pages using an
exclusive preview server on `127.0.0.1:4338`. Keep that port free. It never reuses
an existing development server; `npm run verify` runs diagnostics and this same
build-and-browser gate. For a focused test, use `npm test -- tests/<file>.spec.ts`.

For UI changes, manually inspect the affected surface at relevant mobile, tablet, and desktop sizes. Include keyboard and reduced-motion behavior in the PR evidence.

## Architecture summary

- Routes compose surfaces; they do not own feature interaction logic.
- `src/data/site.ts` is the shared typed site catalog.
- Stable keys are identity; display order is presentation.
- Browser interaction is scoped to each surface root and has a teardown path.
- CSS tokens are the single source for responsive values shared with JavaScript.
- Plugin seams require at least two real adapters.
- Tests describe user-visible behavior and run in Chromium, Firefox, and WebKit.

## Merge bar

- P0/P1 findings: none.
- P2 findings: fixed or explicitly approved with a bounded follow-up.
- CI: green.
- PR evidence: complete.

Maintainers should configure the `Quality / Verify` check as required in GitHub branch protection. Repository files cannot enforce that remote setting by themselves.
