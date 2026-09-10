/** A bounded, interruptible cross-dissolve. Position chooses a target; time paints it. */
export class BufferedMix {
  value = 0;
  target = 0;
  private from = 0;
  private started = 0;
  duration = 500;

  get moving() { return this.value !== this.target; }

  advance(now: number) {
    if (!this.moving) return;
    const t = this.duration > 0 ? Math.min(1, Math.max(0, (now - this.started) / this.duration)) : 1;
    this.value = this.from + (this.target - this.from) * t * t * (3 - 2 * t);
    if (t === 1) this.value = this.target;
  }

  select(target: number, now: number) {
    this.advance(now);
    if (target === this.target) return;
    this.from = this.value; this.target = target; this.started = now;
  }

  settle() { this.value = this.target; this.from = this.target; }
}
