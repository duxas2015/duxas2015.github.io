<?php

// Начальный каталог для поиска
$base_dir = 'video';
// Разрешенные расширения файлов (в нижнем регистре)
$target_extensions = ['mp4', '3gp'];

/**
 * Рекурсивно сканирует каталог, ища файлы с заданными расширениями.
 * Строит HTML-структуру дерева ссылок.
 * * @param string $path Текущий путь (относительно корневого каталога сайта)
 * @return string Возвращает HTML-код <ul>...</ul> или пустую строку, если нет подходящих файлов
 */
function buildVideoTree($path) {
    global $target_extensions;
    
    // Получаем содержимое каталога в алфавитном порядке
    $items = scandir($path);
    if ($items === false) {
        return ''; // Ошибка чтения каталога
    }

    $html = '';
    $has_content = false;

    foreach ($items as $item) {
        // Игнорируем "." и ".."
        if ($item === '.' || $item === '..') {
            continue;
        }

        $full_path = $path . '/' . $item;
        
        if (is_dir($full_path)) {
            // Если это каталог, рекурсивно вызываем функцию
            $submenu = buildVideoTree($full_path);
            
            // Включаем каталог, только если в нем или его подкаталогах есть целевые файлы
            if (!empty($submenu)) {
                // Имя каталога
                $html .= '<li><strong>' . htmlspecialchars($item) . '</strong><ul>' . $submenu . '</ul></li>';
                $has_content = true;
            }
        } elseif (is_file($full_path)) {
            // Если это файл, проверяем расширение
            $file_info = pathinfo($full_path);
            $extension = isset($file_info['extension']) ? strtolower($file_info['extension']) : '';

            // Проверяем, находится ли расширение в списке разрешенных
            if (in_array($extension, $target_extensions)) {
                // Имя ссылки - имя файла без расширения
                $link_text = htmlspecialchars($file_info['filename']);
                // Ссылка - полный путь к файлу
                $link_url = htmlspecialchars($full_path);
                
                $html .= '<li><a href="' . $link_url . '">' . $link_text . '</a></li>';
                $has_content = true;
            }
        }
    }

    // Возвращаем контент только если что-то было найдено
    return $has_content ? $html : '';
}

// Формируем строку с разрешенными расширениями для вывода
$ext_list = '*.' . implode(', *.', $target_extensions);

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Дерево ссылок на видео</title>
    <style>
        body { font-family: Arial, sans-serif; }
        ul { list-style-type: none; }
        /* Простой стиль для отображения иерархии */
        ul ul { margin-left: 20px; border-left: 1px dashed #ccc; padding-left: 10px; }
        li { margin-bottom: 5px; }
        strong { color: #333; }
    </style>
</head>
<body>

    <h1>🎬 Видео-каталог (Типы файлов: <?php echo $ext_list; ?>)</h1>

    <?php
    if (!is_dir($base_dir)) {
        echo '<p>Каталог <strong>' . htmlspecialchars($base_dir) . '</strong> не найден!</p>';
    } else {
        echo '<ul>';
        // Начинаем построение дерева с корневого каталога 'video'
        $tree_html = buildVideoTree($base_dir);
        if (empty($tree_html)) {
            echo '<li>Целевые видеофайлы не найдены.</li>';
        } else {
            // Выводим имя корневого каталога и его содержимое
            echo '<li><strong>' . htmlspecialchars($base_dir) . '</strong><ul>' . $tree_html . '</ul></li>';
        }
        echo '</ul>';
    }
    ?>

</body>
</html>