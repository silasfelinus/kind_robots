"""Offline orchestra for Rainbow Bullet Hell Space Princess's score (Silas's second playtest, 2026-10-19:
"we REALLY need better music. think space opera, and more than a midi 8 note on repeat").

Numpy only. Every instrument is additive or noise synthesis with real envelopes: string sections of detuned
voices with vibrato, brass whose brightness swells with the note, a formant choir, harp and celesta plucks,
timpani, taiko, snare and cymbals. A track is mixed into stereo stems, sent through a synthetic hall reverb and
folded into a seamless loop (the reverb tail past the loop end is added back onto its start).
"""

from __future__ import annotations

import numpy as np

SR = 32000
RNG = np.random.default_rng(20261019)


def hz(midi: float) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12)


def env_adsr(n: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    """An envelope n samples long whose release ends at n."""
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    e = np.full(n, sustain, dtype=np.float64)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a, endpoint=False) ** 1.5
    d_end = min(n, a + d)
    if d_end > a:
        e[a:d_end] = np.linspace(1, sustain, d_end - a, endpoint=False)
    r = min(r, n)
    e[n - r:] *= np.linspace(1, 0, r) ** 1.3
    return e


def phase_of(freq: float, n: int, vib_rate=0.0, vib_cents=0.0, detune_cents=0.0, scoop_cents=0.0,
             vib_delay=0.15) -> np.ndarray:
    t = np.arange(n) / SR
    cents = np.full(n, detune_cents, dtype=np.float64)
    if vib_cents:
        ramp = np.clip((t - vib_delay) / 0.3, 0, 1)
        cents += vib_cents * ramp * np.sin(2 * np.pi * vib_rate * t + RNG.uniform(0, 2 * np.pi))
    if scoop_cents:
        cents += scoop_cents * np.exp(-t / 0.05)
    f = freq * 2.0 ** (cents / 1200)
    return 2 * np.pi * np.cumsum(f) / SR


