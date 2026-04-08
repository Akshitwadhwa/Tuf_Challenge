import styles from "./WallCalendar.module.css";
import { useState } from "react";
import { type TodoItem } from "@/lib/calendar";

type TodoPanelProps = {
  items: TodoItem[];
  draft: string;
  validationMessage: string | null;
  maxLength: number;
  onDraftChange: (value: string) => void;
  onAdd: (priority?: "urgent" | "today" | "rest") => void;
  onToggle: (todoId: string) => void;
  onDelete: (todoId: string) => void;
};

export function TodoPanel({
  items,
  draft,
  validationMessage,
  maxLength,
  onDraftChange,
  onAdd,
  onToggle,
  onDelete
}: TodoPanelProps) {
  const [selectedPriority, setSelectedPriority] = useState<"urgent" | "today" | "rest" | null>(null);

  const priorityOptions = [
    { value: "urgent" as const, label: "Urgent", color: "#ef4444" },
    { value: "today" as const, label: "Complete Today", color: "#1f2937" },
    { value: "rest" as const, label: "Rest", color: "#ffffff" }
  ];
  return (
    <section className={`${styles.noteSection} ${styles.todoSection}`}>
      <div className={styles.notesHeading}>
        <div>
          <p className={styles.sectionLabel}>Monthly to-do</p>
          <h4>Small checklist</h4>
        </div>
        <span className={styles.dateBadge}>
          {items.filter((item) => !item.completed).length} open
        </span>
      </div>

      <div className={styles.todoComposer}>
        <input
          className={`${styles.todoInput} ${validationMessage ? styles.fieldInvalid : ""}`}
          type="text"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(selectedPriority ?? undefined);
              setSelectedPriority(null);
            }
          }}
          placeholder="Add a quick task for this month..."
          maxLength={maxLength}
          aria-invalid={validationMessage ? true : undefined}
        />
        <button 
          type="button" 
          onClick={() => {
            onAdd(selectedPriority ?? undefined);
            setSelectedPriority(null);
          }}
        >
          Add
        </button>
      </div>

      <div className={styles.prioritySelector} aria-label="Select task priority">
        {priorityOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.priorityOption} ${selectedPriority === option.value ? styles.priorityOptionActive : ""}`}
            onClick={() => setSelectedPriority(selectedPriority === option.value ? null : option.value)}
            title={option.label}
            aria-pressed={selectedPriority === option.value}
          >
            <span 
              className={styles.priorityDot} 
              style={{ backgroundColor: option.color }}
              aria-hidden="true"
            />
            <span className={styles.priorityLabel}>{option.label}</span>
          </button>
        ))}
      </div>

      {validationMessage ? (
        <p className={`${styles.fieldFeedback} ${styles.fieldFeedbackError}`} role="status">
          {validationMessage}
        </p>
      ) : (
        <p className={styles.fieldHint}>{draft.length}/{maxLength} characters</p>
      )}

      <div className={styles.todoList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>Add a few small tasks to keep the month actionable.</div>
        ) : (
          items.map((item) => {
            const priorityColorMap: Record<"urgent" | "today" | "rest", string> = {
              urgent: "#ef4444",
              today: "#1f2937",
              rest: "#ffffff"
            };
            const priorityColor = item.priority ? priorityColorMap[item.priority] : undefined;

            return (
              <article key={item.id} className={styles.todoItem}>
                <button
                  type="button"
                  className={`${styles.todoCheck} ${item.completed ? styles.todoCheckDone : ""}`}
                  onClick={() => onToggle(item.id)}
                  aria-pressed={item.completed}
                  aria-label={item.completed ? "Mark task incomplete" : "Mark task complete"}
                >
                  <span />
                </button>

                {priorityColor && (
                  <span 
                    className={styles.todoPriorityDot}
                    style={{ backgroundColor: priorityColor }}
                    aria-hidden="true"
                    title={item.priority === "urgent" ? "Urgent" : item.priority === "today" ? "Complete Today" : "Rest"}
                  />
                )}

                <p className={`${styles.todoText} ${item.completed ? styles.todoTextDone : ""}`}>
                  {item.text}
                </p>

              <button
                type="button"
                className={`${styles.iconDeleteButton} ${styles.todoDelete}`}
                onClick={() => onDelete(item.id)}
                aria-label="Delete task"
                title="Delete task"
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
                  <path d="M9.5 4.75h5" />
                  <path d="M4.75 7.25h14.5" />
                  <path d="M7.75 7.25v10.5c0 .83.67 1.5 1.5 1.5h5.5c.83 0 1.5-.67 1.5-1.5V7.25" />
                  <path d="M10.25 10.25v5.5" />
                  <path d="M13.75 10.25v5.5" />
                </svg>
              </button>
            </article>
            );
          })
        )}
      </div>
    </section>
  );
}
