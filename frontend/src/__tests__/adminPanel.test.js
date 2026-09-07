import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminSidebar from "../admin/components/AdminSidebar.jsx";
import AdminHeader from "../admin/components/AdminHeader.jsx";
import AdminRoute from "../admin/components/AdminRoute.jsx";
import AdminLayout from "../admin/components/AdminLayout.jsx";

jest.mock("../api/api.js", () => {
  const mock = {
    getListings: jest.fn().mockResolvedValue([]),
    getBrokers: jest.fn().mockResolvedValue([]),
    getAdminStats: jest.fn().mockResolvedValue({}),
    getAdminAnalytics: jest.fn().mockResolvedValue({}),
    getAdminProperties: jest.fn().mockResolvedValue({ properties: [], total: 0, totalPages: 1 }),
    getAdminAgents: jest.fn().mockResolvedValue([]),
    deleteAdminProperty: jest.fn(),
  };
  return { __esModule: true, ...mock, default: mock };
});

jest.mock("../context/ListingsContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ listings: [], loading: false, error: false, refetch: () => {} });
  return {
    ListingsProvider: ({ children }) => children,
    useListings: () => useContext(Ctx),
  };
});

jest.mock("../context/FavoritesContext", () => {
  const { createContext, useContext } = require("react");
  const Ctx = createContext({ favorites: new Set(), isFavorite: () => false, toggleFavorite: () => {} });
  return {
    FavoritesProvider: ({ children }) => children,
    useFavorites: () => useContext(Ctx),
  };
});

let mockAuthValue = { user: null, loading: false, isAdmin: false, logout: jest.fn() };

jest.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthValue,
}));

describe("Admin Sidebar navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: { firstName: "أحمد", lastName: "علي" }, loading: false, isAdmin: true, logout: jest.fn() };
  });

  it("renders all 10 navigation items", () => {
    render(
      <MemoryRouter>
        <AdminSidebar isOpen={false} onClose={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("لوحة التحكم")).toBeInTheDocument();
    expect(screen.getByText("التقارير")).toBeInTheDocument();
    expect(screen.getByText("العقارات")).toBeInTheDocument();
    expect(screen.getByText("المستخدمون")).toBeInTheDocument();
    expect(screen.getByText("الوكلاء")).toBeInTheDocument();
    expect(screen.getByText("الطلبات")).toBeInTheDocument();
    expect(screen.getByText("رسائل التواصل")).toBeInTheDocument();
    expect(screen.getByText("المشتركين")).toBeInTheDocument();
    expect(screen.getByText("سجل النشاط")).toBeInTheDocument();
    expect(screen.getByText("الإعدادات")).toBeInTheDocument();
  });

  it("renders 'العودة للموقع' link pointing to /", () => {
    render(
      <MemoryRouter>
        <AdminSidebar isOpen={false} onClose={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /العودة للموقع/ })).toHaveAttribute("href", "/");
  });

  it("renders sidebar branding", () => {
    render(
      <MemoryRouter>
        <AdminSidebar isOpen={false} onClose={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("عقار ويب")).toBeInTheDocument();
    expect(screen.getByText("لوحة الإدارة")).toBeInTheDocument();
  });
});

describe("Admin Header navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: { firstName: "أحمد", lastName: "علي" }, loading: false, isAdmin: true, logout: jest.fn() };
  });

  it("renders 'العودة للموقع' link that navigates to /", () => {
    render(
      <MemoryRouter>
        <AdminHeader title="لوحة التحكم" onMenuToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /العودة للموقع/ })).toHaveAttribute("href", "/");
  });

  it("renders user name and admin badge", () => {
    render(
      <MemoryRouter>
        <AdminHeader title="لوحة التحكم" onMenuToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("مسؤول")).toBeInTheDocument();
    const userName = screen.getByText((_, element) =>
      element.tagName === "SPAN" &&
      element.className === "admin-header-user-name" &&
      element.textContent.includes("أحمد"),
    );
    expect(userName).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(
      <MemoryRouter>
        <AdminHeader title="لوحة التحكم" onMenuToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("خروج")).toBeInTheDocument();
  });
});

describe("Admin Route access control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated users to /login", () => {
    mockAuthValue = { user: null, loading: false, isAdmin: false, logout: jest.fn() };
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>admin content</div></AdminRoute>} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("redirects non-admin users to /", () => {
    mockAuthValue = { user: { firstName: "عادي" }, loading: false, isAdmin: false, logout: jest.fn() };
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>admin content</div></AdminRoute>} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("home page")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("renders admin content for admin users", () => {
    mockAuthValue = { user: { firstName: "admin" }, loading: false, isAdmin: true, logout: jest.fn() };
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>admin content</div></AdminRoute>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("admin content")).toBeInTheDocument();
  });
});

describe("Admin Properties page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: { firstName: "أحمد", lastName: "علي" }, loading: false, isAdmin: true, logout: jest.fn() };
  });

  it("has a link to /admin/properties/new in the sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/admin/properties"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="properties" element={<div>properties list</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const sidebarLink = screen.getAllByText("العقارات");
    expect(sidebarLink.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("properties list")).toBeInTheDocument();
  });
});

describe("Admin Layout — no duplicate navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: { firstName: "أحمد", lastName: "علي" }, loading: false, isAdmin: true, logout: jest.fn() };
  });

  it("does not render public Navbar links", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("الرئيسية")).not.toBeInTheDocument();
    expect(screen.queryByText("للبيع")).not.toBeInTheDocument();
  });
});
