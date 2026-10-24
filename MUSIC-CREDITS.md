# Wedding music — An Evening Together

An original instrumental arrangement created for Mingyu and Kristie's invitation: a gentle acoustic piano melody and broken-chord accompaniment, with varied timing and velocity. It does not reproduce the melody or arrangement of “Can't Take My Eyes Off You.” No vocals or commercial recording are included.

The composition, rendering source (`music-source.py`), and rendered `wedding-original.mp3` are distributed under GPL-2.0-only. See `MUSIC-LICENSE.txt`.

## Instrument samples

Rendered using FluidSynth and the acoustic grand piano instrument in TimGM6mb:

- TimGM6mb SoundFont, copyright 2004 Tim Brechbill; 2010 David Bolton.
- License: GPL-2.0-only.
- Upstream reference: https://github.com/musescore/musescore-old/commit/90c33ef9d87b3f5ff92efd3b07d89eb455fb1fef
- Debian source package, including the SoundFont and its licensing information: https://packages.debian.org/source/timgm6mb-soundfont

The SoundFont itself is not bundled with this website. The track uses instrument samples rather than a live piano performance.

## Reproduce the audio

Install Python 3, NumPy, libfluidsynth, FFmpeg, and the `timgm6mb-soundfont` package, then run:

```sh
python3 music-source.py /usr/share/sounds/sf2/TimGM6mb.sf2 /tmp/wedding-original.wav
ffmpeg -i /tmp/wedding-original.wav -af 'lowpass=f=6500,loudnorm=I=-19:TP=-2:LRA=9' -c:a libmp3lame -b:a 128k wedding-original.mp3
```

The renderer uses a fixed random seed. FluidSynth versions may produce slightly different sample output.
