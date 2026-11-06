"""MAIM campaign sound beds. Every sound is synthesised here with numpy: no samples, no third-party music,
no voice. Deterministic (fixed seeds). Events are keyed to each composition's frame timings (30 fps).
Usage: python3 audio/sound.py <film-id> <out.wav>
"""
import numpy as np, wave, sys

SR, FPS = 48000, 30


class Mix:
    def __init__(self, dur, seed):
        self.n = int(SR * dur); self.t = np.arange(self.n) / SR; self.dur = dur
        self.L = np.zeros(self.n); self.R = np.zeros(self.n); self.rng = np.random.default_rng(seed)

    def env(self, start, a, d, length):
        e = np.zeros(self.n); i0 = int(start * SR); i1 = min(self.n, i0 + int(length * SR))
        if i0 >= self.n: return e
        tt = np.arange(i1 - i0) / SR
        e[i0:i1] = np.minimum(1, tt / max(a, 1e-4)) * np.exp(-tt / d)
        return e

    def add(self, sig, pan=0.0, g=1.0):
        self.L += sig * g * (1 - pan) / 2 * 2 ** 0.5
        self.R += sig * g * (1 + pan) / 2 * 2 ** 0.5

    def pad(self, freqs, start, end, fade=1.2, g=0.06, pan=0.0):
        t = self.t; s = np.zeros(self.n)
        for k, fr in enumerate(freqs):
            s += np.sin(2 * np.pi * fr * t + k) / (k + 1) + 0.3 * np.sin(2 * np.pi * fr * 2.001 * t) / (k + 1)
        w = np.clip((t - start) / fade, 0, 1) * np.clip((end - t) / fade, 0, 1)
        self.add(s * w * g, pan)

    def lp_noise(self, k=24):
        # band-limited noise: 4th-order Butterworth low-pass, cutoff falls as k rises (k=24 ~2 kHz, k=90 ~550 Hz)
        from scipy.signal import butter, sosfilt
        nz = self.rng.standard_normal(self.n)
        sos = butter(4, min(0.45, 2000 * 24 / k / (SR / 2)), output='sos')
        return sosfilt(sos, nz) * 0.25

    def thump(self, fr, g=0.5, low=70, pan=None):
        st = fr / FPS
        e = self.env(st, 0.002, 0.045, 0.25)
        body = np.sin(2 * np.pi * low * self.t) * self.env(st, 0.001, 0.06, 0.25)
        self.add(self.lp_noise(90) * e * 3.0 + body * 0.6, pan=(self.rng.random() - 0.5) * 0.8 if pan is None else pan, g=g)

    def boom(self, fr, g=0.9):
        st = fr / FPS
        sweep = np.sin(2 * np.pi * (48 + 30 * np.exp(-(np.clip(self.t - st, 0, None)) / 0.08)) * self.t)
        self.add(sweep * self.env(st, 0.002, 0.35, 1.6) + self.lp_noise(60) * self.env(st, 0.001, 0.12, 0.6) * 3, g=g)

    def click(self, fr, f0=880, g=0.16, d=0.03, pan=0.0):
        self.add(np.sin(2 * np.pi * f0 * self.t) * self.env(fr / FPS, 0.001, d, 0.2), g=g, pan=pan)

    def pop(self, fr, g=0.14):
        st = fr / FPS; tt = np.clip(self.t - st, 0, None)
        self.add(np.sin(2 * np.pi * (520 + 900 * np.exp(-tt / 0.02)) * self.t) * self.env(st, 0.001, 0.04, 0.15), g=g, pan=(self.rng.random() - 0.5) * 0.6)

    def plop(self, fr, g=0.3, f0=300):
        st = fr / FPS; tt = np.clip(self.t - st, 0, None)
        self.add(np.sin(2 * np.pi * (f0 + 500 * np.exp(-tt / 0.03)) * self.t) * self.env(st, 0.002, 0.09, 0.4) + self.lp_noise(8) * self.env(st, 0.001, 0.05, 0.3) * 0.6, g=g)

    def swell(self, f0, f1, start_fr, end_fr, g=0.035):
        a, b = start_fr / FPS, end_fr / FPS
        w = np.clip((self.t - a) / max(b - a - 0.2, 0.1), 0, 1) * np.clip((b - self.t) / 0.2, 0, 1)
        fr = f0 + (f1 - f0) * np.clip((self.t - a) / (b - a), 0, 1)
        self.add(np.sin(2 * np.pi * np.cumsum(fr) / SR) * w, g=g)

    def whoosh(self, start_fr, end_fr, g=0.12):
        a, b = start_fr / FPS, end_fr / FPS
        w = np.sin(np.pi * np.clip((self.t - a) / (b - a), 0, 1)) ** 2
        self.add(self.lp_noise(14) * w * 2, g=g)

    def pulse(self, start_fr, end_fr, f0=55, rate=4, g=0.12):
        a, b = start_fr / FPS, end_fr / FPS
        w = np.clip((self.t - a) / 0.4, 0, 1) * np.clip((b - self.t) / 0.2, 0, 1)
        self.add(np.sin(2 * np.pi * f0 * self.t) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * self.t)) * w, g=g)

    def bell(self, fr, base=440, g=0.09):
        st = fr / FPS
        for p, a in [(1, 1), (2.76, 0.4), (5.4, 0.2), (8.93, 0.08)]:
            self.add(np.sin(2 * np.pi * base * p * self.t) * self.env(st, 0.003, 1.6 / p ** 0.5, 4.0), g=g * a)

    def write(self, path):
        m = np.clip(self.t / 0.08, 0, 1) * np.clip((self.dur - self.t) / 0.9, 0, 1)
        L, R = self.L * m, self.R * m
        pk = max(np.abs(L).max(), np.abs(R).max())
        out = (np.stack([L / pk * 0.7, R / pk * 0.7], 1) * 32767).astype(np.int16)
        with wave.open(path, 'wb') as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(out.tobytes())


