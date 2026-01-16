import React, { useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useRiskAnalysis } from '../../hooks/useRiskAnalysis';
import { formatDateWIB, getMonthName } from '../../utils/time';
import { formatIDR, formatBillions, calculateGap, calculateProgress, calculateRequiredMonthlyGain } from '../../utils/finance';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
    const { assets, totalNetWorth, target, loading } = usePortfolio();

    // --- Metric Calculations (Mocked for now until History is fully populated) ---
    // In strict v4.0, these come from checking snapshots.
    // Baseline: Dec 31, 2025 (2.7B start for 2026?) -> Assuming we are in 2026 now? 
    // Wait, SRD says "Project-Based". Let's assume current year is the project year.
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    // Simulating History Data for MVP Visualization
    // Replace this with `PortfolioService.getHistory()` in real integration
    const historyData = [
        { month: 'Jan', value: 280000000 },
        { month: 'Feb', value: 320000000 },
        { month: 'Mar', value: 380000000 },
        { month: 'Dec', value: 2700000000 }, // Dec 2025 (Baseline)
        { month: 'Jan', value: 2800000000 }, // Jan 2026
        { month: 'Apr', value: totalNetWorth }, // Current
    ];

    // YoY Baseline (Dec 31 of previous year)
    // If no data, fallback to Jan 1
    const yoyBaseline = 2700000000; // Mocked from "2025 Initial"
    const yoyChange = totalNetWorth - yoyBaseline;
    const yoyPercent = (yoyChange / yoyBaseline) * 100;

    // MoM Baseline (Previous Month)
    const momBaseline = 2800000000; // Mocked "Last Month"
    const momChange = totalNetWorth - momBaseline;
    const momPercent = (momChange / momBaseline) * 100;

    // Timeline Data (Jan 2025 -> Current)
    // Filter to only show up to current month (no future)
    const chartData = historyData.filter(d => true); // All history is past/present

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
                    Jan 2025 — Present (16 Months)
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
