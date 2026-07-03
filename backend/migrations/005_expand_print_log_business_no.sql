-- 005: 扩大 print_log.business_no 列容量，支持大批量打印日志
SET @col_type := (
    SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'print_log'
      AND column_name = 'business_no'
);
SET @sql := IF(@col_type = 'varchar(128)',
    'ALTER TABLE print_log MODIFY COLUMN business_no TEXT NULL',
    'SELECT "business_no already expanded, skip" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
