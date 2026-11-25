# Aura Accessibility Prototype

## Load it locally

### Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `aura-extension` folder.
4. Pin or open Aura from the extensions menu.
5. On a regular webpage, open Aura and choose **Start on this page**.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select this folder's `manifest.json`.
4. On a regular webpage, open Aura and choose **Start on this page**.

Firefox temporary add-ons are removed when the browser session ends. A packaged, signed build is needed for ordinary installation.

## Included behavior

- Starts only when the user activates Aura for the current tab. It requests `activeTab`, `scripting`, and `storage`; it does not request permission to read every website.
- Offers six profiles : Protanopia, Deuteranopia, Tritanopia, Achromatopsia, Low Vision/Contrast, and Reading Comfort.
- Uses a dark surface with bright amber/coral text for Protanopia; warm ivory with dark navy and blue/orange signals for Deuteranopia; warm ivory with magenta/teal signals for Tritanopia; and grayscale luminance contrast with different link colors and underline styles for Achromatopsia.
- Low Vision/Contrast uses crisp warm off-white backgrounds with charcoal/navy text. Reading Comfort uses warm ivory and calm dark text for reading blocks.
- Force-overrides foreground colors on nested page elements, including inline spans and labels. Visited and unvisited links differ in both color and underline style. Recognizable semantic error/success/warning states use profile-specific colors and extra borders.
- Increases line spacing and scales detected small icons inside clickable controls to 150%. Decorative icons and non-clickable images are left at their original size.
- Restores the prior theme variables, transformed text, icon classes, and styles when stopped.
- Clarify wording is off by default. When enabled, it applies a larger local English or Swedish word/phrase replacement list. The glossary also includes local hover explanations for accessibility and color-vision terms. This is a prototype vocabulary, not general text simplification.
- While Aura is active, a pointer that settles over text starts speech for the sentence at that position. Pointer movement cancels current speech and restarts at the new position. `Shift+F9` pauses/resumes, and `Esc` stops narration.
- TTS starts on for every new Aura activation. The popup has a **Turn TTS off / Turn TTS on** button for the active tab. That on/off choice is temporary and is not saved; activating Aura again starts with TTS on.
- Lists voices exposed by the browser. Local voices are preferred. **Allow online voices** is off by default; when enabled, an online voice can be chosen and the sentence may leave the device.
- Stores selected profile and preferences in the browser's local extension storage. No network service or analytics is included in this prototype.

## Current limits

- Site styling is complex. Common containers are recolored, but some custom widgets, shadow DOM, embedded frames, canvas content, and browser-internal pages may not be adjusted.
- Scaling clickable icons with CSS transforms can cause overlap because it does not enlarge the surrounding layout box. Stop Aura or adjust the page if a site becomes hard to use.
- The local simplification vocabulary is deliberately small. It does not rewrite every sentence and must not be treated as a complete language model.
- Voice availability depends on the browser and operating system. The extension only uses a remote voice after the user explicitly enables that option.
- The profile palettes are only suggestions, including a 40–50% brightness-difference aim and warm ivory in place of pure white. They are still starting points, not medically validated prescriptions. Semantic color replacement only applies when the webpage exposes recognizable status markers; arbitrary charts may not be remapped.

## Main files

- `manifest.json` — Chrome/Firefox extension metadata and minimal permissions.
- `popup.html`, `popup.css`, `popup.js` — profile, Clarify Content, TTS, language, voice, and per-tab activation controls.
- `profiles.js` — starter color profiles.
- `content.js` — reversible page styling, local simplification, pointer narration, and page-state handling.
