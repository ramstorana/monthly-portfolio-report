
import pandas as pd
import json
import os
import re

# File mapping to Month Number (1-12)
FILES = {
    "1-JAN-2025.xlsx": 1,
    "05-MAY-2025 POSITION.xlsx": 5,
    "06-JUN-2025 POSITION .xlsx": 6,
    "08-AUG-2025 POSITION .xlsx": 8,
    "10-OCT-2025 POSITION .xlsx": 10,
    "11-NOV-2025 POSITION .xlsx": 11,
    "12-DEC-2025 POSITION.xlsx": 12
}

BASE_DIR = "/Users/ramstorana/Documents/MONTHLY PORTFOLIO REPORT"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'history_2025.json')

def parse_file(filename, month_num):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        print(f"Skipping {filename} (not found)")
        return None

    try:
        df = pd.read_excel(path)
        # normalize columns
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # Hardcoded extraction logic based on the known format
        # Row indices are approximate based on inspect output, better to search by label?
        # Let's search by Label in column 1 ("unnamed: 1")
        
        assets = []
        
        # Helper to find row index by content
        def find_row(key):
            for i, row in df.iterrows():
                val = str(row.iloc[1]).strip().lower() # Column B
                if key.lower() in val:
                    return i
            return -1

        # Generic extraction helper
        def extract_asset(row_idx, type, name_col=2, qty_col=3, price_col=4):
            if row_idx == -1: return
            
            # Start from row_idx + 1 (data usually follows header)
            # Actually looking at the inspect output:
            # Row 2: Cash | TD | 5 | ...
            # Row 3: null | JPY | 1000000 ...
            
            # Let's iterate from row_idx until we hit a null or next category
            for i in range(row_idx, len(df)):
                row = df.iloc[i]
                name = row.iloc[name_col] # Column C usually
                if pd.isna(name): continue
                
                # Stop if we hit a category header ("Stocks", "Commodity", "Total")
                label_col = str(row.iloc[1]).lower()
                if "stocks" in label_col or "commodity" in label_col or "total" in label_col:
                    break
                    
                # Extract
                qty = row.iloc[qty_col]
                price = row.iloc[price_col]
                
                # specific clean up
                ticker = ""
                currency = "IDR"
                
                if type == 'cash':
                    if "USD" in str(name): currency = "USD"
                    elif "JPY" in str(name): currency = "JPY"
                    elif "SGD" in str(name): currency = "SGD"
                
                if type == 'stock':
                    ticker = str(name) + ".JK" # Assumption
                    
                assets.append({
                    "id": f"2025-{month_num}-{len(assets)}",
                    "type": type,
                    "name": str(name),
                    "ticker": ticker,
                    "quantity": qty if pd.notnull(qty) else 0,
                    "currency": currency,
                    "manual_price_idr": price if pd.notnull(price) and isinstance(price, (int, float)) else 0
                })

        # --- EXTRACT CASH ---
        # "Cash" is at row index 2 in the inspect output, but let's find it.
        # It seems the header is "Cash" at row 2 col 1?
        # Actually in inspect output: row 2 col 1 is "Cash"
        # row 2 col 2 is "TD"
        
        # Let's simple iterate all rows and detect types based on context if possible, 
        # or stick to fixed ranges if structure is rigid. 
        # Structure seems rigid.
        
        # Cash/TD
        td_qty = df.iloc[3, 3] # Row 3 (0-based) based on inspect? Checks:
        # Inspect:
        # 0: header
        # 1: Assets...
        # 2: Cash (row label) | TD (val) | 5 (qty)
        try:
             assets.append({
                "id": f"2025-{month_num}-cash-td",
                "type": "cash",
                "name": "TD (Time Deposit)",
                "quantity": 1,
                "currency": "IDR",
                "manual_price_idr": df.iloc[2, 4] if pd.notnull(df.iloc[2, 4]) else 0 # Col E is Price
             })
        except: pass
        
        # JPY
        try:
             assets.append({
                "id": f"2025-{month_num}-cash-jpy",
                "type": "cash",
                "name": "JPY Savings",
                "quantity": df.iloc[3, 3], # JPY Qty
                "currency": "JPY",
                "manual_price_idr": 0 
             })
        except: pass

        # BA
        try:
             assets.append({
                "id": f"2025-{month_num}-cash-ba",
                "type": "cash",
                "name": "BA",
                "quantity": 1,
                "currency": "IDR",
                "manual_price_idr": df.iloc[4, 5] if pd.notnull(df.iloc[4, 5]) else 0 # BA uses Total col 5 sometimes?
             })
        except: pass

        # Stocks (BUMI)
        # Found at row w/ "Stocks (Shares)"
        stock_row_idx = find_row("Stocks (Shares)")
        if stock_row_idx != -1:
            try:
                assets.append({
                    "id": f"2025-{month_num}-stock-bumi",
                    "type": "stock",
                    "name": str(df.iloc[stock_row_idx, 2]), # BUMI
                    "ticker": str(df.iloc[stock_row_idx, 2]) + ".JK",
                    "quantity": df.iloc[stock_row_idx, 3],
                    "currency": "IDR",
                    "manual_price_idr": df.iloc[stock_row_idx, 4]
                })
            except: pass

        # Gold
        gold_row_idx = find_row("Commodity (g)")
        if gold_row_idx != -1:
            try:
                assets.append({
                    "id": f"2025-{month_num}-gold",
                    "type": "gold",
                    "name": "Physical Gold",
                    "quantity": df.iloc[gold_row_idx, 3],
                    "currency": "IDR",
                    "manual_price_idr": df.iloc[gold_row_idx, 4]
                })
            except: pass
            
        # Calculate Total (Or read it)
        # Let's calculate in JS, but we can grab the Excel total to verify?
        # Column F (index 5) row "TOTAL"
        total_nw = 0
        total_row_idx = find_row("TOTAL")
        if total_row_idx != -1:
            total_nw = df.iloc[total_row_idx, 5]

        return {
            "id": f"2025-{month_num}",
            "year": 2025,
            "month": month_num,
            "date": f"2025-{month_num:02d}-28T23:59:59.000Z", # Approximate EOM
            "assets": assets,
            "isLocked": True,
            "totalNetWorth": float(total_nw) if pd.notnull(total_nw) else 0
        }

    except Exception as e:
        print(f"Error parsing {filename}: {e}")
        return None

snapshots = []
for fname, month in FILES.items():
    print(f"Processing {fname}...")
    snap = parse_file(fname, month)
    if snap:
        snapshots.append(snap)

# Sort by month
snapshots.sort(key=lambda x: x['month'])

with open(OUTPUT_FILE, 'w') as f:
    json.dump(snapshots, f, indent=2, default=str)

print(f"Done. Wrote {len(snapshots)} snapshots to {OUTPUT_FILE}")
