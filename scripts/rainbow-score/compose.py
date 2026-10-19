"""Rainbow Bullet Hell Space Princess: the space-opera score, composed as data and rendered by synth.py.

Every Act has its own hand-written eight-bar theme over its own chords. A flight cue is a fanfare intro, the
theme on horns over a string ostinato, the theme again an octave up on trumpets and violins with the choir, a
development (strings, harp and celesta over a new progression, building with a snare roll), and the tutti
return; a boss cue is a driving ostinato with brass stabs, the Act's motif hammered out in the trumpets, and a
chromatic middle. The finale and the ending bring back the main theme; the failure is a slow lament. Original
melodies throughout.

    python3 scripts/rainbow-score/compose.py [cue ...]      # renders public/rainbow-princess-audio/*.mp3
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import synth as S  # noqa: E402

MAJOR = [0, 2, 4, 5, 7, 9, 11]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'rainbow-princess-audio')
PAD_SECONDS = 0.5


# ------------------------------------------------------------------ theory

def degree(token: str) -> int:
    """'5', 'b3', '#4', "1'" (octave up), '5,' (octave down) as semitones above the key root."""
    octave = token.count("'") - token.count(',')
    token = token.strip("',")
    shift = 0
    while token and token[0] in 'b#':
        shift += -1 if token[0] == 'b' else 1
        token = token[1:]
    d = int(token)
    return MAJOR[(d - 1) % 7] + 12 * ((d - 1) // 7) + shift + 12 * octave


ROMAN = {'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7}


def chord(symbol: str) -> list[int]:
    """'I', 'bVI', 'iv', 'V7', 'Isus' as semitones above the key root (root position triad)."""
    flat = 0
    while symbol and symbol[0] in 'b#':
        flat += -1 if symbol[0] == 'b' else 1
        symbol = symbol[1:]
    seventh = symbol.endswith('7')
    sus = symbol.endswith('sus')
    core = symbol.rstrip('7').replace('sus', '')
    root = MAJOR[ROMAN[core.lower()] - 1] + flat
    third = 4 if core.isupper() else 3
    tones = [root, root + (5 if sus else third), root + 7]
    if seventh:
        tones.append(root + 10)
    return tones


def melody(text: str) -> list[tuple[float, float, int | None]]:
    """'5:1 r:0.5 ...' as (beat, beats, semitones) notes."""
    notes, beat = [], 0.0
    for token in text.split():
        name, beats = token.split(':')
        beats = float(beats)
        notes.append((beat, beats, None if name == 'r' else degree(name)))
        beat += beats
    return notes


def minorize(text: str) -> str:
    """A major theme's degrees in the parallel minor (3, 6 and 7 flattened) for its boss."""
    out = []
    for token in text.split():
        if token == '|':
            out.append(token)
            continue
        name, beats = token.split(':')
        core = name.strip("',")
        if core in ('3', '6', '7'):
            name = name.replace(core, 'b' + core, 1)
        out.append(f'{name}:{beats}')
    return ' '.join(out)


# ------------------------------------------------------------------ the Acts' themes

@dataclass
class Theme:
    root: int            # key root, MIDI, octave 4
    bpm: int
    chords: list[list[str]]   # eight bars, one or two chords each
    tune: str            # eight bars of melody
    develop: list[list[str]]  # eight bars of the development
    ostinato: str = 'eighths'  # eighths | gallop | pulse | march | sixteenths
    drums: str = 'heroic'      # heroic | wonder | taiko | gallop | march | lament
    lead: str = 'horn'         # horn | strings | choir | celesta
    minor: bool = False
    extra: dict = field(default_factory=dict)


