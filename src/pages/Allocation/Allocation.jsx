import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { usePortfolio } from '../../hooks/usePortfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatIDR } from '../../utils/finance';
import { formatDateWIB, getWIBDate } from '../../utils/time';
import styles from './Allocation.module.css';
import AddAssetModal from '../../components/AddAssetModal';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';

const Allocation = () => {
    const { assets, totalNetWorth, addAsset, deleteAsset, updateAsset, loading } = usePortfolio();

    console.log('Allocation Render:', { loading, assetsLength: assets?.length, totalNetWorth });

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

    // Group by Asset Class for the Pie Chart
    const chartData = assets.reduce((acc, asset) => {
        const typeLabel = (asset.type || 'other').toUpperCase();
        const assetValue = parseFloat(asset.currentValue) || 0;
        const existing = acc.find(item => item.name === typeLabel);
        if (existing) {
            existing.value += assetValue;
        } else {
            acc.push({ name: typeLabel, value: assetValue });
        }
        return acc;
    }, []);

    const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#ff7675', '#74b9ff'];

    // Individual Stock Drill-down
    const stockAssets = assets.filter(a => a.type === 'stock');
    const totalStockValue = stockAssets.reduce((sum, a) => sum + (parseFloat(a.currentValue) || 0), 0);
    const stockProportion = totalNetWorth > 0 ? (totalStockValue / totalNetWorth) * 100 : 0;

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
            <div className={styles.chartContainer} style={{ padding: '24px 12px' }}>
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    </PieChart>
                </ResponsiveContainer>
                <div style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: -10
                }}>
                    Asset Distribution
                </div>
            </div>

            {/* Single Stock Detail Section */}
            {stockAssets.length > 0 && (
                <div className={styles.table} style={{ marginBottom: 24, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-purple)' }}>
                            Single Stock Breakdown
                        </h3>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card-secondary)', padding: '4px 12px', borderRadius: 20 }}>
                            {stockProportion.toFixed(1)}% of Portfolio
                        </div>
                    </div>
                    {stockAssets.map((asset) => (
                        <div key={asset.id} className={styles.row}>
                            <div className={styles.rowLabel}>
                                <div>
                                    <div className={styles.assetType} style={{ fontWeight: 600 }}>{asset.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{asset.ticker}</div>
                                </div>
                            </div>
                            <div className={styles.rowValues}>
                                <div className={styles.value} style={{ fontWeight: 600 }}>{formatIDR(asset.currentValue || 0)}</div>
                                <div className={styles.percent} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {totalNetWorth > 0 ? ((asset.currentValue / totalNetWorth) * 100).toFixed(2) : '0.00'}%
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                                <button
                                    onClick={() => {
                                        setEditingAsset(asset);
                                        setIsModalOpen(true);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary-purple)',
                                        cursor: 'pointer',
                                        padding: 4,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => deleteAsset(asset.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ff7675',
                                        cursor: 'pointer',
                                        padding: 4,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* All Assets List */}
            <div className={styles.table} style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
                    All Digital & Physical Assets
                </h3>
                {assets.map((item) => (
                    <div key={item.id} className={styles.row}>
                        <div className={styles.rowLabel}>
                            <span className={styles.assetType} style={{ fontWeight: 600 }}>{item.name}</span>
                        </div>
                        <div className={styles.rowValues}>
                            <div className={styles.value} style={{ fontWeight: 600 }}>{formatIDR(item.currentValue || 0)}</div>
                            <div className={styles.percent} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {item.type.toUpperCase()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                            <button
                                onClick={() => {
                                    setEditingAsset(item);
                                    setIsModalOpen(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-purple)',
                                    cursor: 'pointer',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => deleteAsset(item.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fab1a0',
                                    cursor: 'pointer',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
