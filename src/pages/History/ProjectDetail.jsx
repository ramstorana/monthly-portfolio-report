import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { ArrowLeft, Lock, X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBillions, formatIDR } from '../../utils/finance';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { PortfolioService } from '../../services/PortfolioService';
import { getMonthName } from '../../utils/time';

// Consistent category colors
const CATEGORY_COLORS = {
    gold: '#fdcb6e',      // Yellow
    crypto: '#e17055',    // Orange
    cash: '#00b894',      // Green
    stock: '#0984e3',     // Blue
    other: '#a29bfe'      // Purple fallback
};

const CATEGORY_LABELS = {
    gold: '🥇 Gold',
    crypto: '₿ Crypto',
    cash: '💵 Cash',
    stock: '📈 Stocks'
};

const ProjectDetail = () => {
    const { year } = useParams();
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(null);

    const data = PortfolioService.getData();
    const yearSnapshots = data.snapshots.filter(s => s.year === parseInt(year));
    yearSnapshots.sort((a, b) => a.month - b.month);

    const projectStats = useMemo(() => {
        if (yearSnapshots.length === 0) return { start: 0, end: 0, gain: 0, gainPercent: 0 };
        const start = yearSnapshots[0].totalNetWorth;
        const end = yearSnapshots[yearSnapshots.length - 1].totalNetWorth;
        const gain = end - start;
        const gainPercent = start ? (gain / start * 100) : 0;
        return { start, end, gain, gainPercent };
    }, [yearSnapshots]);

    const chartData = yearSnapshots.map(s => ({
        name: getMonthName(s.month - 1).substring(0, 3),
        value: s.totalNetWorth,
        fullDate: s.date
    }));

    // Calculate category totals for a snapshot
    const getCategoryTotals = (assets) => {
        const totals = { gold: 0, crypto: 0, cash: 0, stock: 0 };
        assets.forEach(asset => {
            const type = asset.type || 'other';
            const val = calculateAssetValue(asset);
            if (totals[type] !== undefined) {
                totals[type] += val;
            }
        });
        return totals;
    };

    // Calculate individual asset value
    const calculateAssetValue = (asset) => {
        const qty = parseFloat(asset.quantity) || 0;
        const price = parseFloat(asset.manual_price_idr) || 0;

        if (asset.type === 'crypto' && asset.ticker === 'BTC') {
            return qty * price;
        }
        if (asset.type === 'cash' && asset.currency !== 'IDR') {
            return qty * price;
        }
        return qty * price;
    };

    // Get month-over-month change
    const getMonthChange = (index) => {
        if (index === 0) return null;
        const current = yearSnapshots[index].totalNetWorth;
        const previous = yearSnapshots[index - 1].totalNetWorth;
        const change = ((current - previous) / previous) * 100;
        return change;
    };

    // Pie chart data for modal
    const getPieData = (assets) => {
        const totals = getCategoryTotals(assets);
        return Object.entries(totals)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: CATEGORY_LABELS[key] || key.toUpperCase(),
                value,
                color: CATEGORY_COLORS[key] || CATEGORY_COLORS.other
            }));
    };

    // Group assets by category for detail view
    const getAssetsByCategory = (assets) => {
        const grouped = { gold: [], crypto: [], stock: [], cash: [] };
        assets.forEach(asset => {
            const type = asset.type || 'other';
            if (grouped[type]) {
                grouped[type].push({
                    ...asset,
                    calculatedValue: calculateAssetValue(asset)
                });
            }
        });
        return grouped;
    };

    // Format quantity display
    const formatQuantity = (asset) => {
        if (asset.type === 'gold') return `${asset.quantity} grams`;
        if (asset.type === 'crypto') return `${asset.quantity} ${asset.ticker || 'coins'}`;
        if (asset.type === 'stock') return `${Number(asset.quantity).toLocaleString()} shares`;
        if (asset.type === 'cash') {
            if (asset.currency === 'IDR') return '';
            return `${Number(asset.quantity).toLocaleString()} ${asset.currency}`;
        }
        return asset.quantity;
    };

    // Styles
    const cardStyle = {
        backgroundColor: 'var(--card-bg)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid var(--border-color)'
    };

    const monthCardStyle = (isHovered) => ({
        backgroundColor: isHovered ? 'var(--bg-card-secondary)' : 'var(--card-bg)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid var(--border-color)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
    });

    const [hoveredMonth, setHoveredMonth] = useState(null);

    return (
        <Layout>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <ArrowLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate('/history')} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{year} Portfolio History</h2>
                <span style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 12,
                    backgroundColor: '#00b89420', color: '#00b894', fontWeight: 600
                }}>Completed</span>
            </div>

            {/* Year Summary Card */}
            <div style={cardStyle}>
                <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontWeight: 600 }}>
                    YEAR SUMMARY
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Starting (Jan)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {formatBillions(projectStats.start)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Ending (Dec)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {formatBillions(projectStats.end)}
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: '16px 0',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Total Gain</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {projectStats.gain >= 0 ? <TrendingUp size={18} color="#00b894" /> : <TrendingDown size={18} color="#d63031" />}
                        <span style={{
                            fontSize: 16, fontWeight: 700,
                            color: projectStats.gain >= 0 ? '#00b894' : '#d63031',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            {projectStats.gain >= 0 ? '+' : ''}{formatBillions(projectStats.gain)} ({projectStats.gainPercent.toFixed(1)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Net Worth Chart */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        Net Worth Over Time
                    </h3>
                    <span style={{ fontSize: 13, color: 'var(--primary-purple)', cursor: 'pointer', fontWeight: 500 }}>
                        Expand
                    </span>
                </div>

                <div style={{ height: 260, width: '100%', marginBottom: 16 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValueHistory" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={true} stroke="var(--border-color)" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 12, dy: 10 }}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['dataMin - 50000000', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={false}
                                width={1}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div style={{
                                                backgroundColor: 'var(--bg-card)',
                                                border: 'none',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                                minWidth: 140
                                            }}>
                                                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                                                    {label}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#6c5ce7', fontWeight: 500 }}>
                                                    value : {formatBillions(payload[0].value)}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#6c5ce7"
                                strokeWidth={3}
                                fill="url(#colorValueHistory)"
                                activeDot={{ r: 6, strokeWidth: 2, fill: 'var(--bg-main)', stroke: '#6c5ce7' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    paddingTop: 16,
                    borderTop: '1px dashed var(--border-color)'
                }}>
                    Jan {year} — Dec {year} ({yearSnapshots.length} Months)
                </div>
            </div>

            {/* Monthly Breakdown Cards */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600 }}>
                    MONTHLY BREAKDOWN
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {yearSnapshots.map((snap, index) => {
                        const totals = getCategoryTotals(snap.assets);
                        const total = snap.totalNetWorth || 1;
                        const change = getMonthChange(index);

                        return (
                            <div
                                key={snap.id}
                                style={monthCardStyle(hoveredMonth === snap.id)}
                                onMouseEnter={() => setHoveredMonth(snap.id)}
                                onMouseLeave={() => setHoveredMonth(null)}
                                onClick={() => setSelectedMonth(snap)}
                            >
                                {/* Top Row: Month + Value + Change */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                                            {getMonthName(snap.month - 1)}
                                        </span>
                                        {snap.isLocked && <Lock size={12} color="var(--text-secondary)" />}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: 'var(--primary-purple)'
                                        }}>
                                            {formatBillions(snap.totalNetWorth)}
                                        </span>
                                        {change !== null && (
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: change >= 0 ? '#00b894' : '#d63031',
                                                backgroundColor: change >= 0 ? '#00b89415' : '#d6303115',
                                                padding: '2px 8px',
                                                borderRadius: 8
                                            }}>
                                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Category Breakdown Bar */}
                                <div style={{
                                    display: 'flex',
                                    height: 6,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    backgroundColor: 'var(--border-color)'
                                }}>
                                    {Object.entries(totals).map(([cat, val]) => {
                                        const percent = (val / total) * 100;
                                        if (percent < 1) return null;
                                        return (
                                            <div
                                                key={cat}
                                                style={{
                                                    width: `${percent}%`,
                                                    backgroundColor: CATEGORY_COLORS[cat],
                                                    transition: 'width 0.3s ease'
                                                }}
                                                title={`${CATEGORY_LABELS[cat]}: ${percent.toFixed(1)}%`}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Category Legend */}
                                <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                                    {Object.entries(totals).map(([cat, val]) => {
                                        if (val === 0) return null;
                                        return (
                                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    backgroundColor: CATEGORY_COLORS[cat]
                                                }} />
                                                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedMonth && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end',
                    animation: 'fadeIn 0.2s ease'
                }} onClick={() => setSelectedMonth(null)}>
                    <div style={{
                        backgroundColor: 'var(--bg-main)',
                        width: '100%',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 24,
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                                    {getMonthName(selectedMonth.month - 1)} {selectedMonth.year}
                                </h3>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Total: <span style={{ fontWeight: 600, color: 'var(--primary-purple)' }}>
                                        {formatBillions(selectedMonth.totalNetWorth)}
                                    </span>
                                </div>
                            </div>
                            <div onClick={() => setSelectedMonth(null)} style={{
                                cursor: 'pointer', padding: 8, borderRadius: 8,
                                backgroundColor: 'var(--border-color)'
                            }}>
                                <X size={20} />
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div style={{ height: 220, marginBottom: 20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getPieData(selectedMonth.assets)}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={80}
                                        paddingAngle={3} dataKey="value"
                                    >
                                        {getPieData(selectedMonth.assets).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatIDR(val)} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value, entry) => (
                                            <span style={{ color: 'var(--text-primary)', fontSize: 11 }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Category Sections */}
                        {(() => {
                            const grouped = getAssetsByCategory(selectedMonth.assets);
                            const categoryOrder = ['gold', 'crypto', 'stock', 'cash'];

                            return categoryOrder.map(cat => {
                                const assets = grouped[cat];
                                if (!assets || assets.length === 0) return null;

                                const subtotal = assets.reduce((sum, a) => sum + a.calculatedValue, 0);
                                const percent = ((subtotal / selectedMonth.totalNetWorth) * 100).toFixed(1);

                                return (
                                    <div key={cat} style={{ marginBottom: 24 }}>
                                        {/* Category Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            padding: '10px 12px',
                                            backgroundColor: CATEGORY_COLORS[cat] + '20',
                                            borderRadius: 10,
                                            borderLeft: `4px solid ${CATEGORY_COLORS[cat]}`
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: 13 }}>
                                                {CATEGORY_LABELS[cat]}
                                            </span>
                                            <span style={{
                                                fontSize: 12,
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600
                                            }}>
                                                {formatBillions(subtotal)} ({percent}%)
                                            </span>
                                        </div>

                                        {/* Assets List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {assets.map((asset, idx) => (
                                                <div key={idx} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr auto',
                                                    gap: 12,
                                                    padding: '12px 14px',
                                                    backgroundColor: 'var(--card-bg)',
                                                    borderRadius: 10,
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                            {asset.name}
                                                            {asset.ticker && (
                                                                <span style={{
                                                                    marginLeft: 8,
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
                                                            {formatQuantity(asset)}
                                                            {asset.type !== 'cash' && asset.manual_price_idr > 1000 && (
                                                                <span> × {formatIDR(asset.manual_price_idr)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        textAlign: 'right',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        alignSelf: 'center'
                                                    }}>
                                                        {formatIDR(asset.calculatedValue)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}

                    </div>
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </Layout>
    );
};

export default ProjectDetail;
