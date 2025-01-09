// utils/dates.ts

export function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
}