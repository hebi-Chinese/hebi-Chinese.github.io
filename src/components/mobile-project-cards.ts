const mounted = new WeakMap<HTMLElement, MobileProjects>();

class MobileProjects {
  private controller = new AbortController();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private rail: HTMLElement;
  private originals: HTMLAnchorElement[];
  private cards: HTMLAnchorElement[];
  private status: HTMLElement;
  private resize: ResizeObserver;
  private selectedKey: string;
  // Input intent survives intermediate scroll events until that destination settles.
  private requestedKey: string | null = null;
  private physical = 1;
  private timer = 0;
  private pressed = false;
  private measuredWidth = 0;

  constructor(private root: HTMLElement) {
    this.rail = root.querySelector<HTMLElement>('[data-mobile-rail]')!;
    this.originals = [...root.querySelectorAll<HTMLAnchorElement>('[data-mobile-card]')];
    this.status = root.querySelector<HTMLElement>('[data-mobile-status]')!;
    this.selectedKey = this.originals[0].dataset.projectKey!;
    // Only boundary copies are added; the catalog and canonical links remain unique.
    this.rail.prepend(this.originals.at(-1)!.cloneNode(true));
    this.rail.append(this.originals[0].cloneNode(true));
    this.cards = [...this.rail.querySelectorAll<HTMLAnchorElement>('[data-mobile-card]')];
    root.dataset.ready = '';
    root.querySelector<HTMLElement>('[data-mobile-controls]')!.hidden = false;
    root.querySelector<HTMLElement>('[data-mobile-hint]')!.hidden = false;
    this.bind();
    this.resize = new ResizeObserver(this.restore);
    this.resize.observe(this.rail);
    this.restore();
  }

