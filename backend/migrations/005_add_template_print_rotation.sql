SET @print_rotation_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'print_rotation'
);

SET @print_rotation_sql := IF(
  @print_rotation_exists = 0,
  'ALTER TABLE print_template ADD COLUMN print_rotation INT NOT NULL DEFAULT 0 COMMENT ''打印整体旋转角度：0/90/180/270'' AFTER dpi',
  'SELECT 1'
);

PREPARE print_rotation_stmt FROM @print_rotation_sql;
EXECUTE print_rotation_stmt;
DEALLOCATE PREPARE print_rotation_stmt;
