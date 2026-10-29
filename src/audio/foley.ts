// Small, synthesised sound effects for the opening: the wax cracking, paper
// flaps lifting and the satin ribbon sliding away. Generated from filtered
// noise, so no audio files are needed. They play only when the guest has
// sound on, and the context is created inside her tap, as browsers require.

let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

/** Call from the tap handler to unlock audio. */
export function primeFoley() {
  try {
    ctx ??= new AudioContext()
    void ctx.resume()
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const d = noise.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
  } catch {
    ctx = null
  }
}

function burst(opts: { at?: number; dur: number; type: BiquadFilterType; freq: number; q?: number; gain: number; shape: (t: number) => number }) {
  if (!ctx || !noise) return
  const t0 = ctx.currentTime + (opts.at ?? 0)
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  const filter = ctx.createBiquadFilter()
  filter.type = opts.type
  filter.frequency.value = opts.freq
  filter.Q.value = opts.q ?? 0.8
  const g = ctx.createGain()
  const steps = 48
  const curve = new Float32Array(steps)
  for (let i = 0; i < steps; i++) curve[i] = opts.gain * opts.shape(i / (steps - 1))
  g.gain.setValueAtTime(0, t0)
  g.gain.setValueCurveAtTime(curve, t0, opts.dur)
  src.connect(filter).connect(g).connect(ctx.destination)
  src.start(t0, Math.random())
  src.stop(t0 + opts.dur + 0.05)
}

/** The wax gives: a sharp crack over a soft thud. */
export function crack() {
  if (!ctx) return
  burst({ dur: 0.09, type: 'bandpass', freq: 2600, q: 1.2, gain: 0.55, shape: (t) => Math.pow(1 - t, 3) })
  burst({ at: 0.02, dur: 0.06, type: 'highpass', freq: 4200, gain: 0.25, shape: (t) => Math.pow(1 - t, 4) })
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  const t0 = ctx.currentTime
  o.frequency.setValueAtTime(140, t0)
  o.frequency.exponentialRampToValueAtTime(60, t0 + 0.12)
  g.gain.setValueAtTime(0.28, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14)
  o.connect(g).connect(ctx.destination)
  o.start(t0)
  o.stop(t0 + 0.15)
}

/** A paper flap lifting: a short, uneven rustle. */
export function rustle(dur = 0.7) {
  const flutter = Array.from({ length: 6 }, () => 0.5 + Math.random() * 0.5)
  burst({
    dur,
    type: 'bandpass',
    freq: 1500 + Math.random() * 900,
    q: 0.6,
    gain: 0.16,
    shape: (t) => Math.sin(Math.PI * t) * flutter[Math.floor(t * 5.99)],
  })
}

/** Satin sliding over paper. */
export function swish(dur = 0.8) {
  burst({ dur, type: 'highpass', freq: 3200, gain: 0.11, shape: (t) => Math.sin(Math.PI * Math.pow(t, 0.7)) })
}
