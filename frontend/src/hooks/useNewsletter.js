import { useState, useCallback } from "react";
import { subscribeNewsletter } from "../api/api";

/**
 * Shared newsletter subscription hook.
 * Handles submit, loading, success + error state. Prevents duplicated
 * request logic across Footer, Sale and Rent.
 */
export default function useNewsletter() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (event, emailFieldName) => {
    event.preventDefault();
    setError("");
    const emailInput = event.target.elements[emailFieldName];
    const email = emailInput?.value;
    if (!email) return;

    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setSubmitted(true);
    } catch {
      setError("تعذر الاشتراك. تحقق من البريد الإلكتروني وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubmitted(false);
    setError("");
  }, []);

  return { submitted, error, submitting, handleSubmit, reset };
}
