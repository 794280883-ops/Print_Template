CREATE TABLE IF NOT EXISTS print_template (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_code VARCHAR(64) NOT NULL UNIQUE COMMENT '模板编码',
  template_name VARCHAR(128) NOT NULL COMMENT '模板名称',
  template_type VARCHAR(32) NOT NULL COMMENT '模板类型：LOCATION/CONTAINER',
  width_mm DECIMAL(10,2) NOT NULL,
  height_mm DECIMAL(10,2) NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'mm',
  dpi INT NOT NULL DEFAULT 203,
  version VARCHAR(32) NOT NULL DEFAULT 'V0',
  status VARCHAR(32) NOT NULL DEFAULT 'draft' COMMENT 'draft/published/disabled',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  remark VARCHAR(512),
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_type_status (template_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS print_template_element (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL,
  element_uid VARCHAR(64) NOT NULL COMMENT '前端 DSL 元素 ID',
  element_type VARCHAR(32) NOT NULL COMMENT 'text/qrcode/barcode/image/line/rect',
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
  image_url VARCHAR(512),
  extra_json JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_template_element_uid (template_id, element_uid),
  CONSTRAINT fk_template_element_template FOREIGN KEY (template_id) REFERENCES print_template(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS print_template_warehouse (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL,
  warehouse_code VARCHAR(64) NOT NULL,
  warehouse_name VARCHAR(128),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_template_warehouse (template_id, warehouse_code),
  CONSTRAINT fk_template_warehouse_template FOREIGN KEY (template_id) REFERENCES print_template(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS print_field_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_type VARCHAR(32) NOT NULL,
  field_code VARCHAR(128) NOT NULL,
  field_name VARCHAR(128) NOT NULL,
  field_type VARCHAR(32) NOT NULL DEFAULT 'string',
  example_value VARCHAR(512),
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(512),
  sort_no INT DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_type_field (template_type, field_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS print_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT,
  template_code VARCHAR(64),
  business_type VARCHAR(32),
  business_no VARCHAR(128),
  warehouse_code VARCHAR(64),
  print_payload JSON,
  print_status VARCHAR(32) NOT NULL COMMENT 'success/failed',
  error_message VARCHAR(1024),
  operator VARCHAR(64),
  printed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_code (template_code),
  INDEX idx_business_no (business_no),
  INDEX idx_printed_at (printed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  operated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_module_action (module_name, action_name),
  INDEX idx_operated_at (operated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO print_field_dict
  (template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no)
VALUES
  ('LOCATION','locationCode','库位编码','string','DD1801-004A',1,'库位唯一标识编码，由系统按规则自动生成或手动指定，全局唯一',10),
  ('LOCATION','locationPrefix','库位前缀','string','TZ',0,'库位编码前缀，标识库区或货架分类，通常 2-4 位大写字母',20),
  ('LOCATION','row','排','integer','12',0,'货架排号，整数，从 1 开始递增',30),
  ('LOCATION','column','列','integer','89',0,'货架列号，整数，表示该排在仓库中的列位置',40),
  ('LOCATION','level','层','string','B1',0,'货架层级标识，由字母+数字组成，如 A1、B2、C3',50),
  ('LOCATION','directionMark','方向标','string','↑',0,'方向指示符，↑ ↓ ← → 表示货架朝向或存取方向',60),
  ('LOCATION','warehouseCode','区域仓编码','string','JP-TYO-01',1,'区域仓编码',70),
  ('LOCATION','areaCode','物理仓编码','string','JP01',0,'物理仓编码',80),
  ('CONTAINER','containerCode','容器编码','string','C2P0001',1,'容器唯一编码，前缀 C2P 表示二级包装容器，后跟流水号',10),
  ('CONTAINER','warehouseCode','区域仓编码','string','JP-TYO-01',1,'区域仓编码',20),
  ('CONTAINER','areaCode','物理仓编码','string','JP01',0,'物理仓编码',30),
  ('CONTAINER','purpose','用途','string','入库周转',0,'容器标签用途',40),
  ('CONTAINER','usageScene','使用场景','string','入库收货',0,'容器标签适用的业务使用场景',50),
  ('PRODUCT','productCode','商品编码','string','SKU-10001',1,'商品编码',10),
  ('PRODUCT','customerProductCode','客户商品编码','string','CUST-SKU-10001',0,'客户商品编码',20);

INSERT IGNORE INTO print_template
  (id, template_code, template_name, template_type, width_mm, height_mm, unit, dpi, version, status, is_default, remark, created_by, updated_by)
VALUES
  (1,'TPL_LOCATION_10050','库位标签-100x50','LOCATION',100,50,'mm',203,'V1','published',1,'标准库位大标签','Admin','Admin'),
  (2,'TPL_CONTAINER_IN_10050','容器入库标签-100x50','CONTAINER',100,50,'mm',203,'V1','published',1,'入库容器标签','Admin','Admin'),
  (3,'TPL_PICKING_100150','拣货容器标签-100x150','CONTAINER',100,150,'mm',203,'V0','draft',0,'长版拣货容器标签','Admin','Admin');

INSERT IGNORE INTO print_template_warehouse (template_id, warehouse_code, warehouse_name)
VALUES
  (1,'JP-TYO-01','东京仓'),
  (1,'US-LAX-01','洛杉矶仓'),
  (2,'JP-TYO-01','东京仓'),
  (3,'US-LAX-01','洛杉矶仓');

INSERT IGNORE INTO print_template_element
  (template_id, element_uid, element_type, x, y, width, height, z_index, rotate, text_kind, text_content, bind_field, font_size, bold, align_type, color, background_color, image_url, extra_json)
VALUES
  (1,'text_location_code','text',14,5,72,11,1,0,'field',NULL,'locationCode',28,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (1,'qr_location_code','qrcode',8,23,20,20,2,0,NULL,NULL,'locationCode',NULL,0,NULL,NULL,NULL,NULL,JSON_OBJECT()),
  (1,'text_prefix','text',8,6,14,7,3,0,'field',NULL,'locationPrefix',12,1,'left','#111827','transparent',NULL,JSON_OBJECT()),
  (1,'text_direction','text',64,24,26,14,4,0,'field',NULL,'directionMark',24,1,'center','#ffffff','#111827',NULL,JSON_OBJECT()),
  (2,'title_inbound','text',6,4,88,8,1,0,'static','CONTAINER INBOUND',NULL,16,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (2,'container_code','text',8,14,58,10,2,0,'field',NULL,'containerCode',22,1,'left','#111827','transparent',NULL,JSON_OBJECT()),
  (2,'container_qr','qrcode',72,14,20,20,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,NULL,JSON_OBJECT()),
  (2,'container_warehouse','text',8,30,32,7,4,0,'field',NULL,'warehouseCode',10,0,'left','#111827','transparent',NULL,JSON_OBJECT()),
  (2,'container_area','text',8,39,55,6,5,0,'field',NULL,'areaCode',8,0,'left','#334155','transparent',NULL,JSON_OBJECT()),
  (3,'picking_title','text',7,8,86,10,1,0,'static','PICKING CONTAINER',NULL,18,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (3,'picking_code','text',12,28,76,14,2,0,'field',NULL,'containerCode',28,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (3,'picking_barcode','barcode',12,48,76,22,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,NULL,JSON_OBJECT()),
  (3,'picking_purpose','text',12,78,38,10,4,0,'field',NULL,'purpose',16,1,'left','#111827','transparent',NULL,JSON_OBJECT());

INSERT IGNORE INTO operation_log (module_name, action_name, target_type, target_id, target_name, before_json, after_json, operator)
VALUES ('print_template','系统初始化','print_template',NULL,'预置模板',NULL,JSON_OBJECT('templateCount', 3),'Admin');
