FROM php:8.2-apache

# Установка системных зависимостей, Python 3, pip и ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Включение расширений PHP для работы с MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Включение модуля Apache rewrite
RUN a2enmod rewrite

# Установка необходимых Python-пакетов
RUN pip3 install --no-cache-dir --break-system-packages \
    pandas \
    openpyxl \
    webvtt-py \
    yt-dlp

# Рабочий каталог
WORKDIR /var/www/html

# Создание папки downloads и установка прав для сохранения файлов
RUN mkdir -p /var/www/html/downloads && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 777 /var/www/html/downloads