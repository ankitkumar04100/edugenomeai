// Telemetry & Logging module
export interface TelemetryEvent {
  timestamp: number;
  type: string;
  data: Record<string, any>;
}

class TelemetryLogger {
  private events: TelemetryEvent[] = [];

  log(type: string, data: Record<string, any> = {}) {
    const event: TelemetryEvent = { timestamp: Date.now(), type, data };
    this.events.push(event);
    if (this.events.length > 500) this.events = this.events.slice(-250);
    console.debug(`[Telemetry] ${type}`, data);
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  getRecentEvents(count: number = 20): TelemetryEvent[] {
    return this.events.slice(-count);
  }

  clear() {
    this.events = [];
  }
}

export const telemetry = new TelemetryLogger();
