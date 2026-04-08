import { useEffect, useRef, useState } from "react";
import type { IplHeroData } from "@/lib/ipl";
import type { BackgroundPreset } from "./BackgroundPanel";
import styles from "./WallCalendar.module.css";

type CalendarHeroProps = {
  monthLabel: string;
  heroImage: string | null;
  iplHero: IplHeroData | null;
  isIplHeroReady: boolean;
  onUploadClick: () => void;
  presets: BackgroundPreset[];
  activePresetId: string;
  onPresetSelect: (presetId: string) => void;
};

export function CalendarHero({
  monthLabel,
  heroImage,
  iplHero,
  isIplHeroReady,
  onUploadClick,
  presets,
  activePresetId,
  onPresetSelect
}: CalendarHeroProps) {
  const [monthName, year] = monthLabel.split(" ");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToneOpen, setIsToneOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
        setIsToneOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <header className={styles.heroPanel}>
      <div className={styles.heroImage}>
        <div className={styles.heroSettings} ref={settingsRef}>
          <button
            type="button"
            className={styles.heroSettingsButton}
            onClick={() => {
              setIsSettingsOpen((open) => !open);
              setIsToneOpen(false);
            }}
            aria-label="Open hero settings"
            aria-expanded={isSettingsOpen}
            aria-haspopup="menu"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={styles.heroSettingsIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="6" x2="19" y2="6" />
              <line x1="5" y1="12" x2="19" y2="12" />
              <line x1="5" y1="18" x2="19" y2="18" />
              <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {isSettingsOpen ? (
            <div className={styles.heroSettingsMenu} role="menu" aria-label="Hero settings">
              <button
                type="button"
                className={styles.heroSettingsMenuItem}
                onClick={() => {
                  onUploadClick();
                  setIsSettingsOpen(false);
                  setIsToneOpen(false);
                }}
              >
                Change background image
              </button>

              <button
                type="button"
                className={styles.heroSettingsMenuItem}
                aria-expanded={isToneOpen}
                onClick={() => setIsToneOpen((open) => !open)}
              >
                Change tone
              </button>

              {isToneOpen ? (
                <div className={styles.heroToneMenu}>
                  <span className={styles.heroToneLabel}>Page tone</span>
                  <div className={`${styles.presetGrid} ${styles.heroToneGrid}`}>
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${styles.presetSwatch} ${
                          activePresetId === preset.id ? styles.presetSwatchActive : ""
                        }`}
                        onClick={() => {
                          onPresetSelect(preset.id);
                          setIsSettingsOpen(false);
                          setIsToneOpen(false);
                        }}
                        aria-pressed={activePresetId === preset.id}
                      >
                        <span className={styles.presetPreview} style={{ background: preset.preview }} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {heroImage ? (
          <img src={heroImage} alt="Custom calendar cover" className={styles.heroPhoto} />
        ) : (
          <>
            <div className={styles.heroSky} />
            <div className={styles.heroPeak} />
            <div className={styles.heroSlope} />
            <div className={styles.heroClimber} aria-hidden="true" />
          </>
        )}

        <div className={styles.heroWaveLeft} />
        <div className={styles.heroWaveCenter} />
        <div className={styles.heroWaveRight} />

        {iplHero ? (
          <section className={styles.iplOverlay} aria-label="Latest IPL match update">
            <div className={styles.iplHeader}>
              <span className={styles.iplBadge}>{iplHero.label}</span>
              <span className={styles.iplUpdated}>{formatUpdatedAt(iplHero.updatedAt)}</span>
            </div>

            <div className={styles.iplCopy}>
              <span className={styles.iplSeries}>{iplHero.title}</span>
              <strong>{iplHero.subtitle}</strong>
            </div>

            <div className={styles.iplTeams}>
              <div className={styles.iplTeam}>
                <span>{iplHero.teamAShort}</span>
                <strong>{iplHero.teamAName}</strong>
                <em>{iplHero.teamAScore ?? "Score pending"}</em>
              </div>

              <div className={styles.iplVersus}>vs</div>

              <div className={styles.iplTeam}>
                <span>{iplHero.teamBShort}</span>
                <strong>{iplHero.teamBName}</strong>
                <em>{iplHero.teamBScore ?? "Score pending"}</em>
              </div>
            </div>

            <div className={styles.iplMeta}>
              <span>{iplHero.venue}</span>
              <span>{iplHero.startLabel}</span>
            </div>
          </section>
        ) : !isIplHeroReady ? (
          <section className={styles.iplOverlay} aria-hidden="true">
            <div className={styles.iplHeader}>
              <span className={styles.iplBadge}>IPL update</span>
            </div>
            <div className={styles.iplSkeleton} />
          </section>
        ) : null}

        <div className={styles.monthStamp}>
          <span>{year}</span>
          <strong>{monthName.toUpperCase()}</strong>
        </div>
      </div>
    </header>
  );
}

function formatUpdatedAt(value: string) {
  const updatedAt = new Date(value);

  if (Number.isNaN(updatedAt.getTime())) {
    return "Just updated";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(updatedAt);
}
