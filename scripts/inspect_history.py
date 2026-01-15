import pandas as pd
import os

files = [
    "/Users/ramstorana/Documents/MONTHLY PORTFOLIO REPORT/1-JAN-2025.xlsx",
]

for f in files:
    try:
        print(f"--- Reading {os.path.basename(f)} ---")
        df = pd.read_excel(f)
        print(df.head(10))
        print(df.columns)
    except Exception as e:
        print(f"Error reading {f}: {e}")
