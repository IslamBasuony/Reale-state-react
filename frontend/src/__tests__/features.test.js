import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Favorites from "../pages/Favorites.jsx";
import SearchResults from "../pages/SearchResults.jsx";
import ProjectDetails from "../pages/ProjectDetails.jsx";
import NewsDetails from "../pages/NewsDetails.jsx";
import AgentDetails from "../pages/AgentDetails.jsx";
import { FavoritesProvider, useFavorites } from "../context/FavoritesContext";
import { ListingsProvider } from "../context/ListingsContext";
import { normalizeListings } from "../api/normalize.js";
import { getListings, getBrokers } from "../api/api.js";
import { AuthProvider } from "../context/AuthContext";

jest.mock("../api/api.js", () => ({
  getListings: jest.fn().mockResolvedValue([]),
  getBrokers: jest.fn(),
}));

let mockAuthValue = { user: null, loading: false };

jest.mock("../context/AuthContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ user: null, loading: false });
  const MockAuthProvider = ({ children }) => (
    <Ctx.Provider value={mockAuthValue}>{children}</Ctx.Provider>
  );
  return {
    AuthProvider: MockAuthProvider,
    useAuth: () => useContext(Ctx),
  };
});

const rawListings = [
  {
    id: 1,
    title: "شقة للبيع",
    purpose: "sale",
    type: "شقة",
    status: "available",
    currency: "EGP",
    price_period: "sale",
    price: 1850000,
    area_size: 120,
    bedrooms_number: 2,
    bathrooms_number: 1,
    images: ["http://example.com/sale.jpg"],
    location: { name: "وسط البلد", city: "القاهرة" },
    agent: {
      id: 5,
      name: "أحمد علي",
      first_name: "أحمد",
      last_name: "علي",
      phone: "01000000000",
      email: "ahmed@example.com",
      bio: "مستشار عقاري",
    },
  },
  {
    id: 2,
    title: "استوديو للإيجار",
    purpose: "rent",
    type: "شقة",
    status: "rented",
    currency: "EGP",
    price_period: "monthly",
    price: 8000,
    area_size: 35.8,
    bedrooms_number: 1,
    bathrooms_number: 1,
    images: ["http://example.com/rent.jpg"],
    location: { name: "الزمالك", city: "القاهرة" },
  },
];

const listings = normalizeListings(rawListings);

const wrap = (ui, { initialEntries = ["/"] } = {}) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <FavoritesProvider>
          <ListingsProvider>{ui}</ListingsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("Favorites flow", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    getBrokers.mockResolvedValue([]);
    mockAuthValue = { user: null, loading: false };
  });

  it("persists a toggled favorite into localStorage", () => {
    function ToggleButton() {
      const { toggleFavorite } = useFavorites();
      return (
        <button type="button" onClick={() => toggleFavorite(7)}>
          toggle
        </button>
      );
    }
    wrap(<ToggleButton />);
    fireEvent.click(screen.getByText("toggle"));
    expect(JSON.parse(localStorage.getItem("realEstateFavorites_guest"))).toEqual([7]);
  });

  it("lists only favorited properties on the favorites page", async () => {
    localStorage.setItem("realEstateFavorites_guest", JSON.stringify([1]));
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/favorites"] }
    );

    expect(await screen.findByText("شقة للبيع")).toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
  });

  it("shows an empty state when no favorites exist", async () => {
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/favorites"] }
    );

    expect(
      await screen.findByText(/لا توجد عقارات في المفضلة بعد/)
    ).toBeInTheDocument();
  });
});

