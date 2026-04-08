export type CalendarCell = {
  iso: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type SavedRangeNote = {
  id: string;
  startIso: string;
  endIso: string;
  text: string;
  icon?: string;
  createdAt: string;
};

export type CalendarMonthState = {
  monthMemo: string;
  rangeNotes: SavedRangeNote[];
  todos: TodoItem[];
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  priority?: "urgent" | "today" | "rest";
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric"
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short"
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function formatMonthLabel(date: Date) {
  return monthFormatter.format(date);
}

export function formatWeekdayLabel(date: Date) {
  return weekdayFormatter.format(date);
}

export function formatSelectionLabel(startIso?: string | null, endIso?: string | null) {
  if (!startIso) {
    return "Select a start date";
  }

  if (!endIso || startIso === endIso) {
    return shortDateFormatter.format(fromIsoDate(startIso));
  }

  return `${shortDateFormatter.format(fromIsoDate(startIso))} - ${shortDateFormatter.format(
    fromIsoDate(endIso)
  )}`;
}

export function getInclusiveDayCount(startIso?: string | null, endIso?: string | null) {
  if (!startIso) {
    return 0;
  }

  const startDate = fromIsoDate(startIso);
  const endDate = fromIsoDate(endIso ?? startIso);

  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
}

export function getMonthCells(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const startWeekday = firstDay.getDay();
  const gridStart = new Date(firstDay);

  gridStart.setDate(firstDay.getDate() - startWeekday);

  const todayIso = toIsoDate(new Date());
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    cells.push({
      iso: toIsoDate(current),
      date: current,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === monthDate.getMonth(),
      isToday: toIsoDate(current) === todayIso
    });
  }

  return cells;
}

export function sortRange(startIso: string, endIso: string) {
  return startIso <= endIso
    ? { startIso, endIso }
    : { startIso: endIso, endIso: startIso };
}

export function isWithinRange(iso: string, startIso?: string | null, endIso?: string | null) {
  if (!startIso || !endIso) {
    return false;
  }

  return iso >= startIso && iso <= endIso;
}

export function createEmptyMonthState(): CalendarMonthState {
  return {
    monthMemo: "",
    rangeNotes: [],
    todos: []
  };
}

export function createRangeNoteId(startIso: string, endIso: string) {
  return `${startIso}-${endIso}-${Date.now()}`;
}

export function createTodoId() {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeMonthState(input: Partial<CalendarMonthState> | null | undefined): CalendarMonthState {
  return {
    monthMemo: typeof input?.monthMemo === "string" ? input.monthMemo : "",
    rangeNotes: Array.isArray(input?.rangeNotes)
      ? input.rangeNotes.map((note) => ({
          id: typeof note?.id === "string" ? note.id : createRangeNoteId("note", `${Date.now()}`),
          startIso: typeof note?.startIso === "string" ? note.startIso : "",
          endIso: typeof note?.endIso === "string" ? note.endIso : "",
          text: typeof note?.text === "string" ? note.text : "",
          icon: typeof note?.icon === "string" ? note.icon : undefined,
          createdAt: typeof note?.createdAt === "string" ? note.createdAt : new Date().toISOString()
        }))
      : [],
    todos: Array.isArray(input?.todos) ? input.todos : []
  };
}
