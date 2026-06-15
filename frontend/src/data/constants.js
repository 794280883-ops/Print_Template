export const PX_PER_MM = 4;

export const TYPE_LABEL = {
  LOCATION: "库位模板",
  CONTAINER: "容器模板",
  PRODUCT: "商品模板",
  SKU: "SKU 标签",
  CARTON: "箱唛模板",
};

export const STATUS_LABEL = {
  enabled: "启用",
  disabled: "停用",
};

export const FIELD_DICT = {
  LOCATION: [
    { code: "locationCode", name: "库位编码", type: "string", example: "DD1801-004A", required: true, desc: "库位唯一标识编码，由系统按规则自动生成或手动指定，全局唯一" },
    { code: "locationPrefix", name: "库位前缀", type: "string", example: "TZ", required: false, desc: "库位编码前缀，标识库区或货架分类，通常 2-4 位大写字母" },
    { code: "row", name: "排", type: "integer", example: "12", required: false, desc: "货架排号，整数，从 1 开始递增" },
    { code: "column", name: "列", type: "integer", example: "89", required: false, desc: "货架列号，整数，表示该排在仓库中的列位置" },
    { code: "level", name: "层", type: "string", example: "B1", required: false, desc: "货架层级标识，由字母+数字组成，如 A1、B2、C3" },
    { code: "directionMark", name: "方向标", type: "string", example: "↑", required: false, desc: "方向指示符，↑ ↓ ← → 表示货架朝向或存取方向" },
    { code: "warehouseCode", name: "区域仓编码", type: "string", example: "JP-TYO-01", required: false, desc: "区域仓编码" },
    { code: "areaCode", name: "物理仓编码", type: "string", example: "JP01", required: false, desc: "物理仓编码" },
  ],
  CONTAINER: [
    { code: "containerCode", name: "容器编码", type: "string", example: "C2P0001", required: true, desc: "容器唯一编码，前缀 C2P 表示二级包装容器，后跟流水号" },
    { code: "warehouseCode", name: "区域仓编码", type: "string", example: "JP-TYO-01", required: false, desc: "区域仓编码" },
    { code: "areaCode", name: "物理仓编码", type: "string", example: "JP01", required: false, desc: "物理仓编码" },
  ],
  PRODUCT: [
    { code: "productCode", name: "商品编码", type: "string", example: "SKU-10001", required: true, desc: "商品编码" },
    { code: "customerProductCode", name: "商品条码", type: "string", example: "CUST-SKU-10001", required: false, desc: "商品条码" },
  ],
};

export const SUPPORTED_TYPES = ["text", "qrcode", "barcode", "image", "line", "rect", "checkbox"];

export const COMPONENTS = [
  { type: "text", label: "静态文本", icon: "T", preset: { textKind: "static", text: "STATIC TEXT", width: 28, height: 8, fontSize: 12 } },
  { type: "text", label: "动态字段", icon: "{}", preset: { textKind: "field", bindField: "locationCode", width: 38, height: 9, fontSize: 14, bold: true } },
  { type: "qrcode", label: "二维码", icon: "QR", preset: { bindField: "locationCode", width: 18, height: 18, errorLevel: "M" } },
  { type: "barcode", label: "一维码", icon: "|||", preset: { bindField: "locationCode", width: 42, height: 13, errorLevel: "M" } },
  { type: "line", label: "横线", icon: "—", preset: { width: 50, height: 1, direction: "horizontal" } },
  { type: "rect", label: "矩形", icon: "□", preset: { width: 30, height: 14, color: "#000000", backgroundColor: "#000000" } },
  { type: "checkbox", label: "复选框", icon: "☑", preset: { width: 24, height: 7, checked: false, text: "" } },
];
