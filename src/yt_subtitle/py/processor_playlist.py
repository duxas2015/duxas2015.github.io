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

# Путь к yt-dlp (измените, если он отличается)
YT_DLP_PATH = r"C:\Python313\Scripts\yt-dlp.exe"

def get_playlist_video_ids(url):
    """Получает список ID видео из ссылки на плейлист или одиночное видео."""
    command = [
        YT_DLP_PATH,
        "--get-id",
        "--flat-playlist",
        "--no-warnings",
        url
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        ids = result.stdout.strip().split('\n')
        return [i for i in ids if i]
    except subprocess.CalledProcessError as e:
        print(f"Ошибка при получении списка видео: {e}", file=sys.stderr)
        return []

def get_dominant_language_postfix(text_sample):
    """Определяет, какой алфавит преобладает."""
    cyrillic_count = len(re.findall(r'[а-яА-ЯёЁ]', text_sample))
    latin_count = len(re.findall(r'[a-zA-Z]', text_sample))
    return "en" if latin_count > cyrillic_count else "ru"

def save_to_excel(sentences, base_path, lang_code, is_original):
    """Сохраняет список предложений в файл .xlsx."""
    df = pd.DataFrame(sentences, columns=['Subtitles'])
    postfix = ".orig" if is_original else ""
    file_name = f"{base_path.stem}{postfix}.{lang_code}.xlsx"
    full_path = base_path.parent / file_name
    df.to_excel(full_path, index=False)
    return full_path

def process_video(video_id, langs, output_dir):
    """Полный цикл обработки одного видео по его ID."""
    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
    output_base_path = Path(output_dir) / video_id
    temp_vtt_base = f"/tmp/{video_id}_temp"
    
    # Создаем папку /tmp если её нет (актуально для Windows)
    Path("/tmp").mkdir(exist_ok=True)

    # 1. Скачивание субтитров
    command = [
        YT_DLP_PATH,
        "--write-auto-subs",
        "--sub-langs", langs,
        "--sub-format", "vtt",
        "--skip-download",
        youtube_url,
        "-o", temp_vtt_base
    ]

    print(f"\n--- Обработка видео {video_id} ---", file=sys.stderr)
    subprocess.run(command, check=False, capture_output=True, text=True)

    vtt_files = list(Path("/tmp").glob(f"{video_id}_temp.*.vtt"))
    if not vtt_files:
        print(f"Субтитры для {video_id} не найдены. Пропускаем.")
        return

    vtt_path = vtt_files[0]

    try:
        vtt_content = webvtt.read(str(vtt_path))
        final_text_parts = []
        last_printed_line = ""

        for caption in vtt_content:
            clean_content = re.sub(r'<[^>]+>', '', caption.text)
            lines = [line.strip() for line in clean_content.split('\n') if line.strip()]
            if not lines: continue
            if last_printed_line and lines[0] == last_printed_line:
                lines = lines[1:]
            for line in lines:
                final_text_parts.append(line)
                last_printed_line = line

        raw_text = re.sub(r'\s+', ' ', " ".join(final_text_parts)).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', raw_text) if s.strip()]

        if not sentences:
            print(f"Текст субтитров для {video_id} пуст.")
            return

        orig_lang = get_dominant_language_postfix(" ".join(sentences[:2]))
        
        path_ru = save_to_excel(sentences, output_base_path, "ru", (orig_lang == "ru"))
        path_en = save_to_excel(sentences, output_base_path, "en", (orig_lang == "en"))

        print(f"Готово: {path_ru.name}, {path_en.name}")
        
    finally:
        for f in Path("/tmp").glob(f"{video_id}_temp.*.vtt"):
            if f.exists(): os.remove(f)

def main():
    parser = argparse.ArgumentParser(description="Download subtitles from playlist or video.")
    parser.add_argument("url", help="YouTube video or playlist URL.")
    parser.add_argument("langs", help="Languages (e.g., 'ru', 'en', or 'ru,en').")
    parser.add_argument("--output-dir", default=".", help="Output directory.")

    args = parser.parse_args()

    # Получаем все ID видео (если это плейлист — будет список, если видео — один ID)
    print("Получение списка видео...")
    video_ids = get_playlist_video_ids(args.url)
    
    if not video_ids:
        print("Видео не найдены.")
        return

    print(f"Найдено видео: {len(video_ids)}")

    for vid in video_ids:
        try:
            process_video(vid, args.langs, args.output_dir)
        except Exception as e:
            print(f"Ошибка при обработке {vid}: {e}")

if __name__ == "__main__":
    main()