describe("Favorites privacy", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    getBrokers.mockResolvedValue([]);
  });

  it("scopes favorites by user ID in localStorage", () => {
    function ToggleButton() {
      const { toggleFavorite } = useFavorites();
      return (
        <button type="button" onClick={() => toggleFavorite(7)}>
          toggle
        </button>
      );
    }

    mockAuthValue = { user: { id: 1 }, loading: false };
    wrap(<ToggleButton />);
    fireEvent.click(screen.getByText("toggle"));
    expect(localStorage.getItem("realEstateFavorites_1")).toBeTruthy();
    expect(localStorage.getItem("realEstateFavorites_2")).toBeNull();
  });

  it("does not share favorites between users", () => {
    localStorage.setItem("realEstateFavorites_1", JSON.stringify([10]));
    localStorage.setItem("realEstateFavorites_2", JSON.stringify([20]));

    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span>{[...favorites].join(",")}</span>;
    }

    mockAuthValue = { user: { id: 1 }, loading: false };
    const { unmount } = wrap(<FavoriteIds />);
    expect(screen.getByText("10")).toBeInTheDocument();

    unmount();

    mockAuthValue = { user: { id: 2 }, loading: false };
    wrap(<FavoriteIds />);
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("clears in-memory favorites on logout but keeps localStorage", async () => {
    localStorage.setItem("realEstateFavorites_1", JSON.stringify([10, 20]));

    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span data-testid="fav-count">{favorites.size}</span>;
    }

    mockAuthValue = { user: { id: 1 }, loading: false };
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-count")).toHaveTextContent("2");

    mockAuthValue = { user: null, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("fav-count")).toHaveTextContent("0");
    expect(localStorage.getItem("realEstateFavorites_1")).toBe(JSON.stringify([10, 20]));
  });

  it("User A favorites persist after logout and return on re-login", () => {
    localStorage.setItem("realEstateFavorites_1", JSON.stringify([10, 20]));

    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span data-testid="fav-count">{favorites.size}</span>;
    }

    mockAuthValue = { user: { id: 1 }, loading: false };
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-count")).toHaveTextContent("2");

    mockAuthValue = { user: null, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-count")).toHaveTextContent("0");

    mockAuthValue = { user: { id: 1 }, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-count")).toHaveTextContent("2");
    expect(localStorage.getItem("realEstateFavorites_1")).toBe(JSON.stringify([10, 20]));
  });

  it("User A favorites are not visible to User B", () => {
    localStorage.setItem("realEstateFavorites_1", JSON.stringify([10, 20]));
    localStorage.setItem("realEstateFavorites_2", JSON.stringify([30, 40]));

    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span data-testid="fav-ids">{[...favorites].sort().join(",")}</span>;
    }

    mockAuthValue = { user: { id: 1 }, loading: false };
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("10,20");

    mockAuthValue = { user: null, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("");

    mockAuthValue = { user: { id: 2 }, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("30,40");
  });

  it("User B favorites are not visible to User A", () => {
    localStorage.setItem("realEstateFavorites_1", JSON.stringify([10]));
    localStorage.setItem("realEstateFavorites_2", JSON.stringify([20]));

    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span data-testid="fav-ids">{[...favorites].sort().join(",")}</span>;
    }

    mockAuthValue = { user: { id: 2 }, loading: false };
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("20");

    mockAuthValue = { user: null, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("");

    mockAuthValue = { user: { id: 1 }, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <FavoritesProvider>
            <FavoriteIds />
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("fav-ids")).toHaveTextContent("10");
  });

  it("does not use a global realEstateFavorites key", () => {
    function FavoriteIds() {
      const { favorites } = useFavorites();
      return <span data-testid="fav-count">{favorites.size}</span>;
    }

    mockAuthValue = { user: { id: 99 }, loading: false };
    wrap(<FavoriteIds />);
    expect(localStorage.getItem("realEstateFavorites")).toBeNull();
  });

  it("redirects unauthenticated user away from favorites page", async () => {
    mockAuthValue = { user: null, loading: false };
    const ProtectedRoute = require("../components/ProtectedRoute").default;
    render(
      <MemoryRouter initialEntries={["/favorites"]}>
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/login" element={<div>login page</div>} />
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("allows authenticated user to access favorites page", async () => {
    mockAuthValue = { user: { id: 1 }, loading: false };
    getListings.mockResolvedValue([]);
    const ProtectedRoute = require("../components/ProtectedRoute").default;
    render(
      <MemoryRouter initialEntries={["/favorites"]}>
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/login" element={<div>login page</div>} />
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/لا توجد عقارات في المفضلة بعد/)).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });
});

describe("Search results", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    mockAuthValue = { user: null, loading: false };
  });

  it("applies the purpose from the URL and shows only sale properties", async () => {
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/search-results?purpose=sale"] }
    );

    expect(await screen.findByText("شقة للبيع")).toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
  });

  it("filters by the location query parameter", async () => {
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/search-results?purpose=rent&location=وسط"] }
    );

    expect(
      await screen.findByText(/لا توجد عقارات مطابقة لبحثك/)
    ).toBeInTheDocument();
  });
});

