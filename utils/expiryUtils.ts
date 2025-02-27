export class ExpiryUtils {
  private static readonly DEFAULT_EXPIRIES: { [key: string]: number } = {
    milk: 7,
    eggs: 21,
    cheese: 14,
    yogurt: 14,
    butter: 30,
    chicken: 2,
    beef: 3,
    fish: 2,
    carrots: 14,
    apples: 14,
    lettuce: 7,
    tomatoes: 7,
    bread: 5,
    juice: 7
  };

  static calculateDefaultExpiry(itemName: string): string {
    const today = new Date();
    const daysToAdd = this.getDefaultExpiryDays(itemName);
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  }

  private static getDefaultExpiryDays(itemName: string): number {
    return this.DEFAULT_EXPIRIES[itemName.toLowerCase()] || 7;
  }
}
