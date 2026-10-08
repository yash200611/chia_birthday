import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const errors = [];
const notices = [];
const birthdayVideoPath = "assets/video/doji-fifteenth-birthday.mp4";

const coreFiles = [
  "index.html",
  "styles.css",
  "content.js",
  "app.js",
  "assets/favicon.svg",
  birthdayVideoPath,
];

function readDistFile(relativePath) {
  const absolutePath = path.join(dist, relativePath);
  if (!fs.existsSync(absolutePath)) return "";
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of coreFiles) {
  if (!fs.existsSync(path.join(dist, file))) {
    errors.push(`Missing required file: dist/${file}`);
  }
}

const html = readDistFile("index.html");
const css = readDistFile("styles.css");
const contentSource = readDistFile("content.js");
const appSource = readDistFile("app.js");

function htmlIds(source) {
  return [...source.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gis)].map((match) => match[2]);
}

const ids = htmlIds(html);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) {
  errors.push(`Duplicate IDs in index.html: ${duplicateIds.join(", ")}`);
}

const idSet = new Set(ids);
function requireId(id, description) {
  if (!idSet.has(id)) errors.push(`Missing ${description}: #${id}`);
}

function hasElementWithId(tagName, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`<${tagName}\\b[^>]*\\bid\\s*=\\s*(["'])${escapedId}\\1`, "i").test(html);
}

const chapterIds = [
  ["story", "opening story chapter"],
  ["timeline", "photo timeline chapter"],
  ["scrapbook", "scrapbook chapter"],
  ["messages", "fifteen-messages chapter"],
  ["letter", "birthday-letter chapter"],
];
for (const [id, description] of chapterIds) {
  requireId(id, description);
  if (idSet.has(id) && !hasElementWithId("section", id)) {
    errors.push(`Expected ${description} to be a <section>: #${id}`);
  }
}

const controlIds = [
  ["timeline-prev", "timeline previous control"],
  ["timeline-next", "timeline next control"],
  ["scrapbook-tidy", "scrapbook tidy control"],
  ["music-toggle", "music play/pause control"],
  ["viewer-prev", "lightbox previous control"],
  ["viewer-next", "lightbox next control"],
  ["envelope-button", "letter envelope control"],
  ["wish-button", "make-a-wish control"],
  ["replay-button", "celebration replay control"],
  ["premiere-close", "birthday-film invitation close control"],
  ["premiere-watch", "birthday-film invitation watch control"],
  ["premiere-explore", "birthday-film invitation explore control"],
  ["birthday-film-close", "finished-film close control"],
  ["film-interactive", "interactive-film control"],
  ["episode-close", "birthday-film close control"],
  ["episode-prev", "birthday-film previous-scene control"],
  ["episode-play", "birthday-film play/pause control"],
  ["episode-next", "birthday-film next-scene control"],
  ["episode-soundtrack", "birthday-film soundtrack control"],
  ["episode-explore", "birthday-film explore control"],
];
for (const [id, description] of controlIds) {
  requireId(id, description);
  if (idSet.has(id) && !hasElementWithId("button", id)) {
    errors.push(`Expected ${description} to be a <button>: #${id}`);
  }
}

for (const id of ["premiere-dialog", "birthday-film-dialog", "episode-player"]) {
  if (!hasElementWithId("dialog", id)) errors.push(`Missing cinematic dialog: <dialog id="${id}">`);
}

