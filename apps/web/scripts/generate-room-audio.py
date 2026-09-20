"""Render original, deterministic room sound loops. Requires Python 3 and ffmpeg.
Run from any directory. No external recordings or licensed music are used.
"""
from array import array
from math import sin, pi, exp
from pathlib import Path
import random
import subprocess
import tempfile
import wave

RATE = 22050
SECONDS = 32  # eight bars at 60 BPM
SIZE = RATE * SECONDS
OUT = Path(__file__).resolve().parents[1] / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def tone(samples, start, duration, frequency, gain, kind="keys"):
    offset = int(start * RATE)
    for j in range(int(duration * RATE)):
        t = j / RATE
        envelope = min(1, t / .015) * exp(-t * (2.1 if kind == "keys" else 3.5))
        envelope *= min(1, (duration - t) / .08)
        phase = 2 * pi * frequency * t
        sound = sin(phase) + (.28 * sin(2 * phase) + .08 * sin(3 * phase) if kind == "keys" else .1 * sin(2 * phase))
        samples[(offset + j) % SIZE] += gain * envelope * sound


def render(name):
    rng = random.Random(2026 + sum(map(ord, name)))
    data = array("f", [0]) * SIZE
    low = 0
    slow = 0
    previous = 0
    for i in range(SIZE):
        t = i / RATE
        noise = rng.uniform(-1, 1)
        low = .94 * low + .06 * noise
        slow = .995 * slow + .005 * noise
        high = noise - previous
        previous = noise
        if name == "rain":
            data[i] = .19 * noise + .55 * low
        elif name == "bonfire":
            data[i] = .45 * low + 1.1 * slow
        elif name == "ocean":
            swell = .2 + .8 * ((1 + sin(2 * pi * t / 8)) / 2) ** 2
            data[i] = swell * (.12 * noise + .9 * low)
        elif name == "forest":
            data[i] = .22 * low * (.7 + .3 * sin(2 * pi * t / 16))
        elif name == "brown-noise":
            data[i] = 2.2 * slow
        elif name == "jazz":
            # Quiet swung brushes, snare and kick under the harmony.
            beat = t % 1
            offbeat = (t - .66) % 1
            brush = .018 * high * (exp(-beat * 38) + .65 * exp(-offbeat * 45))
            kick = .065 * sin(2 * pi * 56 * beat) * exp(-beat * 19) if int(t) % 2 == 0 else 0
            snare = .025 * noise * exp(-beat * 25) if int(t) % 2 else 0
            data[i] = brush + kick + snare
    if name == "bonfire":
        for _ in range(115):
            start = rng.randrange(SIZE)
            length = rng.randint(150, 2400)
            gain = rng.uniform(.025, .19)
            for j in range(length):
                data[(start + j) % SIZE] += gain * rng.uniform(-1, 1) * exp(-j / (length / 7))
    if name == "forest":
        for _ in range(35):
            start = rng.randrange(SIZE)
            length = rng.randint(1800, 5500)
            freq = rng.uniform(1600, 3100)
            for j in range(length):
                t = j / RATE
                data[(start + j) % SIZE] += .045 * sin(pi * j / length) ** 2 * sin(2 * pi * (freq * t + 950 * t * t))
    if name == "jazz":
        # Original Cmaj9 / Am9 / Dm9 / G13 progression, with a sparse melody.
        chords = [(48, 55, 59, 62, 64), (45, 52, 55, 59, 60), (50, 57, 60, 64, 65), (43, 53, 57, 59, 64)] * 2
        melody = [76, 74, 71, 69, 72, 71, 67, 69, 69, 72, 76, 74, 71, 69, 67, 74]
        hz = lambda note: 440 * 2 ** ((note - 69) / 12)
        for bar, chord in enumerate(chords):
            for note in chord[1:]:
                tone(data, bar * 4 + .04, 3.8, hz(note), .045)
                tone(data, bar * 4 + 2.66, 1.3, hz(note), .018)
            for beat, note in enumerate([chord[0] - 12, chord[0], chord[0] - 5, chord[0] - 12]):
                tone(data, bar * 4 + beat, .95, hz(note), .105, "bass")
            tone(data, bar * 4 + .66, 1.6, hz(melody[bar * 2]), .045)
            tone(data, bar * 4 + 2, 1.8, hz(melody[bar * 2 + 1]), .04)
    # Gentle seam fade avoids clicks without interrupting the loop's cadence.
    fade = int(.015 * RATE)
    for i in range(fade):
        data[i] *= i / fade
        data[-i - 1] *= i / fade
    peak = max(abs(value) for value in data) or 1
    gain = min(1.7, .8 / peak)
    pcm = array("h", (int(max(-1, min(1, value * gain)) * 32767) for value in data))
    with tempfile.TemporaryDirectory(prefix="focentra-audio-") as temp:
        wav = Path(temp) / "loop.wav"
        with wave.open(str(wav), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(RATE)
            output.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "96k", str(OUT / f"{name}.mp3")], check=True)
    print(f"Rendered {name}")


if __name__ == "__main__":
    for name in ["bonfire", "rain", "jazz", "ocean", "forest", "brown-noise"]:
        render(name)
