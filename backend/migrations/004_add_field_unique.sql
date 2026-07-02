-- 004: print_field_dict 增加 is_unique 列，支持字段级唯一性校验
ALTER TABLE print_field_dict ADD COLUMN is_unique TINYINT(1) NOT NULL DEFAULT 0;
