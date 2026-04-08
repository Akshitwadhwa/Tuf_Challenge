export type IplHeroStatus = "live" | "upcoming" | "completed" | "unavailable";

export type IplHeroData = {
  status: IplHeroStatus;
  label: string;
  title: string;
  subtitle: string;
  teamAName: string;
  teamAShort: string;
  teamAScore: string | null;
  teamBName: string;
  teamBShort: string;
  teamBScore: string | null;
  venue: string;
  startLabel: string;
  updatedAt: string;
  sourceUrl: string;
};

type FixtureCard = {
  dateLabel: string;
  dateKey: string | null;
  statusText: string;
  footerText: string;
  timeText: string;
  teamAId: string | null;
  teamAName: string;
  teamAShort: string;
  teamBId: string | null;
  teamBName: string;
  teamBShort: string;
  scorecardPath: string;
};

type SportsEventData = {
  eventStatus?: string;
};

type WisdenScore = {
  runs?: string;
  overs?: string;
};

type WisdenTeam = {
  Name_Full?: string;
  Name_Short?: string;
  actual_Name_Full?: string;
  actual_Name_Short?: string;
  id?: string;
};

type WisdenGameData = {
  Timestamp?: string;
  Matchdetail?: {
    Team_Home?: string;
    Team_Away?: string;
    Match?: {
      Upcoming?: boolean;
      Live?: boolean;
      Recent?: boolean;
      Time?: string;
      Offset?: string;
      Date?: string;
      StartDate?: string;
      Status?: string;
      Match_display_status?: string;
      Result?: string;
      Equation?: string;
      sub_status?: string;
      state?: string;
    };
    Venue?: {
      Name?: string;
      City?: string;
    };
  };
  Teams?: Record<string, WisdenTeam>;
  scores?: Record<string, { scores?: WisdenScore[] }>;
};

type WisdenMatchData = NonNullable<NonNullable<WisdenGameData["Matchdetail"]>["Match"]>;

const WISDEN_BASE_URL = "https://www.wisden.com";
const IPL_FIXTURES_URL = `${WISDEN_BASE_URL}/series/ipl-2026/live-cricket-scores-schedule-fixtures-results`;
const scorecardDataNeedle = '"fantasyWidgetData":{"apis":{"gameData":{"data":';
const htmlHeaders = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

