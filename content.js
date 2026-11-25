(() => {
  if (globalThis.__auraPrototypeInstalled) return;
  globalThis.__auraPrototypeInstalled = true;

  const api = globalThis.browser ?? globalThis.chrome;
  const promiseApi = Boolean(globalThis.browser);
  const profiles = globalThis.AURA_PROFILES ?? {};
  const styleId = "aura-accessibility-prototype-style";
  const textOriginals = new WeakMap();
  const originalThemeVars = new Map();
  const iconClass = "aura-prototype-icon-boost";
  const excludedText = "script,style,noscript,textarea,input,select,option,button,[contenteditable='true'],#aura-prototype-notice";
  const state = { active: false, profile: "protanopia", clarify: false, language: "en-US", allowRemote: false, ttsEnabled: true };
  let hadActiveClass = false;
  let observer = null;
  let speechTimer = null;
  let noticeTimer = null;
  let lastPoint = null;
  let notice = null;
  let voiceMessage = "";

  function call(namespace, method, ...args) {
    const fn = namespace[method].bind(namespace);
    if (promiseApi) return fn(...args);
    return new Promise((resolve, reject) => {
      fn(...args, (value) => {
        const error = api.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(value);
      });
    });
  }

  function css() {
    return `
      html.aura-prototype-active { background: var(--aura-bg) !important; color: var(--aura-fg) !important; }
      html.aura-prototype-active body { background-color: var(--aura-bg) !important; color: var(--aura-fg) !important; line-height: 1.65 !important; }
      html.aura-prototype-active main, html.aura-prototype-active article,
      html.aura-prototype-active section, html.aura-prototype-active nav,
      html.aura-prototype-active header, html.aura-prototype-active footer,
      html.aura-prototype-active aside, html.aura-prototype-active blockquote,
      html.aura-prototype-active fieldset, html.aura-prototype-active table,
      html.aura-prototype-active td, html.aura-prototype-active th { background-color: var(--aura-surface) !important; }
      html.aura-prototype-active p, html.aura-prototype-active li,
      html.aura-prototype-active dd, html.aura-prototype-active dt,
      html.aura-prototype-active blockquote, html.aura-prototype-active figcaption,
      html.aura-prototype-active td, html.aura-prototype-active th { line-height: 1.7 !important; }
      html.aura-prototype-active h1, html.aura-prototype-active h2,
      html.aura-prototype-active h3, html.aura-prototype-active h4 { line-height: 1.35 !important; }
      html.aura-prototype-active body *:not(svg):not(svg *) { color: var(--aura-fg) !important; }
      html.aura-prototype-active body, html.aura-prototype-active main,
      html.aura-prototype-active article, html.aura-prototype-active section,
      html.aura-prototype-active nav, html.aura-prototype-active header,
      html.aura-prototype-active footer, html.aura-prototype-active aside,
      html.aura-prototype-active p, html.aura-prototype-active li,
      html.aura-prototype-active h1, html.aura-prototype-active h2,
      html.aura-prototype-active h3, html.aura-prototype-active h4,
      html.aura-prototype-active label, html.aura-prototype-active td,
      html.aura-prototype-active th { color: var(--aura-fg) !important; }
      html.aura-prototype-active body a:link, html.aura-prototype-active body a:link *:not(svg):not(svg *),
      html.aura-prototype-active body [role='link'], html.aura-prototype-active body [role='link'] *:not(svg):not(svg *) { color: var(--aura-link) !important; text-decoration-line: underline !important; text-decoration-thickness: 0.12em !important; text-decoration-style: solid !important; }
      html.aura-prototype-active body a:visited, html.aura-prototype-active body a:visited *:not(svg):not(svg *) { color: var(--aura-visited) !important; text-decoration-line: underline !important; text-decoration-thickness: 0.14em !important; text-decoration-style: double !important; }
      html.aura-prototype-active body [role='alert'], html.aura-prototype-active body [aria-invalid='true'],
      html.aura-prototype-active body .error, html.aura-prototype-active body .danger,
      html.aura-prototype-active body [data-status='error'], html.aura-prototype-active body [data-state='error'] { color: var(--aura-danger) !important; border-color: var(--aura-danger) !important; }
      html.aura-prototype-active body .success, html.aura-prototype-active body [data-status='success'],
      html.aura-prototype-active body [data-state='success'] { color: var(--aura-success) !important; border-color: var(--aura-success) !important; }
      html.aura-prototype-active body .warning, html.aura-prototype-active body [data-status='warning'],
      html.aura-prototype-active body [data-state='warning'] { color: var(--aura-warning) !important; border-color: var(--aura-warning) !important; }
      html.aura-prototype-active body [role='alert'] { border-style: dashed !important; }
      html.aura-prototype-active body [role='status'] { border-inline-start: 4px solid var(--aura-success) !important; }
      html.aura-prototype-active body [role='alert'] svg, html.aura-prototype-active body [data-status='error'] svg,
      html.aura-prototype-active body [data-status='success'] svg { fill: currentColor !important; stroke: currentColor !important; }
      html.aura-prototype-active button, html.aura-prototype-active [role='button'],
      html.aura-prototype-active input, html.aura-prototype-active select,
      html.aura-prototype-active textarea { border-color: var(--aura-accent) !important; }
      html.aura-prototype-active input, html.aura-prototype-active select,
      html.aura-prototype-active textarea { background-color: var(--aura-surface) !important; color: var(--aura-fg) !important; }
      html.aura-prototype-active button, html.aura-prototype-active [role='button'] { background-color: var(--aura-surface) !important; color: var(--aura-fg) !important; }
      html.aura-prototype-active input::placeholder, html.aura-prototype-active textarea::placeholder { color: var(--aura-fg) !important; opacity: .75 !important; }
      html.aura-prototype-active :focus-visible { outline: 3px solid var(--aura-accent) !important; outline-offset: 2px !important; }
      html.aura-prototype-active .${iconClass} { transform: scale(1.5) !important; transform-origin: center !important; }
      #aura-prototype-notice { position: fixed; z-index: 2147483647; right: 16px; bottom: 16px; max-width: min(360px, calc(100vw - 32px)); padding: 10px 14px; border: 2px solid #f4b942; border-radius: 10px; background: #172033; color: #fff; font: 14px/1.45 system-ui, sans-serif; box-shadow: 0 4px 22px #0007; pointer-events: none; }
    `;
  }

  function setTheme() {
    const profile = profiles[state.profile] ?? profiles.protanopia;
    if (!profile) return;
    for (const [key, value] of Object.entries(profile)) {
      if (key === "name" || typeof value !== "string") continue;
      const property = `--aura-${key}`;
      if (!originalThemeVars.has(property)) originalThemeVars.set(property, [document.documentElement.style.getPropertyValue(property), document.documentElement.style.getPropertyPriority(property)]);
      document.documentElement.style.setProperty(property, value);
    }
  }

  function ensureStyle() {
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = css();
  }

  function makeNotice() {
    if (notice?.isConnected) return notice;
    notice = document.createElement("div");
    notice.id = "aura-prototype-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;
    document.documentElement.appendChild(notice);
    return notice;
  }

  function showNotice(message, duration = 2800) {
    const box = makeNotice();
    box.textContent = message;
    box.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { if (box.isConnected) box.hidden = true; }, duration);
  }

  function visitElements(root, selector, callback) {
    if (!root) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.matches(selector)) callback(root);
    if (root.querySelectorAll) root.querySelectorAll(selector).forEach(callback);
  }

  function boostIcons(root = document) {
    visitElements(root, "svg, img, [role='img'], i[class*='icon'], span[class*='icon-']", (element) => {
      if (element.closest("#aura-prototype-notice")) return;
      const control = element.closest("button, a, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [tabindex]:not([tabindex='-1']), input[type='image']");
      if (!control) return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.width > 72 || rect.height > 72) return;
      const isIconLike = element.tagName.toLowerCase() === "svg" ||
        element.tagName.toLowerCase() === "i" ||
        element.getAttribute("role") === "img" ||
        element.matches("span[class*='icon-']") ||
        (element.tagName.toLowerCase() === "img" && (element.alt === "" || element.hasAttribute("aria-hidden")));
      if (isIconLike) element.classList.add(iconClass);
    });
  }

  const replacements = {
    "en-US": [
      ["in the event that", "if"], ["for the purpose of", "to"], ["in order to", "to"],
      ["upon completion", "after"], ["prior to", "before"], ["in addition", "also"],
      ["approximately", "about"], ["subsequently", "later"], ["consequently", "so"],
      ["regarding", "about"], ["concerning", "about"], ["utilize", "use"],
      ["commence", "start"], ["terminate", "end"], ["assistance", "help"],
      ["assist", "help"], ["facilitate", "help"], ["purchase", "buy"],
      ["additional", "more"], ["demonstrate", "show"], ["indicate", "show"],
      ["require", "need"], ["obtain", "get"], ["attempt", "try"],
      ["endeavour", "try"], ["endeavor", "try"], ["sufficient", "enough"],
      ["numerous", "many"], ["individuals", "people"], ["substantial", "large"],
      ["modification", "change"], ["modify", "change"], ["finalize", "finish"]
    ],
    "sv-SE": [
      ["i enlighet med", "enligt"], ["i syfte att", "för att"], ["i samband med", "när"],
      ["tillhandahålla", "ge"], ["följaktligen", "därför"], ["efterföljande", "nästa"],
      ["beträffande", "om"], ["avseende", "om"], ["ytterligare", "mer"],
      ["erhålla", "få"], ["erhöll", "fick"], ["påbörja", "börja"],
      ["påbörjas", "börja"], ["påbörjades", "började"], ["assistera", "hjälpa"],
      ["bistå", "hjälpa"], ["inköpa", "köpa"], ["anskaffa", "skaffa"],
      ["demonstrera", "visa"], ["indikera", "visa"], ["erfordra", "behöva"],
      ["identifiera", "hitta"], ["implementera", "genomföra"], ["utföra", "göra"],
      ["säkerställa", "se till"], ["möjliggöra", "göra möjligt"], ["försöka", "prova"],
      ["ytterligare", "mer"]
    ]
  };

  const explanations = {
    "en-US": new Map([
      ["photophobia", "Sensitivity to bright light."],
      ["contrast sensitivity", "How easily someone can see the difference between light and dark."],
      ["astigmatism", "A vision condition that can make edges or text look blurred."],
      ["accessibility", "Making a page or tool easier for people with different needs to use."],
      ["interface", "The part of a website or app that you see and use."],
      ["achromatopsia", "A condition where a person sees without color."],
      ["protanopia", "A type of color vision where reds can look unusually dark."],
      ["deuteranopia", "A type of color vision where reds and greens can look alike."],
      ["tritanopia", "A type of color vision where blues and yellows can look alike."]
    ]),
    "sv-SE": new Map([
      ["ljuskänslighet", "Att starkt ljus känns obehagligt."],
      ["kontrastkänslighet", "Hur lätt någon ser skillnaden mellan ljust och mörkt."],
      ["tillgänglighet", "Att en sida eller ett verktyg är lättare för fler personer att använda."],
      ["gränssnitt", "Den del av en webbplats eller app som du ser och använder."],
      ["färgblindhet", "Ett sätt att se färger där vissa färger kan se lika ut."],
      ["protanopi", "En typ av färgseende där rött kan se ovanligt mörkt ut."],
      ["deuteranopi", "En typ av färgseende där rött och grönt kan se lika ut."],
      ["tritanopi", "En typ av färgseende där blått och gult kan se lika ut."]
    ])
  };

  function simplify(value, lang = state.language) {
    let result = value;
    for (const [from, to] of (replacements[lang] ?? [])) {
      const phrase = from.replaceAll(" ", "\\s+");
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${phrase})(?=$|[^\\p{L}\\p{N}_])`, "giu");
      result = result.replace(regex, (_matched, prefix, matched) => `${prefix}${matched[0] === matched[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to}`);
    }
    return result;
  }

  function textNodes(root = document) {
    if (root?.nodeType === Node.TEXT_NODE) {
      return root.parentElement && !root.parentElement.closest(excludedText) && root.data.trim() ? [root] : [];
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(excludedText) || !node.data.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const found = [];
    while (walker.nextNode()) found.push(walker.currentNode);
    return found;
  }

  function clarifyText(root = document) {
    for (const node of textNodes(root)) {
      if (!textOriginals.has(node)) textOriginals.set(node, { original: node.data, applied: node.data });
      const record = textOriginals.get(node);
      const original = record.original;
      const replacement = simplify(original);
      record.applied = replacement;
      if (replacement !== node.data) node.data = replacement;
    }
  }

  function restoreText(root = document) {
    for (const node of textNodes(root)) {
      if (textOriginals.has(node)) {
        const record = textOriginals.get(node);
        if (node.data === record.applied) node.data = record.original;
        textOriginals.delete(node);
      }
    }
  }

  function startObserver() {
    observer?.disconnect();
    observer = new MutationObserver((records) => {
      if (!state.active) return;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) continue;
          if (state.clarify) clarifyText(node);
          boostIcons(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function sentenceAt(text, offset) {
    if (!text.trim()) return "";
    try {
      if (Intl.Segmenter) {
        const segments = new Intl.Segmenter(state.language, { granularity: "sentence" }).segment(text);
        for (const part of segments) {
          if (offset >= part.index && offset <= part.index + part.segment.length) return part.segment.trim();
        }
      }
    } catch (_) { /* use punctuation fallback */ }
    const boundaries = /[^.!?。！？\n]+(?:[.!?。！？]+|\n|$)/g;
    for (const match of text.matchAll(boundaries)) {
      if (offset >= match.index && offset <= match.index + match[0].length) return match[0].trim();
    }
    return text.trim();
  }

  function getSentenceAtPoint(x, y, target) {
    let position = null;
    try {
      if (document.caretPositionFromPoint) position = document.caretPositionFromPoint(x, y);
      else if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(x, y);
        if (range) position = { offsetNode: range.startContainer, offset: range.startOffset };
      }
    } catch (_) { /* unsupported hit testing on this element */ }

    let node = position?.offsetNode;
    if (node?.nodeType !== Node.TEXT_NODE || !node.data.trim()) {
      const block = target?.closest("p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,label") || target;
      const value = block?.textContent?.trim() ?? "";
      return value ? sentenceAt(value, 0) : "";
    }

    const block = node.parentElement?.closest("p,li,dd,dt,blockquote,figcaption,h1,h2,h3,h4,h5,h6,label") || node.parentElement;
    if (!block) return sentenceAt(node.data, position.offset);
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let offsetInBlock = 0;
    let current;
    while ((current = walker.nextNode())) {
      if (current === node) { offsetInBlock += position.offset; break; }
      offsetInBlock += current.data.length;
    }
    return sentenceAt(block.textContent ?? node.data, offsetInBlock);
  }

  function chooseVoice() {
    const voices = speechSynthesis.getVoices();
    const languagePrefix = state.language.slice(0, 2).toLowerCase();
    const matching = voices.filter((voice) => (voice.lang || "").toLowerCase().startsWith(languagePrefix));
    const local = matching.filter((voice) => voice.localService === true);
    const candidates = state.allowRemote ? matching : local;
    if (!candidates.length) {
      voiceMessage = state.allowRemote
        ? `No ${languagePrefix === "sv" ? "Swedish" : "English"} voice is available in this browser.`
        : `No local ${languagePrefix === "sv" ? "Swedish" : "English"} voice found. Install a voice or enable online voices.`;
      return null;
    }
    voiceMessage = "";
    const selectedId = state.voiceId ?? "";
    const selected = candidates.find((voice) => `${voice.name}\u001f${voice.lang}\u001f${voice.voiceURI}` === selectedId);
    return selected ?? local.find((voice) => voice.default) ?? local[0] ?? candidates.find((voice) => voice.default) ?? candidates[0];
  }

  function speakAt(x, y, target) {
    if (!state.active || !state.ttsEnabled) return;
    const sentence = getSentenceAtPoint(x, y, target);
    if (!sentence) return;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = state.language;
    const voice = chooseVoice();
    if (!voice) {
      showNotice(voiceMessage, 3800);
      return;
    }
    utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  function explainAt(target, x, y) {
    if (!state.clarify) return;
    const sentence = target?.textContent?.trim() ?? "";
    if (!sentence) return;
    const entries = explanations[state.language] ?? new Map();
    for (const [term, explanation] of entries) {
      if (sentence.toLowerCase().includes(term)) {
        const box = makeNotice();
        box.textContent = `${term}: ${explanation}`;
        box.hidden = false;
        box.style.right = "auto";
        box.style.bottom = "auto";
        box.style.left = `${Math.max(8, Math.min(x + 12, window.innerWidth - 300))}px`;
        box.style.top = `${Math.max(8, Math.min(y + 16, window.innerHeight - 90))}px`;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { if (box.isConnected) box.hidden = true; }, 2600);
        return;
      }
    }
  }

  function onPointerMove(event) {
    if (!state.active || !state.ttsEnabled || event.pointerType === "touch") return;
    if (event.target?.closest("#aura-prototype-notice")) return;
    lastPoint = { x: event.clientX, y: event.clientY, target: event.target };
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
      if (lastPoint) {
        if (state.clarify) explainAt(lastPoint.target, lastPoint.x, lastPoint.y);
        speakAt(lastPoint.x, lastPoint.y, lastPoint.target);
      }
    }, 420);
  }

  function onKeyDown(event) {
    if (event.target?.closest?.("input,textarea,select,[contenteditable='true']")) return;
    if (event.key === "Escape") {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      clearTimeout(speechTimer);
      showNotice("Narration stopped.", 1400);
    } else if (event.key === "F9" && event.shiftKey && "speechSynthesis" in window) {
      event.preventDefault();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      else if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
    }
  }

  function start(settings = {}) {
    Object.assign(state, settings);
    state.ttsEnabled = true;
    state.active = true;
    ensureStyle();
    setTheme();
    hadActiveClass = document.documentElement.classList.contains("aura-prototype-active");
    document.documentElement.classList.add("aura-prototype-active");
    boostIcons(document);
    if (state.clarify) clarifyText(document);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    startObserver();
    showNotice(`Aura active · ${profiles[state.profile]?.name ?? "Visual profile"}`, 2200);
    return { active: true, voiceMessage };
  }

  function update(settings = {}) {
    const wasTtsEnabled = state.ttsEnabled;
    Object.assign(state, settings);
    if (wasTtsEnabled && !state.ttsEnabled) {
      clearTimeout(speechTimer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    setTheme();
    if (state.clarify) clarifyText(document);
    else restoreText(document);
    return { active: state.active, ttsEnabled: state.ttsEnabled, voiceMessage };
  }

  function stop() {
    state.active = false;
    state.ttsEnabled = true;
    clearTimeout(speechTimer);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("keydown", onKeyDown);
    observer?.disconnect();
    restoreText(document);
    document.querySelectorAll(`.${iconClass}`).forEach((element) => element.classList.remove(iconClass));
    if (!hadActiveClass) document.documentElement.classList.remove("aura-prototype-active");
    document.getElementById(styleId)?.remove();
    for (const [property, [value, priority]] of originalThemeVars) {
      if (value) document.documentElement.style.setProperty(property, value, priority);
      else document.documentElement.style.removeProperty(property);
    }
    originalThemeVars.clear();
    hadActiveClass = false;
    notice?.remove();
    notice = null;
    return { active: false, voiceMessage: "" };
  }

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "AURA_VOICES") {
      const voices = "speechSynthesis" in window ? speechSynthesis.getVoices().map((voice) => ({
        name: voice.name, lang: voice.lang, localService: voice.localService === true, voiceURI: voice.voiceURI
      })) : [];
      sendResponse({ voices });
      return false;
    }
    if (message?.type === "AURA_STATUS") {
      sendResponse({ active: state.active, ttsEnabled: state.ttsEnabled, voiceMessage });
      return false;
    }
    if (message?.type === "AURA_START") {
      sendResponse(start(message));
      return false;
    }
    if (message?.type === "AURA_UPDATE") {
      sendResponse(update(message));
      return false;
    }
    if (message?.type === "AURA_STOP") {
      sendResponse(stop());
      return false;
    }
    return false;
  });

  if ("speechSynthesis" in window) speechSynthesis.addEventListener?.("voiceschanged", chooseVoice);
})();
