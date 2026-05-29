# Database Schema

Migration file:

```text
backend/migrations/001_init.sql
```

Tables:

```text
print_template
print_template_element
print_template_warehouse
print_field_dict
print_log
operation_log
```

Seed data:

```text
TPL_LOCATION_10050
TPL_CONTAINER_IN_10050
TPL_PICKING_100150
LOCATION field dictionary
CONTAINER field dictionary
JP-TYO-01
US-LAX-01
DE-FRA-01
```

The backend restores the frontend DSL from `print_template`, `print_template_element`, and `print_template_warehouse`. Element fields that do not have dedicated columns are stored in `extra_json`.
