import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Contact from "../pages/Contact.jsx";
import Footer from "../components/Footer.jsx";
import ProjectDetails from "../pages/ProjectDetails.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";

const mockApi = {
  submitContact: jest.fn(),
  submitProjectInquiry: jest.fn(),
  subscribeNewsletter: jest.fn(),
  authRequest: jest.fn(),
};

jest.mock("../api/api.js", () => ({
  __esModule: true,
  get default() { return mockApi; },
  submitContact: (...a) => mockApi.submitContact(...a),
  submitProjectInquiry: (...a) => mockApi.submitProjectInquiry(...a),
  subscribeNewsletter: (...a) => mockApi.subscribeNewsletter(...a),
  authRequest: (...a) => mockApi.authRequest(...a),
}));

const wrap = (ui, initialEntries = ["/"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/contact" element={ui} />
        <Route path="/projects/:id" element={ui} />
        <Route path="/forgot-password" element={ui} />
        <Route path="/reset-password" element={ui} />
        <Route path="/properties/:id" element={<div>detail page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("P16 Contact form", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits contact form and shows success message", async () => {
    mockApi.submitContact.mockResolvedValue({ success: true });
    wrap(<Contact />, ["/contact"]);

    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "أحمد" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "ahmed@test.com" } });
    fireEvent.change(screen.getByLabelText("رقم الهاتف"), { target: { value: "01012345678" } });
    fireEvent.change(screen.getByLabelText("الرسالة"), { target: { value: "رسالة تجريبية" } });
    fireEvent.click(screen.getByRole("button", { name: /إرسال الرسالة/ }));

    await waitFor(() => {
      expect(screen.getByText(/تم إرسال رسالتك بنجاح/)).toBeInTheDocument();
    });
    expect(mockApi.submitContact).toHaveBeenCalledWith({
      name: "أحمد",
      email: "ahmed@test.com",
      phone: "01012345678",
      message: "رسالة تجريبية",
    });
  });

  it("shows server error on failure", async () => {
    mockApi.submitContact.mockRejectedValue(new Error("تعذر إرسال الرسالة"));
    wrap(<Contact />, ["/contact"]);

    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "أحمد" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "ahmed@test.com" } });
    fireEvent.change(screen.getByLabelText("رقم الهاتف"), { target: { value: "01012345678" } });
    fireEvent.change(screen.getByLabelText("الرسالة"), { target: { value: "رسالة" } });
    fireEvent.click(screen.getByRole("button", { name: /إرسال الرسالة/ }));

    await waitFor(() => {
      expect(screen.getByText("تعذر إرسال الرسالة")).toBeInTheDocument();
    });
    expect(screen.queryByText(/تم إرسال رسالتك بنجاح/)).not.toBeInTheDocument();
  });

  it("disables submit button while submitting", async () => {
    let resolveFn;
    mockApi.submitContact.mockReturnValue(new Promise((r) => { resolveFn = r; }));
    wrap(<Contact />, ["/contact"]);

    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "أحمد" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "ahmed@test.com" } });
    fireEvent.change(screen.getByLabelText("رقم الهاتف"), { target: { value: "01012345678" } });
    fireEvent.change(screen.getByLabelText("الرسالة"), { target: { value: "رسالة" } });
    fireEvent.click(screen.getByRole("button", { name: /إرسال الرسالة/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /جارٍ الإرسال/ })).toBeDisabled();
    });
    resolveFn({ success: true });
  });
});

