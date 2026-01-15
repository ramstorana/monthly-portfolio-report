
import pandas as pd
import json
import os

try:
    file_path = "/Users/ramstorana/Documents/MONTHLY PORTFOLIO REPORT/2025 Total Portfolio!.xlsx"
    df = pd.read_excel(file_path)
    
    # Process dataframe: lowercase columns, handle NaNs
    df.columns = [str(c).lower().strip() for c in df.columns]
    data = df.where(pd.notnull(df), None).to_dict(orient='records')
    
    output_path = os.path.join(os.path.dirname(__file__), 'assets.json')
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2, default=str)
        
    print(f"Successfully wrote data to {output_path}")

except Exception as e:
    with open('error.log', 'w') as f:
        f.write(str(e))
    print(f"Error: {e}")
