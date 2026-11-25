(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const promiseApi = Boolean(globalThis.browser);
  const $ = (id) => document.getElementById(id);
  const controls = {
    profile: $("profile"), clarify: $("clarify"), language: $("language"), voice: $("voice"),
    ttsToggle: $("ttsToggle"),
    allowRemote: $("allowRemote"), toggle: $("toggle"), status: $("status"),
    voiceStatus: $("voiceStatus"), refreshVoices: $("refreshVoices")
  };
  let activeTabId = null;
  let active = false;
  let ttsEnabled = true;

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

  async function queryTab() {
    const tabs = await call(api.tabs, "query", { active: true, currentWindow: true });
    return tabs && tabs[0];
  }

  async function send(type, extra = {}) {
    return call(api.tabs, "sendMessage", activeTabId, { type, ...extra });
  }

  async function settings() {
    const stored = await call(api.storage.local, "get", {
      profile: "protanopia", clarify: false, language: "en-US", voiceId: "", allowRemote: false
    });
    const legacy = { redGreen: "deuteranopia", blueYellow: "tritanopia", grayscale: "achromatopsia" };
    if (!globalThis.AURA_PROFILES?.[stored.profile]) stored.profile = legacy[stored.profile] ?? "protanopia";
    return stored;
  }

  async function saveSettings() {
    const value = {
      profile: controls.profile.value,
      clarify: controls.clarify.checked,
      language: controls.language.value,
      voiceId: controls.voice.value,
      allowRemote: controls.allowRemote.checked
    };
    await call(api.storage.local, "set", value);
    if (active && activeTabId !== null) {
      try { await send("AURA_UPDATE", value); } catch (_) { /* tab may have navigated */ }
    }
  }

  async function ensureContentScript() {
    await call(api.scripting, "executeScript", {
      target: { tabId: activeTabId }, files: ["profiles.js", "content.js"]
    });
  }

  async function refreshVoices() {
    controls.voiceStatus.textContent = "Finding voices on this device…";
    try {
      await ensureContentScript();
      const result = await send("AURA_VOICES");
      const previous = controls.voice.value;
      controls.voice.replaceChildren(new Option("Best local voice", ""));
      const voices = (result?.voices ?? []).filter((voice) => {
        const localeMatch = voice.lang?.toLowerCase().startsWith(controls.language.value.slice(0, 2).toLowerCase());
        return localeMatch && (voice.localService || controls.allowRemote.checked);
      });
      for (const voice of voices) {
        const id = `${voice.name}\u001f${voice.lang}\u001f${voice.voiceURI}`;
        const label = `${voice.name} (${voice.lang})${voice.localService ? " · local" : " · online"}`;
        controls.voice.add(new Option(label, id));
      }
      controls.voice.value = [...controls.voice.options].some((option) => option.value === previous) ? previous : "";
      controls.voiceStatus.textContent = voices.length ? `${voices.length} matching voice(s) found.` : "No matching voices found. Install an English/Swedish voice, or explicitly allow online voices.";
    } catch (_) {
      controls.voiceStatus.textContent = "Could not read voices on this tab. Try a regular web page.";
    }
  }

  async function refresh() {
    try {
      const tab = await queryTab();
      activeTabId = tab?.id ?? null;
      const url = tab?.url ?? "";
      const supported = activeTabId !== null && /^(https?|file):/i.test(url);
      controls.toggle.disabled = !supported;
      if (!supported) {
        active = false;
        ttsEnabled = true;
        renderTtsButton();
        controls.status.textContent = "Open a web page to use Aura.";
        controls.toggle.textContent = "Start on this page";
        return;
      }
      try {
        const result = await send("AURA_STATUS");
        active = Boolean(result?.active);
        ttsEnabled = active ? result?.ttsEnabled !== false : true;
        renderTtsButton();
        controls.status.textContent = active ? "Active in this tab" : "Ready for this tab";
        controls.toggle.textContent = active ? "Stop and restore page" : "Start on this page";
        controls.voiceStatus.textContent = result?.voiceMessage ?? "";
      } catch (_) {
        active = false;
        ttsEnabled = true;
        renderTtsButton();
        controls.status.textContent = "Ready for this tab";
        controls.toggle.textContent = "Start on this page";
      }
    } catch (_) {
      active = false;
      ttsEnabled = true;
      renderTtsButton();
      controls.status.textContent = "This tab is not available.";
      controls.toggle.disabled = true;
    }
  }

  function renderTtsButton() {
    controls.ttsToggle.disabled = !active;
    controls.ttsToggle.setAttribute("aria-pressed", String(ttsEnabled));
    controls.ttsToggle.textContent = ttsEnabled ? "Turn TTS off" : "Turn TTS on";
  }

  async function toggleTts() {
    if (!active) {
      ttsEnabled = true;
      renderTtsButton();
      return;
    }
    ttsEnabled = !ttsEnabled;
    renderTtsButton();
    try { await send("AURA_UPDATE", { ttsEnabled }); }
    catch (_) { await refresh(); }
  }

  async function startOrStop() {
    if (active) {
      try { await send("AURA_STOP"); } catch (_) { /* page may have navigated */ }
      active = false;
      await refresh();
      return;
    }
    controls.toggle.disabled = true;
    controls.status.textContent = "Starting on this page…";
    try {
      await call(api.scripting, "executeScript", {
        target: { tabId: activeTabId },
        files: ["profiles.js", "content.js"]
      });
      await send("AURA_START", { ...(await settings()), ttsEnabled: true });
      await refresh();
    } catch (error) {
      controls.status.textContent = "Aura could not run on this page.";
      controls.voiceStatus.textContent = error.message || "Try a regular web page.";
    } finally {
      controls.toggle.disabled = false;
    }
  }

  async function init() {
    const stored = await settings();
    controls.profile.value = stored.profile;
    controls.clarify.checked = stored.clarify;
    controls.language.value = stored.language;
    controls.allowRemote.checked = stored.allowRemote;
    for (const control of [controls.profile, controls.clarify, controls.language, controls.allowRemote, controls.voice]) {
      control.addEventListener("change", saveSettings);
    }
    controls.allowRemote.addEventListener("change", refreshVoices);
    controls.language.addEventListener("change", refreshVoices);
    controls.refreshVoices.addEventListener("click", refreshVoices);
    controls.toggle.addEventListener("click", startOrStop);
    controls.ttsToggle.addEventListener("click", toggleTts);
    renderTtsButton();
    await refresh();
  }

  init().catch(() => { controls.status.textContent = "Aura could not load its settings."; });
})();
