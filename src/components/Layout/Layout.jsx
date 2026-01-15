import React from 'react';
import { LayoutDashboard, PieChart, TrendingUp, Settings, History as HistoryIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

// eslint-disable-next-line no-unused-vars
const NavItem = ({ to, Icon, label, isActive }) => {
    return (
        <Link to={to} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
            <Icon size={24} />
            <span className={styles.navLabel}>{label}</span>
        </Link>
    );
};

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className={styles.container}>
            <main className={styles.content}>
                {children}
            </main>
            <nav className={styles.bottomNav}>
                <NavItem to="/" Icon={LayoutDashboard} label="Home" isActive={location.pathname === '/'} />
                <NavItem to="/portfolio" Icon={PieChart} label="Portfolio" isActive={location.pathname === '/portfolio' || location.pathname === '/allocation'} />
                <NavItem to="/history" Icon={HistoryIcon} label="History" isActive={location.pathname === '/history'} />
            </nav>
        </div>
    );
};

export default Layout;