def additive(phase: np.ndarray, freq: float, amps: np.ndarray) -> np.ndarray:
    """Sum harmonics k=1..len(amps) of `phase`; amps is (K,) or (K, n) for time-varying spectra."""
    k_max = int(min(len(amps), (SR * 0.45) // max(freq, 1)))
    if k_max < 1:
        return np.zeros_like(phase)
    ks = np.arange(1, k_max + 1)[:, None]
    offsets = RNG.uniform(0, 2 * np.pi, (k_max, 1))
    a = amps[:k_max] if amps.ndim == 2 else amps[:k_max, None]
    return (a * np.sin(ks * phase[None, :] + offsets)).sum(axis=0)


def saw_amps(k: int, rolloff: float) -> np.ndarray:
    ks = np.arange(1, k + 1)
    return (1 / ks) * np.exp(-(ks - 1) / rolloff)


# ------------------------------------------------------------------ instruments (mono, n samples)

def strings_voice(midi: float, dur: float, attack=0.25, release=0.45, bright=9.0, detune=0.0,
                  vib=6.0) -> np.ndarray:
    n = int((dur + release) * SR)
    ph = phase_of(hz(midi), n, vib_rate=5.3, vib_cents=vib, detune_cents=detune)
    sig = additive(ph, hz(midi), saw_amps(40, bright))
    return sig * env_adsr(n, attack, 0.2, 0.85, release)


def string_section(midi: float, dur: float, voices=4, **kw) -> tuple[np.ndarray, np.ndarray]:
    """A section of detuned players, spread across the stereo field."""
    detunes = np.linspace(-9, 9, voices)
    pans = np.linspace(-0.6, 0.6, voices)
    left = right = None
    for detune, pan in zip(detunes, pans):
        v = strings_voice(midi, dur, detune=float(detune) + RNG.uniform(-2, 2), **kw)
        l, r = v * np.cos((pan + 1) * np.pi / 4), v * np.sin((pan + 1) * np.pi / 4)
        left = l if left is None else left + l
        right = r if right is None else right + r
    return left / voices, right / voices


def brass(midi: float, dur: float, vel=1.0, bright=1.0, release=0.25) -> np.ndarray:
    """A horn (bright < 1) or trumpet (bright > 1): its spectrum opens with the attack."""
    n = int((dur + release) * SR)
    e = env_adsr(n, 0.07, 0.25, 0.8, release)
    ph = phase_of(hz(midi), n, vib_rate=5.0, vib_cents=7, scoop_cents=-35, vib_delay=0.35)
    k = 30
    ks = np.arange(1, k + 1)[:, None]
    width = (1.6 + 7.0 * bright * vel * e)[None, :]
    amps = (1 / ks) * np.exp(-(ks - 1) / width)
    return additive(ph, hz(midi), amps) * e * vel


FORMANTS = [(700, 110, 1.0), (1220, 130, 0.5), (2600, 170, 0.25)]


def choir_voice(midi: float, dur: float, attack=0.45, release=0.7, detune=0.0) -> np.ndarray:
    n = int((dur + release) * SR)
    f0 = hz(midi)
    k = int(min(40, (SR * 0.45) // f0))
    ks = np.arange(1, k + 1)
    freqs = ks * f0
    shape = sum(g / (1 + ((freqs - fc) / bw) ** 2) for fc, bw, g in FORMANTS)
    amps = shape / ks ** 0.5
    ph = phase_of(f0, n, vib_rate=4.6, vib_cents=11, detune_cents=detune, vib_delay=0.2)
    breath = np.convolve(RNG.normal(0, 1, n), np.ones(6) / 6, mode='same') * 0.015
    return (additive(ph, f0, amps) + breath) * env_adsr(n, attack, 0.3, 0.9, release)


def choir(midi: float, dur: float, voices=3, **kw) -> tuple[np.ndarray, np.ndarray]:
    pans = np.linspace(-0.5, 0.5, voices)
    left = right = 0
    for i, pan in enumerate(pans):
        v = choir_voice(midi, dur, detune=(i - (voices - 1) / 2) * 8, **kw)
        left = left + v * np.cos((pan + 1) * np.pi / 4)
        right = right + v * np.sin((pan + 1) * np.pi / 4)
    return left / voices, right / voices


def pluck(midi: float, length=2.2, hardness=1.4) -> np.ndarray:
    """A harp string: upper partials die first."""
    n = int(length * SR)
    t = np.arange(n) / SR
    f0 = hz(midi)
    k = int(min(24, (SR * 0.45) // f0))
    ks = np.arange(1, k + 1)[:, None]
    taus = (1.4 / ks ** 0.8)
    amps = (1 / ks ** hardness) * np.exp(-t[None, :] / taus)
    ph = 2 * np.pi * f0 * t
    return additive(ph, f0, amps) * np.minimum(1, t / 0.004)


def celesta(midi: float, length=1.8) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    f0 = hz(midi)
    out = np.zeros(n)
    for ratio, gain, tau in [(1, 1.0, 0.9), (2.0, 0.35, 0.35), (4.0, 0.15, 0.15), (6.8, 0.06, 0.08)]:
        if ratio * f0 < SR * 0.45:
            out += gain * np.sin(2 * np.pi * ratio * f0 * t) * np.exp(-t / tau)
    return out * np.minimum(1, t / 0.002)


def timpani(midi: float, vel=1.0, length=2.4) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    f0 = hz(midi)
    out = np.zeros(n)
    for ratio, gain, tau in [(1, 1.0, 0.9), (1.5, 0.5, 0.55), (1.98, 0.35, 0.4), (2.44, 0.22, 0.28), (2.96, 0.12, 0.2)]:
        out += gain * np.sin(2 * np.pi * ratio * f0 * t * (1 + 0.02 * np.exp(-t / 0.05))) * np.exp(-t / tau)
    thump = np.convolve(RNG.normal(0, 1, n), np.ones(24) / 24, mode='same') * np.exp(-t / 0.03) * 0.8
    return (out + thump) * vel


def taiko(vel=1.0, length=0.9) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    freq = 48 + 70 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.28)
    slap = np.convolve(RNG.normal(0, 1, n), np.ones(8) / 8, mode='same') * np.exp(-t / 0.015) * 0.6
    return (body + slap) * vel


def snare(vel=1.0, length=0.35) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = np.diff(RNG.normal(0, 1, n + 1)) * 0.5
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return (noise * np.exp(-t / 0.11) + tone * 0.6) * vel * 0.6


def cymbal(vel=1.0, length=3.2, swell=False) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = np.diff(np.diff(RNG.normal(0, 1, n + 2))) * 0.35
    e = np.exp(-t / 1.1) if not swell else (t / length) ** 3
    return noise * e * vel


def bass_note(midi: float, dur: float, staccato=False) -> np.ndarray:
    """Cellos and basses: a dark sawtooth, bowed short or long."""
    release = 0.08 if staccato else 0.3
    n = int((dur + release) * SR)
    ph = phase_of(hz(midi), n, vib_rate=5.0, vib_cents=0 if staccato else 5)
    sig = additive(ph, hz(midi), saw_amps(28, 5.0))
    e = env_adsr(n, 0.012 if staccato else 0.08, 0.12, 0.55 if staccato else 0.9, release)
    return sig * e


def synth_arp(midi: float, length=0.5) -> np.ndarray:
    """The rainbow shimmer: a bright square-ish blip that rings out."""
    n = int(length * SR)
    t = np.arange(n) / SR
    f0 = hz(midi)
    k = int(min(15, (SR * 0.45) // f0))
    ks = np.arange(1, k + 1, 2)[:, None]
    amps = (1 / ks) * np.exp(-t[None, :] / (0.25 / ks ** 0.5))
    return (amps * np.sin(ks * 2 * np.pi * f0 * t[None, :])).sum(axis=0) * np.minimum(1, t / 0.003)


# ------------------------------------------------------------------ mixing

class Mix:
    """Stereo stems on a loop of `length` seconds, with headroom for tails."""

    STEMS = ('strings', 'brass', 'choir', 'keys', 'low', 'perc')
    SENDS = {'strings': 0.32, 'brass': 0.26, 'choir': 0.42, 'keys': 0.38, 'low': 0.12, 'perc': 0.18}

    def __init__(self, length: float, tail: float = 4.0):
        self.length = length
        self.n = int(round(length * SR))
        self.total = self.n + int(tail * SR)
        self.stems = {name: np.zeros((2, self.total)) for name in self.STEMS}

    def add(self, stem: str, at: float, mono=None, pan=0.0, gain=1.0, stereo=None):
        start = int(round(at * SR))
        if start >= self.total:
            return
        if stereo is not None:
            left, right = stereo
        else:
            angle = (pan + 1) * np.pi / 4
            left, right = mono * np.cos(angle), mono * np.sin(angle)
        end = min(self.total, start + len(left))
        self.stems[stem][0, start:end] += left[: end - start] * gain
        self.stems[stem][1, start:end] += right[: end - start] * gain

    def render(self, levels: dict[str, float] | None = None) -> np.ndarray:
        levels = levels or {}
        dry = np.zeros((2, self.total))
        send = np.zeros((2, self.total))
        for name, stem in self.stems.items():
            level = levels.get(name, 1.0)
            dry += stem * level
            send += stem * level * self.SENDS[name]
        wet = hall(send)
        mix = dry + wet[:, : self.total]
        # Fold everything past the loop end back onto its start, so the loop is seamless.
        loop = mix[:, : self.n].copy()
        tail = mix[:, self.n:]
        for i in range(0, tail.shape[1], self.n):
            chunk = tail[:, i: i + self.n]
            loop[:, : chunk.shape[1]] += chunk
        # Sit the score at about -18 LUFS (game music under its effects), taming only the loudest peaks.
        rms = np.sqrt((loop ** 2).mean()) or 1
        loop = loop * (0.1 / rms)
        loop = np.where(np.abs(loop) > 0.7, np.sign(loop) * (0.7 + 0.25 * np.tanh((np.abs(loop) - 0.7) / 0.25)),
                        loop)
        return loop


def hall(send: np.ndarray, seconds=2.8) -> np.ndarray:
    """A synthetic concert hall: decaying stereo noise, darker as it fades."""
    m = int(seconds * SR)
    t = np.arange(m) / SR
    ir = np.zeros((2, m))
    for ch in range(2):
        noise = RNG.normal(0, 1, m)
        dark = np.convolve(noise, np.ones(12) / 12, mode='same')
        blend = np.clip(t / seconds * 1.6, 0, 1)
        ir[ch] = ((1 - blend) * noise + blend * dark) * np.exp(-t / 0.75)
        ir[ch, : int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    n = send.shape[1] + m
    size = 1 << (n - 1).bit_length()
    out = np.zeros((2, n))
    for ch in range(2):
        out[ch] = np.fft.irfft(np.fft.rfft(send[ch], size) * np.fft.rfft(ir[ch], size), size)[:n]
    return out * 0.9
