CREATE TABLE `subtitle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `movie` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `movie_code` varchar(100) COLLATE utf8mb3_bin NOT NULL,
  `series` int DEFAULT '0',
  `episode` int DEFAULT '0',
  `subtitle_en` longtext COLLATE utf8mb3_bin,
  `subtitle_ru` longtext COLLATE utf8mb3_bin,
  PRIMARY KEY (`id`),
  KEY `movie_code` (`movie_code`,`series`,`episode`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

CREATE TABLE `subtitle_detail` (
  `id` int NOT NULL,
  `idx` int NOT NULL,
  `en_tag` varchar(50) COLLATE utf8mb3_bin DEFAULT NULL,
  `en_time` varchar(100) COLLATE utf8mb3_bin DEFAULT NULL,
  `en_text` text COLLATE utf8mb3_bin,
  `ru_text` text COLLATE utf8mb3_bin,
  `ru_tag` varchar(50) COLLATE utf8mb3_bin DEFAULT NULL,
  `ru_time` varchar(100) COLLATE utf8mb3_bin DEFAULT NULL,
  KEY `id` (`id`),
  CONSTRAINT `subtitle_detail_ibfk_1` FOREIGN KEY (`id`) REFERENCES `subtitle` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;