MAIN = Theme(
    root=62, bpm=132,
    chords=[['I'], ['IV'], ['vi'], ['V'], ['I'], ['bVI', 'bVII'], ['IV', 'V'], ['I']],
    tune="5,:0.5 1:0.5 5:2.5 4:0.25 3:0.25 | 4:1 6:1 1':2 | 7:0.5 6:0.5 5:1 3:2 | 2:1 3:0.5 4:0.5 5:2 | "
         "5,:0.5 1:0.5 5:2.5 4:0.25 3:0.25 | b6:1 1':1 b7:1 2':1 | 1':1 6:1 7:1 5:1 | 1':3 r:1",
    develop=[['vi'], ['IV'], ['I'], ['V'], ['bVI'], ['bVII'], ['IV'], ['Vsus', 'V']],
)

THEMES: dict[int, Theme] = {
    1: MAIN,
    2: Theme(
        root=64, bpm=108, minor=True,
        chords=[['i'], ['bVI'], ['bIII'], ['bVII'], ['i'], ['bVI'], ['IV'], ['V']],
        tune="5:2 b3:1 1:1 | b6:2 5:1 b3:1 | 5:1 b3:1 2:1 5,:1 | 4:3 r:1 | "
             "5:1 1':2 b7:1 | b6:1 5:1 b3:2 | 6:2 4:1 1':1 | 7:2 5:2",
        develop=[['bVI'], ['bVII'], ['IV'], ['IV'], ['bVI'], ['bVII'], ['bIII'], ['V']],
        ostinato='pulse', drums='wonder', lead='choir',
    ),
    3: Theme(
        root=60, bpm=138, minor=True,
        chords=[['i'], ['i'], ['bVI'], ['V'], ['i'], ['iv'], ['bII'], ['V']],
        tune="1:0.75 1:0.25 b3:0.5 1:0.5 5:2 | b6:0.5 5:0.5 b3:0.5 2:0.5 1:2 | 1':1 b6:1 b3:1 1:1 | 7,:1 2:1 5,:2 | "
             "1:0.75 1:0.25 b3:0.5 1:0.5 5:2 | 4:1 b6:1 1':2 | b2:1 4:1 b6:2 | 7,:2 5,:2",
        develop=[['bVI'], ['bII'], ['bVI'], ['V'], ['iv'], ['bII'], ['iv'], ['V']],
        ostinato='sixteenths', drums='taiko',
    ),
    4: Theme(
        root=57, bpm=152,
        chords=[['I'], ['bVII'], ['IV'], ['I'], ['I'], ['bVII'], ['IV'], ['V']],
        tune="5:0.5 5:0.5 1':1 5:1 3:1 | b7:1 2:1 4:1 2:1 | 4:1.5 6:0.5 1':2 | 5:1 3:1 1:2 | "
             "5:0.5 5:0.5 1':1 5:1 3:1 | b7:1 2':1 4':2 | 1':1 6:1 4:1 6:1 | 5:2 7:2",
        develop=[['vi'], ['IV'], ['bVII'], ['V'], ['vi'], ['IV'], ['bVI'], ['V']],
        ostinato='gallop', drums='gallop', extra={'octave': 12},
    ),
    5: Theme(
        root=53, bpm=120, minor=True,
        chords=[['i'], ['bVI'], ['iv'], ['V'], ['i'], ['bVI'], ['bVII'], ['i']],
        tune="5:2 b3:1 1:1 | b6:1.5 1':0.5 b6:1 5:1 | 4:1 b6:1 1':2 | 7:2 5:2 | "
             "5:1 b6:0.5 5:0.5 b3:2 | 1:1 b3:1 b6:2 | b7:1 2':1 4':2 | 1':3 r:1",
        develop=[['bVI'], ['bIII'], ['bVII'], ['iv'], ['bVI'], ['bIII'], ['iv'], ['V']],
        ostinato='pulse', drums='lament', extra={'octave': 12},
    ),
    6: Theme(
        root=58, bpm=126,
        chords=[['I'], ['iii'], ['IV'], ['I'], ['vi'], ['IV'], ['V'], ['I']],
        tune="5:2 3:1 1:1 | 3:2 5:1 7:1 | 6:2 4:1 1':1 | 5:3 r:1 | 3':2 1':1 6:1 | 1':1.5 6:0.5 4:2 | "
             "5:1 7:1 2':2 | 1':3 r:1",
        develop=[['IV'], ['V'], ['iii'], ['vi'], ['bVI'], ['bVII'], ['IV'], ['V']],
        ostinato='eighths', drums='heroic', extra={'octave': 12},
    ),
    7: Theme(
        root=66, bpm=116, minor=True,
        chords=[['i'], ['bVI'], ['bIII'], ['V'], ['i'], ['iv'], ['bVI'], ['V']],
        tune="1':1 5:1 b3:1 5:1 | b6:2 1':2 | b3:1 5:1 b7:2 | 7:2 2':2 | 5:1.5 b3:0.5 1:2 | 4:1 b6:1 1':2 | "
             "b6:1 1':1 b3':2 | 7:2 5:2",
        develop=[['bVI'], ['bIII'], ['bVII'], ['iv'], ['bVI'], ['bII'], ['iv'], ['V']],
        ostinato='pulse', drums='wonder', lead='celesta',
    ),
    8: Theme(
        root=62, bpm=112, minor=True,
        chords=[['i'], ['bVI'], ['i'], ['bVI'], ['iv'], ['bII'], ['V'], ['i']],
        tune="5,:1 1:0.75 1:0.25 b3:1 1:1 | b6:1.5 1':0.5 b3':2 | 5:1 4:0.5 b3:0.5 1:2 | b6,:1 1:1 b3:2 | "
             "4:1.5 b6:0.5 1':2 | b2':2 b6:1 4:1 | 5:1 7:1 2':2 | 1':3 r:1",
        develop=[['bVI'], ['bII'], ['iv'], ['V'], ['bVI'], ['bVII'], ['bII'], ['V']],
        ostinato='march', drums='march',
    ),
}
THEMES[9] = Theme(**{**MAIN.__dict__, 'bpm': 136, 'extra': {'finale': True}})


