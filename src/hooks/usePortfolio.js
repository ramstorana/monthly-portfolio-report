import { useState, useEffect } from 'react';
import { PortfolioService } from '../services/PortfolioService';
import { WEALTH_TARGETS } from '../constants/targets';

export const usePortfolio = () => {
    const [assets, setAssets] = useState([]);
    const [totalNetWorth, setTotalNetWorth] = useState(0);
    const [loading, setLoading] = useState(true);

    const currentYear = new Date().getFullYear();
    const targetObj = WEALTH_TARGETS.find(t => t.year === currentYear);
    const target = targetObj ? targetObj.target : 0;

    useEffect(() => {
        loadPortfolio();

        // Listen for storage events to sync across tabs
        window.addEventListener('storage', loadPortfolio);
        return () => window.removeEventListener('storage', loadPortfolio);
    }, []);

    const loadPortfolio = async () => {
        setLoading(true);
        try {
            // Load raw assets from LocalStorage (via Service)
            const rawAssets = PortfolioService.getLocalAssets();

            // Enrich with market prices
            const enrichedAssets = await PortfolioService.calculatePortfolioValues(rawAssets);

            setAssets(enrichedAssets);
            setTotalNetWorth(PortfolioService.calculateTotalNetWorth(enrichedAssets));
        } catch (error) {
            console.error("Failed to load portfolio:", error);
        } finally {
            setLoading(false);
        }
    };

    const addAsset = async (asset) => {
        await PortfolioService.addAsset(asset);
        loadPortfolio();
    };

    const updateAsset = async (asset) => {
        await PortfolioService.updateAsset(asset);
        loadPortfolio();
    };

    const deleteAsset = async (id) => {
        await PortfolioService.deleteAsset(id);
        loadPortfolio();
    };

    return {
        assets,
        totalNetWorth,
        target,
        loading,
        refresh: loadPortfolio,
        addAsset,
        updateAsset,
        deleteAsset
    };
};
