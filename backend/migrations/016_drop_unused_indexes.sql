-- Drop indexes that are never used by application queries.
-- print_log: app only INSERTs and reads by primary key (WHERE id = ?)
-- operation_log: app only INSERTs, never SELECTs
-- business_data: uk_type_code prefix already covers business_type lookups

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'print_log' AND INDEX_NAME = 'idx_business_no');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE print_log DROP INDEX idx_business_no', 'SELECT ''idx_business_no not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'print_log' AND INDEX_NAME = 'idx_template_code');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE print_log DROP INDEX idx_template_code', 'SELECT ''idx_template_code not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'print_log' AND INDEX_NAME = 'idx_printed_at');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE print_log DROP INDEX idx_printed_at', 'SELECT ''idx_printed_at not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operation_log' AND INDEX_NAME = 'idx_module_action');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE operation_log DROP INDEX idx_module_action', 'SELECT ''idx_module_action not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operation_log' AND INDEX_NAME = 'idx_operated_at');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE operation_log DROP INDEX idx_operated_at', 'SELECT ''idx_operated_at not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_data' AND INDEX_NAME = 'idx_business_type');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE business_data DROP INDEX idx_business_type', 'SELECT ''idx_business_type not found'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
