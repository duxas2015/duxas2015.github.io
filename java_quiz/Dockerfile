FROM php:8.2-apache

# Устанавливаем необходимые системные библиотеки и расширения PHP для работы с MySQL
RUN apt-get update && apt-get install -y \
    && docker-php-ext-install pdo pdo_mysql mysqli \
    && rm -rf /var/lib/apt/lists/*

# Включаем модуль mod_rewrite для Apache (полезно для большинство CMS/фреймворков)
RUN a2enmod rewrite