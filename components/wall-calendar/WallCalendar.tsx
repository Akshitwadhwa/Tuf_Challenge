"use client";

import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { IplHeroData } from "@/lib/ipl";
import styles from "./WallCalendar.module.css";
import type { BackgroundPreset } from "./BackgroundPanel";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarHero } from "./CalendarHero";
import { FeedbackToast } from "./FeedbackToast";
import { NotesPanel } from "./NotesPanel";
import { TodoPanel } from "./TodoPanel";
import {
  addMonths,
  createEmptyMonthState,
  createRangeNoteId,
  createTodoId,
  formatMonthLabel,
  formatSelectionLabel,
  getMonthCells,
  getMonthKey,
  normalizeMonthState,
  sortRange,
  startOfMonth,
  toIsoDate,
  type CalendarMonthState
} from "@/lib/calendar";
import { loadMediaAsset, saveMediaAsset } from "@/lib/calendarMediaDb";

const storageKey = "wall-calendar-assignment-state";
const heroImageAssetId = "hero-image";
const backgroundPreferenceKey = "wall-calendar-background-preference";

const backgroundPresets: BackgroundPreset[] = [
  {
    id: "paper",
    label: "Paper",
    preview: "linear-gradient(180deg, #f8f1e5 0%, #e8d7c0 55%, #dec7a8 100%)"
  },
  {
    id: "mist",
    label: "Mist",
    preview: "linear-gradient(180deg, #edf3fb 0%, #dbe4f1 55%, #c8d4e5 100%)"
  },
  {
    id: "sunset",
    label: "Sunset",
    preview: "linear-gradient(180deg, #f6e6d5 0%, #ecc7b0 52%, #d9a68a 100%)"
  },
  {
    id: "forest",
    label: "Forest",
    preview: "linear-gradient(180deg, #e6efe7 0%, #ccd8c8 55%, #b4c4b0 100%)"
  }
];

type RangeSelection = {
  startIso: string | null;
  endIso: string | null;
};

type StoredCalendarState = Record<string, CalendarMonthState>;
type BackgroundPreference = {
  presetId: string;
};
type FeedbackTone = "success" | "error" | "info";
type FeedbackMessage = {
  id: number;
  tone: FeedbackTone;
  title: string;
  detail?: string;
};
type MonthAnimationDirection = "next" | "previous";
type MonthAnimationPhase = "idle" | "fold-out" | "fold-in";

const monthFoldOutDurationMs = 280;
const monthFoldInDurationMs = 420;
const heroImageMaxSizeBytes = 5 * 1024 * 1024;
const todoCharacterLimit = 90;
const emptySelection: RangeSelection = {
  startIso: null,
  endIso: null
};

