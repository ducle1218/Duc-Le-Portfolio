"""Build small, responsive listing assets; keep full-size project sources intact."""
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/images/optimized"
OUT.mkdir(parents=True, exist_ok=True)

CARDS = [
    ("quadruped", "quadruped-robot/folded-configuration.webp", "contain"),
    ("volumetric-display", "volumetric-display/radial-arm-assembly.webp", "contain"),
    ("fea", "fea/aligner-load-stress.png", "contain"),
    ("solidworks", "cswa_solidworks_practice.jpg", "cover"),
    ("sprocket", "capstone/Sprocket_Robot_CAD.png", "contain"),
    ("launch-vehicle", "launch_vehicle_cross_section.png", "contain"),
    ("high-stakes", "High_Stake_Robot.png", "cover"),
    ("arduino", "arduino/Arduino_Physical_Breadboard.jpg", "cover"),
    ("tower", "tower/Tower_Testing_Setup.jpg", "cover"),
    ("sensor-challenge", "sensor-challenge/Sensor_Warehouse_Course.jpg", "cover"),
    ("putt-putt", "putt-putt/PuttPutt_Boat_Photo.jpg", "cover"),
    ("wind-turbine", "wind-turbine-notebook/wt-test-p8-3blade-12in.jpg", "cover"),
]
HEROES = [
    ("quadruped", "quadruped-robot/hero-cutout.png"),
    ("volumetric-display", "volumetric-display/hero-cutout.png"),
    ("fea", "fea/hero-cutout.png"),
    ("sprocket", "capstone/Sprocket_Robot_CAD.png"),
]
ICONS = ["cpp_logo.png", "solidworks_icon.png", "matlab_logo.png", "onshape_logo.png", "autocad_logo.png", "arduino-icon.png", "bambu-logo.png"]

manifest = {
    "description": "Responsive WebP variants for listing/spotlight use only. Original project/detail sources are unchanged.",
    "heroSizes": "(max-width: 650px) 90vw, 43vw",
    "cardSizes": "(max-width: 650px) 90vw, (max-width: 900px) 44vw, 29vw",
    "assets": [],
}

def build(name, rel, kind, widths, fit="contain", quality=87):
    source = ROOT / "src/assets/images" / rel
    original = ImageOps.exif_transpose(Image.open(source))
    if original.mode not in ("RGB", "RGBA"):
        original = original.convert("RGBA" if "transparency" in original.info else "RGB")
    entry = {"kind": kind, "name": name, "source": source.relative_to(ROOT).as_posix(), "sourceBytes": source.stat().st_size, "sourceWidth": original.width, "sourceHeight": original.height, "variants": []}
    last_size = None
    for target_width in widths:
        result = original.copy()
        if fit == "cover":
            # The listing already uses a centered 4:3 object-fit:cover crop.
            width = min(target_width, original.width, int(original.height * 4 / 3))
            result = ImageOps.fit(result, (width, round(width * 3 / 4)), method=Image.Resampling.LANCZOS)
        else:
            result.thumbnail((target_width, target_width * (0.75 if kind == "card" else 1.4)), Image.Resampling.LANCZOS)
        if result.size == last_size:
            continue
        last_size = result.size
        dest = OUT / f"{name}-{kind}-{result.width}.webp"
        result.save(dest, "WEBP", quality=quality, method=6, exact=True)
        entry["variants"].append({"path": dest.relative_to(ROOT).as_posix(), "bytes": dest.stat().st_size, "width": result.width, "height": result.height})
    entry["src"] = entry["variants"][0]["path"]
    entry["srcset"] = ", ".join(f"{item['path']} {item['width']}w" for item in entry["variants"])
    manifest["assets"].append(entry)

if __name__ == "__main__":
    for name, rel, fit in CARDS:
        build(name, rel, "card", (640, 960), fit, 84 if fit == "cover" else 88)
    for name, rel in HEROES:
        build(name, rel, "hero", (640, 960, 1280), quality=90)
    for rel in ICONS:
        build(Path(rel).stem.replace("_", "-"), "logos/" + rel, "icon", (32, 64), quality=92)

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    for item in manifest["assets"]:
        print(f"{item['name']} {item['kind']}: {item['sourceBytes']:,} -> " + ", ".join(f"{v['width']}w/{v['bytes']:,} B" for v in item['variants']))
