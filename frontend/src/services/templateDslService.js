import { FIELD_DICT } from "../data/constants.js";

export function sampleByType(type) {
  return Object.fromEntries((FIELD_DICT[type] || []).map((field) => {
    let value = field.example || "";
    // Parse JSON array for select-type fields, use first option
    if (field.type === "select") {
      try {
        const arr = JSON.parse(value);
        if (Array.isArray(arr) && arr.length) value = arr[0];
      } catch { /* not JSON, use as-is */ }
    }
    return [field.code, value];
  }));
}

export function fieldExists(type, code) {
  return (FIELD_DICT[type] || []).some((field) => field.code === code);
}
