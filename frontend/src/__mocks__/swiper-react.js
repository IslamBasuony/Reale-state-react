// Mock for "swiper/react"
// Swiper v12 ships as ESM-only (".mjs"), which Jest 27 (CRA 5) cannot resolve
// through its CommonJS resolver. This lightweight mock lets components that
// import Swiper render normally under jsdom. The real Swiper is used at
// runtime in the browser via webpack.
const React = require("react");

const Swiper = ({ children }) => React.createElement("div", null, children);
const SwiperSlide = ({ children }) =>
  React.createElement("div", null, children);

module.exports = { Swiper, SwiperSlide };
