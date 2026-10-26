// Optional background sound. Starts only from a user gesture (the seal tap or
// the sound toggle). Uses the configured music file when one exists; otherwise
// a soft generated ambience: a warm drone with slow plucked phrases in maqam
// Hijaz, so the invitation never depends on an audio asset to work.

const HIJAZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66] // D Eb F# G A Bb C D

class Ambience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer = 0
  private audio: HTMLAudioElement | null = null
  private step = 0
  playing = false

  constructor(private url: string) {}

  async start() {
    if (this.playing) return
    this.playing = true
    if (this.url) {
      this.audio ??= Object.assign(new Audio(this.url), { loop: true, volume: 0 })
      try {
        await this.audio.play()
        this.fadeElement(0.6)
      } catch {
        this.playing = false
      }
      return
    }
    try {
      this.ctx ??= new AudioContext()
      await this.ctx.resume()
      if (!this.master) this.build()
      const g = this.master!.gain
      g.cancelScheduledValues(this.ctx.currentTime)
      g.setTargetAtTime(0.16, this.ctx.currentTime, 1.2)
      this.timer = window.setInterval(() => this.phrase(), 1100)
    } catch {
      this.playing = false
    }
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    if (this.audio) return this.fadeElement(0, () => this.audio?.pause())
    clearInterval(this.timer)
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
      const ctx = this.ctx
      setTimeout(() => !this.playing && ctx.suspend(), 1500)
    }
  }

  private fadeElement(to: number, done?: () => void) {
    const a = this.audio!
    const from = a.volume
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1200)
      a.volume = from + (to - from) * k
      if (k < 1) requestAnimationFrame(tick)
      else done?.()
    }
    requestAnimationFrame(tick)
  }

  private build() {
    const ctx = this.ctx!
    this.master = ctx.createGain()
    this.master.gain.value = 0
    // Simple echo for space.
    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.42
    const fb = ctx.createGain()
    fb.gain.value = 0.32
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 1800
    delay.connect(tone).connect(fb).connect(delay)
    this.master.connect(ctx.destination)
    tone.connect(this.master)
    this.bus = ctx.createGain()
    this.bus.connect(this.master)
    this.bus.connect(delay)

    // Drone: tonic and fifth, slowly breathing through a filter.
    const pad = ctx.createBiquadFilter()
    pad.type = 'lowpass'
    pad.frequency.value = 520
    const padGain = ctx.createGain()
    padGain.gain.value = 0.22
    pad.connect(padGain).connect(this.master)
    for (const [f, d] of [[73.42, -4], [73.42, 5], [110, 3], [146.83, -2]] as const) {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = d
      o.connect(pad)
      o.start()
    }
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.07
    lfoGain.gain.value = 260
    lfo.connect(lfoGain).connect(pad.frequency)
    lfo.start()
  }

  private bus: GainNode | null = null

  /** One plucked note, walking gently through the scale. */
  private phrase() {
    const ctx = this.ctx!
    if (Math.random() < 0.25) return // breathing room
    this.step = Math.max(0, Math.min(HIJAZ.length - 1, this.step + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]))
    const f = HIJAZ[this.step] * (Math.random() < 0.3 ? 2 : 1)
    const t = ctx.currentTime + 0.02
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.28, t + 0.012)
    env.gain.exponentialRampToValueAtTime(0.001, t + 2.2)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(3200, t)
    lp.frequency.exponentialRampToValueAtTime(600, t + 1.2)
    for (const [type, mult, g] of [['triangle', 1, 1], ['sine', 2, 0.35]] as const) {
      const o = ctx.createOscillator()
      const og = ctx.createGain()
      o.type = type
      o.frequency.value = f * mult
      og.gain.value = g
      o.connect(og).connect(lp)
      o.start(t)
      o.stop(t + 2.3)
    }
    lp.connect(env).connect(this.bus!)
  }
}

let instance: Ambience | null = null

export function ambience(url: string) {
  instance ??= new Ambience(url)
  return instance
}

const PREF = 'henna:sound'
export const soundPreferred = () => {
  try {
    return localStorage.getItem(PREF) !== 'off'
  } catch {
    return true
  }
}
export const setSoundPreferred = (on: boolean) => {
  try {
    localStorage.setItem(PREF, on ? 'on' : 'off')
  } catch {
    // ignore
  }
}