# ------------------------------------------------------------------ arranging

class Arranger:
    def __init__(self, theme: Theme, bars: int, bpm: int | None = None):
        self.t = theme
        self.bpm = bpm or theme.bpm
        self.beat = 60 / self.bpm
        self.bar = 4 * self.beat
        self.length = bars * self.bar
        self.mix = S.Mix(self.length)

    def at(self, bar: float, beat: float = 0) -> float:
        return bar * self.bar + beat * self.beat

    def tones(self, symbol: str, center: int) -> list[int]:
        """A chord voiced close around `center`."""
        notes = []
        for tone in S_chord(symbol):
            midi = self.t.root + tone
            while midi < center - 6:
                midi += 12
            while midi > center + 6:
                midi -= 12
            notes.append(midi)
        return sorted(notes)

    def bass_root(self, symbol: str) -> int:
        midi = self.t.root + S_chord(symbol)[0]
        while midi > 50:
            midi -= 12
        while midi < 38:
            midi += 12
        return midi

    # --- layers over a run of bars, `chords` one list per bar
    def pad(self, bar0: int, chords: list[list[str]], stem='strings', level=0.5, center=64, choir=False):
        for i, bar_chords in enumerate(chords):
            span = 4 / len(bar_chords)
            for j, symbol in enumerate(bar_chords):
                start = self.at(bar0 + i, j * span)
                dur = span * self.beat
                for midi in self.tones(symbol, center):
                    if choir:
                        self.mix.add('choir', start, stereo=S.choir(midi, dur), gain=level)
                    else:
                        self.mix.add(stem, start, stereo=S.string_section(midi, dur, attack=0.3, vib=5), gain=level)
                bass = self.bass_root(symbol)
                self.mix.add('low', start, S.bass_note(bass, dur), gain=level * 0.9)

    def ostinato(self, bar0: int, chords: list[list[str]], style: str, level=0.45):
        for i, bar_chords in enumerate(chords):
            span = 4 / len(bar_chords)
            for j, symbol in enumerate(bar_chords):
                root = self.bass_root(symbol)
                fifth = root + 7
                start_beat = j * span
                if style == 'eighths':
                    pattern = [(k * 0.5, 0.45, root if k % 2 == 0 else root + 12) for k in range(int(span * 2))]
                elif style == 'sixteenths':
                    pattern = [(k * 0.25, 0.22, root if k % 4 else root + 12) for k in range(int(span * 4))]
                elif style == 'gallop':
                    pattern = []
                    for k in range(int(span)):
                        pattern += [(k, 0.45, root), (k + 0.5, 0.22, root), (k + 0.75, 0.22, fifth)]
                elif style == 'march':
                    pattern = []
                    for k in range(int(span)):
                        pattern += [(k, 0.6, root)] if k % 2 == 0 else [(k, 0.3, fifth), (k + 0.75, 0.2, fifth)]
                else:  # pulse: long bowed roots
                    pattern = [(0, span * 0.95, root)]
                for beat, beats, midi in pattern:
                    staccato = style != 'pulse'
                    self.mix.add('low', self.at(bar0 + i, start_beat + beat),
                                 S.bass_note(midi, beats * self.beat, staccato=staccato), gain=level)
                # Violins on spiccato chord tones above the basses (not under a slow pulse).
                if style in ('eighths', 'sixteenths', 'gallop'):
                    tones = self.tones(symbol, 70)
                    step = 0.5 if style != 'sixteenths' else 0.25
                    for k in range(int(span / step)):
                        midi = tones[k % len(tones)] if k % 4 != 3 else tones[1]
                        self.mix.add('strings', self.at(bar0 + i, start_beat + k * step),
                                     stereo=S.string_section(midi, step * self.beat * 0.6, voices=3, attack=0.01,
                                                             release=0.09, vib=0),
                                     gain=level * 0.55)

    def tune(self, bar0: int, text: str, lead: str, octave=0, level=0.8):
        for beat, beats, semis in melody(text.replace('|', ' ')):
            if semis is None:
                continue
            midi = self.t.root + semis + octave
            at = self.at(bar0, beat)
            dur = beats * self.beat
            if lead == 'horn':
                self.mix.add('brass', at, S.brass(midi, dur, vel=0.9, bright=0.6), pan=-0.2, gain=level)
            elif lead == 'trumpet':
                self.mix.add('brass', at, S.brass(midi, dur, vel=1.0, bright=1.3), pan=0.15, gain=level * 0.8)
            elif lead == 'strings':
                self.mix.add('strings', at, stereo=S.string_section(midi, dur, attack=0.08, bright=12), gain=level)
            elif lead == 'choir':
                self.mix.add('choir', at, stereo=S.choir(midi, dur, attack=0.2), gain=level)
            elif lead == 'celesta':
                self.mix.add('keys', at, S.celesta(midi), pan=0.25, gain=level * 0.9)
                self.mix.add('strings', at, stereo=S.string_section(midi - 12, dur, attack=0.05, vib=8), gain=level * 0.5)

    def arpeggio(self, bar0: int, chords: list[list[str]], instrument='harp', level=0.35, center=76):
        for i, bar_chords in enumerate(chords):
            span = 4 / len(bar_chords)
            for j, symbol in enumerate(bar_chords):
                tones = self.tones(symbol, center)
                seq = tones + [tones[0] + 12] + tones[::-1][1:]
                for k in range(int(span * 2)):
                    midi = seq[k % len(seq)]
                    at = self.at(bar0 + i, j * span + k * 0.5)
                    if instrument == 'harp':
                        self.mix.add('keys', at, S.pluck(midi), pan=0.35 if k % 2 else -0.35, gain=level)
                    elif instrument == 'shimmer':
                        self.mix.add('keys', at, S.synth_arp(midi + 12), pan=0.5 if k % 2 else -0.5, gain=level * 0.6)
                    else:
                        self.mix.add('keys', at, S.celesta(midi + 12), pan=0.3, gain=level)

    def drums(self, bar0: int, bars: int, style: str, chords: list[list[str]], level=0.7, crash=True):
        if crash:
            self.mix.add('perc', self.at(bar0), stereo=(S.cymbal(0.5), S.cymbal(0.5)), gain=level)
        for i in range(bars):
            root = self.bass_root(chords[i % len(chords)][0])
            timp = root if root >= 41 else root + 12
            b = bar0 + i
            if style == 'heroic':
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.9), gain=level)
                self.mix.add('perc', self.at(b, 2), S.timpani(timp + 7 if timp + 7 < 56 else timp - 5, 0.6), gain=level)
                for beat in (1, 3):
                    self.mix.add('perc', self.at(b, beat), S.snare(0.5), pan=0.15, gain=level)
            elif style == 'wonder':
                if i % 2 == 0:
                    self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.45), gain=level)
                if i % 4 == 3:
                    self.mix.add('perc', self.at(b, 0), stereo=(S.cymbal(0.35, length=self.bar, swell=True),) * 2,
                                 gain=level)
            elif style == 'taiko':
                for beat, vel in ((0, 1.0), (1.5, 0.7), (2, 0.9), (3.5, 0.7)):
                    self.mix.add('perc', self.at(b, beat), S.taiko(vel), gain=level)
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.7), gain=level * 0.8)
            elif style == 'gallop':
                for k in range(8):
                    self.mix.add('perc', self.at(b, k * 0.5), S.snare(0.55 if k % 2 == 0 else 0.3), pan=0.15,
                                 gain=level * 0.8)
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.8), gain=level)
                self.mix.add('perc', self.at(b, 2), S.taiko(0.6), gain=level)
            elif style == 'march':
                for beat in (0, 2):
                    self.mix.add('perc', self.at(b, beat), S.taiko(0.8), gain=level)
                for beat, vel in ((1, 0.6), (1.75, 0.35), (3, 0.6), (3.5, 0.35), (3.75, 0.45)):
                    self.mix.add('perc', self.at(b, beat), S.snare(vel), pan=0.15, gain=level)
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.6), gain=level)
            elif style == 'lament':
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.6), gain=level)
                self.mix.add('perc', self.at(b, 3), S.celesta(96, length=0.6), pan=0.4, gain=level * 0.35)
            elif style == 'boss':
                for beat in (0, 0.75, 1.5, 2, 2.75, 3.5):
                    self.mix.add('perc', self.at(b, beat), S.taiko(0.9 if beat in (0, 2) else 0.6), gain=level)
                for k in range(16):
                    self.mix.add('perc', self.at(b, k * 0.25), S.snare(0.35 if k % 4 else 0.6), pan=0.1,
                                 gain=level * 0.6)
                self.mix.add('perc', self.at(b, 0), S.timpani(timp, 0.9), gain=level)

    def roll(self, bar: int, beats=4.0, level=0.6, timp=45):
        """A timpani roll that swells into the next bar, under a cymbal swell."""
        steps = int(beats * 4)
        for k in range(steps):
            self.mix.add('perc', self.at(bar, k * 0.25), S.timpani(timp, 0.25 + 0.65 * k / steps, length=0.6),
                         gain=level)
        swell = S.cymbal(0.5, length=beats * self.beat, swell=True)
        self.mix.add('perc', self.at(bar), stereo=(swell, swell), gain=level)

    def fanfare(self, bar0: int, symbol: str, level=0.7):
        """Two bars of brass calls on the tonic, a timpani roll under the second."""
        rhythm = [(0, 0.75), (0.75, 0.25), (1, 1.5), (3, 0.5), (3.5, 0.5)]
        for bar in (0, 1):
            for beat, beats in rhythm:
                for midi in self.tones(symbol, 62 if bar == 0 else 67):
                    self.mix.add('brass', self.at(bar0 + bar, beat), S.brass(midi, beats * self.beat, vel=0.9,
                                 bright=1.0), pan=-0.1, gain=level * 0.45)
        self.mix.add('low', self.at(bar0), S.bass_note(self.bass_root(symbol), 2 * self.bar), gain=0.6)
        self.roll(bar0 + 1, level=0.5, timp=self.bass_root(symbol) + 12 if self.bass_root(symbol) < 41 else
                  self.bass_root(symbol))


