import { floatObjects, type FloatObject } from './objects';
import { BufferedMix } from './buffered-mix';

const mounted = new WeakMap<HTMLElement, Showcase>();
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };

interface Actor { element: HTMLElement; thread: HTMLElement; config: FloatObject; order: number }

function getActors(root: HTMLElement): Actor[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-float-object]')).flatMap((element) => {
    const config = floatObjects.find((object) => object.key === element.dataset.floatObject);
    const thread = element.querySelector<HTMLElement>('.float-thread');
    if (!config || !thread) return [];
    const order = floatObjects.filter((object) => object.product === config.product).indexOf(config);
    return [{ element, thread, config, order }];
  });
}

function liftActor({ element, thread, config: c, order }: Actor, progress: number, mix: number, factor: number) {
  const lift = c.product === 'dual' ? smooth((progress - .025 - order * .028) / .13)
    : smooth((mix - .1 - order * .1) / .6);
  const dx = c.dx * factor * lift;
  const dy = c.dy * factor * lift;
  element.style.setProperty('--lift', lift.toFixed(4));
  element.style.setProperty('--dx', `${dx.toFixed(2)}px`);
  element.style.setProperty('--dy', `${dy.toFixed(2)}px`);
  element.style.setProperty('--magnify', (1 + (c.scale - 1) * lift).toFixed(4));
  element.style.setProperty('--angle', `${(c.angle * lift).toFixed(2)}deg`);
  thread.style.width = `${Math.hypot(dx, dy).toFixed(2)}px`;
  thread.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
}

class Showcase {
  private controller = new AbortController();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private observer: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  private panels: HTMLElement[];
  private buttons: HTMLButtonElement[];
  private actors: Actor[];
  private planes: HTMLElement[];
  private images: HTMLImageElement[];
  private fading: HTMLElement[][];
  private mix = new BufferedMix();
  private forward = .55;
  private back = .40;
  private frame = 0;
  private inView = false;
  private selected = 'dual';
  private manual: string | null = null;
  private lastScrollY = scrollY;
  private scrollStart = .73;
  private scrollRange = .46;
  private floats = true;

