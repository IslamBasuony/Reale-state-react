import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./pages/Home.jsx";

jest.mock("./api/api.js", () => ({
  getListings: jest.fn().mockResolvedValue([]),
  getSimilarListings: jest.fn().mockResolvedValue([]),
  getListing: jest.fn().mockResolvedValue(null),
  getBrokers: jest.fn().mockResolvedValue([]),
  getBroker: jest.fn().mockResolvedValue(null),
  subscribeNewsletter: jest.fn().mockResolvedValue({}),
  submitContact: jest.fn().mockResolvedValue({}),
}));

jest.mock("./context/AuthContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ user: null, loading: false });
  return {
    AuthProvider: ({ children }) => (
      <Ctx.Provider value={{ user: null, loading: false }}>{children}</Ctx.Provider>
    ),
    useAuth: () => useContext(Ctx),
  };
});

jest.mock("./context/ListingsContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ listings: null, loading: false, error: false, refetch: () => {} });
  return {
    ListingsProvider: ({ children }) => children,
    useListings: () => useContext(Ctx),
  };
});

jest.mock("./context/FavoritesContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ favorites: new Set(), isFavorite: () => false, toggleFavorite: () => {}, clearFavorites: () => {} });
  return {
    FavoritesProvider: ({ children }) => children,
    useFavorites: () => useContext(Ctx),
  };
});

test("renders the home page hero heading", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Home />
    </MemoryRouter>,
  );
  const heading = screen.getByText(/اللي هيبدأ/);
  expect(heading).toBeInTheDocument();
});
