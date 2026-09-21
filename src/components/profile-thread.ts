const mounted = new WeakMap<HTMLElement, ProfileThread>();
const clamp = (value: number) => Math.max(0, Math.min(1, value));

class ProfileThread {
  private controller = new AbortController();
  private preference = matchMedia('(prefers-reduced-motion: reduce)');
  private resize: ResizeObserver;
  private visibility: IntersectionObserver;
  private list: HTMLElement;
  private rows: HTMLElement[];
  private svg: SVGSVGElement;
  private paths: NodeListOf<SVGPathElement>;
  private clip: SVGRectElement;
  private origin: HTMLElement;
  private hold: HTMLElement;
  private nextSheet: HTMLElement | null;
  private frame = 0;
  private near = false;
  private hovered: HTMLElement | null = null;
  private flowTop = 0;
  private readingLine = 0;
  private focusLine = 0;
  private finishRange = 0;
  private finishLead = 0;

  constructor(private root: HTMLElement) {
    this.list = root.querySelector<HTMLElement>('.profile-list')!;
    this.rows = Array.from(root.querySelectorAll<HTMLElement>('[data-profile-key]'));
    this.svg = root.querySelector<SVGSVGElement>('[data-profile-path]')!;
    this.paths = this.svg.querySelectorAll('path');
    this.clip = this.svg.querySelector<SVGRectElement>('[data-thread-clip]')!;
    // Optional public geometry contract supplied by HeroAboutFlow; also works standalone.
    const context = root.closest<HTMLElement>('[data-profile-scroll-context]');
    this.origin = context ? context.querySelector<HTMLElement>('[data-profile-flow-origin]')! : root;
    this.hold = context ? context.querySelector<HTMLElement>('[data-profile-flow-hold]')! : root;
    this.nextSheet = context?.querySelector<HTMLElement>('[data-profile-next-sheet]') ?? null;
    this.resize = new ResizeObserver(this.measure);
    this.visibility = new IntersectionObserver(([entry]) => {
      this.near = entry.isIntersecting;
      if (this.near) this.schedule(); else this.stop();
    }, { rootMargin: '100% 0px' });
    this.bind();
    this.measure();
    this.resize.observe(this.list);
    this.visibility.observe(root);
    void document.fonts.ready.then(() => { if (!this.controller.signal.aborted) this.measure(); });
  }

  private bind() {
    const { signal } = this.controller;
    this.rows.forEach(row => {
      row.addEventListener('pointerenter', () => { this.hovered = row; this.schedule(); }, { signal });
      row.addEventListener('pointerleave', () => { this.hovered = null; this.schedule(); }, { signal });
    });
    addEventListener('scroll', this.schedule, { passive: true, signal });
    addEventListener('resize', this.measure, { signal });
    this.preference.addEventListener('change', this.measure, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else this.measure();
    }, { signal });
    document.addEventListener('astro:before-swap', this.destroy, { once: true, signal });
    addEventListener('pagehide', event => { this.stop(); if (!event.persisted) this.destroy(); }, { signal });
    addEventListener('pageshow', this.measure, { signal });
  }

  private measure = () => {
    this.stop();
    if (document.hidden) return;
    const css = getComputedStyle(this.root);
    this.readingLine = parseFloat(css.getPropertyValue('--thread-reading-line'));
    this.focusLine = parseFloat(css.getPropertyValue('--thread-focus-line'));
    this.finishRange = parseFloat(css.getPropertyValue('--thread-finish-range'));
    this.finishLead = parseFloat(css.getPropertyValue('--thread-finish-lead'));
    this.flowTop = 0;
    // offsetTop excludes the parent's 3D tilt. Stop before the sticky hold's moving offset.
    for (let node: HTMLElement | null = this.list; node && node !== this.hold; node = node.offsetParent as HTMLElement | null) {
      this.flowTop += node.offsetTop;
    }
    const points = this.rows.map(row => {
      const glyph = row.querySelector<HTMLElement>('[data-profile-glyph]')!;
      return { x: row.offsetLeft + glyph.offsetLeft + glyph.offsetWidth / 2, y: row.offsetTop + glyph.offsetTop + glyph.offsetHeight / 2 };
    });
    const commands = [`M ${points[0].x} ${points[0].y}`];
    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      const middle = (previous.y + point.y) / 2;
      commands.push(`C ${previous.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`);
    });
    this.svg.setAttribute('viewBox', `0 0 ${this.list.clientWidth} ${this.list.clientHeight}`);
    this.paths.forEach(path => path.setAttribute('d', commands.join(' ')));
    this.root.classList.add('is-thread-ready');
    this.paint();
  };

  private paint = () => {
    this.frame = 0;
    const reading = clamp((innerHeight * this.readingLine - this.origin.getBoundingClientRect().top - this.flowTop) / this.list.clientHeight);
    const range = innerHeight * this.finishRange;
    // Finish before the third sheet/bookmark covers the final node, even while About is pinned.
    const handoff = this.nextSheet ? clamp((innerHeight + this.finishLead + range - this.nextSheet.getBoundingClientRect().top) / range) : 0;
    const progress = this.preference.matches ? 1 : Math.max(reading, handoff);
    this.clip.setAttribute('height', String(progress * this.list.clientHeight));
    let nearest: HTMLElement | null = null;
    let distance = Infinity;
    if (!this.preference.matches) this.rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      const delta = Math.abs(rect.top + rect.height / 2 - innerHeight * this.focusLine);
      if (rect.bottom > 80 && rect.top < innerHeight && delta < distance) { distance = delta; nearest = row; }
    });
    const active = this.preference.matches ? null : this.hovered ?? nearest;
    this.rows.forEach(row => row.classList.toggle('is-reading', row === active));
  };

  private schedule = () => {
    if (!this.frame && this.near && !document.hidden && !this.preference.matches) this.frame = requestAnimationFrame(this.paint);
  };
  private stop = () => { cancelAnimationFrame(this.frame); this.frame = 0; };
  private destroy = () => {
    this.stop(); this.controller.abort(); this.resize.disconnect(); this.visibility.disconnect();
    this.root.classList.remove('is-thread-ready');
    this.rows.forEach(row => row.classList.remove('is-reading'));
    mounted.delete(this.root);
  };
}

export function mountProfileThreads() {
  document.querySelectorAll<HTMLElement>('[data-profile-surface]').forEach(root => {
    if (!mounted.has(root)) mounted.set(root, new ProfileThread(root));
  });
}
