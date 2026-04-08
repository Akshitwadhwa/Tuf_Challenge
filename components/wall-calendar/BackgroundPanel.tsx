import styles from "./WallCalendar.module.css";

export type BackgroundPreset = {
  id: string;
  label: string;
  preview: string;
};

type BackgroundPanelProps = {
  presets: BackgroundPreset[];
  activePresetId: string;
  isUsingCustomImage: boolean;
  isReady: boolean;
  onPresetSelect: (presetId: string) => void;
  onUploadClick: () => void;
  onResetCustomImage: () => void;
};

export function BackgroundPanel({
  presets,
  activePresetId,
  isUsingCustomImage,
  isReady,
  onPresetSelect,
  onUploadClick,
  onResetCustomImage
}: BackgroundPanelProps) {
  return (
    <section className={`${styles.noteSection} ${styles.backgroundSection}`}>
      <div className={styles.notesHeading}>
        <div>
          <p className={styles.sectionLabel}>Background</p>
          <h4>Page backdrop</h4>
        </div>
        <span className={styles.savedIndicator}>{isReady ? "Saved" : "Loading"}</span>
      </div>

      <div className={styles.presetGrid}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`${styles.presetSwatch} ${
              !isUsingCustomImage && activePresetId === preset.id ? styles.presetSwatchActive : ""
            }`}
            onClick={() => onPresetSelect(preset.id)}
            aria-pressed={!isUsingCustomImage && activePresetId === preset.id}
          >
            <span className={styles.presetPreview} style={{ background: preset.preview }} />
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.noteActions}>
        <button type="button" onClick={onUploadClick}>
          {isUsingCustomImage ? "Change background" : "Upload background"}
        </button>
        <button
          type="button"
          className={styles.ghostButton}
          onClick={onResetCustomImage}
          disabled={!isUsingCustomImage}
        >
          Use preset
        </button>
      </div>
    </section>
  );
}