def S_chord(symbol: str) -> list[int]:
    return chord(symbol)


# ------------------------------------------------------------------ cues

def flight(theme: Theme) -> S.Mix:
    a = Arranger(theme, bars=34)
    octave = theme.extra.get('octave', 0)
    lead = theme.lead
    tonic = theme.chords[0][0]
    finale = theme.extra.get('finale', False)
    # Intro: the fanfare.
    a.fanfare(0, tonic)
    # A: the theme over the ostinato.
    a.pad(2, theme.chords, level=0.35)
    a.ostinato(2, theme.chords, theme.ostinato)
    a.tune(2, theme.tune, lead if lead != 'horn' else 'horn', octave=octave - (12 if lead == 'choir' else 0))
    a.drums(2, 8, theme.drums, theme.chords, level=0.55)
    if finale:
        a.pad(2, theme.chords, level=0.3, center=60, choir=True)
    # A2: an octave up on trumpets and violins, with the choir and a shimmer of arpeggios.
    a.pad(10, theme.chords, level=0.3)
    a.pad(10, theme.chords, level=0.32, center=60, choir=True)
    a.ostinato(10, theme.chords, theme.ostinato)
    a.tune(10, theme.tune, 'trumpet' if lead == 'horn' else lead, octave=octave)
    a.tune(10, theme.tune, 'strings', octave=octave + 12, level=0.35)
    a.arpeggio(10, theme.chords, 'shimmer' if theme.root == 62 and not theme.minor else 'harp', level=0.3)
    a.drums(10, 8, theme.drums, theme.chords, level=0.65)
    # B: the development, quieter, strings and harp over new chords, then a roll into the return.
    a.pad(18, theme.develop, level=0.45, center=67)
    a.pad(22, theme.develop[4:], level=0.3, center=60, choir=True)
    a.arpeggio(18, theme.develop, 'harp', level=0.32)
    a.arpeggio(22, theme.develop[4:], 'celesta', level=0.22)
    a.ostinato(22, theme.develop[4:], theme.ostinato, level=0.35)
    a.drums(18, 7, 'wonder' if theme.drums not in ('march', 'taiko') else theme.drums, theme.develop, level=0.4,
            crash=False)
    a.roll(25, level=0.55, timp=a.bass_root(theme.develop[-1][0]) + 12)
    # A3: tutti. Horns and trumpets in octaves, the choir doubling, the full kit.
    a.pad(26, theme.chords, level=0.35)
    a.pad(26, theme.chords, level=0.38, center=62, choir=True)
    a.ostinato(26, theme.chords, theme.ostinato, level=0.5)
    a.tune(26, theme.tune, 'horn', octave=octave - 12 if octave else 0, level=0.8)
    a.tune(26, theme.tune, 'trumpet', octave=octave + (0 if octave else 12) - (12 if theme.root >= 64 else 0),
           level=0.7)
    a.tune(26, theme.tune, 'choir', octave=octave - (12 if theme.root >= 62 else 0), level=0.4)
    a.arpeggio(26, theme.chords, 'harp', level=0.25)
    a.drums(26, 8, theme.drums, theme.chords, level=0.75)
    return a.mix


