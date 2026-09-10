# Homepage editorial depth pass

> 2026-09-09: the CurrentReel/third-viewport proposal below is historical and superseded by [the approved single-page product showcase](homepage-product-showcase.md). The Hero/About, skills, wheel, and blog decisions remain unchanged.

## Problem

The home route currently mixes several unrelated surface languages: pill metadata, rounded CTAs, a framed site index, a terminal window, a pill cloud, a 3D card wheel, and a restrained article list. The result is readable but visually fragmented. Two areas in particular underperform:

- the Hero metadata reads like generic UI chips instead of authored editorial copy;
- the two 3D moments rely mainly on scale and rotation, without enough thickness, occlusion, perspective, or grounding shadow to read as spatial scenes.

## Intended result

Make `/` feel like one editorial portfolio rather than a stack of interface cards:

- replace the Hero chips and pill CTAs with a concise, fact-based introduction and typographic links;
- reduce framed/pill treatments in the site index and skills register;
- give the article preview a stronger publication-like hierarchy;
- strengthen the Hero-to-About fold with a visible depth seam and scroll-responsive shadow;
- give the homepage project wheel a deeper Z-axis scene with card yaw, internal parallax layers, occlusion, and a grounded perspective plane.

The content concept is not being reorganized around “主线 / 副线”. Those labels are treated as a weak presentation detail and removed.

The former terminal/status split is also replaced. Its terminal chrome, command transcript, blinking cursor, reveal scan, and explanatory aside all repeated information already present elsewhere without giving the third viewport a clear job. The new third viewport is one full-screen “Current signal” reel. Native page scrolling advances three factual workbench themes—anti-cheat, multi-agent systems, and model fine-tuning—through one aperture before releasing into the toolbox section. The reference is miHoYo Launcher's pinned scene-to-scene pacing; no reference assets, copy, scroll interception, or product UI are copied.

## Scope and interfaces

- The route remains a thin composition module.
- `Hero`, `HeroAboutFlow`, `SiteIndex`, `CurrentReel`, `Skills`, and `Blog` keep small, surface-owned public interfaces.
- `Terminal` leaves the homepage composition and is replaced by `CurrentReel`; the old terminal presentation has no retained public behavior.
- `ProjectsWheel` gains one optional `immersive` presentation prop. `/` enables it; `/projects` keeps the existing standard scene so this task does not redesign that route.
- No navigation, project catalog, profile catalog, content schema, stable slug, or URL changes.
- No new runtime or development dependencies.

## Verification

- Public homepage copy and links remain keyboard-accessible.
- Project previous/next and card-detail controls keep their observable behavior.
- `/` has one `h1`, no serious WCAG 2.1 AA violations, no console errors, and no horizontal overflow.
- Responsive evidence is required at 320, 375, 768, 1024, and 1440 widths.
- Reduced motion must expose all content and leave no running decorative animation loop.
- Desktop scrolling must advance the current-signal reel through all three catalog entries without hijacking wheel input; mobile and reduced-motion layouts expose all three entries statically.
- Each desktop signal gets a stable reading interval between eased transitions; the section must not spend the whole scroll range in an ambiguous half-transition.
- Run the repository gates: `npm run check`, `npm test`, `npm run build`, `npm audit --omit=dev --audit-level=critical`, and `git diff --check`.

## Deep-module review

`CurrentReel.astro` is a cohesive, zero-prop surface module slightly above 300 lines because its responsive static layout, desktop sticky presentation, scroll rendering, accessibility state, and animation cleanup must agree on the same markup. Its only external dependency is the typed `currentSignals` catalog. Splitting CSS or the small instance runtime into pass-through files would reduce locality without producing a reusable boundary. The runtime has one observer, one event-controller, and one scheduled frame; it stops work off-screen and disconnects on teardown.

`ProjectsWheel.astro` is intentionally a deep surface module and remains below the repository's 800-line hard limit. Its public interface is limited to `headingLevel` and the homepage-only `immersive` presentation flag. The module hides the card scene markup, responsive presentation, front/back accessibility state, drag/inertia behavior, keyboard controls, pointer tilt, observers, animation-frame scheduling, and teardown behind one instance-scoped `data-projects-wheel` root.

The instance initializer remains longer than 50 lines as a documented narrow exception. It owns one shared state closure and one `AbortController`; extracting the initializer into pass-through helpers would require threading the same cards, observers, state, frames, and cleanup handles through a context object without creating a second adapter or a clearer public boundary. The existing focused internal functions (`renderCards`, `selectProject`, face accessibility, pointer effects, and motion scheduling) keep individual behaviors reviewable while preserving teardown locality.

## Visual reference principles

The pass borrows principles rather than copying a specific site: editorial hierarchy and rule-based layout, Z-axis sequencing, stacking/occlusion, and purposeful 3D interaction. Reference families reviewed on Awwwards include editorial portfolio layouts, Z-axis gallery depth, and stacking 3D project cards.
