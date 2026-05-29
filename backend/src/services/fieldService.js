import * as fieldRepository from "../repositories/fieldRepository.js";

export async function listFields(templateType) {
  const rows = await fieldRepository.listFields(templateType);
  return rows.map((row) => ({
    code: row.field_code,
    name: row.field_name,
    type: row.field_type,
    example: row.example_value,
    required: Boolean(row.is_required),
    desc: row.description,
  }));
}
