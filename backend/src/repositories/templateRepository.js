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

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(filters.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM print_template ${whereClause}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT * FROM print_template ${whereClause} ORDER BY updated_at DESC, id DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit: pageSize, offset },
  );

  const templates = await Promise.all(rows.map((row) => getTemplateById(row.id)));
  return { rows: templates, total, page, pageSize };
}

export async function getTemplateById(id, connection = pool) {
  const [[template]] = await connection.query("SELECT * FROM print_template WHERE id = ?", [id]);
  if (!template) return null;
  const [elements] = await connection.query("SELECT * FROM print_template_element WHERE template_id = ? ORDER BY z_index ASC, id ASC", [id]);
  return toTemplateDsl(template, elements);
}

export async function getTemplateRowByCode(templateCode, connection = pool) {
  const [[row]] = await connection.query("SELECT * FROM print_template WHERE template_code = ?", [templateCode]);
  return row || null;
}

export async function getTemplateRowByName(templateName, connection = pool) {
  const [[row]] = await connection.query("SELECT * FROM print_template WHERE template_name = ?", [templateName]);
  return row || null;
}

export async function createTemplate(template) {
  return withTransaction(async (connection) => {
    const [result] = await connection.query(
      `INSERT INTO print_template
        (template_code, template_name, template_type, width_mm, height_mm, unit, dpi, print_rotation, status, remark, field_preview_values)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.templateCode,
        template.templateName,
        template.templateType,
        template.size.width,
        template.size.height,
        template.size.unit,
        template.size.dpi,
        template.printRotation || 0,
        template.status,
        template.remark,
        template.fieldPreviewValues ? JSON.stringify(template.fieldPreviewValues) : null,
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
       SET template_code = ?, template_name = ?, template_type = ?, width_mm = ?, height_mm = ?, unit = ?, dpi = ?, print_rotation = ?,
           status = ?, remark = ?, field_preview_values = ?
       WHERE id = ?`,
      [
        template.templateCode,
        template.templateName,
        template.templateType,
        template.size.width,
        template.size.height,
        template.size.unit,
        template.size.dpi,
        template.printRotation || 0,
        template.status,
        template.remark,
        template.fieldPreviewValues ? JSON.stringify(template.fieldPreviewValues) : null,
        id,
      ],
    );
    await connection.query("DELETE FROM print_template_element WHERE template_id = ?", [id]);
    await replaceTemplateChildren(connection, id, template);
    return getTemplateById(id, connection);
  });
}

export async function updateTemplateStatus(id, status) {
  await pool.query("UPDATE print_template SET status = ? WHERE id = ?", [status, id]);
  return getTemplateById(id);
}

export async function deleteTemplate(id) {
  return withTransaction(async (connection) => {
    const [[template]] = await connection.query("SELECT * FROM print_template WHERE id = ?", [id]);
    if (!template) return null;
    await connection.query("DELETE FROM print_template_element WHERE template_id = ?", [id]);
    await connection.query("DELETE FROM print_template WHERE id = ?", [id]);
    return { id, templateCode: template.template_code, templateName: template.template_name };
  });
}

export async function updateTemplateName(id, templateName) {
  await pool.query("UPDATE print_template SET template_name = ? WHERE id = ?", [templateName, id]);
  return getTemplateById(id);
}

async function replaceTemplateChildren(connection, templateId, template) {
  for (const element of template.elements) {
    const row = elementToRow(templateId, element);
    await connection.query(
      `INSERT INTO print_template_element
        (template_id, element_uid, element_type, x, y, width, height, z_index, rotate, text_kind, text_content, bind_field, font_size, bold, align_type, color, background_color, extra_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        row.extra_json,
      ],
    );
  }
}
