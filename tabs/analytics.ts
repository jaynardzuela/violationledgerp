export type LiveMetrics = {
  timestamp: number;
  totalInBoundary: number;
  movingCount: number;
  parkedCount: number;
  violatingCount: number;
  warningsCount: number;
  avgViolationMs: number;
};

export type LiveSeries = {
  timestamps: number[];
  violationsSeries: number[];
};

export type AnalyticsSnapshot = LiveMetrics & LiveSeries;

type Subscriber = (snapshot: AnalyticsSnapshot) => void;

function floorToMinute(ts: number): number {
  return ts - (ts % 60000);
}

class AnalyticsStore {
  private subscribers: Set<Subscriber> = new Set();
  private bufferSize = 60; // keep last 60 minutes
  private timestamps: number[] = [];
  private violationsSeries: number[] = [];
  private lastMetrics: LiveMetrics | null = null;

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    if (this.lastMetrics) {
      cb(this.getSnapshot());
    }
    return () => {
      this.subscribers.delete(cb);
    };
  }

  publish(metrics: LiveMetrics) {
    this.lastMetrics = metrics;
    this.pushPoint(metrics.timestamp, metrics.violatingCount);
    const snapshot = this.getSnapshot();
    this.subscribers.forEach((cb) => cb(snapshot));
  }

  private pushPoint(ts: number, violations: number) {
    const minuteTs = floorToMinute(ts);
    const len = this.timestamps.length;
    if (len > 0 && this.timestamps[len - 1] === minuteTs) {
      // Update current minute bucket
      this.violationsSeries[len - 1] = violations;
    } else {
      // Append a new minute bucket
      this.timestamps.push(minuteTs);
      this.violationsSeries.push(violations);
      if (this.timestamps.length > this.bufferSize) {
        this.timestamps.shift();
        this.violationsSeries.shift();
      }
    }
  }

  getSnapshot(): AnalyticsSnapshot {
    const base: LiveMetrics = this.lastMetrics ?? {
      timestamp: Date.now(),
      totalInBoundary: 0,
      movingCount: 0,
      parkedCount: 0,
      violatingCount: 0,
      warningsCount: 0,
      avgViolationMs: 0,
    };
    return {
      ...base,
      timestamps: [...this.timestamps],
      violationsSeries: [...this.violationsSeries],
    };
  }
}

export const analyticsStore = new AnalyticsStore();
