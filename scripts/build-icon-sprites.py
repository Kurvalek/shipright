"""Turns the animated GIFs in `shipping-icons/` into sprite strips.

A GIF cannot be paused, restarted or recoloured from CSS: it plays on a loop the
moment it decodes, and hiding it does not stop it. So each one is flattened into
a single horizontal strip and stepped through with a CSS keyframe instead, which
means the icon sits on frame one at rest, starts from the beginning on every
hover, and stops when the pointer leaves.

The strips keep only their alpha channel, so they are used as CSS masks and take
their colour from `currentColor` — the same icon can be oxblood on one card and
amber on another without a second asset.

Every strip is resampled to the same frame count so one CSS rule drives all of
them rather than one rule per icon.

Development aid, not part of the build. Run when the source GIFs change:

    python3 scripts/build-icon-sprites.py
"""

from pathlib import Path

from PIL import Image, ImageChops

FRAMES = 24
SIZE = 100

SOURCE = Path("shipping-icons")
DEST = Path("src/assets/icons")

# Only the four animations the cards actually use. The name on the left is what
# the app imports; the comment is what the animation does.
STRIPS = {
    # A clock face ticking on the side of a truck.
    "truck-clock": "icons8-shipping-100.gif",
    # A lid lifting off a box.
    "box-open": "icons8-box-100.gif",
    # An arrow tracking into the back of a truck.
    "truck-loading": "icons8-loading-truck-100.gif",
    # Motion lines resolving into a tick.
    "truck-shipped": "icons8-shipping.gif",
}


def build(name: str, filename: str) -> None:
    source = Image.open(SOURCE / filename)
    total = source.n_frames

    strip = Image.new("RGBA", (SIZE * FRAMES, SIZE), (0, 0, 0, 0))

    for i in range(FRAMES):
        # Spread the requested frames evenly across the source, inclusive of
        # both ends, so a 28-frame loop and an 18-frame loop both land on a
        # complete cycle.
        source.seek(round(i * (total - 1) / (FRAMES - 1)))
        frame = source.convert("RGBA")
        if frame.size != (SIZE, SIZE):
            frame = frame.resize((SIZE, SIZE), Image.LANCZOS)

        # These GIFs are black line art on an opaque white background, so the
        # shape lives in the luminance rather than the alpha: dark ink becomes
        # opaque, white paper becomes clear. Multiplying by any alpha the source
        # does carry keeps this correct for transparent sources too.
        coverage = ImageChops.invert(frame.convert("L"))
        coverage = ImageChops.multiply(coverage, frame.getchannel("A"))

        # Discard the colour and keep the coverage. As a CSS mask only the alpha
        # channel is read, and the card supplies the colour.
        cell = Image.new("RGBA", frame.size, (255, 255, 255, 0))
        cell.putalpha(coverage)

        strip.paste(cell, (i * SIZE, 0))

    out = DEST / f"{name}.png"
    strip.save(out, optimize=True)
    print(f"{out}  {total} frames -> {FRAMES}  {out.stat().st_size // 1024}KB")


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for name, filename in STRIPS.items():
        build(name, filename)


if __name__ == "__main__":
    main()
