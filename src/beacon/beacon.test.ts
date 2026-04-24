/**
 * Tests for the ChittyBeacon module.
 * Covers: default endpoint, BEACON_ENDPOINT alias, and error-always-warns behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We re-import the module inside each test so that mutations to process.env
// are picked up by the module-level DEFAULT_CONFIG initialisation.  Using
// vi.resetModules() before each test achieves that cleanly.

describe('beacon DEFAULT_CONFIG', () => {
  beforeEach(() => {
    vi.resetModules()
    // Make sure none of the override env vars are set before each test
    delete process.env.CHITTY_BEACON_ENDPOINT
    delete process.env.BEACON_ENDPOINT
  })

  afterEach(() => {
    delete process.env.CHITTY_BEACON_ENDPOINT
    delete process.env.BEACON_ENDPOINT
    vi.restoreAllMocks()
  })

  it('defaults endpoint to monitor.chitty.cc when no env vars are set', async () => {
    const mod = await import('./index')
    // Re-export the detectApp to verify the module loaded; the real check is
    // that configure() accepts the default without error.  We inspect the
    // default by calling configure with an empty object and checking it didn't
    // override the endpoint.
    expect(mod.configure).toBeDefined()
    // Verify default by checking that sendBeacon hits the correct URL.
    // We spy on globalThis.fetch before sending a beacon.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":"ok"}', { status: 200 })
    )
    await mod.sendBeacon('probe-default')
    const calledUrl = (fetchSpy.mock.calls[0] as [string])[0]
    expect(calledUrl).toBe('https://monitor.chitty.cc/track')
  })

  it('honours CHITTY_BEACON_ENDPOINT when set', async () => {
    process.env.CHITTY_BEACON_ENDPOINT = 'https://custom.example.com'
    const mod = await import('./index')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":"ok"}', { status: 200 })
    )
    await mod.sendBeacon('probe-custom')
    const calledUrl = (fetchSpy.mock.calls[0] as [string])[0]
    expect(calledUrl).toBe('https://custom.example.com/track')
  })

  it('honours BEACON_ENDPOINT alias when CHITTY_BEACON_ENDPOINT is not set', async () => {
    process.env.BEACON_ENDPOINT = 'https://alias.example.com'
    const mod = await import('./index')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":"ok"}', { status: 200 })
    )
    await mod.sendBeacon('probe-alias')
    const calledUrl = (fetchSpy.mock.calls[0] as [string])[0]
    expect(calledUrl).toBe('https://alias.example.com/track')
  })

  it('CHITTY_BEACON_ENDPOINT takes priority over BEACON_ENDPOINT', async () => {
    process.env.CHITTY_BEACON_ENDPOINT = 'https://primary.example.com'
    process.env.BEACON_ENDPOINT = 'https://alias.example.com'
    const mod = await import('./index')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":"ok"}', { status: 200 })
    )
    await mod.sendBeacon('probe-priority')
    const calledUrl = (fetchSpy.mock.calls[0] as [string])[0]
    expect(calledUrl).toBe('https://primary.example.com/track')
  })
})

describe('beacon error logging', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.CHITTY_BEACON_ENDPOINT
    delete process.env.BEACON_ENDPOINT
    // Ensure silent mode (default) — errors must still surface as warnings
    delete process.env.CHITTY_BEACON_VERBOSE
  })

  afterEach(() => {
    delete process.env.CHITTY_BEACON_ENDPOINT
    delete process.env.BEACON_ENDPOINT
    vi.restoreAllMocks()
  })

  it('always emits console.warn on non-OK HTTP response even in silent mode', async () => {
    const mod = await import('./index')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 })
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mod.sendBeacon('probe-404')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0][0]).toContain('404')
  })

  it('always emits console.warn on network error even in silent mode', async () => {
    const mod = await import('./index')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mod.sendBeacon('probe-network-error')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0][0]).toContain('ECONNREFUSED')
  })

  it('does NOT emit console.warn on a successful 200 response', async () => {
    const mod = await import('./index')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":"ok"}', { status: 200 })
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mod.sendBeacon('probe-ok')
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
