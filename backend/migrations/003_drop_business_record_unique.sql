-- 003: 去掉 business_record 的编码唯一索引
-- 业务背景：导入业务数据时不再强制编码唯一，允许重复编码导入
-- 使用条件删除，避免索引已不存在时重复执行报错（migration 脚本无版本记录，每次启动都执行）
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'business_record'
      AND index_name = 'uk_module_record'
);
SET @sql := IF(@idx_exists > 0,
    'ALTER TABLE business_record DROP INDEX uk_module_record',
    'SELECT "uk_module_record already dropped, skip" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
