import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import styles from './RiskAlert.module.css';

const RiskAlert = ({ riskLevel, message }) => {
    if (riskLevel === 'safe' || !message) return null;

    const isCritical = riskLevel === 'critical';
    const Icon = isCritical ? ShieldAlert : AlertTriangle;

    return (
        <div className={`${styles.container} ${isCritical ? styles.critical : styles.warning}`}>
            <Icon className={styles.icon} size={24} />
            <div className={styles.content}>
                <h4 className={styles.title}>{isCritical ? 'CRITICAL RISK' : 'RISK WARNING'}</h4>
                <p className={styles.message}>{message}</p>
            </div>
        </div>
    );
};

export default RiskAlert;