const birthdayVideo = html.match(
  /<video\b[^>]*\bid\s*=\s*(["'])birthday-video\1[^>]*>[\s\S]*?<\/video>/i,
)?.[0];
if (!birthdayVideo) {
  errors.push('Missing finished birthday film element: <video id="birthday-video">');
} else {
  const escapedVideoPath = birthdayVideoPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasVideoSource = new RegExp(
    `\\b(?:src|href)\\s*=\\s*(["'])(?:\\./)?${escapedVideoPath}(?:[?#][^"']*)?\\1`,
    "i",
  ).test(birthdayVideo);
  if (!hasVideoSource) errors.push(`Birthday video element must load ${birthdayVideoPath}`);
}

const filmDownload = html.match(/<a\b[^>]*\bid\s*=\s*(["'])film-download\1[^>]*>/i)?.[0];
if (!filmDownload) {
  errors.push('Missing birthday-film download control: <a id="film-download">');
} else {
  const escapedVideoPath = birthdayVideoPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasVideoHref = new RegExp(
    `\\bhref\\s*=\\s*(["'])(?:\\./)?${escapedVideoPath}(?:[?#][^"']*)?\\1`,
    "i",
  ).test(filmDownload);
  if (!hasVideoHref) errors.push(`Birthday-film download control must link to ${birthdayVideoPath}`);
  if (!/\bdownload(?:\s*=\s*(["']).*?\1|\s|>)/i.test(filmDownload)) {
    errors.push("Birthday-film download control must include the download attribute");
  }
}

function readableHtmlText(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:rsquo|#8217|#x2019);/gi, "'")
    .replace(/&(?:hellip|#8230|#x2026);/gi, "...")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const pageText = readableHtmlText(html);
const requiredHeadings = [
  ["the summer she turned fifteen", "hero heading \"The Summer She Turned Fifteen\""],
  ["previously, in your life", "timeline heading \"Previously, in your life...\""],
  [/our favou?rite scenes/, "scrapbook heading \"Our favourite scenes\""],
  ["15 things that make you, you", "messages heading \"15 things that make you, you\""],
  ["a letter for your next chapter", "letter heading \"A letter for your next chapter\""],
];

for (const [needle, description] of requiredHeadings) {
  const found = needle instanceof RegExp ? needle.test(pageText) : pageText.includes(needle);
  if (!found) errors.push(`Missing ${description}`);
}

for (const landmark of ["<header", "<main", "<section", "<dialog", "<noscript"]) {
  if (!html.toLowerCase().includes(landmark)) errors.push(`Missing landmark: ${landmark}`);
}
if (!/<meta\b[^>]*\bname\s*=\s*(["'])viewport\1/i.test(html)) {
  errors.push("Missing viewport meta tag");
}

function referencedCoreFile(file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:src|href)\\s*=\\s*(["'])(?:\\./)?${escaped}(?:[?#][^"']*)?\\1`, "i").test(html);
}

for (const file of ["styles.css", "content.js", "app.js"]) {
  if (!referencedCoreFile(file)) errors.push(`index.html does not load ${file}`);
}

const contentScriptPosition = html.search(/(?:src\s*=\s*["'](?:\.\/)?content\.js(?:[?#][^"']*)?["'])/i);
const appScriptPosition = html.search(/(?:src\s*=\s*["'](?:\.\/)?app\.js(?:[?#][^"']*)?["'])/i);
if (contentScriptPosition >= 0 && appScriptPosition >= 0 && contentScriptPosition > appScriptPosition) {
  errors.push("content.js must load before app.js");
}

function evaluateBirthdayContent(source) {
  if (!source) return null;

  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);

  try {
    new vm.Script(source, { filename: "dist/content.js" }).runInContext(sandbox, { timeout: 1000 });
  } catch (error) {
    errors.push(`content.js could not be evaluated: ${error.message}`);
    return null;
  }

  const config = sandbox.window.BIRTHDAY_CONTENT ?? sandbox.BIRTHDAY_CONTENT;
  if (!config || typeof config !== "object") {
    errors.push("content.js must define window.BIRTHDAY_CONTENT");
    return null;
  }

  return config;
}

const birthdayContent = evaluateBirthdayContent(contentSource);
if (birthdayContent) {
  if (!Array.isArray(birthdayContent.messages)) {
    errors.push("BIRTHDAY_CONTENT.messages must be an array");
  } else {
    if (birthdayContent.messages.length !== 15) {
      errors.push(`Expected exactly 15 configured messages; found ${birthdayContent.messages.length}`);
    }

    const emptyMessages = birthdayContent.messages
      .map((message, index) => {
        if (typeof message === "string") return message.trim() ? null : index + 1;
        if (!message || typeof message !== "object") return index + 1;
        const hasCopy = Object.values(message).some(
          (value) => typeof value === "string" && value.trim().length > 0,
        );
        return hasCopy ? null : index + 1;
      })
      .filter(Boolean);

    if (emptyMessages.length) {
      errors.push(`Configured messages without readable copy: ${emptyMessages.join(", ")}`);
    }
  }

  const hasBonusKey = Object.hasOwn(birthdayContent, "bonus") || Object.hasOwn(birthdayContent, "bonusScene");
  const bonus = birthdayContent.bonus ?? birthdayContent.bonusScene;
  if (!hasBonusKey || !bonus || typeof bonus !== "object" || Array.isArray(bonus)) {
    errors.push("BIRTHDAY_CONTENT must include a bonus (or bonusScene) configuration object");
  } else if (!Object.hasOwn(bonus, "enabled") || typeof bonus.enabled !== "boolean") {
    errors.push("Bonus-scene configuration must include an enabled boolean");
  }

  const film = birthdayContent.film;
  if (!film || film.enabled !== true || !Array.isArray(film.photoIds)) {
    errors.push("BIRTHDAY_CONTENT must include an enabled film with a photoIds array");
  } else {
    const knownPhotoIds = new Set([
      ...(birthdayContent.timeline || []),
      ...(birthdayContent.scrapbook || []),
    ].map((photo) => photo.id));
    const uniqueFilmIds = new Set(film.photoIds);
    if (film.photoIds.length !== 9 || uniqueFilmIds.size !== 9) {
      errors.push(`Expected nine unique birthday-film photos; found ${film.photoIds.length} entries and ${uniqueFilmIds.size} unique IDs`);
    }
    const unknownFilmIds = film.photoIds.filter((id) => !knownPhotoIds.has(id));
    if (unknownFilmIds.length) errors.push(`Birthday film references unknown photo IDs: ${unknownFilmIds.join(", ")}`);
  }

  const video = birthdayContent.video;
  if (!video || typeof video !== "object" || Array.isArray(video) || video.enabled !== true) {
    errors.push("BIRTHDAY_CONTENT must include an enabled video configuration object");
  } else if (video.src !== birthdayVideoPath) {
    errors.push(`BIRTHDAY_CONTENT.video.src must be ${birthdayVideoPath}`);
  }

}

function countClassToken(source, token) {
  let count = 0;
  for (const match of source.matchAll(/\bclass\s*=\s*(["'])(.*?)\1/gis)) {
    if (match[2].split(/\s+/).includes(token)) count += 1;
  }
  return count;
}

function hasFifteenCandleGenerator(source) {
  const hasCandleMarker = /(?:class(?:Name)?\s*=|classList\.add\s*\(|class\s*=)[\s\S]{0,100}["'`]candle\b/i.test(
    source,
  );
  if (!hasCandleMarker) return false;

  const literalGenerator = [
    /Array\.from\s*\(\s*\{\s*length\s*:\s*15\s*\}/i,
    /(?:new\s+Array|Array)\s*\(\s*15\s*\)/i,
    /for\s*\([^;]*;[^;]*(?:<\s*15|<=\s*14)\s*;[^)]*\)/i,
  ].some((pattern) => pattern.test(source));
  if (literalGenerator) return true;

  const candleCountNames = [...source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*candle[\w$]*)\s*=\s*15\b/gi)].map(
    (match) => match[1],
  );
  return candleCountNames.some((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:length\\s*:\\s*${escaped}|Array\\s*\\(\\s*${escaped}\\s*\\)|<\\s*${escaped}\\b)`).test(
      source,
    );
  });
}

const staticCandleCount = countClassToken(html, "candle");
const generatedCandleCountIsFifteen = hasFifteenCandleGenerator(`${html}\n${appSource}`);
if (staticCandleCount !== 15 && !((staticCandleCount === 0 || staticCandleCount === 1) && generatedCandleCountIsFifteen)) {
  errors.push(
    `Expected exactly 15 cake candles; found ${staticCandleCount} static candle element${staticCandleCount === 1 ? "" : "s"} and no verified 15-candle renderer`,
  );
}

if (!appSource.includes("prefers-reduced-motion")) {
  errors.push("Reduced-motion support missing from JavaScript");
}
if (!css.includes("prefers-reduced-motion")) {
  errors.push("Reduced-motion support missing from CSS");
}

function collectHtmlReferences(source) {
  const references = [];
  for (const match of source.matchAll(/\b(?:src|href|poster|data-src)\s*=\s*(["'])(.*?)\1/gis)) {
    references.push(match[2]);
  }
  for (const match of source.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gis)) {
    for (const candidate of match[2].split(",")) {
      references.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  references.push(...collectCssReferences(source));
  return references;
}

function collectCssReferences(source) {
  return [...source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gis)].map((match) => match[2].trim());
}

function collectScriptAssetReferences(source) {
  const references = [];
  const quotedStrings = /(["'`])([^"'`\r\n]+)\1/g;
  for (const match of source.matchAll(quotedStrings)) {
    const value = match[2].trim();
    if (/^(?:\.\.?\/)?assets\//i.test(value) && !value.includes("${")) references.push(value);
  }
  return references;
}

function cleanLocalReference(reference) {
  const value = reference.trim();
  if (
    !value ||
    /^(?:#|data:|blob:|https?:|\/\/|mailto:|tel:|javascript:)/i.test(value) ||
    value.includes("{{") ||
    value.includes("${")
  ) {
    return null;
  }

  const withoutSuffix = value.split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(withoutSuffix);
  } catch {
    return withoutSuffix;
  }
}

function isOptionalPersonalAsset(reference, sourceName) {
  const clean = reference.split(/[?#]/, 1)[0];
  const isMedia = /\.(?:avif|gif|heic|heif|jpe?g|png|webp|mp3|m4a|aac|ogg|wav|flac)$/i.test(clean);
  const personalFolder = /(?:^|\/)(?:photos?|audio|music|soundtrack)(?:\/|$)/i.test(clean);
  const audioFile = /\.(?:mp3|m4a|aac|ogg|wav|flac)$/i.test(clean);
  return personalFolder || audioFile || (sourceName === "content.js" && isMedia);
}

const references = [
  ...collectHtmlReferences(html).map((reference) => ({ reference, sourceName: "index.html", base: dist })),
  ...collectCssReferences(css).map((reference) => ({ reference, sourceName: "styles.css", base: dist })),
  ...collectScriptAssetReferences(contentSource).map((reference) => ({
    reference,
    sourceName: "content.js",
    base: dist,
  })),
  ...collectScriptAssetReferences(appSource).map((reference) => ({ reference, sourceName: "app.js", base: dist })),
];

const seenReferences = new Set();
for (const item of references) {
  const clean = cleanLocalReference(item.reference);
  if (!clean) continue;

  const key = `${item.sourceName}:${clean}`;
  if (seenReferences.has(key)) continue;
  seenReferences.add(key);

  const absolutePath = clean.startsWith("/")
    ? path.join(dist, clean.replace(/^\/+/, ""))
    : path.resolve(item.base, clean);
  const insideDist = absolutePath === dist || absolutePath.startsWith(`${dist}${path.sep}`);

  if (!insideDist) {
    errors.push(`Local reference escapes dist in ${item.sourceName}: ${item.reference}`);
  } else if (!fs.existsSync(absolutePath)) {
    if (isOptionalPersonalAsset(clean, item.sourceName)) {
      notices.push(`Optional personal asset not supplied: ${clean}`);
    } else {
      errors.push(`Missing local asset referenced by ${item.sourceName}: ${clean}`);
    }
  }
}

if (errors.length) {
  console.error(`Site validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n${errors
    .map((error) => `- ${error}`)
    .join("\n")}`);
  process.exit(1);
}

const acceptedCandleDescription = staticCandleCount === 15 ? "15 static candles" : "a verified 15-candle renderer";
console.log(
  `Site validation passed: ${ids.length} unique IDs, 5 chapters, 15 messages, ${acceptedCandleDescription}, the downloadable birthday film, and all required local assets present.`,
);
if (notices.length) {
  console.log(`${[...new Set(notices)].length} optional personal asset(s) can be added later.`);
}
