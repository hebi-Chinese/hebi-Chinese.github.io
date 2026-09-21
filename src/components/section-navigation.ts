/** Homepage fragment navigation. Native links are the no-JS/cross-page contract. */
export function mountSectionNavigation() {
  const root = document.querySelector<HTMLElement>('[data-home-sections]');
  if (!root) return; // Reading routes use ordinary cross-document links.
  const controller = new AbortController();
  const { signal } = controller;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-home-section]'));
  const targets = new Map<string, HTMLElement>([['top', root], ...sections.map(section => [section.id, section] as [string, HTMLElement])]);
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-navigation] a[href^="/#"]'));
  let animation = 0;
  let indicator = 0;
  let focusFrame = 0;
  let interacted = false;
  let destination: HTMLElement | null = null;

  const resolve = (hash: string) => targets.get(hash.slice(1) || 'top');
  const position = (target: HTMLElement) => Math.max(0, Math.min(
    scrollY + target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop),
    document.documentElement.scrollHeight - innerHeight,
  ));
  const focus = (target: HTMLElement) => {
    const heading = target.querySelector<HTMLElement>('h1, h2')!;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  };
  const stop = () => {
    cancelAnimationFrame(animation); cancelAnimationFrame(focusFrame);
    animation = 0; focusFrame = 0; destination = null;
  };
  const updateIndicator = () => {
    indicator = 0;
    const active = sections.filter(section => position(section) <= scrollY + 8).at(-1);
    navLinks.forEach(link => {
      if (link.hash === `#${active?.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleIndicator = () => {
    if (!indicator && !document.hidden) indicator = requestAnimationFrame(updateIndicator);
  };
  const go = (target: HTMLElement, animate: boolean) => {
    stop();
    destination = target;
    const origin = scrollY;
    const start = performance.now();
    const finish = () => {
      destination = null;
      // Scroll drives the cover's inert state; focus after its paint, including Back jumps.
      focusFrame = requestAnimationFrame(() => {
        focusFrame = requestAnimationFrame(() => {
          focusFrame = 0; focus(target); scheduleIndicator();
        });
      });
    };
    if (!animate || preference.matches) {
      scrollTo({ top: position(target), behavior: 'instant' });
      finish();
      return;
    }
    const step = (now: number) => {
      animation = 0;
      const progress = Math.min((now - start) / 560, 1);
      const eased = 1 - (1 - progress) ** 3;
      // Instant per frame avoids nesting browser smooth scrolling inside this bounded animation.
      scrollTo({ top: origin + (position(target) - origin) * eased, behavior: 'instant' });
      if (progress < 1) animation = requestAnimationFrame(step);
      else finish();
    };
    animation = requestAnimationFrame(step);
  };
  const fromHash = () => {
    const target = resolve(location.hash);
    if (target) go(target, false);
  };
  const interrupt = () => { interacted = true; stop(); };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const target = resolve(url.hash);
    if (!target) return;
    event.preventDefault();
    interacted = true;
    if (location.hash !== url.hash) history.pushState(null, '', url);
    go(target, true);
  }, { signal });
  addEventListener('scroll', scheduleIndicator, { passive: true, signal });
  addEventListener('resize', scheduleIndicator, { signal });
  addEventListener('wheel', interrupt, { passive: true, signal });
  addEventListener('touchstart', interrupt, { passive: true, signal });
  addEventListener('pointerdown', interrupt, { passive: true, signal });
  addEventListener('keydown', event => {
    // Widget arrow input takes precedence over a pending initial-hash focus.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event
    if (['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
  }, { signal });
  addEventListener('popstate', fromHash, { signal });
  addEventListener('hashchange', fromHash, { signal });
  preference.addEventListener('change', () => { if (preference.matches && destination) go(destination, false); }, { signal });
  const cancelFrames = () => { stop(); cancelAnimationFrame(indicator); indicator = 0; };
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelFrames(); }, { signal });
  const destroy = () => { cancelFrames(); controller.abort(); };
  document.addEventListener('astro:before-swap', destroy, { once: true, signal });
  addEventListener('pagehide', event => { cancelFrames(); if (!event.persisted) destroy(); }, { signal });
  addEventListener('pageshow', scheduleIndicator, { signal });
  const alignInitial = () => { if (!interacted && !signal.aborted && location.hash) fromHash(); };
  addEventListener('load', alignInitial, { once: true, signal });
  void document.fonts.ready.then(alignInitial);
  alignInitial();
  scheduleIndicator();
}
