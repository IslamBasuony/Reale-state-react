import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Sale from "../pages/Sale.jsx";
import Rent from "../pages/Rent.jsx";
import { normalizeListings } from "../api/normalize.js";
import { getListings } from "../api/api.js";
import { ListingsProvider } from "../context/ListingsContext";
import { FavoritesProvider } from "../context/FavoritesContext";
import { AuthProvider } from "../context/AuthContext";

jest.mock("../api/api.js", () => ({
  getListings: jest.fn(),
}));

jest.mock("../context/AuthContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ user: null, loading: false });
  return {
    AuthProvider: ({ children }) => (
      <Ctx.Provider value={{ user: null, loading: false }}>{children}</Ctx.Provider>
    ),
    useAuth: () => useContext(Ctx),
  };
});

const rawListings = [
  {
    id: 1,
    title: "شقة للبيع",
    purpose: "sale",
    type: "apartment",
    status: "available",
    currency: "EGP",
    price_period: "sale",
    price: 1850000,
    area_size: 120,
    bedrooms_number: 2,
    bathrooms_number: 1,
    images: ["http://example.com/sale.jpg"],
    location: { name: "وسط البلد", city: "القاهرة" },
  },
  {
    id: 2,
    title: "استوديو للإيجار",
    purpose: "rent",
    type: "studio",
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
  {
    id: 3,
    title: "وحدة بدون غرض",
    type: "apartment",
    status: "available",
    currency: "EGP",
    price_period: "sale",
    price: 100,
    area_size: 50,
    images: [],
  },
];

const listings = normalizeListings(rawListings);

const renderSale = (initial = "/sale") =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <FavoritesProvider>
          <ListingsProvider>
            <Routes>
              <Route path="/sale" element={<Sale />} />
              <Route path="/properties/:id" element={<div>detail page</div>} />
            </Routes>
          </ListingsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

const renderRent = (initial = "/rent") =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <FavoritesProvider>
          <ListingsProvider>
            <Routes>
              <Route path="/rent" element={<Rent />} />
              <Route path="/properties/:id" element={<div>detail page</div>} />
            </Routes>
          </ListingsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("P10 Sale page API integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("consumes getListings and shows only purpose === sale", async () => {
    getListings.mockResolvedValue(listings);
    renderSale();

    expect(getListings).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("شقة للبيع")).toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
    expect(screen.queryByText("وحدة بدون غرض")).not.toBeInTheDocument();

    expect(screen.getByText("وسط البلد، القاهرة")).toBeInTheDocument();
    expect(screen.getByText("2 غرفة")).toBeInTheDocument();
    expect(screen.getByText("120 متر مربع")).toBeInTheDocument();
    expect(screen.getByText("1,850,000 EGP")).toBeInTheDocument();
  });

  it("does not guess a missing purpose as sale", async () => {
    getListings.mockResolvedValue(normalizeListings([rawListings[2]]));
    renderSale();

    expect(
      await screen.findByText("لا توجد عقارات للبيع حاليًا.")
    ).toBeInTheDocument();
    expect(screen.queryByText("وحدة بدون غرض")).not.toBeInTheDocument();
  });

  it("applies /sale?location&type&price URL filters to API data", async () => {
    getListings.mockResolvedValue(
      normalizeListings([
        ...rawListings,
        {
          id: 4,
          title: "فيلا في الزمالك",
          purpose: "sale",
          type: "villa",
          status: "available",
          price: 500000,
          area_size: 300,
          images: ["http://example.com/villa.jpg"],
          location: { name: "الزمالك", city: "القاهرة" },
        },
      ])
    );

    const url =
      "/sale?location=" +
      encodeURIComponent("وسط") +
      "&type=" +
      encodeURIComponent("شقة") +
      "&price=" +
      encodeURIComponent("1 – 2 مليون جنيه");

    renderSale(url);

    expect(await screen.findByText("شقة للبيع")).toBeInTheDocument();
    expect(screen.queryByText("فيلا في الزمالك")).not.toBeInTheDocument();
  });

  it("shows a loading spinner while the API is pending", async () => {
    let resolveFn;
    getListings.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      })
    );
    renderSale();

    expect(screen.getByTestId("sale-loading-spinner")).toBeInTheDocument();
    expect(
      screen.getByText("جارٍ تحميل العقارات المتاحة للبيع...")
    ).toBeInTheDocument();

    resolveFn(listings);
  });

  it("shows the empty state when the API returns no sale properties", async () => {
    getListings.mockResolvedValue([]);
    renderSale();

    expect(
      await screen.findByText("لا توجد عقارات للبيع حاليًا.")
    ).toBeInTheDocument();
  });

  it("shows an error state with retry and still renders fallback content", async () => {
    getListings
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(listings);
    renderSale();

    expect(
      await screen.findByText("تعذر تحميل العقارات حاليًا")
    ).toBeInTheDocument();
    expect(screen.queryByText("شقة للبيع")).not.toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
    expect(
      screen.getByText("شقة عصرية في وسط البلد")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(await screen.findByText("شقة للبيع")).toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
    expect(screen.queryByText("شقة عصرية في وسط البلد")).not.toBeInTheDocument();
  });
});

describe("P10 Rent page API integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("consumes getListings and shows only purpose === rent", async () => {
    getListings.mockResolvedValue(listings);
    renderRent();

    expect(getListings).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("استوديو للإيجار")).toBeInTheDocument();
    expect(screen.queryByText("شقة للبيع")).not.toBeInTheDocument();
    expect(screen.queryByText("وحدة بدون غرض")).not.toBeInTheDocument();

    expect(screen.getByText("الزمالك، القاهرة")).toBeInTheDocument();
    expect(screen.getByText("1 غرفة")).toBeInTheDocument();
    expect(screen.getByText("35.8 متر مربع")).toBeInTheDocument();
    expect(screen.getByText("8,000 EGP / شهريًا")).toBeInTheDocument();
  });

  it("does not guess a missing purpose as rent", async () => {
    getListings.mockResolvedValue(normalizeListings([rawListings[2]]));
    renderRent();

    expect(
      await screen.findByText("لا توجد عقارات للإيجار حاليًا.")
    ).toBeInTheDocument();
    expect(screen.queryByText("وحدة بدون غرض")).not.toBeInTheDocument();
  });

  it("shows the empty state when the API returns no rent properties", async () => {
    getListings.mockResolvedValue([]);
    renderRent();

    expect(
      await screen.findByText("لا توجد عقارات للإيجار حاليًا.")
    ).toBeInTheDocument();
  });

  it("shows an error state with retry and still renders fallback content", async () => {
    getListings
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(listings);
    renderRent();

    expect(
      await screen.findByText("تعذر تحميل العقارات حاليًا")
    ).toBeInTheDocument();
    expect(screen.queryByText("استوديو للإيجار")).not.toBeInTheDocument();
    expect(screen.queryByText("شقة للبيع")).not.toBeInTheDocument();
    expect(
      screen.getByText("استوديو مريح بجوار النيل")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(await screen.findByText("استوديو للإيجار")).toBeInTheDocument();
    expect(screen.queryByText("شقة للبيع")).not.toBeInTheDocument();
    expect(screen.queryByText("استوديو مريح بجوار النيل")).not.toBeInTheDocument();
  });
});
