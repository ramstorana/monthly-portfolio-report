import React, { useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useRiskAnalysis } from '../../hooks/useRiskAnalysis';
import { formatDateWIB, getMonthName } from '../../utils/time';
import { formatIDR, formatBillions, calculateGap, calculateProgress, calculateRequiredMonthlyGain } from '../../utils/finance';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import styles from './Home.module.css';

import history2025 from '../../data/history_2025.json';

const Home = () => {
    const { assets, totalNetWorth, target, loading } = usePortfolio();

    // --- CONTEXT: PROJECT YEAR ---
    const currentYear = new Date().getFullYear();

    // --- DATA INTEGRATION: 2025 History + Current 2026 Live Data ---
    // 1. Process 2025 data + Current 2026
    const historyData = useMemo(() => {
        // Map 2025 history to chart format
        let combinedData = history2025.map(h => ({
            month: getMonthName(h.month - 1).substring(0, 3),
            fullMonth: getMonthName(h.month - 1) + " " + h.year,
            value: h.totalNetWorth,
            year: h.year,
            isHistory: true
        }));

        // 2. Add Current Live Data (2026) if we are in 2026
        if (totalNetWorth > 0) {
            combinedData.push({
                month: getMonthName(new Date().getMonth()).substring(0, 3) + " '26",
                fullMonth: getMonthName(new Date().getMonth()) + " 2026",
                value: totalNetWorth,
                year: 2026,
                isHistory: false
            });
        }

        // 3. Calculate MoM Changes for Trend
        return combinedData.map((item, index, arr) => {
            const prev = arr[index - 1];
            if (!prev) return { ...item, change: 0, changePercent: 0 };

            const change = item.value - prev.value;
            const changePercent = (change / prev.value) * 100;
            return { ...item, change, changePercent };
        });
    }, [totalNetWorth]);

    // --- METRIC CALCULATIONS (YoY & MoM) ---
    // YoY Baseline: Dec 31, 2025 (Last point of 2025 history)
    const last2025 = history2025[history2025.length - 1]?.totalNetWorth || 1;
    const yoyChange = totalNetWorth - last2025;
    const yoyPercent = (yoyChange / last2025) * 100;

    // MoM Baseline: Previous Month (Last item in history before current)
    // If current is the last item, previous is the one before it.
    // logic: historyData has everything. The last item is current. The 2nd to last is previous month.
    const lastItem = historyData[historyData.length - 1] || { value: 0 };
    const prevItem = historyData[historyData.length - 2] || { value: 1 };

    // Override simple MoM with trend-based MoM (more robust if we have >1 month in 2026)
    const momChange = lastItem.value - prevItem.value;
    const momPercent = (momChange / prevItem.value) * 100;

    const chartData = historyData;

    // --- UI Helpers ---
    const getStatusColor = (val) => val >= 0 ? '#00b894' : '#d63031';
    const getStatusSign = (val) => val >= 0 ? '+' : '';

    if (loading) {
        return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Loading Dashboard...</div>;
    }

    const gap = calculateGap(totalNetWorth, target);
    const progress = calculateProgress(totalNetWorth, target);
    const monthlyNeeded = calculateRequiredMonthlyGain(totalNetWorth, target);

    return (
        <Layout>
            {/* --- HEADER --- */}
            <div className={styles.header}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 20, fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>
                    <img src="/logo.png" alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    <span>{currentYear} Project</span>
                    <span style={{ fontSize: 10 }}>▼</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {formatDateWIB(new Date()).split(',')[0]} (Active)
                </div>
            </div>

            {/* --- MAIN NET WORTH CARD --- */}
            <div className={styles.netWorthCard}>
                <div className={styles.netWorthLabel}>Current Net Worth</div>
                <div className={styles.netWorthValue} style={{ fontSize: 32, fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(totalNetWorth)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    As of: {formatDateWIB(new Date())} (Live)
                </div>
            </div>

            {/* --- TARGET PROGRESS CARD --- */}
            <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{currentYear} Target: {formatBillions(target)}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: gap >= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {progress.toFixed(1)}%
                    </span>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progress >= 50 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}></div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gap: {formatBillions(gap)}</span>
                    <span style={{ color: 'var(--text-primary)' }}>Need {formatBillions(monthlyNeeded)}/mo</span>
                </div>
            </div>

            {/* --- METRIC CARDS (YoY & MoM) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {/* YoY Card */}
                <div className={styles.card} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>YoY (Dec → Now)</span>
                        <Download size={14} style={{ opacity: 0.5, cursor: 'pointer' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {formatBillions(yoyChange)}
                    </div>
                    <div style={{ fontSize: 13, color: getStatusColor(yoyPercent), fontWeight: 600 }}>
                        {getStatusSign(yoyPercent)}{yoyPercent.toFixed(1)}%
                    </div>
                </div>

                {/* MoM Card */}
                <div className={styles.card} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>MoM (Last Mo)</span>
                        <Download size={14} style={{ opacity: 0.5, cursor: 'pointer' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {formatBillions(momChange)}
                    </div>
                    <div style={{ fontSize: 13, color: getStatusColor(momPercent), fontWeight: 600 }}>
                        {getStatusSign(momPercent)}{momPercent.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* --- TIMELINE CHART --- */}
            <div className={styles.card}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px 0' }}>Net Worth Over Time</h3>

                <div style={{ height: 260, width: '100%', marginBottom: 16 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={true} stroke="var(--border-color)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 12, dy: 10 }}
                            />
                            <YAxis
                                hide
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div style={{
                                                backgroundColor: 'var(--bg-card)',
                                                border: 'none',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                                minWidth: 160
                                            }}>
                                                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                                                    {label}
                                                </div>
                                                <div style={{ marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total: </span>
                                                    <span style={{ fontSize: 13, color: '#6c5ce7', fontWeight: 600 }}>
                                                        {formatBillions(data.value)}
                                                    </span>
                                                </div>
                                                {data.change !== 0 && (
                                                    <div>
                                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Change: </span>
                                                        <span style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: data.change >= 0 ? '#00b894' : '#d63031'
                                                        }}>
                                                            {data.change >= 0 ? '+' : ''}{formatBillions(data.change)} ({data.changePercent.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                )}
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
                                fillOpacity={1}
                                fill="url(#colorValue)"
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
                    Jan 2025 — Present
                </div>
            </div>

            {/* --- NAVIGATION LINKS --- */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Navigation links removed */}
            </div>

            <div style={{ height: 80 }}></div>
        </Layout >
    );
};

export default Home;
