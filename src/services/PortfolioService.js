import { fetchBitcoinPrice, fetchGoldPrice, fetchExchangeRates, fetchStockPrice } from './marketData.js';
import { getWIBDate, isEndOfMonthWIB, formatDateWIB } from '../utils/time.js';
import { HISTORY_2025 } from '../data/history.js';

const STORAGE_KEY = 'networth_data_v4_4'; // Bumped for 2026 update (JSMR fix)

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
        let data = stored ? JSON.parse(stored) : INITIAL_STATE;

        if (!stored) {
            this.saveData(INITIAL_STATE);
        }

        // --- HARD SYNC 2025 HISTORY ---
        // Ensure 2025 data always comes from the JSON file (Source of Truth)
        // This fixes the issue where LocalStorage has stale 2025 data
        const storedSnapshots = data.snapshots || [];
        const activeSnapshots = storedSnapshots.filter(s => s.year !== 2025);

        // Merge: Imported 2025 History + Active/Other History
        data.snapshots = [...HISTORY_2025, ...activeSnapshots].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        return data;
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
        const newAsset = {
            ...asset,
            id: (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
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

        // 1. Gather all tickers to fetch
        const stockTickers = assets
            .filter(a => a.type === 'stock' && a.ticker)
            .map(a => a.ticker);

        // 2. Fetch all market data in on go
        // We import fetchMarketData dynamically or assume it's imported (need to update imports)
        const marketData = await import('./marketData.js').then(m => m.fetchMarketData(stockTickers));

        // Extract standard indices
        const btcPrice = marketData['BTC-IDR'] || 1633000000;
        const goldUsdOz = marketData['XAUUSD=X'];
        const usdIdr = marketData['USDIDR=X'] || 16800;
        const jpyIdr = marketData['JPYIDR=X'] || 108;

        // Gold Calc
        let goldPrice = 1450000;
        if (goldUsdOz && usdIdr) {
            goldPrice = (goldUsdOz * usdIdr) / 31.1035;
        }

        const fxRates = {
            IDR: 1,
            USD: usdIdr,
            JPY: jpyIdr,
            SGD: 12100 // Hardcoded fallback or need symbol
        };

        const updatedAssets = assets.map((asset) => {
            let currentPrice = 0;
            const currency = asset.currency || 'IDR';
            const exchangeRate = fxRates[currency] || 1;

            try {
                switch (asset.type) {
                    case 'crypto':
                        currentPrice = (asset.ticker === 'BTC') ? btcPrice : (parseFloat(asset.manual_price_idr) || 0);
                        break;
                    case 'gold':
                        currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        break;
                    case 'stock':
                        if (asset.ticker) {
                            // Use the batch fetched price!
                            currentPrice = marketData[asset.ticker] || 0;
                            // Fallback if 0 (failed fetch)
                            if (currentPrice === 0) {
                                currentPrice = parseFloat(asset.manual_price_idr) || 0;
                            }
                        } else {
                            currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        }
                        break;
                    case 'etf':
                        currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        break;
                    case 'cash':
                        currentPrice = exchangeRate;
                        break;
                    default:
                        currentPrice = parseFloat(asset.manual_price_idr) || 0;
                        break;
                }

                const qty = parseFloat(asset.quantity) || 0;

                return {
                    ...asset,
                    currentPrice,
                    currentValue: qty * (currentPrice || 0),
                    exchangeRateUsed: exchangeRate
                };

            } catch (err) {
                console.error(`Failed to calculate value for asset ${asset.name}:`, err);
                return { ...asset, currentPrice: 0, currentValue: 0, error: true };
            }
        });

        return updatedAssets;
    },

    calculateTotalNetWorth(enrichedAssets) {
        return enrichedAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    }
};
