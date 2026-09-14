"""Bakes the ship mark into `public/favicon.ico`.

The app's icons are flat alpha masks painted with `currentColor`, which is what
lets one file be oxblood in the sidebar and muted grey in a row. A browser tab
has no `currentColor` to offer, so the mark has to arrive already coloured, and
the colour has to be written down somewhere — here, matching `--color-brand`.

Built from the same `ship.png` the sidebar imports rather than from a second
drawing, so the tab and the wordmark cannot drift apart.

Four sizes in one file, each resampled from the 100px original rather than from
the size above it. A browser handed a single large icon downsamples it itself,
with no say from us about how; line art this fine is worth resampling once,
carefully. Note that 16px is a smudge whatever is done to it — three sails and a
waterline need more pixels than that, which is the same reason the mark is given
the full 22px in the sidebar instead of being tucked inside a tile. It is kept
because a browser with only larger icons to choose from will make a worse 16
than this one. The hull and the water still read as a dark shape on water, and
the sizes that carry the detail are the ones nearly every display asks for.

Left on a transparent background so it sits on a light tab strip and a dark one
without a second file.

Development aid, not part of the build. Run when the mark changes:

    python3 scripts/build-favicon.py
"""

from pathlib import Path

from PIL import Image

# --color-brand, as it is set in src/index.css.
BRAND = (102, 26, 58)

SIZES = (16, 32, 48, 64)

SOURCE = Path("src/assets/icons/ship.png")
DEST = Path("public/favicon.ico")


def paint(size: int, mask: Image.Image) -> Image.Image:
    icon = Image.new("RGBA", (size, size), (*BRAND, 0))
    icon.putalpha(mask.resize((size, size), Image.LANCZOS))
    return icon


def main() -> None:
    # The shape is entirely in the alpha channel — the RGB underneath is flat
    # black, which is the colour being replaced.
    mask = Image.open(SOURCE).convert("RGBA").getchannel("A")

    icons = [paint(size, mask) for size in SIZES]

    DEST.parent.mkdir(parents=True, exist_ok=True)
    # Largest first: Pillow takes the leader as the image and matches the rest
    # by exact size, falling back to resampling any size it was not handed.
    icons[-1].save(
        DEST,
        sizes=[(size, size) for size in SIZES],
        append_images=icons[:-1],
    )
    print(f"{DEST}  {', '.join(str(s) for s in SIZES)}  {DEST.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
