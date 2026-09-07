export default function StateNotice({ loading, error, emptyText }) {
  if (loading) {
    return (
      <div className="state-notice" role="status" aria-live="polite">
        <div className="spinner-border text-primary" role="status" aria-hidden="true" />
        <p>جارٍ التحميل…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-notice state-notice--error" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="state-notice" role="status">
      <p>{emptyText}</p>
    </div>
  );
}
