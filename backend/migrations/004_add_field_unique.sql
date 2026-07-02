-- 004: print_field_dict 增加 is_unique 列，支持字段级唯一性校验
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'print_field_dict'
      AND column_name = 'is_unique'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE print_field_dict ADD COLUMN is_unique TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT "is_unique column already exists, skip" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
