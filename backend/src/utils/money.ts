export class Money {
  private paise: number;

  constructor(rupees: number) {
    this.paise = Math.round(rupees * 100);
    if (!Number.isFinite(this.paise)) {
      throw new Error(`Invalid amount: ${rupees}`);
    }
  }

  static fromPaise(paise: number): Money {
    const m = new Money(0);
    m.paise = Math.round(paise);
    return m;
  }

  static fromRupees(rupees: number): Money {
    return new Money(rupees);
  }

  getRupees(): number {
    return this.paise / 100;
  }

  getPaise(): number {
    return this.paise;
  }

  equals(other: Money): boolean {
    return this.paise === other.paise;
  }

  add(other: Money): Money {
    return Money.fromPaise(this.paise + other.paise);
  }

  subtract(other: Money): Money {
    return Money.fromPaise(this.paise - other.paise);
  }

  toJSON(): string {
    return this.getRupees().toFixed(2);
  }

  toString(): string {
    return `₹${this.getRupees().toFixed(2)}`;
  }
}
