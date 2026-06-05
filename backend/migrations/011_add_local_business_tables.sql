CREATE TABLE IF NOT EXISTS product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(128) NOT NULL COMMENT '商品编码',
  customer_code VARCHAR(128) COMMENT '客户商品编码',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_sku (sku),
  INDEX idx_product_customer_code (customer_code),
  INDEX idx_product_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS container (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  container_code VARCHAR(128) NOT NULL COMMENT '容器编码',
  region_warehouse_code VARCHAR(64) COMMENT '区域仓编码',
  physics_warehouse_code VARCHAR(64) COMMENT '物理仓编码',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_container_code (container_code),
  INDEX idx_container_region_warehouse (region_warehouse_code),
  INDEX idx_container_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS location (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  location_code VARCHAR(128) NOT NULL COMMENT '库位编码',
  location_prefix VARCHAR(64) COMMENT '库位前缀',
  location_row VARCHAR(64) COMMENT '排',
  location_column VARCHAR(64) COMMENT '列',
  location_floor VARCHAR(64) COMMENT '层',
  direction_flag VARCHAR(16) COMMENT '方向标：1=向上，2=向下',
  region_warehouse_code VARCHAR(64) COMMENT '区域仓编码',
  physics_warehouse_code VARCHAR(64) COMMENT '物理仓编码',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location_code (location_code),
  INDEX idx_location_region_warehouse (region_warehouse_code),
  INDEX idx_location_prefix (location_prefix),
  INDEX idx_location_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO product (sku, customer_code) VALUES
  ('SKU-10001', 'CUST-SKU-10001'),
  ('SKU-10002', 'CUST-SKU-10002'),
  ('SKU-10003', 'CUST-SKU-10003')
ON DUPLICATE KEY UPDATE
  customer_code = VALUES(customer_code);

INSERT INTO container (container_code, region_warehouse_code, physics_warehouse_code) VALUES
  ('C2P0001', 'JP-TYO-01', 'JP01'),
  ('C2P0002', 'JP-TYO-01', 'JP01'),
  ('PICK0099', 'US-LAX-01', 'US01')
ON DUPLICATE KEY UPDATE
  region_warehouse_code = VALUES(region_warehouse_code),
  physics_warehouse_code = VALUES(physics_warehouse_code);

INSERT INTO location
  (location_code, location_prefix, location_row, location_column, location_floor, direction_flag, region_warehouse_code, physics_warehouse_code)
VALUES
  ('DD1801-004A', 'TZ', '12', '89', 'B1', '1', 'JP01', 'A01'),
  ('DD1801-004B', 'TZ', '12', '90', 'B1', '2', 'JP01', 'A01'),
  ('LA-A03-010', 'LA', '03', '010', 'C2', NULL, 'US01', 'A03')
ON DUPLICATE KEY UPDATE
  location_prefix = VALUES(location_prefix),
  location_row = VALUES(location_row),
  location_column = VALUES(location_column),
  location_floor = VALUES(location_floor),
  direction_flag = VALUES(direction_flag),
  region_warehouse_code = VALUES(region_warehouse_code),
  physics_warehouse_code = VALUES(physics_warehouse_code);