export async function fetchLatestIplHeroData(now = new Date()): Promise<IplHeroData> {
  const fixturesHtml = await fetchHtml(IPL_FIXTURES_URL);
  const fixtures = parseFixtureCards(fixturesHtml);
  const activeFixture = pickFeaturedFixture(fixtures, now);

  if (!activeFixture) {
    return createUnavailableHero();
  }

  const scorecardUrl = makeAbsoluteUrl(activeFixture.scorecardPath);
  const scorecardHtml = await fetchHtml(scorecardUrl);
  const sportsEvent = extractJsonLd<SportsEventData>(scorecardHtml, "SportsEvent");
  const gameData = extractGameData(scorecardHtml);

  return buildHeroData(activeFixture, scorecardUrl, sportsEvent, gameData);
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: htmlHeaders,
    next: {
      revalidate: 60
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch IPL data from ${url}`);
  }

  return response.text();
}

function parseFixtureCards(html: string) {
  const wrappers = html.split('<div class="tab-container-wrapper">').slice(1);
  const cards: FixtureCard[] = [];

  for (const wrapper of wrappers) {
    const dateLabel = getTextMatch(wrapper, /<span class="meta date">([^<]+)<\/span>/);
    const dateKey = toDateKey(dateLabel);
    const cardSegments = wrapper.split('<div class="card-item ').slice(1);

    for (const card of cardSegments) {
      const teamNames = [...card.matchAll(/<p class="team-name full-name">([^<]+)<\/p>/g)].map((match) =>
        decodeHtml(match[1] ?? "")
      );
      const teamShortNames = [...card.matchAll(/alt="([^"]+)" class="team-logo lazy"/g)].map((match) =>
        decodeHtml(match[1] ?? "")
      );
      const teamIds = [...card.matchAll(/data-src="\/static-assets\/images\/teams\/(\d+)\.png/g)].map(
        (match) => match[1] ?? null
      );
      const scorecardPath = getTextMatch(card, /<a href="([^"]+)" title="View more" class="btn btn-more btn-scorecard"/);

      if (teamNames.length < 2 || !scorecardPath) {
        continue;
      }

      cards.push({
        dateLabel,
        dateKey,
        statusText: getTextMatch(card, /<span class="status">([^<]+)<\/span>/),
        footerText: collapseWhitespace(getTextMatch(card, /<p class="card-footer-text">\s*([^<]+?)\s*<\/p>/)),
        timeText: getTextMatch(card, /<p class="time-text">([^<]+)<\/p>/),
        teamAId: teamIds[0] ?? null,
        teamAName: teamNames[0] ?? "",
        teamAShort: teamShortNames[0] ?? initials(teamNames[0] ?? ""),
        teamBId: teamIds[1] ?? null,
        teamBName: teamNames[1] ?? "",
        teamBShort: teamShortNames[1] ?? initials(teamNames[1] ?? ""),
        scorecardPath
      });
    }
  }

  return cards;
}

function pickFeaturedFixture(fixtures: FixtureCard[], now: Date) {
  if (fixtures.length === 0) {
    return null;
  }

  const todayKey = getCurrentDateKey(now);
  const todaysFixtures = fixtures.filter((fixture) => fixture.dateKey === todayKey);

  if (todaysFixtures.length > 0) {
    return (
      todaysFixtures.find(
        (fixture) =>
          /live|recent/i.test(fixture.statusText) || !/match yet to begin/i.test(fixture.footerText)
      ) ?? todaysFixtures[0]
    );
  }

  const nextFixture = fixtures.find(
    (fixture) => fixture.dateKey !== null && fixture.dateKey >= todayKey
  );

  return nextFixture ?? fixtures[fixtures.length - 1];
}

function buildHeroData(
  fixture: FixtureCard,
  scorecardUrl: string,
  sportsEvent: SportsEventData | null,
  gameData: WisdenGameData | null
): IplHeroData {
  const match = gameData?.Matchdetail?.Match;
  const status = resolveStatus(match, sportsEvent, fixture.statusText);
  const teamA = resolveTeam(gameData, fixture.teamAId, fixture.teamAName, fixture.teamAShort);
  const teamB = resolveTeam(gameData, fixture.teamBId, fixture.teamBName, fixture.teamBShort);
  const teamAScore = getScore(gameData, fixture.teamAId);
  const teamBScore = getScore(gameData, fixture.teamBId);

  return {
    status,
    label: getStatusLabel(status),
    title: "IPL 2026",
    subtitle: getSubtitle(status, fixture, match),
    teamAName: teamA.name,
    teamAShort: teamA.shortName,
    teamAScore,
    teamBName: teamB.name,
    teamBShort: teamB.shortName,
    teamBScore,
    venue:
      collapseWhitespace(gameData?.Matchdetail?.Venue?.Name ?? "") ||
      collapseWhitespace(fixture.footerText ?? "") ||
      "Venue to be confirmed",
    startLabel: getStartLabel(fixture, match),
    updatedAt: normalizeTimestamp(gameData?.Timestamp),
    sourceUrl: scorecardUrl
  };
}

function resolveStatus(
  match: WisdenMatchData | undefined,
  sportsEvent: SportsEventData | null,
  fixtureStatus: string
): IplHeroStatus {
  if (match?.Live || match?.state === "L") {
    return "live";
  }

  if (match?.Recent || match?.state === "R" || sportsEvent?.eventStatus === "Completed") {
    return "completed";
  }

  if (match?.Upcoming || /upcoming/i.test(fixtureStatus)) {
    return "upcoming";
  }

  return "unavailable";
}

function resolveTeam(
  gameData: WisdenGameData | null,
  teamId: string | null,
  fallbackName: string,
  fallbackShort: string
) {
  const team = (teamId ? gameData?.Teams?.[teamId] : null) ?? null;

  return {
    name: collapseWhitespace(team?.actual_Name_Full ?? team?.Name_Full ?? fallbackName) || fallbackName,
    shortName:
      collapseWhitespace(team?.actual_Name_Short ?? team?.Name_Short ?? fallbackShort) ||
      fallbackShort ||
      initials(fallbackName)
  };
}

function getScore(gameData: WisdenGameData | null, teamId: string | null) {
  if (!gameData || !teamId) {
    return null;
  }

  const directScore = gameData.scores?.[teamId]?.scores?.[0];

  if (directScore?.runs) {
    const overs = directScore.overs ? `${trimTrailingZeros(directScore.overs)} ov` : null;
    return overs ? `${directScore.runs} (${overs})` : directScore.runs;
  }

  return null;
}

function getStatusLabel(status: IplHeroStatus) {
  switch (status) {
    case "live":
      return "Live score";
    case "completed":
      return "Latest result";
    case "upcoming":
      return "Next match";
    default:
      return "IPL update";
  }
}

function getSubtitle(
  status: IplHeroStatus,
  fixture: FixtureCard,
  match: WisdenMatchData | undefined
) {
  if (status === "completed" || status === "live") {
    return (
      collapseWhitespace(match?.Equation ?? match?.Result ?? match?.sub_status ?? match?.Status ?? "") ||
      collapseWhitespace(fixture.footerText) ||
      "Score update unavailable"
    );
  }

  return collapseWhitespace(match?.sub_status ?? fixture.footerText) || "Schedule update unavailable";
}

function getStartLabel(
  fixture: FixtureCard,
  match: WisdenMatchData | undefined
) {
  const dateLabel = collapseWhitespace(match?.Date ?? fixture.dateLabel);
  const timeLabel = collapseWhitespace(match?.Time ?? fixture.timeText);
  const offset = collapseWhitespace(match?.Offset ?? "");

  if (dateLabel && timeLabel && offset) {
    return `${dateLabel} · ${timeLabel} (${offset})`;
  }

  if (dateLabel && timeLabel) {
    return `${dateLabel} · ${timeLabel}`;
  }

  return dateLabel || timeLabel || "Schedule pending";
}

function extractJsonLd<T extends object>(html: string, type: string) {
  const matches = [...html.matchAll(/<script data-n-head="ssr" type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1] ?? "") as { ["@type"]?: string };

      if (parsed["@type"] === type) {
        return parsed as T;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractGameData(html: string) {
  const needleIndex = html.indexOf(scorecardDataNeedle);

  if (needleIndex === -1) {
    return null;
  }

  const dataStart = html.indexOf("{", needleIndex + scorecardDataNeedle.length - 1);

  if (dataStart === -1) {
    return null;
  }

  const jsonSource = extractBalancedJsonObject(html, dataStart);

  if (!jsonSource) {
    return null;
  }

  try {
    return JSON.parse(jsonSource) as WisdenGameData;
  } catch {
    return null;
  }
}

function extractBalancedJsonObject(source: string, startIndex: number) {
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (character === "\\") {
        escaping = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function makeAbsoluteUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${WISDEN_BASE_URL}${path}`;
}

function getTextMatch(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return decodeHtml(match?.[1] ?? "").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toDateKey(label: string) {
  if (!label) {
    return null;
  }

  const parsedDate = new Date(label.replace(/,/g, ""));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getCurrentDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function normalizeTimestamp(timestamp?: string) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const normalized = new Date(timestamp.replace(/^(\d{2})\/(\d{2})\/(\d{4})T/, "$3-$1-$2T"));

  if (Number.isNaN(normalized.getTime())) {
    return new Date().toISOString();
  }

  return normalized.toISOString();
}

function trimTrailingZeros(value: string) {
  return value.replace(/\.0+$/, "");
}

function createUnavailableHero(): IplHeroData {
  return {
    status: "unavailable",
    label: "IPL update",
    title: "IPL 2026",
    subtitle: "Live schedule unavailable right now.",
    teamAName: "",
    teamAShort: "",
    teamAScore: null,
    teamBName: "",
    teamBShort: "",
    teamBScore: null,
    venue: "",
    startLabel: "",
    updatedAt: new Date().toISOString(),
    sourceUrl: IPL_FIXTURES_URL
  };
}
