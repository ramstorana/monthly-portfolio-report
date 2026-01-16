// Twelve Data API for Indonesian Stocks (IDX)
// Free tier: 800 calls/day, 8 calls/minute

const TWELVEDATA_QUOTE_URL = '/api/twelvedata/quote';
const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY || '';

// Cache to prevent rate limiting (5 minutes)
const CACHE_DURATION = 300000;
let CACHE_DATA = {};
let CACHE_TIMESTAMP = 0;
let PENDING_PROMISE = null;

// Convert Yahoo-style ticker (BBCA.JK) to Twelve Data format (BBCA:XIDX)
const convertToTwelveDataSymbol = (ticker) => {
    if (!ticker) return ticker;
    if (ticker.endsWith('.JK')) {
        return ticker.replace('.JK', ':XIDX');
    }
    // Forex and crypto symbols
    if (ticker === 'USDIDR=X') return 'USD/IDR';
    if (ticker === 'JPYIDR=X') return 'JPY/IDR';
    if (ticker === 'XAUUSD=X') return 'XAU/USD';
    if (ticker === 'BTC-IDR') return 'BTC/IDR';
    return ticker;
};

// Convert back from Twelve Data symbol to original format for cache keys
const convertFromTwelveDataSymbol = (symbol) => {
    if (!symbol) return symbol;
    if (symbol.includes(':XIDX')) {
        return symbol.replace(':XIDX', '.JK');
    }
    if (symbol === 'USD/IDR') return 'USDIDR=X';
    if (symbol === 'JPY/IDR') return 'JPYIDR=X';
    if (symbol === 'XAU/USD') return 'XAUUSD=X';
    if (symbol === 'BTC/IDR') return 'BTC-IDR';
    return symbol;
};

// Default symbols for the portfolio
const DEFAULT_SYMBOLS = [
    'JSMR.JK', 'BUMI.JK', 'AADI.JK', 'SRTG.JK', 'TUGU.JK', 'BMRI.JK', 'BBCA.JK'
];

// Fallback mock prices when API fails
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
    "TUGU.JK": 1235,
    "USDIDR=X": 16800,
    "JPYIDR=X": 108,
    "XAUUSD=X": 2650,
    "BTC-IDR": 1633000000
};

/**
 * Fetches quotes for multiple symbols from Twelve Data
 * @param {string[]} symbols - Original format symbols (e.g., BBCA.JK)
 * @returns {Promise<Object>} - Map of original symbol -> price
 */
export const fetchBatchQuotes = async (symbols) => {
    const now = Date.now();

    // Return cached data if still valid
    if (now - CACHE_TIMESTAMP < CACHE_DURATION && Object.keys(CACHE_DATA).length > 0) {
        console.log('[TwelveData] Using cached data');
        return CACHE_DATA;
    }

    // Dedupe pending requests
    if (PENDING_PROMISE) {
        return PENDING_PROMISE;
    }

    PENDING_PROMISE = (async () => {
        try {
            const uniqueSymbols = [...new Set(symbols)];

            // Only fetch stock symbols via Twelve Data (they support IDX)
            const stockSymbols = uniqueSymbols.filter(s => s.endsWith('.JK'));
            const convertedSymbols = stockSymbols.map(convertToTwelveDataSymbol);

            if (convertedSymbols.length === 0 || !API_KEY) {
                console.warn('[TwelveData] No API key or stocks to fetch, using fallbacks');
                return { ...MOCK_PRICES, ...CACHE_DATA };
            }

            // Twelve Data batch quote endpoint
            const url = `${TWELVEDATA_QUOTE_URL}?symbol=${convertedSymbols.join(',')}&apikey=${API_KEY}`;
            console.log('[TwelveData] Fetching:', convertedSymbols.join(', '));

            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`[TwelveData] API fetch failed (${response.status})`);
                return { ...MOCK_PRICES, ...CACHE_DATA };
            }

            const json = await response.json();

            const priceMap = {};

            // Handle single vs multiple symbol response
            if (Array.isArray(json)) {
                // Multiple symbols
                json.forEach(quote => {
                    if (quote.close) {
                        const originalSymbol = convertFromTwelveDataSymbol(quote.symbol);
                        priceMap[originalSymbol] = parseFloat(quote.close);
                    }
                });
            } else if (json.close) {
                // Single symbol
                const originalSymbol = convertFromTwelveDataSymbol(json.symbol);
                priceMap[originalSymbol] = parseFloat(json.close);
            } else if (json.code) {
                // API error response
                console.warn('[TwelveData] API error:', json.message);
                return { ...MOCK_PRICES, ...CACHE_DATA };
            }

            // Merge into cache with fallbacks
            CACHE_DATA = { ...MOCK_PRICES, ...CACHE_DATA, ...priceMap };
            CACHE_TIMESTAMP = Date.now();

            console.log('[TwelveData] Fetched prices:', priceMap);
            return CACHE_DATA;

        } catch (error) {
            console.error('[TwelveData] Fetch error:', error.message);
            return { ...MOCK_PRICES, ...CACHE_DATA };
        } finally {
            PENDING_PROMISE = null;
        }
    })();

    return PENDING_PROMISE;
};

/**
 * Orchestrates fetching all necessary market data including dynamic stock tickers.
 * @param {string[]} stockTickers - Any additional stock tickers to fetch.
 */
export const fetchMarketData = async (stockTickers = []) => {
    const allSymbols = [...DEFAULT_SYMBOLS, ...stockTickers];
    return await fetchBatchQuotes(allSymbols);
};

export const fetchBitcoinPrice = async () => {
    try {
        // For BTC, use CoinGecko or fallback
        const response = await fetch('/api/simple/price?ids=bitcoin&vs_currencies=idr');
        if (response.ok) {
            const data = await response.json();
            return data.bitcoin?.idr || 1633000000;
        }
    } catch (err) {
        console.warn('[TwelveData] BTC fetch failed, using fallback');
    }
    return 1633000000;
};

export const fetchGoldPrice = async () => {
    // Logam Mulia price reference (Jan 2026) ~ Rp 2.675.000 / gram
    // For now use static until we find a reliable gold API
    return 2675000;
};

export const fetchExchangeRates = async () => {
    try {
        // Try Twelve Data forex
        if (API_KEY) {
            const url = `${TWELVEDATA_QUOTE_URL}?symbol=USD/IDR,JPY/IDR&apikey=${API_KEY}`;
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                if (Array.isArray(json)) {
                    const rates = { IDR: 1, SGD: 12100 };
                    json.forEach(quote => {
                        if (quote.symbol === 'USD/IDR' && quote.close) {
                            rates.USD = parseFloat(quote.close);
                        }
                        if (quote.symbol === 'JPY/IDR' && quote.close) {
                            rates.JPY = parseFloat(quote.close);
                        }
                    });
                    return rates;
                }
            }
        }
    } catch (err) {
        console.warn('[TwelveData] Exchange rates fetch failed');
    }
    return { IDR: 1, USD: 16800, JPY: 108, SGD: 12100 };
};

export const fetchStockPrice = async (ticker) => {
    try {
        const quotes = await fetchBatchQuotes([ticker, ...DEFAULT_SYMBOLS]);
        const price = quotes[ticker];
        if (price !== undefined && price > 0) return price;
        return MOCK_PRICES[ticker] || 0;
    } catch (err) {
        return MOCK_PRICES[ticker] || 0;
    }
};
