# Wedding music — A Little Closer

An original instrumental arrangement created for Mingyu and Kristie's invitation: fingerpicked nylon-string guitar accompaniment and a separate guitar melody, with gentle timing and velocity variation. It does not reproduce the melody or arrangement of “Can't Take My Eyes Off You.” No vocals or commercial recording are included.

The composition, rendering source (`music-source.py`), and rendered `wedding-acoustic.mp3` are distributed under GPL-2.0-only. See `MUSIC-LICENSE.txt`.

## Instrument samples

Rendered using FluidSynth and the nylon-string acoustic guitar instrument in TimGM6mb:

- TimGM6mb SoundFont, copyright 2004 Tim Brechbill; 2010 David Bolton.
- License: GPL-2.0-only.
- Upstream reference: https://github.com/musescore/musescore-old/commit/90c33ef9d87b3f5ff92efd3b07d89eb455fb1fef
- Debian source package, including the SoundFont and its licensing information: https://packages.debian.org/source/timgm6mb-soundfont

The SoundFont itself is not bundled with this website. The track uses instrument samples rather than a live guitar performance.

## Reproduce the audio

Install Python 3, NumPy, libfluidsynth, FFmpeg, and the `timgm6mb-soundfont` package, then run:

```sh
python3 music-source.py /usr/share/sounds/sf2/TimGM6mb.sf2 /tmp/wedding-acoustic.wav
ffmpeg -i /tmp/wedding-acoustic.wav -af loudnorm=I=-18:TP=-2:LRA=8 -c:a libmp3lame -b:a 128k wedding-acoustic.mp3
```

The renderer uses a fixed random seed. FluidSynth versions may produce slightly different sample output.
