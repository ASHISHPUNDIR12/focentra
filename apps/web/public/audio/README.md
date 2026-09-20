# Room sound loops

These six original synthesized loops were created for Focentra. They contain no
third-party recordings, samples, or commercial songs. `jazz.mp3` uses an original
keyboard melody over a Cmaj9 / Am9 / Dm9 / G13 progression, bass, and soft percussion.
The nature options are synthesized soundscapes rather than field recordings.

Regenerate all assets with Python 3 and ffmpeg:

```sh
python3 apps/web/scripts/generate-room-audio.py
```

Each bundled MP3 is 32 seconds, mono, 22.05 kHz, and 96 kbps. The player loops the
files and uses the room's persisted start time to align new listeners. Personal
mute and volume do not alter the room's selection.