def film_A(m):  # Thinking Pool: cool water pad, one entrance sound per way in
    m.pad([146.8, 220, 293.7], 0, 13.4, g=0.05); m.pad([146.8, 185, 220, 277.2], 12.6, 18.6, fade=1.5, g=0.05)
    m.plop(2, g=0.35, f0=260); m.plop(15, g=0.2, f0=320)
    m.plop(int((0.35 + 1.3) * FPS), g=0.3, f0=280)           # Awareness reaches the water by the steps
    for k in range(4): m.click(int((4.7 + 0.25 * k) * FPS), f0=1400 - 120 * k, g=0.07, d=0.02)  # Belief: rungs of the ladder
    m.swell(70, 140, int(8.6 * FPS), int(10.8 * FPS), g=0.07)  # Context rises from the depth
    m.bell(390, base=392)


def film_B(m):  # Awareness: scattered ticks resolve into a regular pulse at the same point
    m.pad([110, 164.8, 220], 0, 10.4, g=0.05); m.pad([110, 138.6, 164.8, 220], 9.6, 15.6, fade=1.5, g=0.05)
    for i in range(12): m.click(2 + i * 3, f0=600 + (i * 137) % 700, g=0.07, d=0.02, pan=(i % 3 - 1) * 0.5)
    m.whoosh(70, 190, g=0.06)
    for k, fr in enumerate([96, 150, 204, 258]): m.click(fr, f0=880, g=0.18 + 0.03 * k, d=0.08)
    m.bell(300)


def film_C(m):  # Belief: heavy wall lands, warm light finds the opening
    m.pad([82.4, 123.5, 164.8], 0, 7.6, g=0.05); m.pad([110, 138.6, 164.8, 220, 277.2], 6.6, 15.6, fade=1.8, g=0.05)
    m.boom(12, g=1.0)
    m.swell(220, 330, 150, 232, g=0.04)
    for k in range(6): m.thump(222 + k * 12, g=0.12, low=90, pan=0.0)  # soft steps toward the opening
    m.bell(300, base=440)


def film_D(m):  # Context: a stuck clock, then the frame widens
    m.pad([98, 146.8, 196], 0, 7.0, g=0.045); m.pad([98, 123.5, 146.8, 196], 6.2, 15.6, fade=1.5, g=0.05)
    for fr in range(0, 72, 15): m.click(fr, f0=1800, g=0.08, d=0.01)
    m.whoosh(70, 190, g=0.07)
    for fr in [130, 144, 158]: m.click(fr, f0=740, g=0.13)
    m.bell(300, base=415)


def film_E(m):  # Think. Build.: chatter pops, form fills, approval stamp
    m.pad([110, 164.8, 220], 0, 11.6, g=0.045); m.pad([110, 138.6, 164.8, 246.9], 11.0, 20.6, fade=1.5, g=0.05)
    for i in range(6): m.pop(2 + i * 7)
    m.whoosh(110, 160, g=0.05)
    for i in range(4): m.click(168 + i * 12, f0=1100, g=0.09, d=0.015)
    for i in range(5): m.click(260 + i * 9, f0=1500, g=0.05, d=0.01)
    m.thump(288, g=0.6, low=80, pan=0.0)
    for fr in [352, 360]: m.click(fr, f0=660, g=0.12)
    m.bell(450)


def film_F(m):  # Founding Cohort: retimed to the 640-frame cut
    m.pad([110, 164.8, 220], 0, 7.2, g=0.06, pan=-0.2); m.pad([110, 164.8, 246.9, 329.6], 6.4, 16.4, g=0.06, pan=0.2)
    m.pad([110, 138.6, 164.8, 220, 277.2], 15.4, 21.4, fade=1.5, g=0.055)
    for i in range(14): m.thump(2 + i * 8 + 16, g=0.5)
    m.pulse(140, 195)
    m.swell(330, 550, 198, 232)
    for fr, f0 in zip([252, 286, 320, 350], [880, 988, 1175, 1319]): m.click(fr, f0=f0)
    for fr in [406, 414, 422]: m.click(fr, f0=660, g=0.12)
    m.bell(478)


FILMS = {'A': (18.0, film_A), 'B': (15.0, film_B), 'C': (15.0, film_C), 'D': (15.0, film_D), 'E': (20.0, film_E), 'F': (640 / 30, film_F)}

if __name__ == '__main__':
    k, path = sys.argv[1], sys.argv[2]
    dur, fn = FILMS[k]
    m = Mix(dur, seed=18112026 + ord(k)); fn(m); m.write(path); print('ok', k, path)
