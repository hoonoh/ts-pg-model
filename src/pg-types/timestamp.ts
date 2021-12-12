export class Timestamp extends Date {
  private microsecond: number;

  private timezone: string;

  constructor();
  constructor(value: number | string);
  constructor(
    year: number,
    month: number,
    date?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    ms?: number,
  );
  constructor(value: number | string | Date);
  constructor(...args: any) {
    if (!args.length) {
      super();
    } else if (
      args.length === 1 &&
      (typeof args[0] === 'number' || typeof args[0] === 'string' || args[0] instanceof Date)
    ) {
      super(args[0]);
    } else {
      const [year, month, date, hours, minutes, seconds, ms] = args;
      super(year, month, date, hours, minutes, seconds, ms);
    }

    if (args.length === 1 && typeof args[0] === 'string') {
      const match = args[0].match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.(\d+)([-|+]\d{2})/);
      if (match && match.length >= 2) {
        this.microsecond = parseInt(match[1].padEnd(6, '0'), 10);
        [, , this.timezone] = match;
      }
    }

    this.timezone ??= '+00';
    this.microsecond ??= this.getMilliseconds() * 1000; // + Math.floor(Math.random() * 999);
  }

  getTimezone() {
    return this.timezone;
  }

  getMicroSeconds() {
    return this.microsecond;
  }

  setMicroSeconds(mus: number) {
    if (mus < 0 || mus > 1e6) throw new Error('micro second value has to be between 0 & 1e6');
    this.microsecond = Math.floor(mus);
  }

  toISOString() {
    return super
      .toISOString()
      .replace(
        `${super.getMilliseconds().toString().padStart(3, '0')}Z`,
        `${this.microsecond.toString().padStart(6, '0')}Z`,
      );
  }

  toJSON() {
    return this.toISOString();
  }
}
