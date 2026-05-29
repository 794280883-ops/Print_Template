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
  ('LOCATION','warehouseCode','仓库编码','string','JP01',0,'所属仓库编码，格式：国家代码+序号，如 JP01、US02',70),
  ('LOCATION','areaCode','区域编码','string','A01',0,'库区编码，字母+数字格式，如 A01 表示 A 区 01 分区',80),
  ('LOCATION','fullLocationName','完整库位','string','TZ-DD1801-004A',0,'完整库位名称，由前缀+排+列+层拼接而成的可读标识',90),
  ('CONTAINER','containerCode','容器编码','string','C2P0001',1,'容器唯一编码，前缀 C2P 表示二级包装容器，后跟流水号',10),
  ('CONTAINER','containerType','容器类型','enum','INBOUND',0,'容器业务类型：INBOUND 入库 / TRANSFER 移库 / PICKING 拣货 / OUTBOUND 出库',20),
  ('CONTAINER','appointmentTime','预约时间','datetime','2026-05-21 10:00',0,'容器预约到达或处理时间，格式 yyyy-MM-dd HH:mm',30),
  ('CONTAINER','dispatchWarehouse','发货仓','string','JP01',0,'发货方仓库编码，容器来源仓库',40),
  ('CONTAINER','receiptWarehouse','收货仓','string','US01',0,'收货方仓库编码，容器目标仓库',50),
  ('CONTAINER','qty','数量','integer','12',0,'容器内商品总件数，整数，≥ 0',60),
  ('CONTAINER','containerNo','容器序号','string','001',0,'容器在同批次中的序号，3 位零填充数字',70),
  ('CONTAINER','createdTime','创建时间','date','2026-05-21',0,'容器创建日期，格式 yyyy-MM-dd',80);

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
  (2,'container_type','text',8,30,32,7,4,0,'field',NULL,'containerType',10,0,'left','#111827','transparent',NULL,JSON_OBJECT()),
  (2,'container_time','text',8,39,55,6,5,0,'field',NULL,'appointmentTime',8,0,'left','#334155','transparent',NULL,JSON_OBJECT()),
  (3,'picking_title','text',7,8,86,10,1,0,'static','PICKING CONTAINER',NULL,18,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (3,'picking_code','text',12,28,76,14,2,0,'field',NULL,'containerCode',28,1,'center','#111827','transparent',NULL,JSON_OBJECT()),
  (3,'picking_barcode','barcode',12,48,76,22,3,0,NULL,NULL,'containerCode',NULL,0,NULL,NULL,NULL,NULL,JSON_OBJECT()),
  (3,'picking_qty','text',12,78,38,10,4,0,'field',NULL,'qty',16,1,'left','#111827','transparent',NULL,JSON_OBJECT());

INSERT IGNORE INTO operation_log (module_name, action_name, target_type, target_id, target_name, before_json, after_json, operator)
VALUES ('print_template','系统初始化','print_template',NULL,'预置模板',NULL,JSON_OBJECT('templateCount', 3),'Admin');
