import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchBitcoinPrice, fetchGoldPrice, fetchExchangeRates } from '../services/marketData';
import { formatIDR } from '../utils/finance';

const AddAssetModal = ({ isOpen, onClose, onAdd, onUpdate, editingAsset }) => {
    // console.log('AddAssetModal Render:', { isOpen });

    const [type, setType] = useState('stock');
    const [name, setName] = useState('');
    const [ticker, setTicker] = useState('');
    const [shares, setShares] = useState(''); // Unified quantity/shares field
    const [price, setPrice] = useState(''); // Manual price or auto-fetched
    const [currency, setCurrency] = useState('IDR');

    // Market Data State
    const [btcPrice, setBtcPrice] = useState(0);
    const [goldPrice, setGoldPrice] = useState(0);
    const [fxRates, setFxRates] = useState({});
    const [marketLoading, setMarketLoading] = useState(false);

    // --- Helper Functions (Hoisted to be available for effects) ---

    const resetForm = () => {
        setName('');
        setTicker('');
        setShares('');
        setPrice('');
        setCurrency('IDR');
    };

    const loadMarketData = async () => {
        setMarketLoading(true);
        try {
            const [btc, gold, fx] = await Promise.all([
                fetchBitcoinPrice(),
                fetchGoldPrice(),
                fetchExchangeRates()
            ]);
            setBtcPrice(btc);
            setGoldPrice(gold);
            setFxRates(fx);
        } finally {
            setMarketLoading(false);
        }
    };

    // --- Effects ---

    // Populate form when editing
    useEffect(() => {
        if (!editingAsset) {
            resetForm();
            return;
        }

        try {
            setType(editingAsset.type || 'stock');
            setName(editingAsset.name || '');
            setTicker(editingAsset.ticker || '');
            setShares(editingAsset.quantity?.toString() || '0');
            setPrice(editingAsset.manual_price_idr?.toString() || '0');
            setCurrency(editingAsset.currency || 'IDR');
        } catch (err) {
            console.error("Error populating Edit Form:", err);
            resetForm();
        }
    }, [editingAsset]);

    useEffect(() => {
        if (isOpen) {
            loadMarketData();
        }
    }, [isOpen]);



    // --- Dynamic Constants based on Type ---
    const isAutoPriced = type === 'crypto' || type === 'gold' || type === 'cash';

    // Fetch stock price when ticker changes
    useEffect(() => {
        if ((type === 'stock' || type === 'etf') && ticker && ticker.length > 3) {
            const fetchPrice = async () => {
                setMarketLoading(true);
                try {
                    const { fetchBatchQuotes } = await import('../services/marketData');
                    const quotes = await fetchBatchQuotes([ticker]);
                    const fetchedPrice = quotes[ticker];

                    // Only update if we get a valid price > 0
                    if (fetchedPrice && fetchedPrice > 0) {
                        setPrice(fetchedPrice.toString());
                    }
                } catch (err) {
                    console.error("Failed to fetch stock price", err);
                } finally {
                    setMarketLoading(false);
                }
            };

            // Debounce slightly
            const timer = setTimeout(fetchPrice, 800);
            return () => clearTimeout(timer);
        }
    }, [ticker, type]);

    if (!isOpen) return null;

    const getLabels = () => {
        switch (type) {
            case 'stock': return { qty: 'Number of Shares', price: 'Price per Share (IDR)', name: 'Stock Name' };
            case 'etf': return { qty: 'Number of Shares', price: 'Price per Share (IDR)', name: 'ETF Name' };
            case 'crypto': return { qty: 'Amount (BTC)', price: 'Current Price (IDR)', name: 'Label (e.g. Cold Wallet)' };
            case 'gold': return { qty: 'Weight (Grams)', price: 'Price per Gram (IDR)', name: 'Label (e.g. Vault)' };
            case 'cash': return { qty: 'Amount', price: 'Exchange Rate', name: 'Label (e.g. USD Savings)' };
            default: return { qty: 'Quantity', price: 'Price', name: 'Name' };
        }
    };

    const labels = getLabels();

    // --- Calculations ---
    const calculateTotal = () => {
        const q = parseFloat(shares) || 0;

        if (type === 'crypto') return q * btcPrice;
        if (type === 'gold') return q * goldPrice;
        if (type === 'cash') {
            const rate = fxRates[currency] || 1;
            return q * rate;
        }
        // Manual Stock/ETF
        const p = parseFloat(price) || 0;
        return q * p;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let finalPrice = 0;
        if (type === 'crypto') finalPrice = btcPrice;
        else if (type === 'cash') finalPrice = fxRates[currency] || 1;
        else finalPrice = parseFloat(price);

        const assetPayload = {
            type,
            name,
            ticker: (type === 'stock' || type === 'etf') ? ticker : (type === 'crypto' ? 'BTC' : null),
            quantity: parseFloat(shares),
            manual_price_idr: finalPrice, // Store the price used at entry
            currency: type === 'cash' ? currency : 'IDR'
        };

        if (editingAsset) {
            // Update existing asset
            onUpdate({ ...assetPayload, id: editingAsset.id });
        } else {
            // Add new asset
            onAdd(assetPayload);
        }

        onClose();
        resetForm();
    };

    // --- Styles (SRD v3.0 Compliant) ---
    const modalStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(2px)'
    };

    const contentStyle = {
        backgroundColor: 'var(--card-bg)',
        padding: '28px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '420px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        border: '1px solid var(--border-color)'
    };

    const inputGroupStyle = { marginBottom: 16 };
    const labelStyle = { display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' };
    const inputStyle = {
        width: '100%', padding: '12px 14px', borderRadius: '8px',
        border: '1px solid var(--border-color)',
        fontSize: '15px', fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
        outline: 'none'
    };

    const getAutoPriceDisplay = () => {
        if (marketLoading) return "Fetching...";
        if (type === 'crypto') return formatIDR(btcPrice);
        if (type === 'gold') return formatIDR(goldPrice);
        if (type === 'cash') {
            const rate = fxRates[currency] || 1;
            return `1 ${currency} = ${formatIDR(rate)}`;
        }
        return '';
    };

    return (
        <div style={modalStyle} onClick={onClose}>
            <div style={contentStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
                    <X onClick={onClose} style={{ cursor: 'pointer', opacity: 0.7 }} />
                </div>

                <form onSubmit={handleSubmit}>
                    {/* TYPE SELECTOR */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Type</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={type}
                                onChange={e => { setType(e.target.value); if (e.target.value === 'crypto') setTicker('BTC'); }}
                                style={{ ...inputStyle, appearance: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                            >
                                <option value="stock">Stock</option>
                                <option value="etf">ETF</option>
                                <option value="crypto">Bitcoin</option>
                                <option value="gold">Gold</option>
                                <option value="cash">Cash</option>
                            </select>
                            <div style={{ position: 'absolute', right: 14, top: 14, pointerEvents: 'none', fontSize: 10 }}>▼</div>
                        </div>
                    </div>

                    {/* DYNAMIC FIELDS */}

                    {/* Name / Label */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>{labels.name}</label>
                        <input
                            type="text"
                            placeholder={type === 'crypto' ? "e.g. Cold Wallet" : "e.g. Bank Central Asia"}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ ...inputStyle, fontFamily: 'var(--font-sans)' }}
                            required
                        />
                    </div>

                    {/* Ticker (Stock/ETF only) */}
                    {(type === 'stock' || type === 'etf') && (
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Ticker (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. BBCA.JK"
                                value={ticker}
                                onChange={e => setTicker(e.target.value)}
                                style={{ ...inputStyle, fontFamily: 'var(--font-sans)' }}
                            />
                        </div>
                    )}

                    {/* Currency Selector (Cash only) */}
                    {type === 'cash' && (
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Currency</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    style={{ ...inputStyle, appearance: 'none' }}
                                >
                                    <option value="IDR">IDR (Indonesian Rupiah)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                    <option value="SGD">SGD (Singapore Dollar)</option>
                                    <option value="JPY">JPY (Japanese Yen)</option>
                                </select>
                                <div style={{ position: 'absolute', right: 14, top: 14, pointerEvents: 'none', fontSize: 10 }}>▼</div>
                            </div>
                        </div>
                    )}

                    {/* Quantity / Amount */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>{labels.qty}</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={shares}
                            onChange={e => setShares(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Price / Rate Display */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>{labels.price}</label>
                        {isAutoPriced ? (
                            <div style={{
                                ...inputStyle,
                                backgroundColor: 'var(--bg-card-secondary)',
                                color: 'var(--text-secondary)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span>{getAutoPriceDisplay()}</span>
                                <span style={{ fontSize: 11, opacity: 0.7 }}>Auto-updated</span>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                                {marketLoading && (
                                    <div style={{ position: 'absolute', right: 12, top: 12, fontSize: 11, color: 'var(--primary-purple)', fontWeight: 600 }}>
                                        Fetching...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* TOTAL VALUE PREVIEW BOX */}
                    <div style={{
                        marginTop: 24,
                        padding: 16,
                        backgroundColor: 'var(--bg-card-secondary)',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Total Estimated Value</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {formatIDR(calculateTotal())}
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: 24,
                            width: '100%',
                            padding: '16px',
                            backgroundColor: 'var(--primary-purple)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            opacity: (!shares || (!isAutoPriced && !price)) ? 0.7 : 1,
                            pointerEvents: (!shares || (!isAutoPriced && !price)) ? 'none' : 'auto'
                        }}
                    >
                        {editingAsset ? 'Update Asset' : 'Add Asset'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AddAssetModal;
