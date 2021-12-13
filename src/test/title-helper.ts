export class TitleHelper {
  private groups: string[] = [];

  constructor(private titleInit?: string) {}

  group(subTitle: string) {
    this.groups.push(subTitle);
  }

  ungroup() {
    this.groups.pop();
  }

  private composeTitle(description: string, emoji = '🧪') {
    return (
      `${emoji} ` +
      (this.titleInit ? `${this.titleInit} ${this.nextSymbol} ` : '') +
      (this.groups.length ? `[${this.groups.join(`/`)}] ${this.nextSymbol} ` : '') +
      description
    );
  }

  private nextSymbol = '›';

  should(description: string) {
    return this.composeTitle(`should ${description}`, '🧪');
  }

  throwsWhen(description: string) {
    return this.composeTitle(`throws when ${description}`, '🔴');
  }
}
