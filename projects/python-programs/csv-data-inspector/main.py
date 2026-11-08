import pandas as pd
from pathlib import Path

print("===== CSV Data Inspector =====")

file_path = Path(__file__).parent / "sample.csv"

df = pd.read_csv(file_path)

print("\n===== Dataset Information =====")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n===== Column Names =====")

for column in df.columns:
    print(column)

print("\n===== Column Data Types =====")

for column, dtype in df.dtypes.items():
    print(f"{column}: {dtype}")

print("\n===== Data Preview =====")
print(df.head())

print("\n===== Statistical Summary =====")
print(df.describe())

print("\n===== Categorical Summary =====")
print(df.describe(include="str"))

print("\n===== Missing Values =====")
print(df.isnull().sum())

print("Total missing values:", df.isnull().sum().sum())

print("\n===== Duplicate Rows =====")
print("Duplicate rows:", df.duplicated().sum())

print("\n===== Duplicate Records =====")
print(df[df.duplicated(keep=False)])

print("\n===== Course Distribution =====")
print(df["Course"].value_counts())

print("\n===== Grade Distribution =====")
print(df["Grade"].value_counts().sort_index())

print("\n===== Column Averages =====")

for column in df.select_dtypes(include="number").columns:
    print(f"{column}: {df[column].mean():.2f}")

print("\n===== Column Ranges =====")

for column in df.select_dtypes(include="number").columns:
    minimum = df[column].min()
    maximum = df[column].max()

    print(f"{column}:")
    print(f"  Minimum: {minimum}")
    print(f"  Maximum: {maximum}")
    print(f"  Range: {maximum - minimum}")