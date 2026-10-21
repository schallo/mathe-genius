import { describe, expect, it } from 'vitest'
import { computeRenderSize } from './display'

describe('computeRenderSize', () => {
  it('fills an iPhone home-screen app at device resolution', () => {
    // iPhone 15 standalone: 393 × ~759 CSS px usable, DPR 3
    expect(computeRenderSize(393, 759, 3)).toEqual({ scale: 6, cssWidth: 360, cssHeight: 720 })
  })

  it('keeps one canvas pixel per device pixel in Safari with toolbars', () => {
    const size = computeRenderSize(393, 659, 3)
    expect(size.scale).toBe(5)
    expect(size.cssHeight).toBeLessThanOrEqual(659)
    expect(size.cssWidth * 3).toBe(180 * 5)
  })

  it('uses an integer zoom on a 1080p PC window', () => {
    expect(computeRenderSize(1900, 950, 1)).toEqual({ scale: 2, cssWidth: 360, cssHeight: 720 })
  })

  it('never goes below 1 or above 8', () => {
    expect(computeRenderSize(100, 100, 1).scale).toBe(1)
    expect(computeRenderSize(5000, 5000, 3).scale).toBe(8)
  })
})
