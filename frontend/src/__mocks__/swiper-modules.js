// Mock for "swiper/modules"
// See swiper-react.js for the reason. Modules are only used for autoplay
// configuration in the real Swiper; a named placeholder is enough for tests.
module.exports = {
  Autoplay: { name: "autoplay-mock" },
};
