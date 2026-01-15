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
    const { assets, totalNetWorth, addAsset, deleteAsset, updateAsset } = usePortfolio();
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
        const typeLabel = asset.type.toUpperCase();
        const existing = acc.find(item => item.name === typeLabel);
        if (existing) {
            existing.value += asset.currentValue;
        } else {
            acc.push({ name: typeLabel, value: asset.currentValue });
        }
        return acc;
    }, []);

    const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#ff7675', '#74b9ff'];

    // Individual Stock Drill-down
    const stockAssets = assets.filter(a => a.type === 'stock');
    const totalStockValue = stockAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const stockProportion = totalNetWorth ? (totalStockValue / totalNetWorth) * 100 : 0;

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

            {/* Main Pie Chart */}
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatIDR(value)}
                            contentStyle={{ backgroundColor: 'white', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#2d3436' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Total Assets
                </div>
            </div>

            {/* Single Stock Detail Section */}
            {stockAssets.length > 0 && (
                <div className={styles.table} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                        Single Stock Breakdown ({stockProportion.toFixed(1)}%)
                    </h3>
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
            <div className={styles.table}>
                <h3 style={{ fontSize: 16, marginBottom: 16, paddingBottom: 8 }}>All Holdings</h3>
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
