CREATE TABLE `text` (
  `id` int NOT NULL AUTO_INCREMENT,
  `header` varchar(255) COLLATE utf8mb3_bin NOT NULL,
  `header_code` varchar(100) COLLATE utf8mb3_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `header_code` (`header_code`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `text_detail` (
  `id` int NOT NULL,
  `idx` int NOT NULL,
  `text_row_en` varchar(1000) COLLATE utf8mb3_bin DEFAULT NULL,
  `text_row_ru` varchar(1000) COLLATE utf8mb3_bin DEFAULT NULL,
  KEY `id` (`id`),
  CONSTRAINT `text_detail_ibfk_1` FOREIGN KEY (`id`) REFERENCES `text` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

