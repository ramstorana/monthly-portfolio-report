import { calculateGap, calculateProgress } from '../src/utils/finance.js';
import { PHASES } from '../src/constants/targets.js';
import { PortfolioService } from '../src/services/PortfolioService.js';

console.log("Running Verification...");

// Test 1: Gap Calculation
const gap = calculateGap(100, 150);
if (gap !== -50) console.error("FAIL: Gap should be -50, got", gap);
else console.log("PASS: Gap Calculation");

// Test 2: Progress Calculation
const progress = calculateProgress(50, 100);
if (progress !== 50) console.error("FAIL: Progress should be 50%, got", progress);
else console.log("PASS: Progress Calculation");

// Test 3: Phase Constants
if (PHASES['1'].name !== 'Aggressive Growth') console.error("FAIL: Phase 1 name incorrect");
else console.log("PASS: Phase Constants");

// Test 4: Portfolio Orchestration (Basic)
console.log("Testing PortfolioService...");
const mockAssets = [
    { id: '1', type: 'cash', quantity: 1, manual_price_idr: 1000 },
    { id: '2', type: 'stock', quantity: 10, manual_price_idr: 500 }
];

PortfolioService.calculatePortfolioValues(mockAssets).then(enriched => {
    const total = PortfolioService.calculateTotalNetWorth(enriched);
    const expected = 1000 + (10 * 500); // 6000

    if (total !== expected) {
        console.error(`FAIL: Portfolio Calculation. Expected ${expected}, got ${total}`);
    } else {
        console.log("PASS: PortfolioService Orchestration");
    }
    console.log("Verification Complete.");
}).catch(err => {
    console.error("FAIL: PortfolioService threw error", err);
});
