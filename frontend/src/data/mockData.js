import { nowText } from "../services/timeService.js";

export function createSeedTemplates(uid) {
  return [
    {
      id: uid("tpl"),
      templateCode: "TPL_LOCATION_10050",
      templateName: "库位标签-100x50",
      templateType: "LOCATION",
      areaWarehouseCodes: ["JP-TYO-01", "US-LAX-01"],
      size: { width: 100, height: 50, unit: "mm", dpi: 203 },
      version: "V1",
      status: "published",
      isDefault: true,
      remark: "标准库位大标签",
      updatedAt: nowText(),
      elements: [
        { id: "text_location_code", type: "text", textKind: "field", x: 14, y: 5, width: 72, height: 11, bindField: "locationCode", fontSize: 28, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
        { id: "qr_location_code", type: "qrcode", x: 8, y: 23, width: 20, height: 20, bindField: "locationCode" },
        { id: "text_prefix", type: "text", textKind: "field", x: 8, y: 6, width: 14, height: 7, bindField: "locationPrefix", fontSize: 12, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" },
        { id: "text_direction", type: "text", textKind: "field", x: 64, y: 24, width: 26, height: 14, bindField: "directionMark", fontSize: 24, bold: true, align: "center", color: "#ffffff", backgroundColor: "#111827" },
      ],
      logs: [],
    },
    {
      id: uid("tpl"),
      templateCode: "TPL_CONTAINER_IN_10050",
      templateName: "容器入库标签-100x50",
      templateType: "CONTAINER",
      areaWarehouseCodes: ["JP-TYO-01"],
      size: { width: 100, height: 50, unit: "mm", dpi: 203 },
      version: "V1",
      status: "published",
      isDefault: true,
      remark: "入库容器标签",
      updatedAt: nowText(),
      elements: [
        { id: "title_inbound", type: "text", textKind: "static", text: "CONTAINER INBOUND", x: 6, y: 4, width: 88, height: 8, fontSize: 16, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
        { id: "container_code", type: "text", textKind: "field", x: 8, y: 14, width: 58, height: 10, bindField: "containerCode", fontSize: 22, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" },
        { id: "container_qr", type: "qrcode", x: 72, y: 14, width: 20, height: 20, bindField: "containerCode" },
        { id: "container_type", type: "text", textKind: "field", x: 8, y: 30, width: 32, height: 7, bindField: "containerType", fontSize: 10, bold: false, align: "left", color: "#111827", backgroundColor: "transparent" },
        { id: "container_time", type: "text", textKind: "field", x: 8, y: 39, width: 55, height: 6, bindField: "appointmentTime", fontSize: 8, bold: false, align: "left", color: "#334155", backgroundColor: "transparent" },
      ],
      logs: [],
    },
    {
      id: uid("tpl"),
      templateCode: "TPL_PICKING_100150",
      templateName: "拣货容器标签-100x150",
      templateType: "CONTAINER",
      areaWarehouseCodes: ["US-LAX-01"],
      size: { width: 100, height: 150, unit: "mm", dpi: 203 },
      version: "V0",
      status: "draft",
      isDefault: false,
      remark: "长版拣货容器标签",
      updatedAt: nowText(),
      elements: [
        { id: "picking_title", type: "text", textKind: "static", text: "PICKING CONTAINER", x: 7, y: 8, width: 86, height: 10, fontSize: 18, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
        { id: "picking_code", type: "text", textKind: "field", x: 12, y: 28, width: 76, height: 14, bindField: "containerCode", fontSize: 28, bold: true, align: "center", color: "#111827", backgroundColor: "transparent" },
        { id: "picking_barcode", type: "barcode", x: 12, y: 48, width: 76, height: 22, bindField: "containerCode" },
        { id: "picking_qty", type: "text", textKind: "field", x: 12, y: 78, width: 38, height: 10, bindField: "qty", fontSize: 16, bold: true, align: "left", color: "#111827", backgroundColor: "transparent" },
      ],
      logs: [],
    },
  ];
}

export function locationRows() {
  return [
    { locationCode: "DD1801-004A", locationPrefix: "TZ", row: "12", column: "89", level: "B1", directionMark: "↑", warehouseCode: "JP01", areaCode: "A01" },
    { locationCode: "DD1801-004B", locationPrefix: "TZ", row: "12", column: "90", level: "B1", directionMark: "→", warehouseCode: "JP01", areaCode: "A01" },
    { locationCode: "LA-A03-010", locationPrefix: "LA", row: "03", column: "010", level: "C2", directionMark: "←", warehouseCode: "US01", areaCode: "A03" },
  ];
}

export function containerRows() {
  return [
    { containerCode: "C2P0001", containerType: "INBOUND", appointmentTime: "2026-05-21 10:00", dispatchWarehouse: "JP01", receiptWarehouse: "US01", qty: "12", containerNo: "001" },
    { containerCode: "C2P0002", containerType: "TRANSFER", appointmentTime: "2026-05-21 13:30", dispatchWarehouse: "JP01", receiptWarehouse: "DE01", qty: "8", containerNo: "002" },
    { containerCode: "PICK0099", containerType: "PICKING", appointmentTime: "2026-05-21 15:00", dispatchWarehouse: "US01", receiptWarehouse: "US01", qty: "31", containerNo: "099" },
  ];
}