describe("P16 Footer newsletter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits newsletter email and shows success", async () => {
    mockApi.subscribeNewsletter.mockResolvedValue({ success: true });
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("ادخل بريدك الإلكتروني");
    fireEvent.change(emailInput, { target: { value: "sub@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /اشترك/ }));

    await waitFor(() => {
      expect(screen.getByText(/تم الاشتراك بنجاح/)).toBeInTheDocument();
    });
    expect(mockApi.subscribeNewsletter).toHaveBeenCalledWith("sub@test.com");
  });
});

describe("P16 Project inquiry form", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits inquiry and shows success", async () => {
    mockApi.submitProjectInquiry.mockResolvedValue({ success: true });
    wrap(<ProjectDetails />, ["/projects/1"]);

    await screen.findByText(/ذا كابيتال/);

    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "محمد" } });
    fireEvent.change(screen.getByLabelText("رقم الهاتف"), { target: { value: "01098765432" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "m@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /اطلب معاينة/ }));

    await waitFor(() => {
      expect(screen.getByText(/تم استلام استفسارك/)).toBeInTheDocument();
    });
    expect(mockApi.submitProjectInquiry).toHaveBeenCalledWith("1", {
      name: "محمد",
      email: "m@test.com",
      phone: "01098765432",
    });
  });

  it("shows error on inquiry failure", async () => {
    mockApi.submitProjectInquiry.mockRejectedValue(new Error("fail"));
    wrap(<ProjectDetails />, ["/projects/1"]);

    await screen.findByText(/ذا كابيتال/);

    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "محمد" } });
    fireEvent.change(screen.getByLabelText("رقم الهاتف"), { target: { value: "01098765432" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "m@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /اطلب معاينة/ }));

    await waitFor(() => {
      expect(screen.getByText("تعذر إرسال الاستفسار. حاول مرة أخرى.")).toBeInTheDocument();
    });
  });
});

describe("P16 Forgot Password page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits email and shows success message", async () => {
    mockApi.authRequest.mockResolvedValue({ success: true });
    wrap(<ForgotPassword />, ["/forgot-password"]);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "user@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /إرسال رابط إعادة التعيين/ }));

    await waitFor(() => {
      expect(screen.getByText(/إذا كان البريد الإلكتروني مسجّلًا/)).toBeInTheDocument();
    });
  });

  it("shows error on failure", async () => {
    mockApi.authRequest.mockRejectedValue(new Error("حدث خطأ"));
    wrap(<ForgotPassword />, ["/forgot-password"]);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: "user@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /إرسال رابط إعادة التعيين/ }));

    await waitFor(() => {
      expect(screen.getByText("حدث خطأ")).toBeInTheDocument();
    });
  });
});

describe("P16 Reset Password page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows error for invalid/missing token", () => {
    wrap(<ResetPassword />, ["/reset-password"]);

    expect(screen.getByText(/رابط إعادة التعيين غير صالح/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إعادة التعيين/ })).toBeDisabled();
  });

  it("shows error for short password", async () => {
    mockApi.authRequest.mockResolvedValue({ success: true });
    wrap(<ResetPassword />, ["/reset-password?token=abc123"]);

    fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /إعادة التعيين/ }));

    await waitFor(() => {
      expect(screen.getByText("كلمة المرور يجب أن تكون 8 أحرف على الأقل.")).toBeInTheDocument();
    });
  });

  it("shows error for mismatched passwords", async () => {
    wrap(<ResetPassword />, ["/reset-password?token=abc123"]);

    fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: "Password1!" } });
    fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), { target: { value: "Different1!" } });
    fireEvent.click(screen.getByRole("button", { name: /إعادة التعيين/ }));

    await waitFor(() => {
      expect(screen.getByText("كلمتا المرور غير متطابقتين.")).toBeInTheDocument();
    });
  });

  it("submits valid password reset and shows success", async () => {
    mockApi.authRequest.mockResolvedValue({ success: true });
    wrap(<ResetPassword />, ["/reset-password?token=abc123"]);

    fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: "NewPassword1!" } });
    fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), { target: { value: "NewPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: /إعادة التعيين/ }));

    await waitFor(() => {
      expect(screen.getByText(/تم إعادة تعيين كلمة المرور بنجاح/)).toBeInTheDocument();
    });
  });
});
