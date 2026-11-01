from pathlib import Path
import subprocess
import sys
import time

homepage = Path(__file__).parent
folder = homepage.parent / "c-programs"
generator = homepage / "generate.py"

def get_c_files():
    return sorted(
        (file.name for file in folder.glob("*.c")),
        key=str.lower
    )

subprocess.run([sys.executable, str(generator)], check=True)
previous_files = get_c_files()

print("Watching for C files... Press Ctrl+C to stop.")

while True:
    time.sleep(1)
    current_files = get_c_files()

    if current_files != previous_files:
        subprocess.run([sys.executable, str(generator)], check=True)
        previous_files = current_files
        print("Homepage updated!")