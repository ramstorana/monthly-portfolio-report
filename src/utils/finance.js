export const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatBillions = (amount) => {
    if (amount >= 1e12) {
        return `Rp ${(amount / 1e12).toFixed(2)}T`;
    }
    if (amount >= 1e9) {
        return `Rp ${(amount / 1e9).toFixed(2)}B`;
    }
    if (amount >= 1e6) {
        return `Rp ${(amount / 1e6).toFixed(2)}M`;
    }
    return formatIDR(amount);
};

export const calculateProgress = (current, target) => {
    if (target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
};

export const calculateGap = (current, target) => {
    return current - target;
};

export const calculateRequiredMonthlyGain = (current, target) => {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const monthsRemaining = (endOfYear - now) / (1000 * 60 * 60 * 24 * 30.44); // Approx months

    if (monthsRemaining <= 0) return 0;

    const gap = target - current;
    return gap / monthsRemaining;
};
