import pandas as pd
import sys
import os
from pathlib import Path

def merge():
    # Теперь ожидаем 4 аргумента + путь к скрипту
    if len(sys.argv) < 5:
        print("Использование: python merge.py файл1.xlsx файл2.xlsx выходная_папка формат(xlsx/txt)")
        return

    file1_path = sys.argv[1]
    file2_path = sys.argv[2]
    output_dir = sys.argv[3]
    file_format = sys.argv[4].lower() # xlsx или txt

    try:
        # Читаем оба XLSX файла
        df1 = pd.read_excel(file1_path)
        df2 = pd.read_excel(file2_path)

        # Объединяем их по горизонтали (axis=1)
        result = pd.concat([df1, df2], axis=1)

        # Логика именования: берем базовое имя до первой точки
        name1 = os.path.basename(file1_path).split('.')[0]
        name2 = os.path.basename(file2_path).split('.')[0]
        
        # Выбираем более короткое имя
        shorter_name = name1 if len(name1) <= len(name2) else name2
        
        extension = ".xlsx" if file_format == "xlsx" else ".txt"
        output_filename = f"merged_{shorter_name}{extension}"
        output_path = os.path.join(output_dir, output_filename)

        # Сохраняем результат в зависимости от формата
        if file_format == "xlsx":
            result.to_excel(output_path, index=False)
        else:
            # Сохраняем как текст с разделителем табуляцией в кодировке UTF-8 с BOM
            result.to_csv(output_path, sep='\t', index=False, encoding='utf-8-sig')            
        
        # Выводим SUCCESS и имя файла для PHP
        print(f"SUCCESS: {output_filename}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    merge()