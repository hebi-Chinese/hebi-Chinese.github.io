# Hebi Site Engineering and Code Review Standard

This is the normative engineering contract for the repository. It applies to human contributors and coding agents.

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are requirements, not stylistic decoration:

- **MUST / MUST NOT**: merge-blocking unless an explicit, written exception is approved.
- **SHOULD**: expected default; deviation requires a reason in the PR.
- **MAY**: optional.

## 1. Definition of Done

A change is complete only when all applicable conditions are true:

- The behavior and scope are described in a PRD, issue, or PR body.
- The implementation follows the architecture contract below.
- Public behavior has regression coverage.
- `npm run check`, `npm test`, and `npm run build` pass.
- `npm audit --omit=dev --audit-level=critical` passes.
- `git diff --check` passes.
- The complete diff has no P0/P1 findings.
- Every P2 is fixed or listed as an approved, evidence-backed exception.
- UI changes have responsive, keyboard, reduced-motion, console, overflow, and accessibility evidence where relevant.
- No generated browser/test artifacts remain in the worktree.

Passing `astro build` alone does not satisfy this definition.

## 2. Architecture Contract

### 2.1 Page composition

- Files in `src/pages/` MUST remain route composition modules: content lookup, page-level heading, metadata, and surface assembly.
- Pages MUST NOT implement feature-specific pointer, keyboard, animation, or state logic.
- Every public route MUST render exactly one page-level `h1`.
- Heading levels below the page title MUST remain sequential and meaningful.

### 2.2 Global layout

- `BaseLayout.astro` owns document-level metadata, favicon, shared page shell behavior, and the single global reveal runtime.
- A global concern MUST NOT be initialized again inside a surface module.
- Global scripts MUST provide a no-JavaScript or reduced-motion readable state.

### 2.3 Typed site catalog

- Navigation, projects, profile sections, and shared identity MUST have one source of truth in `src/data/site.ts` or a deliberately named successor catalog.
- A second hand-written array for desktop/mobile or Hero/project views is prohibited.
- Stable `slug` or `key` values MUST identify domain records across surfaces.
- Display indexes and ordinal numbers MUST be derived at render time and MUST NOT be used as identity.
- A catalog change used by more than one surface MUST be verified through all affected surfaces.

### 2.4 Surface modules

- A surface module MUST own its markup, local presentation, interaction behavior, and public props as one coherent responsibility.
- External interfaces SHOULD stay small. Internal complexity may remain inside a deep module when splitting it would only create pass-through files.
- A module over 300 lines MUST receive an explicit deep-module review: identify its public interface, hidden behavior, and why a split would improve or reduce locality.
- A file over 800 lines or a function over 50 lines MUST be split or carry a narrowly scoped documented exception.
- Pages and callers MUST NOT import or query a surface module's internal implementation details.

### 2.5 Instance-safe browser behavior

- Interactive scripts MUST begin with `querySelectorAll` over a surface root such as `[data-projects-wheel]`.
- All subsequent selectors MUST be scoped to that root.
- Hard-coded document-global interaction IDs are prohibited. IDs required for ARIA MUST be unique per instance.
- Each instance MUST own its own state, observers, listeners, timers, and animation frames.
- Event listeners SHOULD use an `AbortController`; observers and outstanding frames MUST be disconnected/cancelled during teardown.
- Rendering two instances of the same surface MUST NOT cause state, selector, focus, or ID collisions.

### 2.6 Seam and plugin discipline

- Do not create a plugin registry, adapter interface, or abstraction for one concrete implementation.
- A new seam requires at least two real adapters or a real production/test substitution at an external dependency.
- “Possible future extensibility” is not sufficient evidence.
- Prefer direct composition, typed data, and explicit props until variation is observed.

### 2.7 Preserved visual architecture

- The Hero/About Forward-Tilt Handoff MUST remain in ordinary document flow; it MUST NOT become a sticky or fixed overlay without a reviewed product decision.
- About MUST rotate from its top edge with positive `rotateX`, opening its lower half toward the viewer before returning to the readable plane.
- Hero Blueprint and profile glyph/map graphics are decorative repetitions and MUST stay outside the accessibility tree.
- Visual refactors MUST preserve these behaviors or explicitly replace them through an approved product/architecture decision and regression evidence.

The [approved cover/buffer handoff](../tasks/cover-buffer-integration.md) permits a bounded sticky hold of the already-readable About surface while the third sheet covers it. This exception applies only to the second-to-third transition; it does not replace the Hero-to-About forward tilt, pin the third sheet, or lock scrolling. Its image buffer may finish after input stops, but must terminate when settled, hidden, off-screen or disposed.

## 3. Frontend Correctness

### 3.1 Semantic and keyboard behavior

- Native interactive elements (`button`, `a`, form controls) MUST be used before ARIA emulation.
- Every interaction MUST be keyboard operable.
- Focus MUST remain visible and deterministic.
- Menus/dialog-like surfaces MUST define open state, Escape behavior, focus entry, and focus return.
- Hidden or inactive card faces MUST leave the accessibility and focus trees.
- New-tab links MUST use `rel="noopener noreferrer"`.
- ARIA state (`aria-expanded`, `aria-controls`, `aria-current`, live status) MUST match visible state.

### 3.2 Accessibility

- Public surfaces MUST meet WCAG 2.1 AA for serious/critical automated checks.
- Normal text contrast MUST be at least 4.5:1; large text at least 3:1.
- Color MUST NOT be the only carrier of meaning.
- Decorative graphics MUST be removed from the accessibility tree.
- Reduced-motion mode MUST show complete readable content, run no continuous decorative CSS animation, and leave no idle decorative rAF loop.
- Automated axe coverage does not replace keyboard and screen-reader-oriented manual review.

