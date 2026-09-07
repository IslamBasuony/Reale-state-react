// Mock for CSS imports that Jest cannot resolve through the
// package exports map (e.g. "swiper/css" in Swiper v12 ESM-only).
// At runtime in the browser, webpack loads the real CSS file.
module.exports = {};