def boss(theme: Theme, bpm_lift=16) -> S.Mix:
    tune = theme.tune if theme.minor else minorize(theme.tune)
    bars = tune.split('|')
    motif = ' '.join(bars[:2])
    first, second = theme.chords[0][0], theme.chords[1][0]
    if not theme.minor:
        first = first.lower() if first == 'I' else first
        second = {'IV': 'iv', 'I': 'i', 'bVII': 'bVII', 'iii': 'bIII'}.get(second, second.lower())
    chords_a = [[first], [second], [first], [second], ['bVI'], ['bVII'], ['iv'], ['V']]
    chords_b = [['i'], ['bII'], ['i'], ['bII'], ['bVI'], ['bVII'], ['V'], ['V']]
    a = Arranger(theme, bars=26, bpm=theme.bpm + bpm_lift)
    tonic = 'i'
    # Intro: tutti stabs on the tonic.
    for bar in (0, 1):
        for beat in (0, 0.75, 1.5, 3):
            for midi in a.tones(tonic, 60):
                a.mix.add('brass', a.at(bar, beat), S.brass(midi, 0.3 * a.beat, vel=1.0, bright=1.2), gain=0.35)
            a.mix.add('perc', a.at(bar, beat), S.taiko(1.0), gain=0.7)
    a.roll(1, level=0.5, timp=a.bass_root(tonic))
    # A: the ostinato, the motif hammered in the trumpets, stabs.
    a.ostinato(2, chords_a, 'sixteenths', level=0.5)
    a.pad(2, chords_a, level=0.28)
    a.tune(2, motif, 'trumpet', octave=0)
    a.tune(6, motif, 'trumpet', octave=12, level=0.7)
    a.tune(6, motif, 'horn', octave=0, level=0.7)
    a.drums(2, 8, 'boss', chords_a, level=0.6)
    stabs(a, 2, chords_a)
    # B: the chromatic middle, choir stabs over the ostinato.
    a.ostinato(10, chords_b, 'sixteenths', level=0.45)
    a.pad(10, chords_b, level=0.4, center=60, choir=True)
    a.arpeggio(10, chords_b, 'shimmer', level=0.25)
    a.drums(10, 7, 'taiko', chords_b, level=0.55)
    a.roll(17, level=0.6, timp=a.bass_root('V'))
    # A': everything.
    a.ostinato(18, chords_a, 'sixteenths', level=0.55)
    a.pad(18, chords_a, level=0.35, center=62, choir=True)
    a.tune(18, motif, 'trumpet', octave=12, level=0.75)
    a.tune(18, motif, 'horn', octave=0, level=0.75)
    a.tune(22, motif, 'trumpet', octave=12, level=0.75)
    a.tune(22, motif, 'choir', octave=0, level=0.45)
    a.drums(18, 8, 'boss', chords_a, level=0.7)
    stabs(a, 18, chords_a)
    return a.mix


