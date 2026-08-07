FROM ubuntu:22.04

# Отключение интерактивных диалогов при установке
ENV DEBIAN_FRONTEND=noninteractive

# Установка Apache, PHP, Python, MySQL (MariaDB) и системных зависимостей
RUN apt-get update && apt-get install -y \
    apache2 \
    php \
    libapache2-mod-php \
    python3 \
    python3-pip \
    mariadb-server \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Установка Python-библиотек, необходимых для скриптов
RUN pip3 install --no-cache-dir \
    pandas \
    openpyxl \
    webvtt-py \
    yt-dlp

# Создание символической ссылки, чтобы `python` ссылался на `python3`
RUN ln -s /usr/bin/python3 /usr/bin/python

# Включение модуля Apache rewrite и настройка директории
RUN a2enmod rewrite

# Создание рабочей директории и папки для загрузок с правильными правами
WORKDIR /var/www/html
RUN mkdir -p /var/www/html/downloads && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/downloads

# Порты для HTTP и MySQL
EXPOSE 80 3306

# Скрипт запуска для одновременного старта MySQL и Apache
CMD service mariadb start && apachectl -D FOREGROUND