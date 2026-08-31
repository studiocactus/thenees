from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "thenees-ascii-source.jpg"
OUTPUT = ROOT / "outputs" / "thenees-hero-background-1920x1080.webm"
WIDTH, HEIGHT, FPS, SECONDS = 1920, 1080, 24, 8
LIME = (197, 255, 0)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
font_path = ROOT / "public" / "fonts" / "silkscreen-400.ttf"
glyph_font = ImageFont.truetype(str(font_path), 15)
label_font = ImageFont.truetype(str(font_path), 14)

source = Image.open(SOURCE).convert("L")
portrait_box = (600, 0, WIDTH, HEIGHT)
pw, ph = portrait_box[2] - portrait_box[0], portrait_box[3] - portrait_box[1]

# Cover crop with the same right-side focus used by the live canvas.
scale = max(pw / source.width, ph / source.height)
crop_w, crop_h = pw / scale, ph / scale
focus_x = source.width * 0.58
x0 = max(0, min(source.width - crop_w, focus_x - crop_w * 0.58))
y0 = max(0, (source.height - crop_h) * 0.5)
portrait = source.crop((x0, y0, x0 + crop_w, y0 + crop_h)).resize((pw, ph), Image.Resampling.LANCZOS)
portrait = ImageEnhance.Contrast(portrait).enhance(1.42)
portrait = ImageEnhance.Brightness(portrait).enhance(0.83)

cell = 18
cols, rows = pw // cell, ph // cell
sample = portrait.resize((cols, rows), Image.Resampling.BILINEAR)
symbols = " .,:;i1tfLCG08@"
glyphs = []
for row in range(rows):
    for col in range(cols):
        value = sample.getpixel((col, row))
        if value < 22:
            continue
        idx = min(len(symbols) - 1, int(value / 256 * len(symbols)))
        glyphs.append((col * cell + cell // 2, row * cell + cell // 2, symbols[idx], value / 255))

random.seed(2608)
stars = [(random.randrange(WIDTH), random.randrange(HEIGHT), random.random()) for _ in range(95)]

writer = imageio_ffmpeg.write_frames(
    str(OUTPUT), (WIDTH, HEIGHT), fps=FPS,
    codec="libvpx-vp9", pix_fmt_in="rgb24", pix_fmt_out="yuv420p",
    macro_block_size=1,
    output_params=["-crf", "31", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-an"],
)
writer.send(None)

for frame_index in range(FPS * SECONDS):
    t = frame_index / FPS
    phase = t / SECONDS * math.tau
    frame = Image.new("RGB", (WIDTH, HEIGHT), (7, 8, 11))
    draw = ImageDraw.Draw(frame, "RGBA")

    # Subtle violet atmosphere and oversized system rings.
    glow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    gd.ellipse((880, -330, 1980, 770), fill=(104, 78, 255, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(115))
    frame = Image.alpha_composite(frame.convert("RGBA"), glow)
    draw = ImageDraw.Draw(frame, "RGBA")
    cx, cy = 1510, 410
    for radius, alpha in ((365, 34), (285, 26), (190, 30)):
        draw.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), outline=(197,255,0,alpha), width=2)
    angle = phase
    dot_x, dot_y = cx + math.cos(angle) * 365, cy + math.sin(angle) * 365
    draw.ellipse((dot_x-6, dot_y-6, dot_x+6, dot_y+6), fill=(*LIME, 230))

    # Ambient pixel field.
    for sx, sy, seed in stars:
        alpha = int(18 + 38 * (0.5 + 0.5 * math.sin(phase + seed * 8)))
        draw.rectangle((sx, sy, sx+2, sy+2), fill=(240, 240, 235, alpha))

    # ASCII portrait with a gentle periodic horizontal displacement.
    portrait_layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(portrait_layer, "RGBA")
    scan_y = int((t / SECONDS) * (HEIGHT + 240)) - 120
    for x, y, char, brightness in glyphs:
        world_x = portrait_box[0] + x
        shift = int(math.sin(phase + y * 0.014) * 2)
        near_scan = abs(y - scan_y) < 42
        if near_scan:
            color = (*LIME, min(255, int(120 + brightness * 150)))
            shift += int(math.sin(y * .11 + phase * 4) * 7)
        else:
            color = (240, 240, 235, int(32 + brightness * 176))
        pd.text((world_x + shift, y), char, font=glyph_font, anchor="mm", fill=color)
    frame = Image.alpha_composite(frame, portrait_layer)
    draw = ImageDraw.Draw(frame, "RGBA")

    # Left-side vignette preserves readability when used behind hero copy.
    vignette = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette, "RGBA")
    for x in range(0, 850, 10):
        alpha = int(238 * (1 - x / 850) ** 1.8)
        vd.rectangle((x, 0, x+10, HEIGHT), fill=(7, 8, 11, alpha))
    vd.rectangle((0, HEIGHT-210, WIDTH, HEIGHT), fill=(7, 8, 11, 105))
    frame = Image.alpha_composite(frame, vignette)
    draw = ImageDraw.Draw(frame, "RGBA")

    # Moving scanline and restrained technical details.
    line_y = int((t / SECONDS) * HEIGHT)
    draw.rectangle((0, line_y, WIDTH, line_y+2), fill=(*LIME, 38))
    for y in range(0, HEIGHT, 4):
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, 7), width=1)
    draw.line((0, HEIGHT-4, WIDTH, HEIGHT-4), fill=(*LIME, 120), width=2)
    draw.text((55, HEIGHT-55), "THENEES_OS // HERO BACKGROUND // 1920x1080", font=label_font, fill=(197,255,0,78))

    writer.send(frame.convert("RGB").tobytes())

writer.close()
print(OUTPUT)
