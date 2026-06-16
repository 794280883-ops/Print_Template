CREATE TABLE IF NOT EXISTS print_business_module (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_code VARCHAR(32) NOT NULL COMMENT '业务模块编码，也是模板类型编码',
  module_name VARCHAR(128) NOT NULL COMMENT '业务模块名称',
  template_label VARCHAR(128) NOT NULL COMMENT '模板类型展示名',
  data_label VARCHAR(128) NOT NULL COMMENT '业务数据展示名',
  code_field VARCHAR(128) NOT NULL COMMENT '业务主键字段编码',
  storage_mode VARCHAR(32) NOT NULL DEFAULT 'mapped_table' COMMENT 'mapped_table/json_table',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_no INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_code (module_code),
  INDEX idx_enabled_sort (enabled, sort_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO print_business_module
  (module_code, module_name, template_label, data_label, code_field, storage_mode, enabled, sort_no)
VALUES
  ('LOCATION', '库位', '库位模板', '库位数据', 'locationCode', 'mapped_table', 1, 10),
  ('CONTAINER', '容器', '容器模板', '容器数据', 'containerCode', 'mapped_table', 1, 20),
  ('PRODUCT', '商品', '商品模板', '商品数据', 'productCode', 'mapped_table', 1, 30)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  template_label = VALUES(template_label),
  data_label = VALUES(data_label),
  code_field = VALUES(code_field),
  storage_mode = VALUES(storage_mode),
  enabled = VALUES(enabled),
  sort_no = VALUES(sort_no);
