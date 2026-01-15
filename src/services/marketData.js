import { PortfolioService } from './PortfolioService';

// Yahoo Finance API via Proxy
const YAHOO_API_BASE = '/api/yahoo/v8/finance/chart';

// Cache to prevent rate limiting (5 minutes)
const CACHE_DURATION = 300000;
const CACHE = {
    bitcoin: { data: null, timestamp: 0 },
    gold: { data: null, timestamp: 0 },
    fx: { data: null, timestamp: 0 },
    stocks: {} // { "BUMI.JK": { data: 155, timestamp: ... } }
};

/**
 * Helper to fetch price from Yahoo Finance Chart API
 * @param {string} symbol - Yahoo Finance symbol (e.g. "BUMI.JK", "BTC-IDR")
 * @returns {Promise<number>} - The latest price
 */
const fetchYahooPrice = async (symbol) => {
    try {
        const response = await fetch(`${YAHOO_API_BASE}/${symbol}?interval=1d&range=1d`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;

        if (price === undefined || price === null) {
            throw new Error('Price not found in response');
        }

        return price;
    } catch (error) {
        console.error(`Failed to fetch ${symbol} from Yahoo:`, error);
        throw error;
    }
};

export const fetchBitcoinPrice = async () => {
    const now = Date.now();
    if (CACHE.bitcoin.data && (now - CACHE.bitcoin.timestamp < CACHE_DURATION)) {
        return CACHE.bitcoin.data;
    }

    try {
        // Fetch BTC-IDR from Yahoo
        const price = await fetchYahooPrice('BTC-IDR');
        CACHE.bitcoin = { data: price, timestamp: now };
        return price;
    } catch (error) {
        console.warn('Failed to fetch Bitcoin price, using fallback:', error);
        // Fallback: Try CoinGecko via proxy if Yahoo fails
        try {
            const response = await fetch('/api/simple/price?ids=bitcoin&vs_currencies=idr');
            const data = await response.json();
            const cgPrice = data.bitcoin.idr;
            CACHE.bitcoin = { data: cgPrice, timestamp: now };
            return cgPrice;
        } catch (err2) {
            console.warn('CoinGecko fallback failed, using hardcoded', err2);
            return 1633000000; // Fallback mock ~1.6B
        }
    }
};

export const fetchGoldPrice = async () => {
    const now = Date.now();
    if (CACHE.gold.data && (now - CACHE.gold.timestamp < CACHE_DURATION)) {
        return CACHE.gold.data;
    }

    try {
        // Yahoo Gold is usually per Ounce in USD (Symbol: GC=F or XAUUSD=X)
        // We need IDR per GRAM.
        // Formula: (Gold_USD_OZ * USD_IDR) / 31.1035

        const [goldUsdOz, usdIdr] = await Promise.all([
            fetchYahooPrice('XAUUSD=X'),
            fetchYahooPrice('USDIDR=X')
        ]);

        const goldIdrGram = (goldUsdOz * usdIdr) / 31.1035;

        CACHE.gold = { data: goldIdrGram, timestamp: now };
        return goldIdrGram;
    } catch (error) {
        console.warn('Using fallback Gold price', error);
        return 1450000; // ~1.45M IDR per gram
    }
};

export const fetchExchangeRates = async () => {
    const now = Date.now();
    if (CACHE.fx.data && (now - CACHE.fx.timestamp < CACHE_DURATION)) {
        return CACHE.fx.data;
    }

    try {
        // Fetch USD-IDR and JPY-IDR
        const [usdIdr, jpyIdr] = await Promise.all([
            fetchYahooPrice('USDIDR=X'),
            fetchYahooPrice('JPYIDR=X')
        ]);

        const rates = {
            IDR: 1,
            USD: usdIdr,
            JPY: jpyIdr,
            SGD: 12000 // Fallback/Mock if needed, or add fetch
        };

        CACHE.fx = { data: rates, timestamp: now };
        return rates;
    } catch (error) {
        console.error("FX fetch failed", error);
        return { IDR: 1, USD: 16800, JPY: 108, SGD: 12100 };
    }
};

export const fetchStockPrice = async (ticker) => {
    const now = Date.now();
    if (CACHE.stocks[ticker] && (now - CACHE.stocks[ticker].timestamp < CACHE_DURATION)) {
        return CACHE.stocks[ticker].data;
    }

    try {
        const price = await fetchYahooPrice(ticker);
        CACHE.stocks[ticker] = { data: price, timestamp: now };
        return price;
    } catch (error) {
        console.warn(`Failed to fetch stock ${ticker}, using mock`, error);
        // Fallback mocks
        const MOCK_PRICES = {
            "BBCA.JK": 10200,
            "BBRI.JK": 5400,
            "BMRI.JK": 6800,
            "TLKM.JK": 3200,
            "ASII.JK": 5100,
            "BUMI.JK": 422,
            "JSMR.JK": 3410,
            "AADI.JK": 7450,
            "SRTG.JK": 1820,
            "TUGU.JK": 1235
        };
        return MOCK_PRICES[ticker] || 0;
    }
};
