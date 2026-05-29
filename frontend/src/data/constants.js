export const PX_PER_MM = 4;

export const TYPE_LABEL = {
  LOCATION: "库位模板",
  CONTAINER: "容器模板",
  SKU: "SKU 标签",
  CARTON: "箱唛模板",
};

export const STATUS_LABEL = {
  draft: "草稿",
  published: "已发布",
  disabled: "已停用",
};

export const STATUS_CLASS = {
  published: "is-success",
  draft: "is-warning",
  disabled: "is-danger",
};

export const WAREHOUSES = [
  { code: "JP-TYO-01", name: "东京仓" },
  { code: "US-LAX-01", name: "洛杉矶仓" },
  { code: "DE-FRA-01", name: "法兰克福仓" },
];

export const FIELD_DICT = {
  LOCATION: [
    { code: "locationCode", name: "库位编码", type: "string", example: "DD1801-004A", required: true, desc: "库位唯一标识编码，由系统按规则自动生成或手动指定，全局唯一" },
    { code: "locationPrefix", name: "库位前缀", type: "string", example: "TZ", required: false, desc: "库位编码前缀，标识库区或货架分类，通常 2-4 位大写字母" },
    { code: "row", name: "排", type: "integer", example: "12", required: false, desc: "货架排号，整数，从 1 开始递增" },
    { code: "column", name: "列", type: "integer", example: "89", required: false, desc: "货架列号，整数，表示该排在仓库中的列位置" },
    { code: "level", name: "层", type: "string", example: "B1", required: false, desc: "货架层级标识，由字母+数字组成，如 A1、B2、C3" },
    { code: "directionMark", name: "方向标", type: "string", example: "↑", required: false, desc: "方向指示符，↑ ↓ ← → 表示货架朝向或存取方向" },
    { code: "warehouseCode", name: "仓库编码", type: "string", example: "JP01", required: false, desc: "所属仓库编码，格式：国家代码+序号，如 JP01、US02" },
    { code: "areaCode", name: "区域编码", type: "string", example: "A01", required: false, desc: "库区编码，字母+数字格式，如 A01 表示 A 区 01 分区" },
    { code: "fullLocationName", name: "完整库位", type: "string", example: "TZ-DD1801-004A", required: false, desc: "完整库位名称，由前缀+排+列+层拼接而成的可读标识" },
  ],
  CONTAINER: [
    { code: "containerCode", name: "容器编码", type: "string", example: "C2P0001", required: true, desc: "容器唯一编码，前缀 C2P 表示二级包装容器，后跟流水号" },
    { code: "containerType", name: "容器类型", type: "enum", example: "INBOUND", required: false, desc: "容器业务类型：INBOUND 入库 / TRANSFER 移库 / PICKING 拣货 / OUTBOUND 出库" },
    { code: "appointmentTime", name: "预约时间", type: "datetime", example: "2026-05-21 10:00", required: false, desc: "容器预约到达或处理时间，格式 yyyy-MM-dd HH:mm" },
    { code: "dispatchWarehouse", name: "发货仓", type: "string", example: "JP01", required: false, desc: "发货方仓库编码，容器来源仓库" },
    { code: "receiptWarehouse", name: "收货仓", type: "string", example: "US01", required: false, desc: "收货方仓库编码，容器目标仓库" },
    { code: "qty", name: "数量", type: "integer", example: "12", required: false, desc: "容器内商品总件数，整数，≥ 0" },
    { code: "containerNo", name: "容器序号", type: "string", example: "001", required: false, desc: "容器在同批次中的序号，3 位零填充数字" },
    { code: "createdTime", name: "创建时间", type: "date", example: "2026-05-21", required: false, desc: "容器创建日期，格式 yyyy-MM-dd" },
  ],
};

export const SUPPORTED_TYPES = ["text", "qrcode", "barcode", "image", "line", "rect"];

export const COMPONENTS = [
  { type: "text", label: "静态文本", icon: "T", preset: { textKind: "static", text: "STATIC TEXT", width: 28, height: 8, fontSize: 12 } },
  { type: "text", label: "动态字段", icon: "{}", preset: { textKind: "field", bindField: "locationCode", width: 38, height: 9, fontSize: 14, bold: true } },
  { type: "qrcode", label: "二维码", icon: "QR", preset: { bindField: "locationCode", width: 18, height: 18 } },
  { type: "barcode", label: "一维码", icon: "|||", preset: { bindField: "locationCode", width: 42, height: 13 } },
  { type: "image", label: "图片占位", icon: "IMG", preset: { width: 22, height: 14, imageUrl: "" } },
  { type: "line", label: "横线", icon: "—", preset: { width: 50, height: 1 } },
  { type: "rect", label: "矩形", icon: "□", preset: { width: 30, height: 14, backgroundColor: "rgba(0,128,255,0.08)" } },
];
