import styles from "./WallCalendar.module.css";
import { useState } from "react";
import { isWithinRange, type CalendarCell, type SavedRangeNote } from "@/lib/calendar";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarGridProps = {
  monthLabel: string;
  cells: CalendarCell[];
  selection: {
    startIso: string | null;
    endIso: string | null;
  };
  effectiveRange: {
    startIso: string | null;
    endIso: string | null;
  };
  notes: SavedRangeNote[];
  isDragging?: boolean;
  onDayClick: (iso: string) => void;
  onDayHover: (iso: string | null) => void;
  onDayMouseDown?: (iso: string) => void;
  onDayMouseEnter?: (iso: string) => void;
  onDayMouseUp?: (iso: string) => void;
};

export function CalendarGrid({
  monthLabel,
  cells,
  selection,
  effectiveRange,
  notes,
  isDragging = false,
  onDayClick,
  onDayHover,
  onDayMouseDown,
  onDayMouseEnter,
  onDayMouseUp
}: CalendarGridProps) {
  const [hoveredDayForTooltip, setHoveredDayForTooltip] = useState<string | null>(null);

  return (
    <section className={styles.datePanel} aria-label={`${monthLabel} calendar`}>
      <div className={styles.weekdayHeader}>
        {weekdayLabels.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className={styles.dateGrid}>
        {cells.map((cell) => {
          const isStart = cell.iso === selection.startIso;
          const isEnd = cell.iso === selection.endIso;
          const isInRange = isWithinRange(cell.iso, effectiveRange.startIso, effectiveRange.endIso);
          const isSingleDay = isStart && isEnd;
          const linkedNotes = notes.filter((note) => cell.iso >= note.startIso && cell.iso <= note.endIso);
          const noteCount = linkedNotes.length;
          const linkedEmoji = linkedNotes.find((note) => note.icon)?.icon ?? null;
          const fullDateLabel = cell.date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          });

          return (
            <button
              key={cell.iso}
              type="button"
              className={[
                styles.dayCell,
                cell.isCurrentMonth ? "" : styles.dayCellMuted,
                cell.isToday ? styles.dayCellToday : "",
                isInRange ? styles.dayCellInRange : "",
                isStart ? styles.dayCellStart : "",
                isEnd ? styles.dayCellEnd : "",
                isSingleDay ? styles.dayCellSingle : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onDayClick(cell.iso)}
              onMouseEnter={() => {
                setHoveredDayForTooltip(cell.iso);
                if (isDragging && onDayMouseEnter) {
                  onDayMouseEnter(cell.iso);
                } else {
                  onDayHover(cell.iso);
                }
              }}
              onMouseLeave={() => {
                setHoveredDayForTooltip(null);
                if (!isDragging) {
                  onDayHover(null);
                }
              }}
              onMouseDown={() => {
                if (onDayMouseDown) {
                  onDayMouseDown(cell.iso);
                }
              }}
              onMouseUp={() => {
                if (isDragging && onDayMouseUp) {
                  onDayMouseUp(cell.iso);
                }
              }}
              aria-pressed={isInRange}
              aria-current={cell.isToday ? "date" : undefined}
              aria-label={`${fullDateLabel}${
                noteCount
                  ? `, ${noteCount} note${noteCount > 1 ? "s" : ""}${linkedEmoji ? `, tagged ${linkedEmoji}` : ""}`
                  : ""
              }`}
            >
              <span className={styles.dayNumber}>{cell.dayNumber}</span>
              <span className={styles.dayFooter}>
                {linkedEmoji ? (
                  <span className={`${styles.noteDot} ${styles.noteEmoji}`} aria-hidden="true">
                    {linkedEmoji}
                  </span>
                ) : noteCount > 0 ? (
                  <span className={styles.bookmarkIcon} aria-hidden="true" title={`${noteCount} note${noteCount > 1 ? "s" : ""}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2h14a1 1 0 011 1v19l-8-5.5L5 22V3a1 1 0 010-1z" />
                    </svg>
                  </span>
                ) : (
                  <span />
                )}
                {cell.isToday ? <span className={styles.todayPill}>Today</span> : null}
              </span>

              {hoveredDayForTooltip === cell.iso && linkedNotes.length > 0 && (
                <div className={styles.noteTooltip} role="tooltip">
                  <div className={styles.tooltipContent}>
                    {linkedNotes.map((note) => (
                      <div key={note.id} className={styles.tooltipNote}>
                        {note.icon && (
                          <span className={styles.tooltipIcon} aria-hidden="true">
                            {note.icon}
                          </span>
                        )}
                        <span className={styles.tooltipText}>{note.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
