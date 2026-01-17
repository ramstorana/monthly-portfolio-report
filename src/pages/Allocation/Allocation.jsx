import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { usePortfolio } from '../../hooks/usePortfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatIDR } from '../../utils/finance';
import { formatDateWIB, getWIBDate } from '../../utils/time';
import styles from './Allocation.module.css';
import AddAssetModal from '../../components/AddAssetModal';
import { Plus, Trash2, Edit2 } from 'lucide-react';

// Consistent category colors
const CATEGORY_COLORS = {
    gold: '#fdcb6e',      // Yellow
    crypto: '#e17055',    // Orange
    cash: '#00b894',      // Green (Mint)
    stock: '#2ecc71',     // Green (Emerald)
    etf: '#b2bec3',       // Silver
    other: '#a29bfe'      // Purple fallback
};

const CATEGORY_LABELS = {
    gold: '🥇 Commodity',
    crypto: '₿ Crypto',
    cash: '💵 Cash',
    stock: '📈 Stocks',
    etf: '📊 ETF'
};

const Allocation = () => {
    const { assets, totalNetWorth, addAsset, deleteAsset, updateAsset, loading } = usePortfolio();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [editingAsset, setEditingAsset] = useState(null);

    // --- Auto-Lock Countdown Logic ---
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = getWIBDate();
            // End of current month in WIB
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            const diff = endOfMonth - now;

            if (diff <= 0) return 'Locked';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

            return `${days} days, ${hours} hours`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute

        setTimeLeft(calculateTimeLeft()); // Initial call

        return () => clearInterval(timer);
    }, []);

    // Calculate category totals
    const getCategoryTotals = () => {
        const totals = { stock: 0, etf: 0, gold: 0, crypto: 0, cash: 0, other: 0 };
        assets.forEach(asset => {
            const type = asset.type || 'other';
            const value = parseFloat(asset.currentValue) || 0;
            if (totals[type] !== undefined) {
                totals[type] += value;
            } else {
                totals.other += value;
            }
        });
        return totals;
    };

    // Prepare chart data
    const chartData = (() => {
        const totals = getCategoryTotals();
        return Object.entries(totals)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: CATEGORY_LABELS[key] || key.toUpperCase(),
                value,
                color: CATEGORY_COLORS[key] || CATEGORY_COLORS.other,
                percent: totalNetWorth ? ((value / totalNetWorth) * 100).toFixed(1) : 0,
                key // keep key for internal use if needed
            }));
    })();

    // Group assets by category for display
    const getAssetsByCategory = () => {
        const grouped = { stock: [], etf: [], gold: [], crypto: [], cash: [], other: [] };
        assets.forEach(asset => {
            const type = asset.type || 'other';
            if (grouped[type]) {
                grouped[type].push(asset);
            } else {
                grouped.other.push(asset);
            }
        });
        return grouped;
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <div className={styles.loader}>Loading Portfolio Data...</div>
                </div>
            </Layout>
        );
    }

    if (!assets || assets.length === 0) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <p>No assets found. Please add an asset to get started.</p>
                    <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>Add Asset</button>
                    <AddAssetModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onAdd={addAsset}
                    />
                </div>
            </Layout>
        );
    }

    const groupedAssets = getAssetsByCategory();
    const categoryOrder = ['stock', 'etf', 'gold', 'crypto', 'cash'];

    return (
        <Layout>
            {/* Header with Active Status */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className={styles.title}>
                        Portfolio <span style={{ fontSize: 14, color: '#00b894', fontWeight: 600 }}>(Active)</span>
                    </h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'var(--primary-purple)', color: 'white', border: 'none',
                            borderRadius: '50%', width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {formatDateWIB(new Date()).split(',')[0]} • Closing in {timeLeft}
                </div>
            </div>

            {/* Portfolio Summary Card */}
            <div style={{
                backgroundColor: 'var(--primary-purple)',
                padding: '28px',
                borderRadius: '24px',
                color: 'white',
                marginBottom: 24,
                boxShadow: '0 10px 30px rgba(108, 92, 231, 0.3)',
                background: 'linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-purple-dark) 100%)'
            }}>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8, fontWeight: 500 }}>Total Portfolio Value</div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>{formatIDR(totalNetWorth)}</div>
            </div>

            {/* Main Pie Chart */}
            <div className={styles.chartContainer} style={{ padding: '24px 12px', minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65} // Donut style
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-main)" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatIDR(value)}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                padding: '12px 16px',
                                backdropFilter: 'blur(8px)'
                            }}
                            itemStyle={{ color: '#2d3436', fontWeight: 600, fontSize: 13 }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconSize={10}
                            iconType="circle"
                            formatter={(value, entry) => (
                                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>
                                    {value} ({entry.payload.percent}%)
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 10
                }}>
                    Asset Distribution
                </div>
            </div>

            {/* Categorized Asset Lists */}
            {categoryOrder.map(cat => {
                const catAssets = groupedAssets[cat];
                if (!catAssets || catAssets.length === 0) return null;

                const subtotal = catAssets.reduce((sum, a) => sum + (parseFloat(a.currentValue) || 0), 0);
                const catPercent = totalNetWorth ? ((subtotal / totalNetWorth) * 100).toFixed(1) : '0.0';

                return (
                    <div key={cat} style={{ marginBottom: 24 }}>
                        {/* Category Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                            padding: '12px 16px',
                            backgroundColor: CATEGORY_COLORS[cat],
                            borderRadius: 12,
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>
                                    {CATEGORY_LABELS[cat]}
                                </span>
                            </div>
                            <span style={{
                                fontSize: 14,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700
                            }}>
                                {formatIDR(subtotal)} ({catPercent}%)
                            </span>
                        </div>

                        {/* Assets List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {catAssets.map((asset) => {
                                const assetVal = parseFloat(asset.currentValue) || 0;
                                const assetPercent = totalNetWorth ? ((assetVal / totalNetWorth) * 100).toFixed(1) : '0.0';

                                return (
                                    <div key={asset.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: 12,
                                        padding: '12px 14px',
                                        backgroundColor: 'var(--card-bg)',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {asset.name}
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: CATEGORY_COLORS[cat],
                                                    backgroundColor: 'var(--bg-main)',
                                                    padding: '2px 6px',
                                                    borderRadius: 6,
                                                    border: `1px solid ${CATEGORY_COLORS[cat]}40`
                                                }}>
                                                    {assetPercent}%
                                                </span>
                                                {asset.ticker && (
                                                    <span style={{
                                                        fontSize: 10,
                                                        color: 'var(--text-secondary)',
                                                        backgroundColor: 'var(--border-color)',
                                                        padding: '2px 6px',
                                                        borderRadius: 4
                                                    }}>
                                                        {asset.ticker}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                {asset.quantity} {asset.type === 'stock' ? 'shares' : asset.type === 'gold' ? 'grams' : ''}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                textAlign: 'right',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 13,
                                                fontWeight: 600
                                            }}>
                                                {formatIDR(assetVal)}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingAsset(asset);
                                                        setIsModalOpen(true);
                                                    }}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        color: 'var(--primary-purple)', cursor: 'pointer', padding: 4
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteAsset(asset.id)}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        color: '#ff7675', cursor: 'pointer', padding: 4
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <AddAssetModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAsset(null);
                }}
                onAdd={addAsset}
                onUpdate={updateAsset}
                editingAsset={editingAsset}
            />
        </Layout>
    );
};

export default Allocation;
