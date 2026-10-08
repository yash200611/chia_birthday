import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.env.DOJI_FFMPEG_PATH || process.argv[2] || "ffmpeg";
const outputDirectory = path.join(root, "dist", "assets", "video");
const output = path.join(outputDirectory, "doji-fifteenth-birthday.mp4");
const soundtrack = path.join(root, "Olivia Rodrigo - deja vu (Official Video).mp3");

const width = 720;
const height = 1280;
const fps = 30;
const fade = 0.75;
const didot = "/System/Library/Fonts/Supplemental/Didot.ttc";
const avenir = "/System/Library/Fonts/Avenir Next.ttc";
const scriptFont = "/System/Library/Fonts/Noteworthy.ttc";

const scenes = [
  {
    path: "dist/assets/summer-cove-hero.jpg",
    duration: 5,
    kind: "intro",
  },
  { path: "dist/assets/photos/photo-08.jpg", duration: 6.2, caption: "AN OPENING CHAPTER" },
  { path: "dist/assets/photos/photo-07.jpg", duration: 6.2, caption: "GROWING INTO HER OWN LIGHT" },
  { path: "dist/assets/photos/photo-06.jpg", duration: 6.2, caption: "THE FAMILY EPISODE" },
  { path: "dist/assets/photos/photo-04.jpg", duration: 6.2, caption: "SIBLING SCENE" },
  { path: "dist/assets/photos/photo-03.jpg", duration: 6.2, caption: "RIGHT HERE, RIGHT NOW" },
  { path: "dist/assets/photos/photo-02.jpg", duration: 6.2, caption: "ALL TOGETHER NOW" },
  { path: "dist/assets/photos/photo-05.jpg", duration: 6.2, caption: "THROUGH HER LENS" },
  { path: "dist/assets/photos/photo-09.jpg", duration: 6.2, caption: "JOY, UNFILTERED" },
  { path: "dist/assets/photos/photo-01.jpg", duration: 6.2, caption: "MAIN-CHARACTER ENERGY" },
  {
    path: "dist/assets/photos/photo-01.jpg",
    duration: 6,
    kind: "outro",
  },
];

function text(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%");
}

function titleCard(index, scene) {
  const source = `[${index}:v]`;
  const base = `${source}scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
    `zoompan=z='min(zoom+0.00028,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${fps},` +
    "eq=saturation=0.9:contrast=0.96:brightness=-0.035," +
    "drawbox=x=0:y=0:w=iw:h=ih:color=0xffb4c8@0.14:t=fill," +
    "drawbox=x=24:y=24:w=672:h=1232:color=white@0.58:t=2,";

  if (scene.kind === "intro") {
    return `${base}` +
      `drawtext=fontfile='${avenir}':text='SEASON 15  •  BIRTHDAY EDITION':fontcolor=white@0.92:fontsize=20:` +
      "x=(w-text_w)/2:y=390:shadowcolor=black@0.35:shadowx=1:shadowy=2," +
      `drawtext=fontfile='${didot}':text='The Summer Doji':fontcolor=0xfff8f1:fontsize=65:` +
      "x=(w-text_w)/2:y=465:shadowcolor=0x542634@0.55:shadowx=2:shadowy=3," +
      `drawtext=fontfile='${didot}':text='Turned Fifteen':fontcolor=0xfff8f1:fontsize=70:` +
      "x=(w-text_w)/2:y=545:shadowcolor=0x542634@0.55:shadowx=2:shadowy=3," +
      `drawtext=fontfile='${scriptFont}':text='starring Doji, with love':fontcolor=0xfff8f1:fontsize=42:` +
      "x=(w-text_w)/2:y=655:shadowcolor=0x542634@0.5:shadowx=2:shadowy=2," +
      `drawtext=fontfile='${avenir}':text='A BIRTHDAY FILM MADE WITH LOVE':fontcolor=white@0.82:fontsize=18:` +
      "x=(w-text_w)/2:y=735:shadowcolor=black@0.35:shadowx=1:shadowy=2," +
      `drawtext=fontfile='${avenir}':text='*':fontcolor=0xffe1eb@0.95:fontsize=46:x=90+18*sin(t*1.3):y=300+12*cos(t),` +
      `drawtext=fontfile='${scriptFont}':text='<3':fontcolor=0xfff8f1@0.92:fontsize=42:x=w-150+12*cos(t):y=770+16*sin(t*1.1),` +
      `trim=duration=${scene.duration},setpts=PTS-STARTPTS,format=yuv420p,settb=AVTB[s${index}]`;
  }

  return `${base}` +
    "drawbox=x=0:y=0:w=iw:h=ih:color=0x3a1727@0.28:t=fill," +
    `drawtext=fontfile='${scriptFont}':text='Happy 15th,':fontcolor=0xfff8f1:fontsize=68:` +
    "x=(w-text_w)/2:y=475:shadowcolor=0x542634@0.65:shadowx=2:shadowy=3," +
    `drawtext=fontfile='${scriptFont}':text='Doji':fontcolor=0xfffff8:fontsize=110:` +
    "x=(w-text_w)/2:y=560:shadowcolor=0x542634@0.65:shadowx=3:shadowy=4," +
    `drawtext=fontfile='${avenir}':text='SEASON 15 HAS ONLY JUST BEGUN':fontcolor=white@0.9:fontsize=20:` +
    "x=(w-text_w)/2:y=735:shadowcolor=black@0.4:shadowx=1:shadowy=2," +
    `drawtext=fontfile='${avenir}':text='*':fontcolor=0xffe1eb@0.95:fontsize=48:x=100+15*sin(t):y=360+12*cos(t),` +
    `drawtext=fontfile='${scriptFont}':text='<3':fontcolor=0xfff8f1@0.95:fontsize=46:x=w-165+12*cos(t):y=780+14*sin(t),` +
    `trim=duration=${scene.duration},setpts=PTS-STARTPTS,format=yuv420p,settb=AVTB[s${index}]`;
}

