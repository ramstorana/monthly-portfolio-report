import React from 'react';
import Layout from '../../components/Layout/Layout';

const Settings = () => {
    return (
        <Layout>
            <h2 style={{ textAlign: 'center' }}>Settings</h2>
            <div style={{ padding: 20, background: '#1a1a1a', borderRadius: 8 }}>
                <p>Currency: IDR</p>
                <p>Theme: Dark (Bloomberg)</p>
                <button style={{ marginTop: 20, padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: 4 }}>
                    Connect Supabase
                </button>
            </div>
        </Layout>
    );
};
export default Settings;