export function WallCalendar() {
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [selection, setSelection] = useState<RangeSelection>(emptySelection);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [draftNoteIcon, setDraftNoteIcon] = useState("");
  const [draftTodo, setDraftTodo] = useState("");
  const [monthStates, setMonthStates] = useState<StoredCalendarState>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isHeroImageReady, setIsHeroImageReady] = useState(false);
  const [backgroundPresetId, setBackgroundPresetId] = useState(backgroundPresets[0].id);
  const [iplHero, setIplHero] = useState<IplHeroData | null>(null);
  const [isIplHeroReady, setIsIplHeroReady] = useState(false);
  const [monthAnimationPhase, setMonthAnimationPhase] = useState<MonthAnimationPhase>("idle");
  const [monthAnimationDirection, setMonthAnimationDirection] =
    useState<MonthAnimationDirection>("next");
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [noteValidationMessage, setNoteValidationMessage] = useState<string | null>(null);
  const [todoValidationMessage, setTodoValidationMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const monthTransitionTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const pendingMonthRef = useRef<Date | null>(null);
  const pendingSelectionRef = useRef<RangeSelection>(emptySelection);

  useEffect(() => {
    const savedState = window.localStorage.getItem(storageKey);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as StoredCalendarState;
        const normalizedState = Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [key, normalizeMonthState(value)])
        ) as StoredCalendarState;
        setMonthStates(normalizedState);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadMediaAsset(heroImageAssetId)
      .then((storedImage) => {
        if (!isMounted) {
          return;
        }

        setHeroImage(storedImage);
        setIsHeroImageReady(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setHeroImage(null);
        setIsHeroImageReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(backgroundPreferenceKey);

    if (savedPreference) {
      try {
        const parsed = JSON.parse(savedPreference) as BackgroundPreference;

        if (backgroundPresets.some((preset) => preset.id === parsed.presetId)) {
          setBackgroundPresetId(parsed.presetId);
        }
      } catch {
        window.localStorage.removeItem(backgroundPreferenceKey);
      }
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(monthStates));
  }, [isHydrated, monthStates]);

  useEffect(() => {
    window.localStorage.setItem(
      backgroundPreferenceKey,
      JSON.stringify({
        presetId: backgroundPresetId
      } satisfies BackgroundPreference)
    );
  }, [backgroundPresetId]);

  useEffect(() => {
    const previousBackground = document.body.style.background;
    const previousAttachment = document.body.style.backgroundAttachment;

    const activePreset =
      backgroundPresets.find((preset) => preset.id === backgroundPresetId) ?? backgroundPresets[0];

    document.body.style.background = activePreset.preview;
    document.body.style.backgroundAttachment = "fixed";

    return () => {
      document.body.style.background = previousBackground;
      document.body.style.backgroundAttachment = previousAttachment;
    };
  }, [backgroundPresetId]);

  useEffect(() => {
    let isMounted = true;
    let timerId: number | null = null;

    async function loadIplHero() {
      try {
        const response = await fetch("/api/ipl-hero", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load IPL hero");
        }

        const payload = (await response.json()) as IplHeroData;

        if (!isMounted) {
          return;
        }

        setIplHero(payload.status === "unavailable" ? null : payload);
        setIsIplHeroReady(true);

        timerId = window.setTimeout(loadIplHero, payload.status === "live" ? 60_000 : 300_000);
      } catch {
        if (!isMounted) {
          return;
        }

        setIplHero(null);
        setIsIplHeroReady(true);
        timerId = window.setTimeout(loadIplHero, 300_000);
      }
    }

    loadIplHero();

    return () => {
      isMounted = false;

      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (monthTransitionTimerRef.current !== null) {
        window.clearTimeout(monthTransitionTimerRef.current);
      }

      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const monthKey = getMonthKey(displayMonth);
  const currentMonthState = normalizeMonthState(monthStates[monthKey]);
  const monthCells = getMonthCells(displayMonth);
  const isMonthAnimating = monthAnimationPhase !== "idle";
  const monthAnimationClass =
    monthAnimationPhase === "idle"
      ? ""
      : monthAnimationPhase === "fold-out"
        ? monthAnimationDirection === "next"
          ? styles.calendarSheetFoldOutNext
          : styles.calendarSheetFoldOutPrevious
        : monthAnimationDirection === "next"
          ? styles.calendarSheetFoldInNext
          : styles.calendarSheetFoldInPrevious;
  const contentAnimationClass =
    monthAnimationPhase === "idle"
      ? ""
      : monthAnimationPhase === "fold-out"
        ? monthAnimationDirection === "next"
          ? styles.contentPanelFoldOutNext
          : styles.contentPanelFoldOutPrevious
        : monthAnimationDirection === "next"
          ? styles.contentPanelFoldInNext
          : styles.contentPanelFoldInPrevious;
  const threadAnimationClass =
    monthAnimationPhase === "idle"
      ? ""
      : monthAnimationDirection === "next"
        ? styles.threadsSwingNext
        : styles.threadsSwingPrevious;

  const previewRange =
    selection.startIso && !selection.endIso && hoveredIso
      ? sortRange(selection.startIso, hoveredIso)
      : null;

  const effectiveStartIso = selection.endIso ? selection.startIso : previewRange?.startIso ?? selection.startIso;
  const effectiveEndIso = selection.endIso ? selection.endIso : previewRange?.endIso ?? null;

  function updateMonthState(
    updater: CalendarMonthState | ((currentMonthState: CalendarMonthState) => CalendarMonthState)
  ) {
    setMonthStates((currentState) => ({
      ...currentState,
      [monthKey]:
        typeof updater === "function"
          ? updater(currentState[monthKey] ?? createEmptyMonthState())
          : updater
    }));
  }

  function showFeedback(
    tone: FeedbackTone,
    title: string,
    detail?: string,
    durationMs = 2600
  ) {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    setFeedbackMessage({
      id: Date.now(),
      tone,
      title,
      detail
    });

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimerRef.current = null;
    }, durationMs);
  }

  function handleMonthMemoChange(value: string) {
    updateMonthState((currentState) => ({
      ...currentState,
      monthMemo: value
    }));
  }

  function handleDayClick(iso: string) {
    setHoveredIso(null);
    setNoteValidationMessage(null);

    if (!selection.startIso || (selection.startIso && selection.endIso)) {
      setSelection({
        startIso: iso,
        endIso: null
      });
      return;
    }

    if (selection.startIso === iso) {
      setSelection({
        startIso: iso,
        endIso: iso
      });
      return;
    }

    setSelection(sortRange(selection.startIso, iso));
  }

  function clearSelection() {
    setSelection(emptySelection);
    setHoveredIso(null);
    setDraftNote("");
    setDraftNoteIcon("");
    setNoteValidationMessage(null);
  }

  function applyMonthChange(nextMonth: Date, nextSelection: RangeSelection = emptySelection) {
    startTransition(() => {
      setDisplayMonth(startOfMonth(nextMonth));
      setSelection(nextSelection);
      setHoveredIso(null);
      setDraftNote("");
      setDraftNoteIcon("");
      setDraftTodo("");
      setNoteValidationMessage(null);
      setTodoValidationMessage(null);
    });
  }

  function changeMonth(
    nextMonth: Date,
    direction: MonthAnimationDirection,
    nextSelection: RangeSelection = emptySelection
  ) {
    const normalizedMonth = startOfMonth(nextMonth);

    if (getMonthKey(normalizedMonth) === monthKey || isMonthAnimating) {
      return;
    }

    if (monthTransitionTimerRef.current !== null) {
      window.clearTimeout(monthTransitionTimerRef.current);
    }

    pendingMonthRef.current = normalizedMonth;
    pendingSelectionRef.current = nextSelection;
    setMonthAnimationDirection(direction);
    setMonthAnimationPhase("fold-out");

    monthTransitionTimerRef.current = window.setTimeout(() => {
      if (!pendingMonthRef.current) {
        return;
      }

      applyMonthChange(pendingMonthRef.current, pendingSelectionRef.current);
      setMonthAnimationPhase("fold-in");

      monthTransitionTimerRef.current = window.setTimeout(() => {
        setMonthAnimationPhase("idle");
        pendingMonthRef.current = null;
        pendingSelectionRef.current = emptySelection;
        monthTransitionTimerRef.current = null;
      }, monthFoldInDurationMs);
    }, monthFoldOutDurationMs);
  }

  function jumpToToday() {
    const today = new Date();
    const todayMonth = startOfMonth(today);
    const todayIso = toIsoDate(today);
    const todaySelection: RangeSelection = {
      startIso: todayIso,
      endIso: todayIso
    };

    if (getMonthKey(todayMonth) === monthKey) {
      setSelection(todaySelection);
      setHoveredIso(null);
      setDraftNote("");
      setDraftNoteIcon("");
      setDraftTodo("");
      setNoteValidationMessage(null);
      setTodoValidationMessage(null);
      return;
    }

    changeMonth(
      todayMonth,
      todayMonth > displayMonth ? "next" : "previous",
      todaySelection
    );
  }

  function saveRangeNote() {
    const trimmedNote = draftNote.trim();

    if (!selection.startIso) {
      const message = "Select a day or range before saving a note.";
      setNoteValidationMessage(message);
      showFeedback("info", "No dates selected", "Pick a day or drag out a range first.");
      return;
    }

    if (!trimmedNote) {
      const message = "Write a short note before saving.";
      setNoteValidationMessage(message);
      showFeedback("info", "Note is empty", "Add a reminder, event, or context for the selected dates.");
      return;
    }

    const normalized = selection.endIso
      ? sortRange(selection.startIso, selection.endIso)
      : { startIso: selection.startIso, endIso: selection.startIso };

    updateMonthState((currentState) => ({
      ...currentState,
      rangeNotes: [
        {
          id: createRangeNoteId(normalized.startIso, normalized.endIso),
          startIso: normalized.startIso,
          endIso: normalized.endIso,
          text: trimmedNote,
          icon: draftNoteIcon || undefined,
          createdAt: new Date().toISOString()
        },
        ...currentState.rangeNotes
      ]
    }));

    setNoteValidationMessage(null);
    setDraftNote("");
    setDraftNoteIcon("");
    setSelection(normalized);
    showFeedback(
      "success",
      "Note saved",
      formatSelectionLabel(normalized.startIso, normalized.endIso)
    );
  }

  function removeRangeNote(noteId: string) {
    const deletedNote = currentMonthState.rangeNotes.find((note) => note.id === noteId);

    updateMonthState((currentState) => ({
      ...currentState,
      rangeNotes: currentState.rangeNotes.filter((note) => note.id !== noteId)
    }));

    showFeedback(
      "info",
      "Note removed",
      deletedNote ? formatSelectionLabel(deletedNote.startIso, deletedNote.endIso) : undefined
    );
  }

  function addTodo() {
    const text = draftTodo.trim();

    if (!text) {
      const message = "Enter a task before adding it.";
      setTodoValidationMessage(message);
      showFeedback("info", "Task is empty", "Add one small action for the month.");
      return;
    }

    if (text.length > todoCharacterLimit) {
      const message = `Keep tasks under ${todoCharacterLimit} characters for readability.`;
      setTodoValidationMessage(message);
      showFeedback("error", "Task is too long", "Shorter tasks scan better in the calendar view.");
      return;
    }

    updateMonthState((currentState) => ({
      ...currentState,
      todos: [
        {
          id: createTodoId(),
          text,
          completed: false
        },
        ...currentState.todos
      ]
    }));

    setTodoValidationMessage(null);
    setDraftTodo("");
    showFeedback("success", "Task added", text);
  }

  function toggleTodo(todoId: string) {
    const toggledTodo = currentMonthState.todos.find((todo) => todo.id === todoId);

    updateMonthState((currentState) => ({
      ...currentState,
      todos: currentState.todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    }));

    if (toggledTodo) {
      showFeedback(
        toggledTodo.completed ? "info" : "success",
        toggledTodo.completed ? "Task reopened" : "Task completed",
        toggledTodo.text
      );
    }
  }

  function deleteTodo(todoId: string) {
    const deletedTodo = currentMonthState.todos.find((todo) => todo.id === todoId);

    updateMonthState((currentState) => ({
      ...currentState,
      todos: currentState.todos.filter((todo) => todo.id !== todoId)
    }));

    showFeedback("info", "Task removed", deletedTodo?.text);
  }

  async function handleHeroImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showFeedback("error", "Unsupported file", "Choose an image file for the calendar cover.");
      event.target.value = "";
      return;
    }

    if (file.size > heroImageMaxSizeBytes) {
      showFeedback("error", "Image is too large", "Use a file smaller than 5 MB for faster loading.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await saveMediaAsset(heroImageAssetId, dataUrl);
      setHeroImage(dataUrl);
      setIsHeroImageReady(true);
      showFeedback("success", "Hero image updated", "Saved locally for future visits.");
    } catch {
      showFeedback("error", "Upload failed", "Try a different image or refresh the page.");
    } finally {
      event.target.value = "";
    }
  }

  function handlePresetSelect(presetId: string) {
    setBackgroundPresetId(presetId);
    const nextPreset = backgroundPresets.find((preset) => preset.id === presetId);
    showFeedback("success", "Page tone updated", nextPreset?.label);
  }

  return (
    <section className={styles.calendarShell}>
      <div className={styles.hook} aria-hidden="true" />
      <div className={`${styles.threads} ${threadAnimationClass}`} aria-hidden="true">
        <span className={styles.threadLeft} />
        <span className={styles.threadRight} />
      </div>

      {feedbackMessage ? (
        <div className={styles.feedbackStack} aria-live="polite" aria-atomic="true">
          <FeedbackToast
            key={feedbackMessage.id}
            tone={feedbackMessage.tone}
            title={feedbackMessage.title}
            detail={feedbackMessage.detail}
            onDismiss={() => setFeedbackMessage(null)}
          />
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleHeroImageChange}
      />

      <div className={styles.calendarFrame}>
        <div className={`${styles.calendarSheet} ${monthAnimationClass}`}>
          <CalendarHero
            monthLabel={formatMonthLabel(displayMonth)}
            selectionLabel={formatSelectionLabel(selection.startIso, selection.endIso)}
            hasSelection={Boolean(selection.startIso)}
            isRangeLocked={Boolean(selection.endIso)}
            onClearSelection={clearSelection}
            heroImage={heroImage}
            iplHero={iplHero}
            isIplHeroReady={isIplHeroReady}
            onUploadClick={() => fileInputRef.current?.click()}
            presets={backgroundPresets}
            activePresetId={backgroundPresetId}
            onPresetSelect={handlePresetSelect}
          />

          <div className={`${styles.contentPanel} ${contentAnimationClass}`}>
            <div className={styles.controlsRow}>
              <div>
                <p className={styles.sectionLabel}>Planner grid</p>
                <h3>{formatMonthLabel(displayMonth)}</h3>
              </div>

              <div className={styles.navCluster}>
                <button
                  type="button"
                  disabled={isMonthAnimating}
                  onClick={() => changeMonth(addMonths(displayMonth, -1), "previous")}
                >
                  Prev
                </button>
                <button type="button" disabled={isMonthAnimating} onClick={jumpToToday}>
                  Today
                </button>
                <button
                  type="button"
                  disabled={isMonthAnimating}
                  onClick={() => changeMonth(addMonths(displayMonth, 1), "next")}
                >
                  Next
                </button>
              </div>
            </div>

            <div className={styles.mainGrid}>
              <div className={styles.sidebarRail}>
                <NotesPanel
                  isHydrated={isHydrated}
                  monthState={currentMonthState}
                  selection={selection}
                  draftNote={draftNote}
                  draftNoteIcon={draftNoteIcon}
                  validationMessage={noteValidationMessage}
                  onMonthMemoChange={handleMonthMemoChange}
                  onDraftNoteChange={(value) => {
                    setDraftNote(value);
                    if (noteValidationMessage) {
                      setNoteValidationMessage(null);
                    }
                  }}
                  onDraftNoteIconChange={setDraftNoteIcon}
                  onSaveRangeNote={saveRangeNote}
                  onResetDraft={() => {
                    setDraftNote("");
                    setDraftNoteIcon("");
                    setNoteValidationMessage(null);
                  }}
                  onDeleteRangeNote={removeRangeNote}
                />
              </div>

              <div className={styles.plannerRail}>
                <CalendarGrid
                  monthLabel={formatMonthLabel(displayMonth)}
                  cells={monthCells}
                  selection={selection}
                  effectiveRange={{
                    startIso: effectiveStartIso,
                    endIso: effectiveEndIso
                  }}
                  notes={currentMonthState.rangeNotes}
                  onDayClick={handleDayClick}
                  onDayHover={setHoveredIso}
                />

                <TodoPanel
                  items={currentMonthState.todos}
                  draft={draftTodo}
                  validationMessage={todoValidationMessage}
                  maxLength={todoCharacterLimit}
                  onDraftChange={(value) => {
                    setDraftTodo(value);
                    if (todoValidationMessage) {
                      setTodoValidationMessage(null);
                    }
                  }}
                  onAdd={addTodo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(`${reader.result ?? ""}`);
    reader.readAsDataURL(file);
  });
}
