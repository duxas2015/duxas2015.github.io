import pandas as pd
import sys
import os
from pathlib import Path

def merge():
    if len(sys.argv) < 4:
        print("Использование: python merge.py файл1.xlsx файл2.xlsx выходная_папка")
        return

    file1_path = sys.argv[1]
    file2_path = sys.argv[2]
    output_dir = sys.argv[3]
    output_path = os.path.join(output_dir, "combined_result.xlsx")

    try:
        # Читаем оба XLSX файла
        df1 = pd.read_excel(file1_path)
        df2 = pd.read_excel(file2_path)

        # Объединяем их по горизонтали (axis=1)
        result = pd.concat([df1, df2], axis=1)

        # Сохраняем результат
        result.to_excel(output_path, index=False)
        
        # Выводим имя файла, чтобы PHP его подхватил
        print(f"SUCCESS: {os.path.basename(output_path)}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    merge()