import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { ArrowLeft, Lock, Unlock, X } from 'lucide-react';
import { formatBillions, formatIDR } from '../../utils/finance';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { PortfolioService } from '../../services/PortfolioService';
import { getMonthName } from '../../utils/time';

const ProjectDetail = () => {
    const { year } = useParams();
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(null); // Snapshot object

    // Fetch Real Data
    const data = PortfolioService.getData();
    const yearSnapshots = data.snapshots.filter(s => s.year === parseInt(year));

    // Sort logic (Jan -> Dec)
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
        name: getMonthName(s.month - 1).substring(0, 3), // "Jan"
        value: s.totalNetWorth,
        fullDate: s.date
    }));

    // --- Detail Modal Helpers ---
    const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#ff7675', '#74b9ff'];

    const getPieData = (assets) => {
        return assets.reduce((acc, asset) => {
            // Check for manual_price_idr in history
            // Calculation logic: quantity * manual_price_idr (since history stores raw values mostly)
            // Or assumes totalValue was stored? 
            // History extraction script stored 'manual_price_idr' and 'quantity'. 
            // Need to calc value on fly or if stored. 
            // My extraction script didn't store 'currentValue', so calc here.

            const val = (parseFloat(asset.quantity) || 0) * (parseFloat(asset.manual_price_idr) || 0);

            const typeLabel = (asset.type || 'other').toUpperCase();
            const existing = acc.find(item => item.name === typeLabel);
            if (existing) {
                existing.value += val;
            } else {
                acc.push({ name: typeLabel, value: val });
            }
            return acc;
        }, []);
    };

    return (
        <Layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <ArrowLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate('/history')} />
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{year} Project</h2>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: '#00b89415', color: '#00b894', fontWeight: 600 }}>Completed</span>
            </div>

            {/* Year Summary Card */}
            <div style={{ backgroundColor: 'var(--card-bg)', padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Year Summary</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Starting (Jan)</div>
                        <div style={{ fontWeight: 600 }}>{formatBillions(projectStats.start)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ending (Dec)</div>
                        <div style={{ fontWeight: 600 }}>{formatBillions(projectStats.end)}</div>
                    </div>
                </div>

                <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14 }}>Gain</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: projectStats.gain >= 0 ? '#00b894' : '#d63031' }}>
                            {projectStats.gain >= 0 ? '+' : ''}{formatBillions(projectStats.gain)} ({projectStats.gainPercent.toFixed(1)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Monthly Progression Chart */}
            <div style={{ backgroundColor: 'var(--card-bg)', padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Monthly Progression</h3>
                <div style={{ height: 150, width: '100%', fontSize: 10 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValueHistory" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary-purple)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--primary-purple)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                            <YAxis
                                domain={['dataMin', 'auto']}
                                tickCount={6}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 10 }}
                                tickFormatter={(val) => (val / 1000000000).toFixed(1) + ' M'}
                                width={45}
                            />
                            <Tooltip formatter={(value) => formatBillions(value)} />
                            <Area type="monotone" dataKey="value" stroke="var(--primary-purple)" strokeWidth={2} fill="url(#colorValueHistory)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Logic Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Monthly Breakdown (Click for details)</h3>
                {yearSnapshots.map((snap) => (
                    <div
                        key={snap.id}
                        onClick={() => setSelectedMonth(snap)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', backgroundColor: 'var(--card-bg)', borderRadius: 12,
                            cursor: 'pointer', transition: 'background-color 0.2s'
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', alignItems: 'center', width: '100%', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, width: 40 }}>{getMonthName(snap.month - 1).substring(0, 3)}</span>
                                {snap.isLocked && <Lock size={12} color="var(--text-secondary)" />}
                            </div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary-purple)', fontWeight: 700 }}>
                                {formatIDR(snap.totalNetWorth)}
                            </div>
                            <div style={{ width: 12 }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MONTH DETAIL MODAL --- */}
            {selectedMonth && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end'
                }} onClick={() => setSelectedMonth(null)}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        padding: 24, maxHeight: '80vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                                {getMonthName(selectedMonth.month - 1)} {selectedMonth.year}
                            </h3>
                            <div onClick={() => setSelectedMonth(null)} style={{ cursor: 'pointer', padding: 8 }}>
                                <X size={24} />
                            </div>
                        </div>

                        {/* Pie Chart for this Month */}
                        <div style={{ height: 200, marginBottom: 24 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getPieData(selectedMonth.assets)}
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={70}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {getPieData(selectedMonth.assets).map((entry, index) => (
                                            <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatIDR(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                                Allocation
                            </div>
                        </div>

                        {/* Top Holdings List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {selectedMonth.assets.map((asset, idx) => (
                                <div key={idx} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center',
                                    borderBottom: '1px solid var(--border-color)', padding: '12px 4px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{asset.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{asset.type.toUpperCase()}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                            {formatIDR((parseFloat(asset.quantity) || 0) * (parseFloat(asset.manual_price_idr) || 0))}
                                        </div>
                                    </div>
                                    <div style={{ width: 4 }}></div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ProjectDetail;