### 3.3 Responsive behavior

- No public route may introduce horizontal document overflow.
- Core surfaces MUST be verified at 320, 375, 768, 1024, and 1440 widths when their layout changes.
- Touch behavior MUST remain usable without hover.
- Content MUST be tested with real Chinese copy, not placeholder lengths.

### 3.4 CSS and design tokens

- Global tokens belong in `src/styles/global.css`; surface-specific styles stay with the surface.
- Repeated color, spacing, typography, motion, or breakpoint values SHOULD use established tokens.
- Responsive parameters consumed by JavaScript MUST have one source of truth, preferably computed CSS custom properties.
- Animation SHOULD use transform, opacity, and clip-path. Layout-property animation requires measured justification.
- `will-change` MUST be enabled only while the relevant animation is active.
- `transition: all` is prohibited.

## 4. Animation and Performance

- `requestAnimationFrame` MUST run only while observable work exists: pointer input, active ripple, drag/inertia, or scroll transition.
- Empty, settled, off-screen, hidden-document, and reduced-motion states MUST stop scheduling frames.
- Observers MUST be used to pause expensive off-screen work where applicable.
- Pointer/scroll input SHOULD coalesce into at most one scheduled frame.
- A new client runtime dependency requires a written comparison against CSS and browser primitives.
- The current site is a microsite: total client JavaScript SHOULD remain below 25 kB gzip unless a PR contains measured evidence and approval.
- Images MUST have explicit dimensions and appropriate eager/lazy priority.

## 5. Content Integrity

- Profile prompts or editorial scaffolding MUST NOT be presented as user facts without confirmation.
- Content frontmatter dates are authored calendar dates. Formatting MUST use the shared content-date utility and MUST NOT shift by machine timezone.
- Empty collections MUST render an intentional empty state rather than throw or fabricate content.
- User-authored Chinese wording MUST not be silently normalized when it carries tone or register.

## 6. Testing Contract

### 6.1 Public interfaces

- Tests MUST assert observable behavior: visible content, navigation, focus, ARIA state, route status, overflow, animation state, and accessibility output.
- Tests MUST NOT assert private helper calls, listener counts, or incidental internal classes unless the class itself is the public styling contract.
- A refactor that preserves behavior SHOULD not require rewriting tests.

### 6.2 Required coverage

- New public routes MUST be added to the route success, single-`h1`, console, and overflow matrix.
- New meaningful pages MUST be added to the axe matrix.
- New responsive surfaces MUST be added to the breakpoint matrix.
- New interactive behavior MUST receive a focused Playwright test.
- Animation lifecycle changes MUST cover reduced motion and idle-frame termination.
- Browser-facing behavior MUST pass Chromium, Firefox, and WebKit.

### 6.3 Test quality

- Prefer one behavior per test and deterministic waits.
- Timeout-only assertions and arbitrary sleeps are prohibited except when measuring a time-based public contract, with a comment explaining why.
- A failing test MUST be fixed; it MUST NOT be skipped, weakened, or retried into green without root-cause evidence.

## 7. Dependencies and Security

- Runtime dependencies require a written need, alternatives considered, bundle impact, and maintenance cost.
- Development dependencies MUST support a named quality gate.
- Secrets, tokens, private keys, `.env`, test reports, caches, and generated output MUST NOT be committed.
- `npm audit fix --force` and unrelated major upgrades are prohibited.
- Critical advisories block merge and deployment.
- High advisories require a tracked migration/exception with applicability analysis. The prior Astro 5 advisories were addressed by the [approved Astro 7 migration](../tasks/astro-7-upgrade.md); that historical result is not permission to ignore future advisories.

## 8. Review Severity and Merge Decision

- **P0 — Blocker:** exploitable security issue, data loss, broken production/deployment, or unusable core route. Must fix immediately.
- **P1 — High:** user-visible regression, inaccessible primary interaction, broken route, architecture violation that will propagate, or unbounded resource use. Must fix before merge.
- **P2 — Medium:** concrete maintainability, compatibility, performance, or accessibility risk. Fix before merge unless explicitly approved out of scope.
- **P3 — Low:** local clarity/style improvement with no material behavioral or architectural risk. May follow up.

Approval requires:

- P0 = 0;
- P1 = 0;
- P2 = 0 or explicitly approved with owner, reason, and follow-up location;
- all automated gates green;
- manual evidence supplied for non-automatable UI claims.

## 9. Required PR Evidence

Every PR must state:

- problem and intended user-visible result;
- architecture/interface impact and affected surfaces;
- data/catalog changes and stable-key implications;
- tests added or changed;
- exact output of `npm run verify` and the critical audit;
- responsive/keyboard/reduced-motion evidence for UI work;
- dependency and security impact;
- remaining P0-P3 findings and approved exceptions.

Reviewers must review the entire PR diff and affected callers, not only the newest file.

## 10. Automated vs Manual Enforcement

CI automatically enforces Astro diagnostics, cross-browser behavior tests, build, critical audit, and whitespace checks.

Human review still enforces:

- whether the module is deep or merely large;
- whether a new seam is justified by real adapters;
- whether design changes preserve the site's editorial language;
- whether tests describe real behavior rather than implementation;
- whether an out-of-scope P2 is genuinely bounded;
- real-device and screen-reader judgment beyond automation.

Repository maintainers SHOULD configure the GitHub `Quality / Verify` status check as required on `main`. This remote branch-protection setting is not created by repository files.
