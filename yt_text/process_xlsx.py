import pandas as pd
import sys
import json

def process_files(file1, file2):
    try:
        # Читаем оба файла
        df1 = pd.read_excel(file1)
        df2 = pd.read_excel(file2)

        # Предполагаем, что данные в колонке 'Subtitles' (как в вашем processor5.py)
        # Если колонки называются иначе, берем первую колонку
        col1 = df1.iloc[:, 0].tolist()
        col2 = df2.iloc[:, 0].tolist()

        # Выравниваем списки по длине
        max_len = max(len(col1), len(col2))
        col1 += [''] * (max_len - len(col1))
        col2 += [''] * (max_len - len(col2))

        # Формируем результат для PHP
        result = []
        for en, ru in zip(col1, col2):
            result.append({'en': str(en), 'ru': str(ru)})
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) == 3:
        process_files(sys.argv[1], sys.argv[2])