def stabs(a: Arranger, bar0: int, chords: list[list[str]]):
    for i, bar_chords in enumerate(chords):
        for beat in (0, 1.5, 3):
            for midi in a.tones(bar_chords[0], 58):
                a.mix.add('brass', a.at(bar0 + i, beat), S.brass(midi, 0.35 * a.beat, vel=0.9, bright=0.8),
                          pan=-0.3, gain=0.25)


def ending() -> S.Mix:
    theme = Theme(**{**MAIN.__dict__, 'bpm': 88})
    a = Arranger(theme, bars=18)
    a.pad(0, [['I'], ['IV']], level=0.4)
    a.arpeggio(0, [['I'], ['IV']], 'harp', level=0.35)
    a.pad(2, theme.chords, level=0.4)
    a.ostinato(2, theme.chords, 'pulse', level=0.35)
    a.tune(2, theme.tune, 'horn', level=0.75)
    a.arpeggio(2, theme.chords, 'harp', level=0.3)
    a.drums(2, 8, 'wonder', theme.chords, level=0.4, crash=False)
    a.pad(10, theme.chords, level=0.38)
    a.pad(10, theme.chords, level=0.36, center=60, choir=True)
    a.tune(10, theme.tune, 'strings', octave=12, level=0.55)
    a.tune(10, theme.tune, 'choir', level=0.35)
    a.arpeggio(10, theme.chords, 'celesta', level=0.2)
    a.drums(10, 8, 'wonder', theme.chords, level=0.45, crash=True)
    return a.mix


