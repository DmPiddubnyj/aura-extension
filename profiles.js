// Palette guidance transcribed from the revised Polish Colors.odt.
// The palettes are practical starting points, not clinically validated prescriptions.
globalThis.AURA_PROFILES = {
  protanopia: {
    name: "Protanopia · red appears darker",
    bg: "#1A1A1A", surface: "#262626", fg: "#FFB000",
    link: "#FFB000", visited: "#FF7A59", accent: "#FF7A59",
    success: "#56B4E9", danger: "#FF7A59", warning: "#FFB000"
  },
  deuteranopia: {
    name: "Deuteranopia · red-green color vision",
    bg: "#FAF8F5", surface: "#F7F4EC", fg: "#0F2942",
    link: "#005FCC", visited: "#5B2C6F", accent: "#D55E00",
    success: "#0072B2", danger: "#D55E00", warning: "#8C3B00"
  },
  tritanopia: {
    name: "Tritanopia · blue-yellow color vision",
    bg: "#FAF8F5", surface: "#F7F4EC", fg: "#1E2022",
    link: "#C2185B", visited: "#4A148C", accent: "#006978",
    success: "#006978", danger: "#C2185B", warning: "#8C3B00"
  },
  achromatopsia: {
    name: "Achromatopsia · grayscale vision",
    bg: "#F7F5F0", surface: "#FAF8F5", fg: "#1E2022",
    link: "#005FCC", visited: "#374151", accent: "#374151",
    success: "#1E2022", danger: "#1E2022", warning: "#1E2022"
  },
  lowVision: {
    name: "Low Vision · contrast",
    bg: "#F8F7F4", surface: "#FFFDF7", fg: "#1E2022",
    link: "#005FCC", visited: "#374151", accent: "#0F2537",
    success: "#0F2537", danger: "#1E2022", warning: "#0F2537"
  },
  readingComfort: {
    name: "Reading Comfort · warm tones",
    bg: "#F6F3EB", surface: "#FAF8F5", fg: "#1E2022",
    link: "#005FCC", visited: "#5B2C6F", accent: "#8C3B00",
    success: "#0F2942", danger: "#8C3B00", warning: "#8C3B00"
  }
};
