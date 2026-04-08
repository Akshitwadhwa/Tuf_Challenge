import styles from "./WallCalendar.module.css";
import {
  formatSelectionLabel,
  getInclusiveDayCount,
  type CalendarMonthState
} from "@/lib/calendar";

const noteIconOptions = [
  { value: "", label: "None", emoji: "•" },
  { value: "🎂", label: "Birthday", emoji: "🎂" },
  { value: "🏢", label: "Office", emoji: "🏢" },
  { value: "🏖️", label: "Holiday", emoji: "🏖️" },
  { value: "✈️", label: "Travel", emoji: "✈️" },
] as const;

type NotesPanelProps = {
  isHydrated: boolean;
  monthState: CalendarMonthState;
  selection: {
    startIso: string | null;
    endIso: string | null;
  };
  draftNote: string;
  draftNoteIcon: string;
  validationMessage: string | null;
  onMonthMemoChange: (value: string) => void;
  onDraftNoteChange: (value: string) => void;
  onDraftNoteIconChange: (value: string) => void;
  onSaveRangeNote: () => void;
  onResetDraft: () => void;
  onClearSelection: () => void;
  onDeleteRangeNote: (noteId: string) => void;
};

export function NotesPanel({
  isHydrated,
  monthState,
  selection,
  draftNote,
  draftNoteIcon,
  validationMessage,
  onMonthMemoChange,
  onDraftNoteChange,
  onDraftNoteIconChange,
  onSaveRangeNote,
  onResetDraft,
  onClearSelection,
  onDeleteRangeNote
}: NotesPanelProps) {
  const dayCount = getInclusiveDayCount(selection.startIso, selection.endIso);

  return (
    <aside className={styles.notesPanel}>
      <section className={`${styles.noteSection} ${styles.notesPad}`}>
        <div className={styles.notesHeading}>
          <div>
            <p className={styles.sectionLabel}>Monthly memo</p>
            <h4>Notes</h4>
          </div>
        </div>

        <textarea
          className={styles.memoField}
          value={monthState.monthMemo}
          onChange={(event) => onMonthMemoChange(event.target.value)}
          placeholder="Add reminders, goals, or deadlines for the month..."
          rows={5}
        />
      </section>

      <section className={`${styles.noteSection} ${styles.rangeSection}`}>
        <div className={styles.notesHeading}>
          <div>
            <p className={styles.sectionLabel}>Selection note</p>
            <h4>{formatSelectionLabel(selection.startIso, selection.endIso)}</h4>
          </div>
          <div className={styles.notesHeadingMeta}>
            <span className={styles.dateBadge}>
              {selection.startIso
                ? `${dayCount} day${dayCount === 1 ? "" : "s"}`
                : "No range"}
            </span>
            {selection.startIso ? (
              <button type="button" className={styles.clearButton} onClick={onClearSelection}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.noteIconPicker} aria-label="Select a note tag">
          {noteIconOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`${styles.noteIconOption} ${draftNoteIcon === option.value ? styles.noteIconOptionActive : ""}`}
              onClick={() => onDraftNoteIconChange(option.value)}
              aria-pressed={draftNoteIcon === option.value}
              title={option.label}
            >
              <span>{option.emoji}</span>
              <small>{option.label}</small>
            </button>
          ))}
        </div>

        <textarea
          className={`${styles.memoField} ${validationMessage ? styles.fieldInvalid : ""}`}
          value={draftNote}
          onChange={(event) => onDraftNoteChange(event.target.value)}
          placeholder="Attach a note to the selected day or range..."
          rows={4}
          aria-invalid={validationMessage ? true : undefined}
        />

        {validationMessage ? (
          <p className={`${styles.fieldFeedback} ${styles.fieldFeedbackError}`} role="status">
            {validationMessage}
          </p>
        ) : (
          <p className={styles.fieldHint}>Choose a range, tag it, and save it to pin the note on the dates.</p>
        )}

        <div className={styles.noteActions}>
          <button type="button" onClick={onSaveRangeNote}>
            Save note
          </button>
          <button type="button" className={styles.ghostButton} onClick={onResetDraft}>
            Reset
          </button>
        </div>
      </section>

      <section className={`${styles.noteSection} ${styles.savedSection}`}>
        <div className={styles.notesHeading}>
          <div>
            <p className={styles.sectionLabel}>Saved annotations</p>
            <h4>
              {monthState.rangeNotes.length} linked note{monthState.rangeNotes.length === 1 ? "" : "s"}
            </h4>
          </div>
        </div>

        <div className={styles.noteList}>
          {monthState.rangeNotes.length === 0 ? (
            <div className={styles.emptyState}>
              Saved range notes will appear here with their linked dates.
            </div>
          ) : (
            monthState.rangeNotes.map((note) => (
              <article key={note.id} className={styles.savedNote}>
                <div className={styles.savedNoteHeader}>
                  <span className={styles.savedNoteTitle}>
                    {note.icon ? <strong className={styles.savedNoteIcon}>{note.icon}</strong> : null}
                    <span>{formatSelectionLabel(note.startIso, note.endIso)}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.iconDeleteButton}
                    onClick={() => onDeleteRangeNote(note.id)}
                    aria-label="Delete note"
                    title="Delete note"
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
                </div>
                <p>{note.text}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
