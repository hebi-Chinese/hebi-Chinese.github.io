const mounted = new WeakMap<HTMLElement, AboutMotion>();

class AboutMotion {
  private controller = new AbortController();
  private preference = matchMedia('(prefers-reduced-motion: reduce)');
  private observer: IntersectionObserver;
  private frame = 0;
  private near = false;
  private stage: HTMLElement;
  private panel: HTMLElement;

  constructor(private root: HTMLElement) {
    // These nodes are owned by HeroAboutFlow's markup, not optional external input.
    this.stage = root.querySelector<HTMLElement>('[data-about-flow-stage]')!;
    this.panel = this.stage.querySelector<HTMLElement>('.about-flow-panel')!;
    this.observer = new IntersectionObserver(([entry]) => {
      this.near = entry.isIntersecting;
      if (this.near) this.schedule(); else this.stop();
    }, { rootMargin: '100% 0px' });
    const { signal } = this.controller;
    addEventListener('scroll', this.schedule, { passive: true, signal });
    addEventListener('resize', this.schedule, { signal });
    this.preference.addEventListener('change', this.refreshPreference, { signal });
    document.addEventListener('visibilitychange', this.onVisibility, { signal });
    document.addEventListener('astro:before-swap', this.destroy, { once: true, signal });
    addEventListener('pagehide', this.onPageHide, { signal });
    addEventListener('pageshow', this.refreshPreference, { signal });
    root.classList.add('motion-ready');
    this.refreshPreference();
    this.observer.observe(this.stage);
  }

  private paint = () => {
    this.frame = 0;
    const start = innerHeight * .82;
    const progress = Math.max(0, Math.min((start - this.stage.getBoundingClientRect().top) / (innerHeight * .9), 1));
    const css = getComputedStyle(this.stage);
    const initialAngle = Number.parseFloat(css.getPropertyValue('--about-angle'));
    const initialScale = Number.parseFloat(css.getPropertyValue('--about-scale'));
    const angle = initialAngle * (1 - progress);
    const scale = initialScale + progress * (1 - initialScale);
    this.panel.style.transform = `translateZ(0) rotateX(${angle.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    this.stage.classList.toggle('is-transforming', progress > 0 && progress < 1);
    this.stage.classList.toggle('is-readable', progress > .65);
  };

  private schedule = () => {
    if (this.frame || !this.near || document.hidden || this.preference.matches) return;
    this.frame = requestAnimationFrame(this.paint);
  };

  private stop = () => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.stage.classList.remove('is-transforming');
  };

  private refreshPreference = () => {
    this.stop();
    if (this.preference.matches) {
      this.panel.style.removeProperty('transform');
      this.stage.classList.add('is-readable');
    } else if (!document.hidden) this.paint();
  };

  private onVisibility = () => { if (document.hidden) this.stop(); else this.refreshPreference(); };
  private onPageHide = (event: PageTransitionEvent) => { this.stop(); if (!event.persisted) this.destroy(); };

  private destroy = () => {
    this.stop(); this.controller.abort(); this.observer.disconnect();
    this.panel.style.removeProperty('transform');
    this.root.classList.remove('motion-ready');
    this.stage.classList.remove('is-readable');
    mounted.delete(this.root);
  };
}

export function mountAboutMotion() {
  document.querySelectorAll<HTMLElement>('[data-hero-about-flow]').forEach(root => {
    if (!mounted.has(root)) mounted.set(root, new AboutMotion(root));
  });
}
