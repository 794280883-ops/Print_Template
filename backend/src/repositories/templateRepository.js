import { pool, withTransaction } from "../config/db.js";
import { elementToRow, toTemplateDsl } from "../utils/dsl.js";

export async function listTemplates(filters = {}) {
  const where = [];
  const params = {};
  if (filters.name) {
    where.push("template_name LIKE :name");
    params.name = `%${filters.name}%`;
  }
  if (filters.type) {
    where.push("template_type = :type");
    params.type = filters.type;
  }
  if (filters.status) {
    where.push("status = :status");
    params.status = filters.status;
  }
  if (filters.warehouse) {
    where.push("id IN (SELECT template_id FROM print_template_warehouse WHERE warehouse_code = :warehouse)");
    params.warehouse = filters.warehouse;
  }

  const [rows] = await pool.query(
    `SELECT * FROM print_template ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY updated_at DESC, id DESC`,
    params,
  );
  return Promise.all(rows.map((row) => getTemplateById(row.id)));
}

export async function getTemplateById(id, connection = pool) {
  const [[template]] = await connection.query("SELECT * FROM print_template WHERE id = ?", [id]);
  if (!template) return null;
  const [elements] = await connection.query("SELECT * FROM print_template_element WHERE template_id = ? ORDER BY z_index ASC, id ASC", [id]);
  const [warehouses] = await connection.query("SELECT * FROM print_template_warehouse WHERE template_id = ? ORDER BY id ASC", [id]);
  return toTemplateDsl(template, elements, warehouses);
}

export async function getTemplateRowByCode(templateCode, connection = pool) {
  const [[row]] = await connection.query("SELECT * FROM print_template WHERE template_code = ?", [templateCode]);
  return row || null;
}

export async function createTemplate(template) {
  return withTransaction(async (connection) => {
    const [result] = await connection.query(
      `INSERT INTO print_template
        (template_code, template_name, template_type, width_mm, height_mm, unit, dpi, version, status, is_default, remark, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admin', 'Admin')`,
      [
        template.templateCode,
        template.templateName,
        template.templateType,
        template.size.width,
        template.size.height,
        template.size.unit,
        template.size.dpi,
        template.version,
        template.status,
        template.isDefault ? 1 : 0,
        template.remark,
      ],
    );
    await replaceTemplateChildren(connection, result.insertId, template);
    return getTemplateById(result.insertId, connection);
  });
}

export async function replaceTemplate(id, template) {
  return withTransaction(async (connection) => {
    await connection.query(
      `UPDATE print_template
       SET template_code = ?, template_name = ?, template_type = ?, width_mm = ?, height_mm = ?, unit = ?, dpi = ?,
           version = ?, status = ?, is_default = ?, remark = ?, updated_by = 'Admin'
       WHERE id = ?`,
      [
        template.templateCode,
        template.templateName,
        template.templateType,
        template.size.width,
        template.size.height,
        template.size.unit,
        template.size.dpi,
        template.version,
        template.status,
        template.isDefault ? 1 : 0,
        template.remark,
        id,
      ],
    );
    await connection.query("DELETE FROM print_template_element WHERE template_id = ?", [id]);
    await connection.query("DELETE FROM print_template_warehouse WHERE template_id = ?", [id]);
    await replaceTemplateChildren(connection, id, template);
    return getTemplateById(id, connection);
  });
}

export async function updateTemplateStatus(id, status, version = null) {
  const params = version ? [status, version, id] : [status, id];
  await pool.query(`UPDATE print_template SET status = ?${version ? ", version = ?" : ""}, updated_by = 'Admin' WHERE id = ?`, params);
  return getTemplateById(id);
}

async function replaceTemplateChildren(connection, templateId, template) {
  for (const code of template.areaWarehouseCodes) {
    await connection.query("INSERT INTO print_template_warehouse (template_id, warehouse_code) VALUES (?, ?)", [templateId, code]);
  }
  for (const element of template.elements) {
    const row = elementToRow(templateId, element);
    await connection.query(
      `INSERT INTO print_template_element
        (template_id, element_uid, element_type, x, y, width, height, z_index, rotate, text_kind, text_content, bind_field, font_size, bold, align_type, color, background_color, image_url, extra_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.template_id,
        row.element_uid,
        row.element_type,
        row.x,
        row.y,
        row.width,
        row.height,
        row.z_index,
        row.rotate,
        row.text_kind,
        row.text_content,
        row.bind_field,
        row.font_size,
        row.bold,
        row.align_type,
        row.color,
        row.background_color,
        row.image_url,
        row.extra_json,
      ],
    );
  }
}
