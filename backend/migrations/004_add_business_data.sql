CREATE TABLE IF NOT EXISTS business_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  business_type VARCHAR(32) NOT NULL COMMENT 'LOCATION/CONTAINER/PRODUCT',
  business_code VARCHAR(128) NOT NULL COMMENT '业务主键编码',
  business_data JSON NOT NULL COMMENT '业务字段键值对',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_type_code (business_type, business_code),
  INDEX idx_business_type (business_type),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO business_data (business_type, business_code, business_data) VALUES
('LOCATION', 'DD1801-004A', JSON_OBJECT('locationCode','DD1801-004A','locationPrefix','TZ','row','12','column','89','level','B1','directionMark','↑','warehouseCode','JP01','areaCode','A01')),
('LOCATION', 'DD1801-004B', JSON_OBJECT('locationCode','DD1801-004B','locationPrefix','TZ','row','12','column','90','level','B1','directionMark','→','warehouseCode','JP01','areaCode','A01')),
('LOCATION', 'LA-A03-010', JSON_OBJECT('locationCode','LA-A03-010','locationPrefix','LA','row','03','column','010','level','C2','directionMark','←','warehouseCode','US01','areaCode','A03')),
('CONTAINER', 'C2P0001', JSON_OBJECT('containerCode','C2P0001','warehouseCode','JP-TYO-01','areaCode','JP01','purpose','入库周转','usageScene','入库收货')),
('CONTAINER', 'C2P0002', JSON_OBJECT('containerCode','C2P0002','warehouseCode','JP-TYO-01','areaCode','JP01','purpose','调拨周转','usageScene','跨仓调拨')),
('CONTAINER', 'PICK0099', JSON_OBJECT('containerCode','PICK0099','warehouseCode','US-LAX-01','areaCode','US01','purpose','拣货周转','usageScene','出库拣货')),
('PRODUCT', 'SKU-10001', JSON_OBJECT('productCode','SKU-10001','customerProductCode','CUST-SKU-10001')),
('PRODUCT', 'SKU-10002', JSON_OBJECT('productCode','SKU-10002','customerProductCode','CUST-SKU-10002')),
('PRODUCT', 'SKU-10003', JSON_OBJECT('productCode','SKU-10003','customerProductCode','CUST-SKU-10003'));
