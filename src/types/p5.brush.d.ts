/**
 * p5.brush ships no types. Only the standalone build is declared, and only the
 * surface the mark factory actually uses — an `any` catch-all would let typos
 * through silently in the one place there is no compiler help otherwise.
 */
declare module 'p5.brush/standalone' {
  export function load(target: HTMLCanvasElement | OffscreenCanvas): void
  export function render(): void
  export function clear(): void

  export function scaleBrushes(scale: number): void
  export function seed(value: string): void
  export function noiseSeed(value: number): void

  export function push(): void
  export function pop(): void
  export function translate(x: number, y: number): void
  export function rotate(angle: number): void
  export function scale(x: number, y?: number): void

  export function set(brushName: string, color: string, weight: number): void
  export function stroke(color: string): void
  export function strokeWeight(weight: number): void
  export function noStroke(): void

  export function fill(color: string, alpha?: number): void
  export function noFill(): void
  export function fillBleed(strength: number, direction?: 'out' | 'in', angle?: number): void
  export function fillTexture(texture: number, border: number): void

  export function hatchStyle(brushName: string, color: string, weight: number): void
  export function hatch(
    distance: number,
    angle: number,
    options?: { rand?: number; continuous?: boolean; gradient?: number },
  ): void
  export function noHatch(): void

  export function field(name: string): void
  export function noField(): void

  export function beginShape(curvature?: number): void
  export function vertex(x: number, y: number, pressure?: number): void
  export function endShape(close?: boolean): void

  /** Each point is [x, y, pressure]. */
  export function spline(points: Array<[number, number, number]>, curvature?: number): void

  export function line(x1: number, y1: number, x2: number, y2: number): void
  export function circle(x: number, y: number, radius: number, randomness?: number): void
  export function rect(
    x: number,
    y: number,
    w: number,
    h: number,
    mode?: 'center' | 'corner',
  ): void
}
