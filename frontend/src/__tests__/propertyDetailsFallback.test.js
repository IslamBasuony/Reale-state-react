import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PropertyDetails from "../pages/PropertyDetails.jsx";
import { getListing, getSimilarListings } from "../api/api.js";

jest.mock("../api/api.js", () => ({
  getListing: jest.fn(),
  getSimilarListings: jest.fn().mockResolvedValue([]),
}));

const apiError = ({ status, isJsonBody, message }) => {
  const error = new Error(message ?? `API request failed: ${status}`);
  error.status = status;
  error.isJsonBody = isJsonBody;
  return error;
};

const renderDetails = () =>
  render(
    <MemoryRouter initialEntries={["/properties/1"]}>
      <Routes>
        <Route path="/properties/:id" element={<PropertyDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("PropertyDetails — API failure handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSimilarListings.mockResolvedValue([]);
  });

  it("keeps the not-found state for a real backend 404 (JSON body)", async () => {
    getListing.mockRejectedValue(
      apiError({ status: 404, isJsonBody: true, message: "Property not found" })
    );
    renderDetails();
    expect(
      await screen.findByText(/العقار غير موجود/)
    ).toBeInTheDocument();
  });

  it("falls back to demo data when /api 404 comes from the host (non-JSON)", async () => {
    getListing.mockRejectedValue(
      apiError({
        status: 404,
        isJsonBody: false,
        message: "API request failed: 404 Not Found",
      })
    );
    renderDetails();
    expect(
      await screen.findByText(/مكتب فاخر للبيع في القاهرة الجديدة/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/حدث خطأ أثناء تحميل بيانات العقار/)
    ).toBeInTheDocument();
  });

  it("falls back to demo data on a plain network/API error", async () => {
    getListing.mockRejectedValue(new Error("Network Error"));
    renderDetails();
    expect(
      await screen.findByText(/مكتب فاخر للبيع في القاهرة الجديدة/)
    ).toBeInTheDocument();
  });
});