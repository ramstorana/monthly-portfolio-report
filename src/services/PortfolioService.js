import { fetchBitcoinPrice, fetchGoldPrice, fetchExchangeRates, fetchStockPrice } from './marketData.js';
import { getWIBDate, isEndOfMonthWIB, formatDateWIB } from '../utils/time.js';
import { HISTORY_2025 } from '../data/history.js';

const STORAGE_KEY = 'networth_data_v4_3'; // Bumped for 2026 update

// Initial Data from '1-JAN-2026 POSITION copy.xlsx'
const INITIAL_ASSETS = [
    // Cash
    { id: '1', type: 'cash', name: 'TD (Time Deposit)', quantity: 1, currency: 'IDR', manual_price_idr: 500000000 },
    { id: '2', type: 'cash', name: 'Savings USD', quantity: 7670, currency: 'USD', manual_price_idr: 0 },
    { id: '3', type: 'cash', name: 'Savings JPY', quantity: 2163702, currency: 'JPY', manual_price_idr: 0 },

    // Crypto
    { id: '4', type: 'crypto', name: 'Bitcoin', ticker: 'BTC', quantity: 0.11278015, manual_price_idr: 0, currency: 'IDR' },

    // Stocks
    { id: '5', type: 'stock', name: 'Jasa Marga', ticker: 'JSMR.JK', quantity: 9300, manual_price_idr: 0, currency: 'IDR' },
    { id: '6', type: 'stock', name: 'Bumi Resources', ticker: 'BUMI.JK', quantity: 150500, manual_price_idr: 0, currency: 'IDR' },
    { id: '7', type: 'stock', name: 'Adaro Minerals', ticker: 'AADI.JK', quantity: 13800, manual_price_idr: 0, currency: 'IDR' },
    { id: '8', type: 'stock', name: 'Saratoga', ticker: 'SRTG.JK', quantity: 93000, manual_price_idr: 0, currency: 'IDR' },
    { id: '9', type: 'stock', name: 'Tugu Insurance', ticker: 'TUGU.JK', quantity: 200000, manual_price_idr: 0, currency: 'IDR' },
    { id: '10', type: 'stock', name: 'Bank Mandiri', ticker: 'BMRI.JK', quantity: 19200, manual_price_idr: 0, currency: 'IDR' },
    { id: '11', type: 'stock', name: 'BCA', ticker: 'BBCA.JK', quantity: 12800, manual_price_idr: 0, currency: 'IDR' },

    // Gold
    { id: '12', type: 'gold', name: 'Physical Gold', quantity: 550, currency: 'IDR', manual_price_idr: 0 },
];

// Initial State Structure
const INITIAL_STATE = {
    assets: INITIAL_ASSETS,
    snapshots: HISTORY_2025, // Populated from Excel history
    auditLog: [],  // User actions (unlock, edit past)
    projects: {
        "2025": { status: "completed", baseline: 280000000, target: 3915000000 },
    },
    meta: {
        lastAutoLockCheck: null
    }
};

export const PortfolioService = {
    // --- PERSISTENCE ---

    getData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            this.saveData(INITIAL_STATE);
            return INITIAL_STATE;
        }
        return JSON.parse(stored);
    },

    saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    getLocalAssets() {
        return this.getData().assets || [];
    },

    // --- ASSET MANAGEMENT ---

    async addAsset(asset) {
        const data = this.getData();
        const newAsset = { ...asset, id: crypto.randomUUID() };
        data.assets.push(newAsset);
        this.saveData(data);
        return newAsset;
    },

    async updateAsset(updatedAsset) {
        const data = this.getData();
        const index = data.assets.findIndex(a => a.id === updatedAsset.id);
        if (index !== -1) {
            data.assets[index] = updatedAsset;
            this.saveData(data);
        }
    },

    async deleteAsset(id) {
        const data = this.getData();
        data.assets = data.assets.filter(a => a.id !== id);
        this.saveData(data);
    },

    // --- SNAPSHOTS & HISTORY ---

    createSnapshot(bypassTimeCheck = false) {
        // Only run if EOM condition met or bypassed (for testing)
        if (!bypassTimeCheck && !isEndOfMonthWIB()) return null;

        const data = this.getData();
        const now = getWIBDate();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();
        const id = `${year}-${month}`;

        // Check if snapshot already exists
        if (data.snapshots.find(s => s.id === id)) return null;

        // Calculate Totals (Synchronous estimate, ideally we fetch fresh prices before locking)
        // For simplicity in this logic, we use the assets as is, assuming UI refreshed prices.
        // A deeper implementation would call calculatePortfolioValues here.

        const snapshot = {
            id,
            year,
            month,
            date: now.toISOString(),
            assets: data.assets, // Deep copy ideally
            isLocked: true,
            totalNetWorth: 0 // Needs calculation
        };

        // We push it, but we rely on the component to enrich it with values first?
        // Let's defer actual saving until we have calculated values.
        // This method is a helper.
        return snapshot;
    },

    saveSnapshot(enrichedSnapshot) {
        const data = this.getData();
        // Remove existing if any (overwrite logic for re-locking)
        data.snapshots = data.snapshots.filter(s => s.id !== enrichedSnapshot.id);
        data.snapshots.push(enrichedSnapshot);
        this.saveData(data);
    },

    getHistory() {
        const data = this.getData();
        return data.snapshots.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    // --- AUDIT LOG ---
    logAction(action, details) {
        const data = this.getData();
        data.auditLog.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action,
            details
        });
        this.saveData(data);
    },

    // --- CALCULATION METHODS ---

    /**
     * Orchestrates the enrichment of assets with current market prices.
     * @param {Array} assets - List of asset objects.
     * @returns {Promise<Array>} - List of assets with calculated 'currentValue' and 'currentPrice'.
     */
    async calculatePortfolioValues(assets) {
        if (!assets || assets.length === 0) return [];

        const [btcPrice, goldPrice, fxRates] = await Promise.all([
            fetchBitcoinPrice(),
            fetchGoldPrice(),
            fetchExchangeRates()
        ]);

        const updatedAssets = await Promise.all(assets.map(async (asset) => {
            let currentPrice = 0;
            // Default currency to IDR if undefined
            const currency = asset.currency || 'IDR';
            const exchangeRate = fxRates[currency] || 1;

            try {
                switch (asset.type) {
                    case 'crypto':
                        currentPrice = (asset.ticker === 'BTC') ? btcPrice : (parseFloat(asset.manual_price_idr) || 0);
                        break;
                    case 'gold':
                        currentPrice = goldPrice;
                        break;
                    case 'stock':
                        if (asset.ticker) {
                            currentPrice = await fetchStockPrice(asset.ticker);
                        } else {
                            currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        }
                        break;
                    case 'etf':
                        currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        break;
                    case 'cash':
                        // For cash, "Price" is effectively 1 unit of that currency.
                        // We use the exchange rate as the "Current Price in IDR"
                        currentPrice = exchangeRate;
                        break;
                    default:
                        currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        break;
                }

                // If asset has quantity, use it. Default to 0.
                const qty = parseFloat(asset.quantity) || 0;

                return {
                    ...asset,
                    currentPrice, // This is Price in IDR per unit (or per currency unit)
                    currentValue: qty * currentPrice,  // Total Value in IDR
                    exchangeRateUsed: exchangeRate
                };

            } catch (err) {
                console.error(`Failed to calculate value for asset ${asset.name}:`, err);
                return { ...asset, currentPrice: 0, currentValue: 0, error: true };
            }
        }));

        return updatedAssets;
    },

    calculateTotalNetWorth(enrichedAssets) {
        return enrichedAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    }
};
