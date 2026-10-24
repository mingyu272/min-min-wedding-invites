"""Render the original 'A Little Closer' acoustic guitar arrangement.

Requires Python 3, NumPy, libfluidsynth, and TimGM6mb.sf2.
Usage: python3 music-source.py /path/to/TimGM6mb.sf2 /tmp/wedding-acoustic.wav
This composition, rendering source, and distributed rendered audio: GPL-2.0-only.
See MUSIC-CREDITS.md and MUSIC-LICENSE.txt.
"""
import ctypes as C
import ctypes.util
import sys
import wave
import numpy as np

RATE = 44100
BEAT = 60 / 84
rng = np.random.default_rng(6122027)
events = []

def note(channel, pitch, start, duration, velocity):
    start = max(0, start)
    events.append((round(start * RATE), True, channel, pitch, velocity))
    events.append((round((start + duration) * RATE), False, channel, pitch, 0))

# Guitar-friendly voicings and a newly composed melody; no borrowed song melody.
chords = [
    (48, [55, 60, 64, 67]), (47, [55, 59, 62, 67]),
    (45, [57, 60, 64, 69]), (40, [55, 59, 64, 67]),
    (41, [53, 57, 60, 65]), (40, [55, 60, 64, 67]),
    (50, [57, 62, 65, 69]), (43, [55, 59, 62, 67]),
]
melody = [
    [(67, 0, .8), (72, 1, .8), (71, 2, .4), (69, 2.5, .4), (67, 3, .8)],
    [(74, .5, 1.2), (71, 2, .8), (67, 3, .8)],
    [(69, 0, 1.2), (72, 1.5, .4), (76, 2, .8), (72, 3, .8)],
    [(71, 0, .8), (67, 1, .8), (64, 2, 1.6)],
    [(69, 0, .8), (72, 1, .4), (74, 1.5, .4), (77, 2, 1.5)],
    [(76, 0, 1.2), (72, 1.5, .4), (67, 2, .8), (64, 3, .8)],
    [(65, 0, .8), (69, 1, .8), (74, 2, 1.2), (72, 3.5, .3)],
    [(71, 0, .8), (69, 1, .8), (67, 2, 1.6)],
]
bridge = [
    (41, [53, 57, 60, 65], [(72, 0, 1.2), (69, 1.5, .4), (65, 2, 1.5)]),
    (45, [57, 60, 64, 69], [(64, 0, .8), (69, 1, .8), (72, 2, 1.5)]),
    (50, [57, 62, 65, 69], [(74, 0, 1.2), (72, 1.5, .4), (69, 2, 1.5)]),
    (43, [55, 59, 62, 67], [(71, 0, .8), (74, 1, .8), (67, 2, 1.5)]),
]
for bar in range(24):
    base = bar * 4 * BEAT
    if bar < 2:
        bass, tones = chords[0 if bar == 0 else 7]
        lead = []
    elif bar < 10:
        bass, tones = chords[bar - 2]
        lead = melody[bar - 2]
    elif bar < 14:
        bass, tones, lead = bridge[bar - 10]
    elif bar < 22:
        bass, tones = chords[bar - 14]
        lead = melody[bar - 14]
    else:
        bass, tones = chords[7 if bar == 22 else 0]
        lead = [(67 if bar == 22 else 72, 0, 3.4)]
    note(1, bass, base, 1.7 * BEAT, 58)
    if bar != 23:
        note(1, bass + 7, base + 2 * BEAT, 1.5 * BEAT, 49)
    for i, tone in enumerate([tones[0], tones[2], tones[1], tones[3], tones[0], tones[2], tones[1], tones[2]]):
        if bar == 23 and i > 2:
            continue
        note(1, tone, base + i * .5 * BEAT + rng.uniform(.003, .018),
             .42 * BEAT, int(rng.integers(40, 53)))
    for pitch, onset, length in lead:
        note(0, pitch, base + onset * BEAT + .012, length * BEAT,
             int(rng.integers(69, 82)))
    if bar == 23:
        for i, pitch in enumerate([48, 55, 60, 64, 67]):
            note(1, pitch, base + 2 * BEAT + i * .025, 2.2 * BEAT, 48)

lib = C.CDLL(ctypes.util.find_library('fluidsynth'))
def bind(name, restype, args):
    f = getattr(lib, name)
    f.restype, f.argtypes = restype, args
    return f
ptr = C.c_void_p
settings = bind('new_fluid_settings', ptr, [])()
setnum = bind('fluid_settings_setnum', C.c_int, [ptr, C.c_char_p, C.c_double])
setint = bind('fluid_settings_setint', C.c_int, [ptr, C.c_char_p, C.c_int])
for key, value in [(b'synth.sample-rate', RATE), (b'synth.gain', .55),
                   (b'synth.reverb.room-size', .35), (b'synth.reverb.damp', .5),
                   (b'synth.reverb.level', .18), (b'synth.reverb.width', 25)]:
    assert setnum(settings, key, value) >= 0
setint(settings, b'synth.chorus.active', 0)
synth = bind('new_fluid_synth', ptr, [ptr])(settings)
assert bind('fluid_synth_sfload', C.c_int, [ptr, C.c_char_p, C.c_int])(synth, sys.argv[1].encode(), 1) >= 0
program = bind('fluid_synth_program_change', C.c_int, [ptr, C.c_int, C.c_int])
control = bind('fluid_synth_cc', C.c_int, [ptr, C.c_int, C.c_int, C.c_int])
for channel, pan in [(0, 58), (1, 72)]:
    program(synth, channel, 24)  # General MIDI nylon-string acoustic guitar.
    control(synth, channel, 10, pan)
noteon = bind('fluid_synth_noteon', C.c_int, [ptr, C.c_int, C.c_int, C.c_int])
noteoff = bind('fluid_synth_noteoff', C.c_int, [ptr, C.c_int, C.c_int])
render = bind('fluid_synth_write_float', C.c_int, [ptr, C.c_int, ptr, C.c_int, C.c_int, ptr, C.c_int, C.c_int])
end = round((24 * 4 * BEAT + 4) * RATE)
audio = np.zeros((end, 2), dtype=np.float32)
def fill(start, stop):
    for pos in range(start, stop, 4096):
        n = min(4096, stop - pos)
        left = np.zeros(n, dtype=np.float32)
        right = np.zeros(n, dtype=np.float32)
        assert render(synth, n, left.ctypes.data, 0, 1, right.ctypes.data, 0, 1) == 0
        audio[pos:pos+n, 0] = left
        audio[pos:pos+n, 1] = right
cursor = 0
for frame, on, channel, pitch, velocity in sorted(events):
    fill(cursor, frame)
    (noteon(synth, channel, pitch, velocity) if on else noteoff(synth, channel, pitch))
    cursor = frame
fill(cursor, end)
audio[:RATE] *= np.linspace(0, 1, RATE)[:, None]
audio[-3*RATE:] *= np.linspace(1, 0, 3*RATE)[:, None]
with wave.open(sys.argv[2], 'wb') as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(RATE)
    out.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
bind('delete_fluid_synth', None, [ptr])(synth)
bind('delete_fluid_settings', None, [ptr])(settings)
print(f'Rendered {end / RATE:.1f} seconds of original sampled acoustic guitar.')