function photoScene(index, scene) {
  const source = `[${index}:v]`;
  const focusWidth = width - 92;
  const focusHeight = height - 300;
  return `${source}split=2[bg${index}][fg${index}];` +
    `[bg${index}]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
    "gblur=sigma=27,eq=saturation=0.82:brightness=-0.05[blur" + index + "];" +
    `[fg${index}]scale=${focusWidth}:${focusHeight}:force_original_aspect_ratio=decrease,` +
    "pad=iw+20:ih+20:10:10:color=0xfffbf7[photo" + index + "];" +
    `[blur${index}][photo${index}]overlay=(W-w)/2:(H-h)/2-20,` +
    "drawbox=x=0:y=0:w=iw:h=ih:color=0xffb4c8@0.075:t=fill," +
    "drawbox=x=24:y=24:w=672:h=1232:color=white@0.48:t=2," +
    `drawtext=fontfile='${avenir}':text='DOJI  •  FIFTEEN':fontcolor=white@0.9:fontsize=18:` +
    "x=(w-text_w)/2:y=62:shadowcolor=black@0.42:shadowx=1:shadowy=2," +
    `drawtext=fontfile='${avenir}':text='${text(scene.caption)}':fontcolor=white:fontsize=25:` +
    "x=(w-text_w)/2:y=1128:box=1:boxcolor=0xa94f70@0.74:boxborderw=18:" +
    "shadowcolor=black@0.2:shadowx=1:shadowy=1," +
    `drawtext=fontfile='${scriptFont}':text='<3':fontcolor=0xfffff8@0.9:fontsize=36:` +
    "x=70+14*sin(t*1.4):y=103+10*cos(t)," +
    `drawtext=fontfile='${avenir}':text='*':fontcolor=0xffffdf@0.92:fontsize=34:` +
    "x=w-115+10*cos(t*1.2):y=170+13*sin(t)," +
    `zoompan=z='min(zoom+0.00024,1.045)':x='iw/2-(iw/zoom/2)+4*sin(on/35)':` +
    `y='ih/2-(ih/zoom/2)+3*cos(on/40)':d=1:s=${width}x${height}:fps=${fps},` +
    `trim=duration=${scene.duration},setpts=PTS-STARTPTS,format=yuv420p,settb=AVTB[s${index}]`;
}

const filters = [];
scenes.forEach((scene, index) => {
  filters.push(scene.kind ? titleCard(index, scene) : photoScene(index, scene));
});

const transitions = ["fade", "smoothleft", "circleopen", "dissolve", "fade", "smoothright", "circleclose", "dissolve", "fade", "smoothleft"];
let cumulative = scenes[0].duration;
let previous = "s0";
for (let index = 1; index < scenes.length; index += 1) {
  const offset = cumulative - fade * index;
  const outputLabel = index === scenes.length - 1 ? "video" : `x${index}`;
  filters.push(
    `[${previous}][s${index}]xfade=transition=${transitions[index - 1]}:duration=${fade}:offset=${offset.toFixed(2)}[${outputLabel}]`,
  );
  previous = outputLabel;
  cumulative += scenes[index].duration;
}

const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0) - fade * (scenes.length - 1);
const audioIndex = scenes.length;
filters.push(
  `[${audioIndex}:a]atrim=start=0:end=${totalDuration.toFixed(2)},asetpts=PTS-STARTPTS,` +
    `afade=t=in:st=0:d=1.2,afade=t=out:st=${(totalDuration - 2.8).toFixed(2)}:d=2.8,volume=0.92[audio]`,
);

fs.mkdirSync(outputDirectory, { recursive: true });

const args = ["-y", "-hide_banner", "-stats"];
for (const scene of scenes) {
  args.push("-loop", "1", "-framerate", String(fps), "-t", String(scene.duration), "-i", path.join(root, scene.path));
}
args.push("-i", soundtrack);
args.push(
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[video]",
  "-map",
  "[audio]",
  "-t",
  totalDuration.toFixed(2),
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "22",
  "-profile:v",
  "high",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "160k",
  "-movflags",
  "+faststart",
  "-metadata",
  "title=Doji's Fifteenth Birthday Film",
  "-metadata",
  "comment=Made with love for Doji's fifteenth birthday",
  output,
);

console.log(`Rendering ${totalDuration.toFixed(2)} seconds to ${path.relative(root, output)}...`);
const result = spawnSync(ffmpeg, args, { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const megabytes = fs.statSync(output).size / (1024 * 1024);
console.log(`Rendered ${output} (${megabytes.toFixed(1)} MiB).`);
