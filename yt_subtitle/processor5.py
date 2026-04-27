#!/usr/bin/env python3

import subprocess
import argparse
import sys
import io
import re
import os
import pandas as pd
from pathlib import Path
import webvtt  # pip install webvtt-py

# Перенаправляем стандартный вывод и ошибки в UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def extract_video_id(url):
    """Извлекает ID видео из различных форматов ссылок YouTube."""
    pattern = r'(?:v=|\/|be\/|embed\/)([a-zA-Z0-9_-]{11})'
    match = re.search(pattern, url)
    return match.group(1) if match else "output"

def get_dominant_language_postfix(text_sample):
    """Определяет, какой алфавит преобладает в первых предложениях."""
    cyrillic_count = len(re.findall(r'[а-яА-ЯёЁ]', text_sample))
    latin_count = len(re.findall(r'[a-zA-Z]', text_sample))
    
    if latin_count > cyrillic_count:
        return "en" # Латиница преобладает
    return "ru" # Кириллица преобладает (или поровну)

def save_to_excel(sentences, base_path, lang_code, is_original):
    """Сохраняет список предложений в файл .xlsx с нужным постфиксом."""
    df = pd.DataFrame(sentences, columns=['Subtitles'])
    
    postfix = ".orig" if is_original else ""
    file_name = f"{base_path.stem}{postfix}.{lang_code}.xlsx"
    full_path = base_path.parent / file_name
    
    df.to_excel(full_path, index=False)
    return full_path

def main():

    parser = argparse.ArgumentParser(
        description="Download YouTube subtitles and save directly to RU and EN Excel files."
    )
    # Первый параметр
    parser.add_argument("youtube_url", help="The URL of the YouTube video.")
    
    # Второй параметр (теперь обязательный)
    parser.add_argument(
        "langs", 
        help="Subtitle languages to download (e.g., 'ru', 'en', or 'ru,en')."
    )
    
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Directory to save xlsx files (default: current directory)."
    )

    args = parser.parse_args()

    video_id = extract_video_id(args.youtube_url)
    output_base_path = Path(args.output_dir) / video_id
    temp_vtt_base = f"/tmp/{video_id}_temp"

    # 1. Скачивание субтитров
    command = [
        r"C:\Python313\Scripts\yt-dlp.exe",
        "--write-auto-subs",
        "--sub-langs", args.langs,  # Используем второй параметр командной строки
        "--sub-format", "vtt",
        "--skip-download",
        args.youtube_url,
        "-o", temp_vtt_base
    ]

    print(f"Загрузка субтитров для видео {video_id}...", file=sys.stderr)
    subprocess.run(command, check=True, capture_output=True, text=True)

    # Находим любой скачанный VTT файл для обработки текста
    vtt_files = list(Path("/tmp").glob(f"{video_id}_temp.*.vtt"))
    if not vtt_files:
        print("Ошибка: Субтитры не найдены.", file=sys.stderr)
        sys.exit(1)
    
    vtt_path = vtt_files[0]

    try:
        # 2. Обработка контента (удаление дублей)
        vtt_content = webvtt.read(str(vtt_path))
        final_text_parts = []
        last_printed_line = ""

        for caption in vtt_content:
            clean_content = re.sub(r'<[^>]+>', '', caption.text)
            lines = [line.strip() for line in clean_content.split('\n') if line.strip()]
            
            if not lines:
                continue

            if last_printed_line and lines[0] == last_printed_line:
                lines = lines[1:]

            for line in lines:
                final_text_parts.append(line)
                last_printed_line = line

        # Склеиваем в текст и разбиваем на предложения
        raw_text = " ".join(final_text_parts)
        raw_text = re.sub(r'\s+', ' ', raw_text).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', raw_text) if s.strip()]

        if not sentences:
            print("Текст субтитров пуст.")
            return

        # 3. Определение языка оригинала по первым двум предложениям
        sample_text = " ".join(sentences[:2])
        orig_lang = get_dominant_language_postfix(sample_text)

        # 4. Создание двух файлов
        # Файл RU
        path_ru = save_to_excel(sentences, output_base_path, "ru", (orig_lang == "ru"))
        # Файл EN
        path_en = save_to_excel(sentences, output_base_path, "en", (orig_lang == "en"))

        print(f"Обработка завершена:")
        print(f"- {path_ru.name}")
        print(f"- {path_en.name}")
        
    finally:
        # Очистка всех временных VTT
        for f in Path("/tmp").glob(f"{video_id}_temp.*.vtt"):
            if f.exists():
                os.remove(f)

if __name__ == "__main__":
    main()