  private bind() {
    const { signal } = this.controller;
    this.root.querySelector('[data-mobile-previous]')!.addEventListener('click', () => this.step(-1), { signal });
    this.root.querySelector('[data-mobile-next]')!.addEventListener('click', () => this.step(1), { signal });
    this.rail.addEventListener('scroll', this.onScroll, { passive: true, signal });
    this.rail.addEventListener('scrollend', this.normalize, { signal });
    this.rail.addEventListener('pointerdown', () => { this.interrupt(); this.pressed = true; }, { signal });
    this.rail.addEventListener('wheel', this.interrupt, { passive: true, signal });
    window.addEventListener('pointerup', this.release, { signal });
    window.addEventListener('pointercancel', this.release, { signal });
    this.rail.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault(); this.step(event.key === 'ArrowLeft' ? -1 : 1);
    }, { signal });
    this.reduced.addEventListener('change', this.restore, { signal });
    document.addEventListener('visibilitychange', () => {
      clearTimeout(this.timer);
      if (!document.hidden) this.restore();
    }, { signal });
    document.addEventListener('astro:before-swap', this.destroy, { once: true, signal });
    window.addEventListener('pagehide', event => {
      clearTimeout(this.timer);
      if (!event.persisted) this.destroy();
    }, { signal });
    window.addEventListener('pageshow', this.restore, { signal });
  }

  private sync() {
    if (!this.rail.clientWidth || this.rail.clientWidth !== this.measuredWidth) return;
    const center = this.rail.getBoundingClientRect().left + this.rail.clientWidth / 2;
    let distance = Infinity;
    this.cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const delta = Math.abs(rect.left + rect.width / 2 - center);
      if (delta < distance) { distance = delta; this.physical = index; }
    });
    const active = this.cards[this.physical];
    const focusInRail = this.cards.includes(document.activeElement as HTMLAnchorElement);
    this.selectedKey = active.dataset.projectKey!;
    // Enable the destination and move focus before making the old card inert.
    active.inert = false;
    active.tabIndex = 0;
    active.setAttribute('aria-hidden', 'false');
    if (focusInRail && document.activeElement !== active) active.focus({ preventScroll: true });
    this.cards.forEach(card => {
      card.inert = card !== active;
      card.tabIndex = card === active ? 0 : -1;
      card.setAttribute('aria-hidden', String(card !== active));
    });
    const text = `${active.dataset.projectNumber} / ${String(this.originals.length).padStart(2, '0')} · ${active.dataset.projectTitle}`;
    if (this.status.textContent !== text) this.status.textContent = text;
  }

  private select(index: number, behavior: ScrollBehavior = this.reduced.matches ? 'instant' : 'smooth') {
    const card = this.cards[index];
    const left = this.rail.scrollLeft + card.getBoundingClientRect().left
      - this.rail.getBoundingClientRect().left - (this.rail.clientWidth - card.offsetWidth) / 2;
    this.rail.scrollTo({ left, behavior });
  }

  private normalize = () => {
    clearTimeout(this.timer);
    if (this.pressed || !this.rail.clientWidth || this.rail.clientWidth !== this.measuredWidth) return;
    this.sync();
    if (this.requestedKey !== null) {
      const active = this.cards[this.physical];
      const offset = active.getBoundingClientRect().left - this.rail.getBoundingClientRect().left
        - (this.rail.clientWidth - active.offsetWidth) / 2;
      // A cancelled smooth scroll can emit scrollend before its replacement finishes.
      if (this.selectedKey !== this.requestedKey || Math.abs(offset) > 1) return;
      this.requestedKey = null;
    }
    if (this.physical !== 0 && this.physical !== this.cards.length - 1) return;
    this.select(this.originals.findIndex(card => card.dataset.projectKey === this.selectedKey) + 1, 'instant');
    this.sync();
  };

  private step(direction: number) {
    this.sync();
    const current = this.originals.findIndex(card => card.dataset.projectKey === (this.requestedKey ?? this.selectedKey));
    const next = (current + direction + this.originals.length) % this.originals.length;
    this.requestedKey = this.originals[next].dataset.projectKey!;
    const center = this.rail.getBoundingClientRect().left + this.rail.clientWidth / 2;
    // Choose the nearest equivalent copy so ordinary 1↔last transitions stay local.
    let target = next + 1;
    let distance = Infinity;
    this.cards.forEach((card, index) => {
      if (card.dataset.projectKey !== this.requestedKey) return;
      const rect = card.getBoundingClientRect();
      const delta = Math.abs(rect.left + rect.width / 2 - center);
      if (delta < distance) { distance = delta; target = index; }
    });
    this.select(target);
    this.normalize();
  }

  private interrupt = () => {
    if (this.requestedKey === null) return;
    this.requestedKey = null;
    clearTimeout(this.timer);
    this.rail.scrollTo({ left: this.rail.scrollLeft, behavior: 'instant' });
    this.sync();
  };

  private onScroll = () => {
    // Resizing can dispatch a stale scroll event before ResizeObserver restores the selected card.
    if (this.rail.clientWidth !== this.measuredWidth) return;
    this.sync();
    clearTimeout(this.timer);
    // Embedded browsers may lack scrollend; settle only after native scrolling pauses.
    this.timer = window.setTimeout(this.normalize, 180);
  };

  private release = () => {
    if (!this.pressed) return;
    this.pressed = false;
    clearTimeout(this.timer);
    // A finger may rest on a boundary after scrolling has already ended.
    if (this.rail.clientWidth) this.timer = window.setTimeout(this.normalize, 180);
  };

  private restore = () => {
    clearTimeout(this.timer);
    this.pressed = false;
    this.measuredWidth = this.rail.clientWidth;
    if (!this.rail.clientWidth) return;
    this.selectedKey = this.requestedKey ?? this.selectedKey;
    this.requestedKey = null;
    this.select(this.originals.findIndex(card => card.dataset.projectKey === this.selectedKey) + 1, 'instant');
    this.sync();
  };

  private destroy = () => {
    clearTimeout(this.timer);
    this.controller.abort(); this.resize.disconnect();
    this.cards[0].remove(); this.cards.at(-1)!.remove();
    this.originals.forEach(card => {
      card.inert = false;
      card.removeAttribute('tabindex'); card.removeAttribute('aria-hidden');
    });
    delete this.root.dataset.ready;
    this.root.querySelector<HTMLElement>('[data-mobile-controls]')!.hidden = true;
    this.root.querySelector<HTMLElement>('[data-mobile-hint]')!.hidden = true;
    mounted.delete(this.root);
  };
}

export function mountMobileProjects() {
  document.querySelectorAll<HTMLElement>('[data-mobile-projects]').forEach(root => {
    if (!mounted.has(root)) mounted.set(root, new MobileProjects(root));
  });
}
