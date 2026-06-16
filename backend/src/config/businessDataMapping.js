export const businessDataMappings = {
  LOCATION: {
    code: "LOCATION",
    label: "库位管理",
    table: "location",
    typeColumn: null,
    typeValue: null,
    bizCodeColumn: "location_code",
    updatedAtColumn: "updated_at",
    fieldsJsonColumn: null,
    warehouse: { source: "column", column: "region_warehouse_code" },
    keyword: [
      { source: "column", column: "location_code" },
      { source: "column", column: "location_prefix" },
    ],
    fields: [
      { code: "locationCode", name: "库位编码", source: "column", column: "location_code", required: true },
      { code: "locationPrefix", name: "库位前缀", source: "column", column: "location_prefix" },
      { code: "row", name: "排", source: "column", column: "location_row" },
      { code: "column", name: "列", source: "column", column: "location_column" },
      { code: "level", name: "层", source: "column", column: "location_floor" },
      { code: "directionMark", name: "方向标", source: "column", column: "direction_flag", transform: "locationDirectionMark" },
      { code: "warehouseCode", name: "区域仓编码", source: "column", column: "region_warehouse_code" },
      { code: "areaCode", name: "物理仓编码", source: "column", column: "physics_warehouse_code" },
    ],
  },
  CONTAINER: {
    code: "CONTAINER",
    label: "容器管理",
    table: "container",
    typeColumn: null,
    typeValue: null,
    bizCodeColumn: "container_code",
    updatedAtColumn: "updated_at",
    fieldsJsonColumn: null,
    warehouse: { source: "column", column: "region_warehouse_code" },
    keyword: [
      { source: "column", column: "container_code" },
    ],
    fields: [
      { code: "containerCode", name: "容器编码", source: "column", column: "container_code", required: true },
      { code: "warehouseCode", name: "区域仓编码", source: "column", column: "region_warehouse_code" },
      { code: "areaCode", name: "物理仓编码", source: "column", column: "physics_warehouse_code" },
    ],
  },
  PRODUCT: {
    code: "PRODUCT",
    label: "商品管理",
    table: "product",
    typeColumn: null,
    typeValue: null,
    bizCodeColumn: "sku",
    updatedAtColumn: "updated_at",
    fieldsJsonColumn: null,
    warehouse: null,
    keyword: [
      { source: "column", column: "sku" },
      { source: "column", column: "barcode" },
      { source: "column", column: "customer_code" },
    ],
    fields: [
      { code: "productCode", name: "商品编码", source: "column", column: "sku", required: true },
      { code: "ProductBarcode", name: "商品条码", source: "column", column: "barcode" },
      { code: "customerProductCode", name: "客户商品编码", source: "column", column: "customer_code" },
    ],
  },
};

export function listBusinessTypeConfigs() {
  return Object.values(businessDataMappings);
}

export function getBusinessDataMapping(bizType) {
  return businessDataMappings[String(bizType || "").toUpperCase()] || null;
}
