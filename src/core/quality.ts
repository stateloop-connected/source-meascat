export type Quality = 'low' | 'medium' | 'high';
export interface QualitySettings {
  pixelRatioCap: number;
  waterSegments: number;
  foam: boolean;
  fogFar: number;
  grain: boolean;
}
export const QUALITY: Record<Quality, QualitySettings> = {
  low: { pixelRatioCap: 1.25, waterSegments: 48, foam: false, fogFar: 38, grain: false },
  medium: { pixelRatioCap: 1.6, waterSegments: 96, foam: true, fogFar: 55, grain: true },
  high: { pixelRatioCap: 2, waterSegments: 160, foam: true, fogFar: 70, grain: true },
};
const ORDER: Quality[] = ['low', 'medium', 'high'];

export function initialQuality(d: { coarsePointer: boolean; cores: number; memoryGB?: number }): Quality {
  if (d.coarsePointer) return d.cores <= 4 || (d.memoryGB ?? 4) <= 3 ? 'low' : 'medium';
  return d.cores <= 2 ? 'medium' : 'high';
}

/** Watches frame times: steps down when slow; steps up only if it has never stepped down (no flip-flopping). */
export class QualityGovernor {
  private samples: number[] = [];
  private fastWindows = 0;
  private downgraded = false;
  constructor(
    public level: Quality,
    private readonly window = 90,
  ) {}
  push(frameMs: number): Quality | null {
    this.samples.push(frameMs);
    if (this.samples.length < this.window) return null;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    const i = ORDER.indexOf(this.level);
    if (avg > 24 && i > 0) {
      this.level = ORDER[i - 1]!;
      this.downgraded = true;
      this.fastWindows = 0;
      return this.level;
    }
    if (avg < 13 && !this.downgraded && i < 2) {
      this.fastWindows++;
      if (this.fastWindows >= 3) {
        this.fastWindows = 0;
        this.level = ORDER[i + 1]!;
        return this.level;
      }
    } else this.fastWindows = 0;
    return null;
  }
}