def failure() -> S.Mix:
    theme = Theme(
        root=62, bpm=70, minor=True,
        chords=[['i'], ['bVI'], ['iv'], ['V'], ['i'], ['bVI'], ['bVII'], ['i']],
        tune="5:2 b3:1 1:1 | b6:3 5:1 | 4:2 b3:1 1:1 | 7,:3 r:1 | 5:2 b6:1 5:1 | b3:3 1:1 | 2:1 4:1 b7:2 | 1:3 r:1",
        develop=[],
    )
    a = Arranger(theme, bars=8)
    a.pad(0, theme.chords, level=0.4)
    a.pad(0, theme.chords, level=0.25, center=60, choir=True)
    a.tune(0, theme.tune, 'strings', octave=-12, level=0.7)
    for i in range(0, 8, 2):
        a.mix.add('perc', a.at(i), S.timpani(a.bass_root(theme.chords[i][0]) + 12, 0.35), gain=0.5)
    return a.mix


def guardian() -> S.Mix:
    theme = Theme(**{**THEMES[3].__dict__, 'root': 55, 'bpm': 128})
    return boss(theme, bpm_lift=16)


CUES = {
    **{f'act{n}-flight': (lambda n=n: flight(THEMES[n])) for n in range(1, 10)},
    **{f'act{n}-boss': (lambda n=n: boss(THEMES[n])) for n in range(1, 10)},
    'guardian': guardian,
    'ending': ending,
    'failure': failure,
}

