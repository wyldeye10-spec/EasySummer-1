/**
 * Timer completion notifications: sound + browser notification.
 * Uses Web Audio API for a crisp two-tone chime — no external audio files needed.
 */

let audioCtx: AudioContext | null = null
let permissionRequested = false

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  // Resume if suspended (browsers require user gesture before first sound)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Play a crisp two-tone "ding-ding" chime using Web Audio API oscillators.
 * First tone: A5 (880Hz), 150ms. Second tone: D6 (1175Hz), 200ms, delayed 150ms.
 */
function playChime(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // First tone: A5, 880Hz, 150ms, quick fade
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 880
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02)
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.08)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.18)

    // Second tone: D6, 1175Hz, 200ms, starts after first
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 1175
    const t2 = now + 0.15
    gain2.gain.setValueAtTime(0, t2)
    gain2.gain.linearRampToValueAtTime(0.28, t2 + 0.02)
    gain2.gain.linearRampToValueAtTime(0.18, t2 + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t2)
    osc2.stop(t2 + 0.22)
  } catch {
    // Silently fail — audio context may not be available
  }
}

/**
 * Show a browser notification for pomodoro completion.
 * Requests permission on first call if not yet granted.
 */
function showNotification(minutes: number): void {
  if (!('Notification' in window)) return

  const send = () => {
    try {
      new Notification('🍅 番茄钟完成！', {
        body: `专注了 ${minutes} 分钟，休息一下吧～`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
        silent: true, // we play our own sound
      })
    } catch { /* ignore */ }
  }

  if (Notification.permission === 'granted') {
    send()
  } else if (Notification.permission === 'default' && !permissionRequested) {
    permissionRequested = true
    Notification.requestPermission().then(p => {
      if (p === 'granted') send()
    })
  }
}

/**
 * Combined notification: plays chime sound + shows browser notification.
 * Call this when the pomodoro timer finishes.
 */
export function notifyTimerComplete(minutes: number): void {
  playChime()
  showNotification(minutes)
}
