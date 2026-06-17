-- ============================================================
-- 001_init.sql — unified backend platform complete schema + seeds
-- ============================================================


-- 1. template
CREATE TABLE IF NOT EXISTS print_template (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_code VARCHAR(64) NOT NULL UNIQUE,
  template_name VARCHAR(128) NOT NULL,
  template_type VARCHAR(32) NOT NULL,
  width_mm DECIMAL(10,2) NOT NULL,
  height_mm DECIMAL(10,2) NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'mm',
  dpi INT NOT NULL DEFAULT 203,
  print_rotation INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'disabled',
  remark VARCHAR(512),
  field_preview_values JSON,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_type_status (template_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. template element
CREATE TABLE IF NOT EXISTS print_template_element (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL,
  element_uid VARCHAR(64) NOT NULL,
  element_type VARCHAR(32) NOT NULL,
  x DECIMAL(10,2) NOT NULL,
  y DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  z_index INT DEFAULT 1,
  rotate INT DEFAULT 0,
  text_kind VARCHAR(32),
  text_content VARCHAR(512),
  bind_field VARCHAR(128),
  font_size INT,
  bold TINYINT(1) DEFAULT 0,
  align_type VARCHAR(32),
  color VARCHAR(64),
  background_color VARCHAR(64),
  extra_json JSON,
  UNIQUE KEY uk_template_element_uid (template_id, element_uid),
  CONSTRAINT fk_template_element_template FOREIGN KEY (template_id) REFERENCES print_template(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. field dictionary
CREATE TABLE IF NOT EXISTS print_field_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_code VARCHAR(32) NOT NULL,
  field_code VARCHAR(128) NOT NULL,
  field_name VARCHAR(128) NOT NULL,
  field_type VARCHAR(32) NOT NULL DEFAULT 'string',
  example_value VARCHAR(512),
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(512),
  sort_no INT DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  searchable TINYINT DEFAULT 0,
  sortable TINYINT DEFAULT 0,
  bindable_in_template TINYINT DEFAULT 1,
  UNIQUE KEY uk_type_field (module_code, field_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. print log
CREATE TABLE IF NOT EXISTS print_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT,
  template_code VARCHAR(64),
  business_type VARCHAR(32),
  business_no VARCHAR(128),
  warehouse_code VARCHAR(64),
  print_payload JSON,
  print_status VARCHAR(32) NOT NULL,
  error_message VARCHAR(1024),
  operator VARCHAR(64),
  printed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. operation log
CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_name VARCHAR(64) NOT NULL,
  action_name VARCHAR(64) NOT NULL,
  target_type VARCHAR(64),
  target_id VARCHAR(64),
  target_name VARCHAR(128),
  before_json JSON,
  after_json JSON,
  operator VARCHAR(64),
  operated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. business module
CREATE TABLE IF NOT EXISTS print_business_module (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_code VARCHAR(32) NOT NULL,
  module_name VARCHAR(128) NOT NULL,
  template_label VARCHAR(128) NOT NULL,
  data_label VARCHAR(128) NOT NULL,
  record_code_field VARCHAR(64) NOT NULL,
  storage_mode VARCHAR(32) NOT NULL DEFAULT 'json_table',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_no INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_code (module_code),
  INDEX idx_enabled_sort (enabled, sort_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. business record (UNIFIED table)
CREATE TABLE IF NOT EXISTS business_record (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_code VARCHAR(32) NOT NULL,
  record_code VARCHAR(128) NOT NULL,
  record_data JSON NOT NULL,
  search_text TEXT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_record (module_code, record_code),
  INDEX idx_module_code (module_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== seeds ==========

INSERT INTO print_business_module
  (module_code, module_name, template_label, data_label, record_code_field, storage_mode, enabled, sort_no)
VALUES
  ('LOCATION', '库位', '库位模板', '库位数据', 'locationCode', 'json_table', 1, 10),
  ('CONTAINER', '容器', '容器模板', '容器数据', 'containerCode', 'json_table', 1, 20),
  ('PRODUCT', '商品', '商品模板', '商品数据', 'productCode', 'json_table', 1, 30)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  template_label = VALUES(template_label),
  data_label = VALUES(data_label),
  record_code_field = VALUES(record_code_field),
  storage_mode = VALUES(storage_mode),
  enabled = VALUES(enabled),
  sort_no = VALUES(sort_no);

INSERT INTO print_field_dict
  (module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, searchable, sortable)
VALUES
  ('LOCATION','locationCode','库位编码','string','DD1801-004A',1,'库位唯一标识编码',10,1,1),
  ('LOCATION','locationPrefix','库位前缀','string','TZ',0,'库位编码前缀',20,1,1),
  ('LOCATION','row','排','string','12',0,'货架排号',30,0,0),
  ('LOCATION','column','列','string','89',0,'货架列号',40,0,0),
  ('LOCATION','level','层','string','B1',0,'货架层级标识',50,0,0),
  ('LOCATION','directionMark','方向标','string','↑',0,'方向指示符',60,0,0),
  ('LOCATION','warehouseCode','区域仓编码','string','JP-TYO-01',1,'区域仓编码',70,1,1),
  ('LOCATION','areaCode','物理仓编码','string','JP01',0,'物理仓编码',80,1,1),
  ('CONTAINER','containerCode','容器编码','string','C2P0001',1,'容器编码',10,1,1),
  ('CONTAINER','warehouseCode','区域仓编码','string','JP-TYO-01',0,'区域仓编码',20,1,1),
  ('CONTAINER','areaCode','物理仓编码','string','JP01',0,'物理仓编码',30,1,1),
  ('PRODUCT','productCode','商品编码','string','SKU-10001',1,'商品编码',10,1,1),
  ('PRODUCT','ProductBarcode','商品条码','string','TM001',0,'商品条码',15,1,1),
  ('PRODUCT','customerProductCode','客户商品编码','string','CUST-SKU-10001',0,'客户商品编码',20,1,1)
ON DUPLICATE KEY UPDATE
  field_name = VALUES(field_name), field_type = VALUES(field_type),
  example_value = VALUES(example_value), is_required = VALUES(is_required),
  description = VALUES(description), sort_no = VALUES(sort_no),
  searchable = VALUES(searchable), sortable = VALUES(sortable);

INSERT IGNORE INTO print_template
  (id, template_code, template_name, template_type, width_mm, height_mm, unit, dpi, status, remark)
VALUES
  (1,'TPL_LOCATION_10050','库位标签-100x50','LOCATION',100,50,'mm',203,'enabled','标准库位大标签'),
  (2,'TPL_CONTAINER_IN_10050','容器入库标签-100x50','CONTAINER',100,50,'mm',203,'enabled','入库容器标签'),
  (3,'TPL_PICKING_100150','拣货容器标签-100x150','CONTAINER',100,150,'mm',203,'disabled','长版拣货容器标签');

INSERT IGNORE INTO print_template_element
  (template_id, element_uid, element_type, x, y, width, height, z_index, rotate, text_kind, text_content, bind_field, font_size, bold, align_type, color, background_color, extra_json)
VALUES
  (1,'text_location_code','text',14,5,72,11,1,0,'field',NULL,'locationCode',28,1,'center','#111827','transparent',JSON_OBJECT()),
  (1,'qr_location_code','qrcode',8,23,20,20,2,0,NULL,NULL,'locationCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT()),
  (1,'text_prefix','text',8,6,14,7,3,0,'field',NULL,'locationPrefix',12,1,'left','#111827','transparent',JSON_OBJECT()),
  (1,'text_direction','text',64,24,26,14,4,0,'field',NULL,'directionMark',24,1,'center','#ffffff','#111827',JSON_OBJECT()),
  (2,'title_inbound','text',6,4,88,8,1,0,'static','CONTAINER INBOUND',NULL,16,1,'center','#111827','transparent',JSON_OBJECT()),
  (2,'container_code','text',8,14,58,10,2,0,'field',NULL,'containerCode',22,1,'left','#111827','transparent',JSON_OBJECT()),
  (2,'container_qr','qrcode',72,14,20,20,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT()),
  (2,'container_warehouse','text',8,30,32,7,4,0,'field',NULL,'warehouseCode',10,0,'left','#111827','transparent',JSON_OBJECT()),
  (2,'container_area','text',8,39,55,6,5,0,'field',NULL,'areaCode',8,0,'left','#334155','transparent',JSON_OBJECT()),
  (3,'picking_title','text',7,8,86,10,1,0,'static','PICKING CONTAINER',NULL,18,1,'center','#111827','transparent',JSON_OBJECT()),
  (3,'picking_code','text',12,28,76,14,2,0,'field',NULL,'containerCode',28,1,'center','#111827','transparent',JSON_OBJECT()),
  (3,'picking_barcode','barcode',12,48,76,22,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,JSON_OBJECT());
