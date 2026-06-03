-- Remove purpose and usageScene fields from CONTAINER type
-- These fields are no longer needed for container templates

-- Delete field dictionary entries
DELETE FROM print_field_dict
WHERE template_type = 'CONTAINER'
  AND field_code IN ('purpose', 'usageScene');

-- Delete template elements that bind to these removed fields
DELETE FROM print_template_element
WHERE bind_field IN ('purpose', 'usageScene');
