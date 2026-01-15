import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { ChevronRight, Lock } from 'lucide-react';
import { formatBillions } from '../../utils/finance';

const History = () => {
    const navigate = useNavigate();

    // Mock Projects based on SRD v4.0
    // Real app would fetch from PortfolioService.getData().projects
    const projects = [
        {
            year: 2025,
            status: 'Completed',
            start: 2700000000,
            end: 4100000000,
            gainPercent: 51.9,
            isBaseline: false
        }
    ];

    return (
        <Layout>
            <h2 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700 }}>Past Projects</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projects.map((proj) => (
                    <div
                        key={proj.year}
                        onClick={() => navigate(`/history/${proj.year}`)}
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            padding: 20,
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 16, fontWeight: 700 }}>{proj.year} Project</span>
                                {proj.status === 'Completed' && (
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: '#00b89415', color: '#00b894', fontWeight: 600 }}>Completed</span>
                                )}
                                {proj.status === 'Baseline' && (
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: '#636e7215', color: '#636e72', fontWeight: 600 }}>Baseline</span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Start</div>
                                    <div style={{ fontWeight: 600 }}>{formatBillions(proj.start)}</div>
                                </div>
                                {!proj.isBaseline && (
                                    <div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>End</div>
                                        <div style={{ fontWeight: 600 }}>{formatBillions(proj.end)}</div>
                                    </div>
                                )}
                            </div>

                            {!proj.isBaseline && (
                                <div style={{ marginTop: 12, fontSize: 13, color: '#00b894', fontWeight: 600 }}>
                                    Gain: +{proj.gainPercent}% 🟢
                                </div>
                            )}
                        </div>

                        <ChevronRight size={20} color="var(--text-secondary)" />
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export default History;