  constructor(private root: HTMLElement, private art: HTMLElement) {
    this.panels = Array.from(root.querySelectorAll<HTMLElement>('[data-showcase-product]'));
    this.buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-showcase-select]'));
    this.planes = Array.from(root.querySelectorAll<HTMLElement>('.art-plane'));
    this.images = Array.from(root.querySelectorAll<HTMLImageElement>('.product-art img'));
    this.fading = this.panels.map(panel => Array.from(panel.querySelectorAll<HTMLElement>('h3, .showcase-description, .float-layer')));
    this.actors = getActors(root);
    this.observer = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      if (this.inView) this.schedule(); else this.stop();
    });
    this.resizeObserver = new ResizeObserver(() => this.refresh());
    this.root.classList.add('is-enhanced');
    this.root.querySelector<HTMLElement>('.showcase-controls')?.removeAttribute('hidden');
    this.refresh();
    this.render();
    this.bind();
    this.observer.observe(root);
    this.resizeObserver.observe(root);
  }

  private bind() {
    const { signal } = this.controller;
    addEventListener('scroll', this.onScroll, { passive: true, signal });
    addEventListener('resize', this.refresh, { signal });
    this.reduced.addEventListener('change', this.onPreference, { signal });
    document.addEventListener('visibilitychange', this.onVisibility, { signal });
    document.addEventListener('astro:before-swap', this.destroy, { once: true, signal });
    addEventListener('pagehide', this.onPageHide, { signal });
    addEventListener('pageshow', this.refresh, { signal });
    this.buttons.forEach((button) => button.addEventListener('click', () => {
      this.manual = button.dataset.showcaseSelect ?? null;
      this.lastScrollY = scrollY;
      this.stop();
      this.render();
    }, { signal }));
  }

  private refresh = () => {
    const css = getComputedStyle(this.root);
    this.scrollStart = Number(css.getPropertyValue('--scroll-start')) || .73;
    this.scrollRange = Number(css.getPropertyValue('--scroll-range')) || .46;
    this.floats = Number(css.getPropertyValue('--float-enabled')) === 1;
    this.mix.duration = Math.max(0, Number(css.getPropertyValue('--crossfade-ms')) || 0);
    this.forward = Number(css.getPropertyValue('--switch-forward')) || .55;
    this.back = Number(css.getPropertyValue('--switch-back')) || .40;
    this.schedule();
  };

  private onScroll = () => {
    if (Math.abs(scrollY - this.lastScrollY) < 1) return;
    this.lastScrollY = scrollY;
    if (this.reduced.matches) return;
    this.manual = null;
    this.schedule();
  };

  private onPreference = () => {
    this.stop();
    this.manual = this.reduced.matches ? this.selected : null;
    this.render();
  };

  private onVisibility = () => { if (document.hidden) this.stop(); else this.schedule(); };
  private onPageHide = (event: PageTransitionEvent) => { this.stop(); if (!event.persisted) this.destroy(); };

  private schedule = () => {
    if (this.frame || !this.inView || document.hidden || this.reduced.matches) return;
    this.frame = requestAnimationFrame(this.render);
  };

  private render = (now = performance.now()) => {
    this.frame = 0;
    const rect = this.art.getBoundingClientRect();
    const p = this.manual ? (this.manual === 'dual' ? .25 : .95)
      : clamp((innerHeight * this.scrollStart - rect.top - rect.height / 2) / (innerHeight * this.scrollRange));
    const target = this.reduced.matches ? Number((this.manual ?? this.selected) === 'aoai')
      : this.manual ? Number(this.manual === 'aoai')
      : p > this.forward ? 1 : p < this.back ? 0 : this.mix.target;
    this.mix.select(target, now);
    const visible = rect.bottom > 0 && rect.top < innerHeight;
    if (this.reduced.matches || !visible || document.hidden) this.mix.settle();
    const active = this.mix.value >= .5 ? 'aoai' : 'dual';
    const opacity = [1 - this.mix.value, this.mix.value];
    // Source-over blending keeps the paper from flashing through at mid-transition.
    this.images.forEach((image, index) => { image.style.opacity = String(index === 0 ? 1 : this.mix.value); });
    this.panels.forEach((panel, index) => {
      this.fading[index].forEach(element => { element.style.opacity = String(opacity[index]); });
      panel.setAttribute('aria-hidden', String(panel.dataset.showcaseProduct !== active));
      panel.inert = panel.dataset.showcaseProduct !== active;
    });
    this.selected = active;
    this.buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.showcaseSelect === active)));
    const zoom = this.reduced.matches ? 0 : smooth(p);
    this.planes.forEach((plane) => { plane.style.transform = `translate3d(0,${-zoom * 8}px,0) scale(${1 + zoom * .025})`; });
    if (this.floats && !this.reduced.matches) this.actors.forEach((actor) => liftActor(actor, p, this.mix.value, clamp(rect.width / 940)));
    this.root.classList.toggle('is-buffering', this.mix.moving);
    if (this.mix.moving) this.schedule();
  };

  private stop = () => { cancelAnimationFrame(this.frame); this.frame = 0; this.root.classList.remove('is-buffering'); };

  private destroy = () => {
    this.stop();
    this.controller.abort();
    this.observer.disconnect();
    this.resizeObserver.disconnect();
    mounted.delete(this.root);
  };
}

export function mountShowcases() {
  document.querySelectorAll<HTMLElement>('[data-product-showcase]').forEach((root) => {
    if (mounted.has(root)) return;
    const art = root.querySelector<HTMLElement>('[data-showcase-art]');
    if (art) mounted.set(root, new Showcase(root, art));
  });
}