LEVELS = {'strings': 1.0, 'brass': 0.95, 'choir': 0.8, 'keys': 0.75, 'low': 0.5, 'perc': 0.65}


def render(cue: str) -> dict:
    mix = CUES[cue]()
    loop = mix.render(LEVELS)
    pad = int(PAD_SECONDS * S.SR)
    # The file is periodic around the loop, so a decoder's start offset can never put a seam in it.
    body = np.concatenate([loop[:, -pad:], loop, loop[:, :pad]], axis=1)
    pcm = (np.clip(body, -1, 1) * 32767).astype('<i2').T.tobytes()
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f'{cue}.mp3')
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(S.SR), '-ac', '2', '-i', 'pipe:0',
         '-c:a', 'libmp3lame', '-b:a', '112k', path],
        input=pcm, check=True,
    )
    return {'id': cue, 'path': f'/rainbow-princess-audio/{cue}.mp3', 'seconds': round(mix.length, 3),
            'loopStart': PAD_SECONDS, 'loopEnd': round(PAD_SECONDS + mix.length, 4)}


def loops() -> dict:
    """Every cue's loop, without rendering: its bars at its tempo."""
    out = {}
    for n in range(1, 10):
        out[f'act{n}-flight'] = 34 * 240 / THEMES[n].bpm
        out[f'act{n}-boss'] = 26 * 240 / (THEMES[n].bpm + 16)
    out['guardian'] = 26 * 240 / (128 + 16)
    out['ending'] = 18 * 240 / 88
    out['failure'] = 8 * 240 / 70
    return {cue: {'seconds': round(sec, 3), 'loopStart': PAD_SECONDS, 'loopEnd': round(PAD_SECONDS + sec, 4)}
            for cue, sec in out.items()}


if __name__ == '__main__':
    if sys.argv[1:] == ['--loops']:
        print(json.dumps(loops(), indent=2))
        sys.exit(0)
    cues = sys.argv[1:] or list(CUES)
    with ProcessPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(render, cues))
    for r in results:
        print(json.dumps(r))
