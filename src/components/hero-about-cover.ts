const mounted = new WeakSet<HTMLElement>();

function mountCover(root: HTMLElement, hold: HTMLElement, sheet: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let near = false;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const paint = () => {
    frame = 0;
    const covered = !reduced.matches && sheet.getBoundingClientRect().top <= 0;
    hold.inert = covered;
    hold.setAttribute('aria-hidden', String(covered));
  };
  const schedule = () => {
    if (!frame && near && !document.hidden) frame = requestAnimationFrame(paint);
  };
  const measure = () => {
    const height = hold.offsetHeight;
    root.style.setProperty('--about-height', `${height}px`);
    root.style.setProperty('--about-rest-top', `${Math.min(0, innerHeight - height)}px`);
    schedule();
  };
  const resize = new ResizeObserver(measure);
  const observer = new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) schedule(); else { stop(); paint(); }
  }, { rootMargin: '100% 0px' });
  const destroy = () => {
    stop(); controller.abort(); resize.disconnect(); observer.disconnect();
    hold.inert = false; hold.removeAttribute('aria-hidden');
    root.classList.remove('cover-ready'); mounted.delete(root);
  };
  measure(); root.classList.add('cover-ready'); resize.observe(hold); observer.observe(sheet);
  addEventListener('scroll', schedule, { passive: true, signal });
  addEventListener('resize', measure, { signal });
  reduced.addEventListener('change', () => { stop(); measure(); paint(); }, { signal });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : schedule(), { signal });
  document.addEventListener('astro:before-swap', destroy, { once: true, signal });
  addEventListener('pagehide', event => { stop(); if (!event.persisted) destroy(); }, { signal });
  addEventListener('pageshow', measure, { signal });
}

export function mountAboutCovers() {
  document.querySelectorAll<HTMLElement>('[data-hero-about-flow][data-about-cover]').forEach(root => {
    if (mounted.has(root)) return;
    const hold = root.querySelector<HTMLElement>('.about-flow-hold');
    const sheet = root.querySelector<HTMLElement>('.cover-sheet');
    if (!hold || !sheet) return;
    mounted.add(root); mountCover(root, hold, sheet);
  });
}
