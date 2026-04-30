import { ref } from 'vue'

const SOUND_ROLL = '/sounds/drum_roll_long.mp3'

export function useAudio() {
  let audioContext: AudioContext | null = null
  const soundEnabled = ref(
    localStorage.getItem('lottery-sound-enabled') !== 'false'
  )

  let audioBufferCache: Map<string, AudioBuffer> = new Map()

  function getContext(): AudioContext {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    return audioContext
  }

  async function loadAudioBuffer(src: string): Promise<AudioBuffer | null> {
    if (audioBufferCache.has(src)) {
      return audioBufferCache.get(src)!
    }
    try {
      const ctx = getContext()
      const response = await fetch(src)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      audioBufferCache.set(src, audioBuffer)
      return audioBuffer
    } catch (e) {
      console.warn('Failed to load audio:', src, e)
      return null
    }
  }

  function playAudioBufferOnce(buffer: AudioBuffer, volume = 0.7): AudioBufferSourceNode | null {
    try {
      const ctx = getContext()
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = volume

      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      source.start(0)
      return source
    } catch (e) {
      console.warn('playAudioBufferOnce error:', e)
      return null
    }
  }

  function setSoundEnabled(v: boolean) {
    soundEnabled.value = v
    localStorage.setItem('lottery-sound-enabled', String(v))
  }

  function playRollTick() {
    if (!soundEnabled.value) return
    try {
      const ctx = getContext()
      const now = ctx.currentTime

      const clickGain = ctx.createGain()
      clickGain.gain.setValueAtTime(0.12, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      clickGain.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)
      osc.connect(clickGain)
      osc.start(now)
      osc.stop(now + 0.03)

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1
      }
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = 2000
      noiseFilter.Q.value = 3

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.06, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)

      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noiseSource.start(now)
      noiseSource.stop(now + 0.015)
    } catch (e) {
      console.warn('Audio tick error:', e)
    }
  }

  async function startRollingSound() {
    if (!soundEnabled.value) return
    try {
      const buffer = await loadAudioBuffer(SOUND_ROLL)
      if (!buffer) return
      playAudioBufferOnce(buffer, 0.75)
    } catch (e) {
      console.warn('Audio rolling error:', e)
    }
  }

  function stopRollingSound() {
  }

  async function playWinFanfare() {
    if (!soundEnabled.value) return
    try {
      const ctx = getContext()
      const now = ctx.currentTime

      const notes = [523.25, 659.25, 783.99, 1046.5]
      const noteDurations = [0.18, 0.18, 0.18, 0.5]

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.type = i < 3 ? 'sawtooth' : 'square'

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(3000, now)
        filter.frequency.exponentialRampToValueAtTime(800, now + noteDurations[i] + 0.1)

        const gain = ctx.createGain()
        const noteStart = now + notes.slice(0, i).reduce((s, _, idx) => s + noteDurations[idx], 0)
        gain.gain.setValueAtTime(0, noteStart)
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02)
        gain.gain.setValueAtTime(0.18, noteStart + noteDurations[i] * 0.5)
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDurations[i] + 0.1)

        osc.frequency.value = freq
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(noteStart)
        osc.stop(noteStart + noteDurations[i] + 0.2)
      })

      for (let i = 0; i < 8; i++) {
        const sCtx = getContext()
        const sparkOsc = sCtx.createOscillator()
        sparkOsc.type = 'sine'
        const sparkFreq = 2000 + Math.random() * 3000
        sparkOsc.frequency.setValueAtTime(sparkFreq, now + 0.6 + i * 0.07)

        const sparkGain = sCtx.createGain()
        const sparkStart = now + 0.6 + i * 0.07
        sparkGain.gain.setValueAtTime(0, sparkStart)
        sparkGain.gain.linearRampToValueAtTime(0.06, sparkStart + 0.01)
        sparkGain.gain.exponentialRampToValueAtTime(0.001, sparkStart + 0.15)

        sparkOsc.connect(sparkGain)
        sparkGain.connect(sCtx.destination)
        sparkOsc.start(sparkStart)
        sparkOsc.stop(sparkStart + 0.2)
      }
    } catch (e) {
      console.warn('Audio fanfare error:', e)
    }
  }

  return {
    soundEnabled,
    setSoundEnabled,
    playRollTick,
    startRollingSound,
    stopRollingSound,
    playWinFanfare
  }
}
