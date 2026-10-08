(() => {
  "use strict";

  const content = window.BIRTHDAY_CONTENT;
  if (!content) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">Birthday content could not be loaded.</p>';
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopDrag = window.matchMedia("(min-width: 961px) and (hover: hover) and (pointer: fine)");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const photoRegistry = new Map();
  [...content.timeline, ...content.scrapbook].forEach((photo) => {
    if (!photoRegistry.has(photo.id)) photoRegistry.set(photo.id, photo);
  });
  const viewerPhotos = [...photoRegistry.values()];
  const photoLoadState = new Map();

  function safeStorageGet(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function syncBodyLock() {
    document.body.classList.toggle("has-dialog", Boolean(document.querySelector("dialog[open]")));
  }

  function getByPath(object, path) {
    return path.split(".").reduce((value, key) => value?.[key], object);
  }

  function bindContent() {
    document.title = `${content.sister.displayName}'s Fifteenth Summer`;
    $$('[data-bind]').forEach((node) => {
      const value = getByPath(content, node.dataset.bind);
      if (value !== undefined && value !== null && value !== "") node.textContent = value;
    });

    const dateNode = $('[data-bind="birthdayDateDisplay"]');
    if (content.sister.birthdayDate) {
      const date = new Date(`${content.sister.birthdayDate}T12:00:00`);
      if (!Number.isNaN(date.getTime())) {
        dateNode.textContent = new Intl.DateTimeFormat(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(date);
      }
    } else {
      dateNode.hidden = true;
    }
  }

  function createPlaceholder(label) {
    const placeholder = document.createElement("span");
    placeholder.className = "photo-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = label || "add your photo";
    placeholder.append(text);
    return placeholder;
  }

  function createMedia(photo, options = {}) {
    const media = document.createElement("span");
    media.className = "photo-media";
    media.style.setProperty("--focal-point", photo.focalPoint || "50% 50%");

    const image = document.createElement("img");
    image.src = photo.path;
    image.alt = photo.alt || "Birthday memory";
    image.loading = options.eager ? "eager" : "lazy";
    image.decoding = "async";
    image.draggable = false;
    if (options.priority) image.fetchPriority = "high";

    image.addEventListener("load", () => {
      photoLoadState.set(photo.id, true);
      media.classList.remove("is-missing");
      const ratio = image.naturalWidth / image.naturalHeight;
      media.style.setProperty("--native-ratio", String(ratio));
      media.closest(".scrap-card")?.style.setProperty("--ratio", ratio > 1.1 ? "4 / 3" : "4 / 5");
    });
    image.addEventListener("error", () => {
      photoLoadState.set(photo.id, false);
      media.classList.add("is-missing");
    });

    media.append(image, createPlaceholder(photo.id.replace("photo-", "photo ")));
    return media;
  }

  function photoButtonBase(photo, className, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.photoId = photo.id;
    button.setAttribute("aria-label", label || `Open ${photo.shortCaption || "birthday photo"}`);
    return button;
  }

  function renderHero() {
    const container = $("#hero-polaroids");
    const requested = content.hero.polaroidPhotoIds || [];
    const ids = [...new Set([
      requested[0],
      requested[1],
      content.hero.centralPhotoId,
      ...requested,
    ])].filter((id) => photoRegistry.has(id));

    if (content.hero.sceneryPath) {
      $(".season-hero__scenery").src = content.hero.sceneryPath;
    }

    ids.slice(0, 4).forEach((id, index) => {
      const photo = photoRegistry.get(id);
      if (!photo) return;
      const card = photoButtonBase(photo, "hero-polaroid", `Open featured photo: ${photo.shortCaption}`);
      card.classList.toggle("hero-polaroid--feature", id === content.hero.centralPhotoId);
      const tape = document.createElement("span");
      tape.className = "hero-polaroid__tape";
      tape.setAttribute("aria-hidden", "true");
      const caption = document.createElement("span");
      caption.className = "hero-polaroid__caption";
      caption.textContent = photo.shortCaption;
      const isCentral = id === content.hero.centralPhotoId;
      card.append(tape, createMedia(photo, { eager: isCentral, priority: isCentral }), caption);
      card.addEventListener("click", () => openViewerById(photo.id));
      container.append(card);
    });
  }

  function renderTimeline() {
    const track = $("#timeline-track");
    content.timeline.forEach((photo, index) => {
      const card = photoButtonBase(photo, "timeline-card", `Open memory: ${photo.shortCaption}`);
      const copy = document.createElement("span");
      copy.className = "timeline-card__copy";
      const number = document.createElement("span");
      number.className = "timeline-card__number";
      number.textContent = String(index + 1).padStart(2, "0");
      const words = document.createElement("span");
      const chapter = document.createElement("small");
      chapter.textContent = photo.chapterLabel || `Scene ${index + 1}`;
      const caption = document.createElement("strong");
      caption.textContent = photo.shortCaption;
      words.append(chapter, caption);
      copy.append(number, words);
      card.append(createMedia(photo), copy);
      card.addEventListener("click", () => openViewerById(photo.id));
      track.append(card);
    });
  }

  function scrapbookLayout(index) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const xByRow = [
      ["4%", "36%", "64%"],
      ["8%", "40%", "64%"],
      ["3%", "34%", "66%"],
    ];
    const widthCycle = ["18rem", "17rem", "20rem", "19rem", "18rem", "17rem"];
    const rotationCycle = ["-5deg", "3deg", "4deg", "2deg", "-4deg", "5deg", "-3deg", "4deg", "-5deg"];
    const yOffset = [0, 2.6, 0.8][column];
    return {
      x: xByRow[row % xByRow.length][column],
      y: `${2 + row * 21.5 + yOffset}rem`,
      w: widthCycle[index % widthCycle.length],
      r: rotationCycle[index % rotationCycle.length],
      z: 3 + ((index * 2) % 5),
    };
  }

  let topScrapbookZ = 20;

  function renderScrapbook() {
    const container = $("#scrapbook-cards");
    const rows = Math.max(1, Math.ceil(content.scrapbook.length / 3));
    $("#scrapbook-board").style.setProperty("--board-height", `${4 + rows * 21.5}rem`);
    content.scrapbook.forEach((photo, index) => {
      const layout = scrapbookLayout(index);
      const card = photoButtonBase(photo, "scrap-card", `Open scrapbook photo: ${photo.shortCaption}`);
      card.style.setProperty("--x", layout.x);
      card.style.setProperty("--y", layout.y);
      card.style.setProperty("--w", layout.w);
      card.style.setProperty("--rotation", layout.r);
      card.style.setProperty("--z", String(layout.z));
      card.dataset.baseRotation = layout.r;

      const tape = document.createElement("span");
      tape.className = "scrap-card__tape";
      tape.setAttribute("aria-hidden", "true");
      const caption = document.createElement("span");
      caption.className = "scrap-card__caption";
      caption.textContent = photo.shortCaption;
      card.append(tape, createMedia(photo), caption);

      if (photo.isSample && !photoLoadState.get(photo.id) && /^photo-1[0-5]$/.test(photo.id)) {
        const sample = document.createElement("span");
        sample.className = "scrap-card__sample";
        sample.textContent = "replaceable slot";
        card.append(sample);
      }

      enableScrapbookDrag(card, photo);
      container.append(card);
    });
  }

  function enableScrapbookDrag(card, photo) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let nextX = 0;
    let nextY = 0;
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    let moved = false;
    let suppressClick = false;

    card.addEventListener("pointerdown", (event) => {
      if (!desktopDrag.matches || event.pointerType === "touch" || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      baseX = Number.parseFloat(card.dataset.dragX || "0");
      baseY = Number.parseFloat(card.dataset.dragY || "0");
      nextX = baseX;
      nextY = baseY;
      const boardRect = $("#scrapbook-board").getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const pad = 14;
      minX = baseX + boardRect.left + pad - cardRect.left;
      maxX = baseX + boardRect.right - pad - cardRect.right;
      minY = baseY + boardRect.top + pad - cardRect.top;
      maxY = baseY + boardRect.bottom - pad - cardRect.bottom;
      moved = false;
      suppressClick = false;
      topScrapbookZ += 1;
      card.style.setProperty("--z", String(topScrapbookZ));
      card.classList.add("is-dragging");
      card.setPointerCapture(pointerId);
    });

    card.addEventListener("pointermove", (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) > 6) moved = true;
      nextX = Math.min(Math.max(baseX + dx, minX), maxX);
      nextY = Math.min(Math.max(baseY + dy, minY), maxY);
      card.style.setProperty("--drag-x", `${nextX}px`);
      card.style.setProperty("--drag-y", `${nextY}px`);
    });

    function finishDrag(event, cancelled = false) {
      if (pointerId !== event.pointerId) return;
      if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
      pointerId = null;
      card.classList.remove("is-dragging");
      card.dataset.dragX = String(nextX);
      card.dataset.dragY = String(nextY);
      suppressClick = moved && !cancelled;
    }

    card.addEventListener("pointerup", finishDrag);
    card.addEventListener("pointercancel", (event) => finishDrag(event, true));
    card.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      openViewerById(photo.id);
    });
  }

  function tidyScrapbook() {
    $$(".scrap-card").forEach((card, index) => {
      card.classList.add("is-tidying");
      card.dataset.dragX = "0";
      card.dataset.dragY = "0";
      card.style.setProperty("--drag-x", "0px");
      card.style.setProperty("--drag-y", "0px");
      card.style.setProperty("--z", String(scrapbookLayout(index).z));
      window.setTimeout(() => card.classList.remove("is-tidying"), reducedMotion.matches ? 0 : 650);
    });
  }

  function renderMessages() {
    const container = $("#message-stars");
    const messages = content.messages.slice(0, 15);
    messages.forEach((message, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "message-star";
      button.dataset.messageId = message.id;
      button.dataset.baseLabel = `Open birthday message ${index + 1} of 15`;
      button.setAttribute("aria-label", button.dataset.baseLabel);

      const shape = document.createElement("span");
      shape.className = "message-star__shape";
      shape.setAttribute("aria-hidden", "true");
      const number = document.createElement("span");
      number.className = "message-star__number";
      number.textContent = String(index + 1).padStart(2, "0");
      const check = document.createElement("span");
      check.className = "message-star__check";
      check.textContent = "✓";
      check.setAttribute("aria-hidden", "true");
      button.append(shape, number, check);
      button.addEventListener("click", () => openMessage(message, index));
      container.append(button);
    });
    restoreMessageProgress();
  }

  const messageDialog = $("#message-dialog");
  const openedMessages = new Set();

  function restoreMessageProgress() {
    try {
      const saved = JSON.parse(safeStorageGet("season15:openedMessages", "[]"));
      const validIds = new Set(content.messages.slice(0, 15).map((message) => message.id));
      if (Array.isArray(saved)) {
        saved.filter((id) => validIds.has(id)).forEach((id) => openedMessages.add(id));
      }
    } catch {
      // Ignore invalid or unavailable storage.
    }
    updateMessageProgress();
  }

  function updateMessageProgress() {
    $$(".message-star").forEach((button) => {
      const isOpened = openedMessages.has(button.dataset.messageId);
      button.classList.toggle("is-opened", isOpened);
      button.setAttribute("aria-label", `${button.dataset.baseLabel}${isOpened ? " — opened" : ""}`);
    });
    const count = Math.min(openedMessages.size, 15);
    $("#opened-count").textContent = String(count);
    $("#message-progress-fill").style.transform = `scaleX(${count / 15})`;
  }

  function openMessage(message, index) {
    openedMessages.add(message.id);
    safeStorageSet("season15:openedMessages", JSON.stringify([...openedMessages]));
    updateMessageProgress();
    $("#message-dialog-number").textContent = `Note ${String(index + 1).padStart(2, "0")} · one of fifteen`;
    $("#message-dialog-title").textContent = `A little thing I love`;
    $("#message-dialog-copy").textContent = message.text;
    messageDialog.showModal();
    syncBodyLock();
  }

  function renderLetter() {
    const copy = $("#letter-copy");
    const greeting = (content.letter.greeting || `Dear ${content.sister.displayName},`).replace(
      "[HER NAME]",
      content.sister.displayName,
    );
    $(".birthday-letter__dear").textContent = greeting;
    if (content.letter.isSample) {
      const label = document.createElement("span");
      label.className = "birthday-letter__sample";
      label.textContent = content.letter.label || "sample letter — replace in content.js";
      copy.append(label);
    }
    content.letter.paragraphs.forEach((paragraph) => {
      const node = document.createElement("p");
      node.textContent = paragraph;
      copy.append(node);
    });
    if (content.letter.signoff) $('[data-bind="sender.signoff"]').textContent = content.letter.signoff;
  }

  function renderBonusScene() {
    const bonus = content.bonusScene;
    if (!bonus?.enabled || !bonus.photo || !bonus.caption) return;
    const slot = $("#bonus-scene-slot");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bonus-shell";
    button.setAttribute("aria-label", "Open the hidden deleted scene");
    button.textContent = "🐚";
    button.addEventListener("click", () => {
      $("#bonus-image").src = bonus.photo;
      $("#bonus-image").alt = bonus.alt || "Funny sibling bonus memory";
      $("#bonus-caption").textContent = bonus.caption;
      $("#bonus-dialog").showModal();
      syncBodyLock();
    });
    slot.append(button);
  }

  const viewer = $("#photo-viewer");
  let viewerIndex = 0;
  let viewerSwipeStart = null;

  function openViewerById(id) {
    const index = viewerPhotos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    viewerIndex = index;
    renderViewer();
    viewer.showModal();
    syncBodyLock();
  }

  function renderViewer() {
    const photo = viewerPhotos[viewerIndex];
    const image = $("#viewer-image");
    const placeholder = $("#viewer-placeholder");
    image.hidden = false;
    placeholder.hidden = true;
    image.alt = photo.alt || "Birthday memory";
    image.src = photo.path;
    image.onload = () => {
      image.hidden = false;
      placeholder.hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      placeholder.hidden = false;
    };
    $("#viewer-chapter").textContent = photo.chapterLabel || "A favourite scene";
    $("#viewer-caption").textContent = photo.shortCaption || "A moment worth keeping";
    $("#viewer-memory").textContent = photo.longMemory || "Add the story behind this photo in content.js.";
    $("#viewer-count").textContent = `${String(viewerIndex + 1).padStart(2, "0")} / ${String(viewerPhotos.length).padStart(2, "0")}`;
  }

  function moveViewer(direction) {
    viewerIndex = (viewerIndex + direction + viewerPhotos.length) % viewerPhotos.length;
    renderViewer();
  }

  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
    syncBodyLock();
  }

  function setupDialogs() {
    $("#viewer-close").addEventListener("click", () => closeDialog(viewer));
    $("#viewer-prev").addEventListener("click", () => moveViewer(-1));
    $("#viewer-next").addEventListener("click", () => moveViewer(1));
    $("#message-dialog-close").addEventListener("click", () => closeDialog(messageDialog));
    $("#bonus-close").addEventListener("click", () => closeDialog($("#bonus-dialog")));

    [viewer, messageDialog, $("#bonus-dialog")].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog || event.target.classList.contains("photo-viewer__panel")) {
          closeDialog(dialog);
        }
      });
      dialog.addEventListener("close", syncBodyLock);
    });

    viewer.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") viewerSwipeStart = event.clientX;
    });
    viewer.addEventListener("pointerup", (event) => {
      if (viewerSwipeStart === null || event.pointerType !== "touch") return;
      const distance = event.clientX - viewerSwipeStart;
      viewerSwipeStart = null;
      if (Math.abs(distance) > 55) moveViewer(distance > 0 ? -1 : 1);
    });
    viewer.addEventListener("pointercancel", () => {
      viewerSwipeStart = null;
    });

    document.addEventListener("keydown", (event) => {
      if (!viewer.open) return;
      if (event.key === "ArrowLeft") moveViewer(-1);
      if (event.key === "ArrowRight") moveViewer(1);
    });
  }

  function setupTimelineControls() {
    const viewport = $("#timeline-viewport");
    const move = (direction) => {
      viewport.scrollBy({
        left: direction * Math.max(viewport.clientWidth * 0.78, 280),
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    };
    $("#timeline-prev").addEventListener("click", () => move(-1));
    $("#timeline-next").addEventListener("click", () => move(1));
    viewport.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    });
  }

  const episodePlayer = $("#episode-player");
  const episodeShots = [$("#episode-shot-a"), $("#episode-shot-b")];
  const requestedEpisodeIds = content.film?.photoIds || viewerPhotos.map((photo) => photo.id);
  const episodePhotos = requestedEpisodeIds.map((id) => photoRegistry.get(id)).filter(Boolean);
  const episodeFeature = photoRegistry.get(content.hero?.centralPhotoId) || episodePhotos.at(-1);
  const episodeScenes = [
    {
      path: content.hero?.sceneryPath,
      focalPoint: "50% 50%",
      kicker: "Season 15 · birthday edition",
      title: "The Summer She Turned Fifteen",
      caption: `Starring ${content.sister.displayName}.`,
      duration: content.film?.introDuration || 4200,
    },
    ...episodePhotos.map((photo, index) => ({
      path: photo.path,
      focalPoint: photo.focalPoint || "50% 50%",
      kicker: `${photo.chapterLabel || "A favourite memory"} · scene ${String(index + 1).padStart(2, "0")}`,
      title: photo.shortCaption || "A moment worth keeping",
      caption: photo.videoCaption || "A little moment worth remembering.",
      duration: content.film?.sceneDuration || 4400,
    })),
    {
      path: episodeFeature?.path || content.hero?.sceneryPath,
      focalPoint: episodeFeature?.focalPoint || "50% 50%",
      kicker: "End credits · and a brand-new beginning",
      title: `Happy 15th, ${content.sister.displayName}.`,
      caption: "Season 15 has only just begun.",
      duration: content.film?.outroDuration || 5600,
    },
  ].filter((scene) => scene.path);

  let episodeIndex = 0;
  let episodeActiveShot = 0;
  let episodeTimer = null;
  let episodeStartedAt = 0;
  let episodeRemaining = 0;
  let episodePlaying = false;
  let episodeEnded = false;
  let episodeSceneToken = 0;

  function renderEpisodeProgress() {
    const progress = $("#episode-progress");
    progress.replaceChildren();
    episodeScenes.forEach((_, index) => {
      const segment = document.createElement("span");
      const fill = document.createElement("i");
      segment.dataset.scene = String(index);
      segment.append(fill);
      progress.append(segment);
    });
  }

  function currentEpisodeFill() {
    return $(`[data-scene="${episodeIndex}"] i`, $("#episode-progress"));
  }

  function freezeEpisodeProgress() {
    const fill = currentEpisodeFill();
    if (!fill) return;
    const segmentWidth = fill.parentElement.getBoundingClientRect().width;
    const fillWidth = fill.getBoundingClientRect().width;
    const percent = segmentWidth > 0 ? Math.min((fillWidth / segmentWidth) * 100, 100) : 0;
    fill.style.transition = "none";
    fill.style.width = `${percent}%`;
  }

  function resetEpisodeProgress() {
    $$("span", $("#episode-progress")).forEach((segment, index) => {
      const fill = $("i", segment);
      fill.style.transition = "none";
      fill.style.width = index < episodeIndex ? "100%" : "0%";
    });
  }

  function clearEpisodeTimer() {
    window.clearTimeout(episodeTimer);
    episodeTimer = null;
  }

  function updateEpisodePlayButton() {
    const button = $("#episode-play");
    const icon = $("span", button);
    const label = $("strong", button);
    button.setAttribute("aria-pressed", String(episodePlaying));
    if (episodeEnded) {
      icon.textContent = "↺";
      label.textContent = "Replay";
      button.setAttribute("aria-label", "Replay Doji's birthday film");
    } else if (episodePlaying) {
      icon.textContent = "Ⅱ";
      label.textContent = "Pause";
      button.setAttribute("aria-label", "Pause Doji's birthday film");
    } else {
      icon.textContent = "▶";
      label.textContent = "Resume";
      button.setAttribute("aria-label", "Resume Doji's birthday film");
    }
  }

  function endEpisode() {
    clearEpisodeTimer();
    const fill = currentEpisodeFill();
    if (fill) {
      fill.style.transition = "none";
      fill.style.width = "100%";
    }
    episodePlaying = false;
    episodeEnded = true;
    episodeRemaining = 0;
    episodePlayer.classList.add("is-ended");
    updateEpisodePlayButton();
  }

  function scheduleEpisodeScene() {
    clearEpisodeTimer();
    if (!episodePlaying || episodeEnded || !episodePlayer.open) return;
    const fill = currentEpisodeFill();
    if (fill) {
      fill.style.transition = "none";
      void fill.offsetWidth;
      fill.style.transition = `width ${episodeRemaining}ms linear`;
      fill.style.width = "100%";
    }
    episodeStartedAt = performance.now();
    episodeTimer = window.setTimeout(() => {
      if (episodeIndex >= episodeScenes.length - 1) endEpisode();
      else showEpisodeScene(episodeIndex + 1);
    }, episodeRemaining);
  }

  function commitEpisodeScene(scene, incomingIndex, token) {
    if (token !== episodeSceneToken || !episodePlayer.open) return;
    const outgoing = episodeShots[episodeActiveShot];
    const incoming = episodeShots[incomingIndex];
    outgoing.classList.remove("is-current");
    outgoing.classList.add("is-leaving");
    incoming.classList.remove("is-current", "is-leaving");
    void incoming.offsetWidth;
    incoming.classList.add("is-current");
    window.setTimeout(() => outgoing.classList.remove("is-leaving"), reducedMotion.matches ? 0 : 950);
    episodeActiveShot = incomingIndex;
    scheduleEpisodeScene();

    const nextScene = episodeScenes[episodeIndex + 1];
    if (nextScene) {
      const preload = new Image();
      preload.src = nextScene.path;
    }
  }

  function showEpisodeScene(nextIndex) {
    if (!episodeScenes.length) return;
    clearEpisodeTimer();
    episodeIndex = Math.max(0, Math.min(nextIndex, episodeScenes.length - 1));
    episodeEnded = false;
    episodePlayer.classList.toggle("is-ended", episodeIndex === episodeScenes.length - 1 && episodeEnded);
    const scene = episodeScenes[episodeIndex];
    episodeRemaining = scene.duration;
    resetEpisodeProgress();
    $("#episode-kicker").textContent = scene.kicker;
    $("#episode-title").textContent = scene.title;
    $("#episode-caption").textContent = scene.caption;
    $("#episode-counter").textContent = `${String(episodeIndex + 1).padStart(2, "0")} / ${String(episodeScenes.length).padStart(2, "0")}`;
    updateEpisodePlayButton();

    const incomingIndex = episodeActiveShot === 0 ? 1 : 0;
    const incoming = episodeShots[incomingIndex];
    const token = ++episodeSceneToken;
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      commitEpisodeScene(scene, incomingIndex, token);
    };
    incoming.onload = commit;
    incoming.onerror = commit;
    incoming.style.setProperty("--episode-focus", scene.focalPoint);
    incoming.style.setProperty("--episode-duration", `${scene.duration}ms`);
    incoming.src = scene.path;
    if (incoming.complete) queueMicrotask(commit);
  }

  function pauseEpisode() {
    if (!episodePlaying) return;
    if (episodeTimer) {
      episodeRemaining = Math.max(120, episodeRemaining - (performance.now() - episodeStartedAt));
      freezeEpisodeProgress();
    }
    clearEpisodeTimer();
    episodePlaying = false;
    updateEpisodePlayButton();
  }

  function resumeEpisode() {
    if (episodeEnded) {
      episodePlaying = true;
      showEpisodeScene(0);
      return;
    }
    if (episodePlaying) return;
    episodePlaying = true;
    updateEpisodePlayButton();
    scheduleEpisodeScene();
  }

  function openEpisode() {
    if (!content.film?.enabled || episodeScenes.length < 2) return false;
    episodePlaying = true;
    episodeEnded = false;
    episodePlayer.classList.remove("is-ended");
    episodePlayer.showModal();
    syncBodyLock();
    showEpisodeScene(0);
    $("#episode-close").focus({ preventScroll: true });
    return true;
  }

  function closeEpisode({ explore = false } = {}) {
    pauseEpisode();
    if (episodePlayer.open) episodePlayer.close();
    syncBodyLock();
    if (explore) {
      window.setTimeout(() => {
        $("#timeline").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
      }, 30);
    }
  }

  function setupEpisode() {
    renderEpisodeProgress();
    $("#episode-close").addEventListener("click", () => closeEpisode());
    $("#episode-explore").addEventListener("click", () => closeEpisode({ explore: true }));
    $("#episode-prev").addEventListener("click", () => showEpisodeScene(episodeIndex - 1));
    $("#episode-next").addEventListener("click", () => {
      if (episodeIndex >= episodeScenes.length - 1) endEpisode();
      else showEpisodeScene(episodeIndex + 1);
    });
    $("#episode-play").addEventListener("click", () => {
      if (episodePlaying) pauseEpisode();
      else resumeEpisode();
    });
    $("#episode-soundtrack").addEventListener("click", () => {
      closeEpisode();
      openBirthdayVideo({ play: true });
    });
    episodePlayer.addEventListener("close", () => {
      pauseEpisode();
      syncBodyLock();
    });
    episodePlayer.addEventListener("keydown", (event) => {
      if (!episodePlayer.open) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showEpisodeScene(episodeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (episodeIndex >= episodeScenes.length - 1) endEpisode();
        else showEpisodeScene(episodeIndex + 1);
      }
      if (event.key === " " && !event.target.closest("button, a, iframe")) {
        event.preventDefault();
        if (episodePlaying) pauseEpisode();
        else resumeEpisode();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && episodePlayer.open) pauseEpisode();
    });
  }

  const premiereDialog = $("#premiere-dialog");
  const birthdayFilmDialog = $("#birthday-film-dialog");
  const birthdayVideo = $("#birthday-video");
  const musicToggle = $("#music-toggle");

  function showToast(message) {
    const toast = $("#status-toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function closePremiere() {
    if (premiereDialog.open) premiereDialog.close();
    syncBodyLock();
  }

  function closeBirthdayVideo() {
    birthdayVideo.pause();
    if (birthdayFilmDialog.open) birthdayFilmDialog.close();
    syncBodyLock();
  }

  function openBirthdayVideo({ play = false } = {}) {
    if (!content.video?.enabled || !content.video.src) return false;
    closePremiere();
    if (episodePlayer.open) {
      pauseEpisode();
      episodePlayer.close();
    }
    if (!birthdayFilmDialog.open) birthdayFilmDialog.showModal();
    syncBodyLock();
    if (play) {
      const playRequest = birthdayVideo.play();
      if (playRequest) {
        playRequest.catch(() => showToast("Tap play to begin Doji's birthday film."));
      }
    }
    return true;
  }

  function setupBirthdayVideo() {
    const videoConfig = content.video || {};
    const source = $("source", birthdayVideo);
    source.src = videoConfig.src || source.src;
    birthdayVideo.poster = videoConfig.poster || birthdayVideo.poster;
    $("#birthday-film-title").textContent = videoConfig.title || "The Summer She Turned Fifteen";
    $("#film-download").href = videoConfig.src || source.src;
    $("#film-download").download = videoConfig.downloadName || "Doji-15th-Birthday-Film.mp4";
    $(".birthday-film-dialog__meta p").innerHTML = `<span aria-hidden="true">♪</span> ${videoConfig.soundtrack || "birthday soundtrack"}`;
    $(".birthday-film-dialog__meta > span").textContent = `${videoConfig.durationLabel || "00:36"} · portrait film`;
    birthdayVideo.load();

    $("#premiere-close").addEventListener("click", closePremiere);
    $("#premiere-explore").addEventListener("click", () => {
      closePremiere();
      $("#timeline").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
    $("#premiere-watch").addEventListener("click", () => openBirthdayVideo({ play: true }));
    $("#birthday-film-close").addEventListener("click", closeBirthdayVideo);
    $("#film-interactive").addEventListener("click", () => {
      closeBirthdayVideo();
      openEpisode();
    });
    musicToggle.addEventListener("click", () => openBirthdayVideo({ play: true }));

    [premiereDialog, birthdayFilmDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        if (dialog === birthdayFilmDialog) closeBirthdayVideo();
        else closePremiere();
      });
      dialog.addEventListener("close", () => {
        if (dialog === birthdayFilmDialog) birthdayVideo.pause();
        syncBodyLock();
      });
    });

    birthdayVideo.addEventListener("play", () => musicToggle.classList.add("is-playing"));
    birthdayVideo.addEventListener("pause", () => musicToggle.classList.remove("is-playing"));
    birthdayVideo.addEventListener("ended", () => {
      musicToggle.classList.remove("is-playing");
      showToast("Happy 15th, Doji ♡ You can download the film to keep it.");
    });
    birthdayVideo.addEventListener("error", () => showToast("The film could not load. Try the download button instead."));

    window.setTimeout(() => {
      if (!premiereDialog.open && !birthdayFilmDialog.open && !document.querySelector("dialog[open]")) {
        premiereDialog.showModal();
        syncBodyLock();
      }
    }, reducedMotion.matches ? 100 : 650);
  }

  function setupStartButton() {
    $("#start-story").addEventListener("click", (event) => {
      event.preventDefault();
      const openedVideo = openBirthdayVideo({ play: true });
      if (!openedVideo) {
        $("#timeline").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
    });
  }

  function setupEnvelope() {
    const button = $("#envelope-button");
    const stage = $("#letter-stage");
    const letter = $("#birthday-letter");
    button.addEventListener("click", () => {
      const willOpen = !stage.classList.contains("is-open");
      if (willOpen) {
        stage.style.setProperty("--letter-open-height", `${letter.scrollHeight + 180}px`);
      }
      stage.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
      letter.setAttribute("aria-hidden", String(!willOpen));
      if (willOpen) {
        window.setTimeout(() => letter.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" }), reducedMotion.matches ? 0 : 520);
      }
    });
  }

  function addConfetti() {
    const container = $("#confetti");
    container.replaceChildren();
    if (reducedMotion.matches) return;
    const colors = ["#F6B8A4", "#EBC6CF", "#BCD7E3", "#F4DE9B", "#934C40"];
    for (let index = 0; index < 36; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.setProperty("--piece-color", colors[index % colors.length]);
      piece.style.setProperty("--piece-x", `${-340 + Math.random() * 680}px`);
      piece.style.setProperty("--piece-y", `${-210 + Math.random() * 390}px`);
      piece.style.setProperty("--piece-r", `${-420 + Math.random() * 840}deg`);
      piece.style.setProperty("--piece-delay", `${Math.random() * 0.18}s`);
      container.append(piece);
    }
  }

  function makeWish() {
    const cake = $("#birthday-cake");
    const button = $("#wish-button");
    cake.classList.add("is-blown");
    cake.setAttribute("aria-label", "A birthday cake with fifteen extinguished candles");
    button.disabled = true;
    button.querySelector("span").textContent = "Wish made";
    $("#birthday-reveal").hidden = false;
    $("#replay-button").hidden = false;
    addConfetti();
    window.setTimeout(() => $("#replay-button").focus({ preventScroll: true }), reducedMotion.matches ? 0 : 450);
  }

  function replayWish() {
    const cake = $("#birthday-cake");
    const button = $("#wish-button");
    cake.classList.remove("is-blown");
    cake.setAttribute("aria-label", "A birthday cake with fifteen lit candles");
    button.disabled = false;
    button.querySelector("span").textContent = "Make a wish";
    $("#birthday-reveal").hidden = true;
    $("#replay-button").hidden = true;
    $("#confetti").replaceChildren();
    if (!reducedMotion.matches) {
      window.setTimeout(() => button.focus({ preventScroll: true }), 150);
    } else {
      button.focus({ preventScroll: true });
    }
  }

  function setupCelebration() {
    $("#wish-button").addEventListener("click", makeWish);
    $("#replay-button").addEventListener("click", replayWish);
  }

  function setupScrollEffects() {
    const nav = $("#site-nav");
    const progress = $("#reading-progress-fill");
    let ticking = false;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const amount = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
      progress.style.transform = `scaleX(${amount})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8%" },
    );
    $$(".reveal").forEach((element) => observer.observe(element));
  }

  function validateContent() {
    if (content.messages.length !== 15) {
      console.warn(`Birthday content should include exactly 15 messages; found ${content.messages.length}.`);
    }
    if (content.sister.age !== 15) {
      console.warn("This experience is designed for a fifteenth birthday.");
    }
  }

  bindContent();
  validateContent();
  renderHero();
  renderTimeline();
  renderScrapbook();
  renderMessages();
  renderLetter();
  renderBonusScene();
  setupDialogs();
  setupTimelineControls();
  setupEpisode();
  setupBirthdayVideo();
  setupStartButton();
  setupEnvelope();
  setupCelebration();
  setupScrollEffects();
  $("#scrapbook-tidy").addEventListener("click", tidyScrapbook);
})();
