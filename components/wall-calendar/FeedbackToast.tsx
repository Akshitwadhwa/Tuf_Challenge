import styles from "./WallCalendar.module.css";

type FeedbackToastProps = {
  tone: "success" | "error" | "info";
  title: string;
  detail?: string;
  onDismiss: () => void;
};

export function FeedbackToast({ tone, title, detail, onDismiss }: FeedbackToastProps) {
  return (
    <div
      className={[
        styles.feedbackToast,
        tone === "success"
          ? styles.feedbackToastSuccess
          : tone === "error"
            ? styles.feedbackToastError
            : styles.feedbackToastInfo
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      <div className={styles.feedbackToastHeader}>
        <span className={styles.feedbackToastLabel}>
          {tone === "success" ? "Saved" : tone === "error" ? "Check this" : "Heads up"}
        </span>
        <button
          type="button"
          className={styles.feedbackToastDismiss}
          onClick={onDismiss}
          aria-label="Dismiss feedback"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>
      </div>
      <strong>{title}</strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}
