import React from 'react';
import Layout from '../../components/Layout/Layout';
import { usePortfolio } from '../../hooks/usePortfolio';
import { WEALTH_TARGETS } from '../../constants/targets';
import { ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from 'recharts';
import { formatIDR, formatBillions } from '../../utils/finance';

const Performance = () => {
    const { totalNetWorth } = usePortfolio();
    const currentYear = new Date().getFullYear();

    // --- YoY Data Preparation ---
    // We want to show the full 21-year roadmap + current actuals
    const yoyData = WEALTH_TARGETS.map(t => {
        let actual = null;
        // Simple logic: If it's the current year or past, show (mock) actuals
        // For real app, this would come from a 'snapshots' table.
        // For MVP, we only know "Current Total Net Worth" for "Current Year".
        if (t.year === currentYear) {
            actual = totalNetWorth;
        } else if (t.year === 2025) {
            // Hardcode the baseline for 2025 if we are ahead
            // Or leave null if we assume we just started.
            // Let's assume 2025 was the 2.7B start.
            actual = 2700000000;
        }

        return {
            year: t.year,
            Target: t.target,
            Actual: actual
        };
    });

    // --- MoM Data Preparation (Current Year) ---
    // Mocking monthly data for the visualization as we don't have history yet.
    // In production, fetch this from 'monthly_snapshots'.
    const momData = [
        { month: 'Jan', value: totalNetWorth * 0.95 },
        { month: 'Feb', value: totalNetWorth * 0.96 },
        { month: 'Mar', value: totalNetWorth * 0.98 },
        { month: 'Apr', value: totalNetWorth * 1.00 }, // Current (simulated)
    ];

    return (
        <Layout>
            <div style={{ paddingBottom: 80 }}>
                <h2 style={{ marginBottom: 24 }}>Performance</h2>

                {/* YoY Chart Section */}
                <div style={{ backgroundColor: 'var(--card-bg)', padding: 20, borderRadius: 16, marginBottom: 24, paddingRight: 30 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16 }}>Year-over-Year (YoY) Progress</h3>
                    <div style={{ height: 300, fontSize: 12 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={yoyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `Rp ${formatBillions(val)}`}
                                />
                                <Tooltip
                                    formatter={(val) => formatIDR(val)}
                                    contentStyle={{ backgroundColor: 'var(--bg-main)', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="Target" fill="var(--bg-card-secondary)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line type="monotone" dataKey="Actual" stroke="var(--primary-purple)" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MoM Chart Section */}
                <div style={{ backgroundColor: 'var(--card-bg)', padding: 20, borderRadius: 16, paddingRight: 30 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16 }}>{currentYear} Monthly Trend (MoM)</h3>
                    <div style={{ height: 250, fontSize: 12 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={momData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `Rp ${formatBillions(val)}`} // Simplification
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    formatter={(val) => formatIDR(val)}
                                    contentStyle={{ backgroundColor: 'var(--bg-main)', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#00b894" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Performance;