describe("Project details", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    getBrokers.mockResolvedValue([]);
    mockAuthValue = { user: null, loading: false };
  });

  it("renders project details for a valid id", () => {
    wrap(
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetails />} />
      </Routes>,
      { initialEntries: ["/projects/1"] }
    );

    expect(screen.getByText("ذا كابيتال")).toBeInTheDocument();
    expect(screen.getByText("عن المشروع")).toBeInTheDocument();
    expect(screen.getByText("أمن وحراسة على مدار الساعة")).toBeInTheDocument();
  });

  it("shows a not-found message for an invalid id", () => {
    wrap(
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetails />} />
      </Routes>,
      { initialEntries: ["/projects/999"] }
    );

    expect(screen.getByText(/المشروع غير موجود/)).toBeInTheDocument();
  });
});

describe("News details", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    mockAuthValue = { user: null, loading: false };
  });

  it("renders the article body and title", () => {
    wrap(
      <Routes>
        <Route path="/news/:id" element={<NewsDetails />} />
      </Routes>,
      { initialEntries: ["/news/1"] }
    );

    expect(
      screen.getByText(/أسعار العقارات في القاهرة الجديدة تسجل نموًا ملحوظًا/)
    ).toBeInTheDocument();
    expect(screen.getByText(/أرجع خبراء العقارات هذا النمو/)).toBeInTheDocument();
  });

  it("shows a not-found message for an invalid id", () => {
    wrap(
      <Routes>
        <Route path="/news/:id" element={<NewsDetails />} />
      </Routes>,
      { initialEntries: ["/news/999"] }
    );

    expect(screen.getByText(/الخبر غير موجود/)).toBeInTheDocument();
  });
});

describe("Agent details", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    getListings.mockResolvedValue([]);
    getBrokers.mockResolvedValue([]);
    mockAuthValue = { user: null, loading: false };
  });

  it("shows the broker profile and their active listings", async () => {
    getBrokers.mockResolvedValue([
      {
        id: 5,
        first_name: "أحمد",
        last_name: "علي",
        phone: "01000000000",
        email: "ahmed@example.com",
        bio: "مستشار عقاري",
      },
    ]);
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/agents/:id" element={<AgentDetails />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/agents/5"] }
    );

    expect(await screen.findByText(/مستشار عقاري/)).toBeInTheDocument();
    expect(screen.getByText("عقارات الوسيط")).toBeInTheDocument();
    expect(screen.getByText("شقة للبيع")).toBeInTheDocument();
  });

  it("shows a not-found message for an unknown broker", async () => {
    getBrokers.mockResolvedValue([
      { id: 1, first_name: "منى", last_name: "السيد", phone: "01011112222" },
    ]);
    getListings.mockResolvedValue(listings);

    wrap(
      <Routes>
        <Route path="/agents/:id" element={<AgentDetails />} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>,
      { initialEntries: ["/agents/999"] }
    );

    expect(await screen.findByText(/الوسيط غير موجود/)).toBeInTheDocument();
  });
});
