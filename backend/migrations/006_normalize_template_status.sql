UPDATE print_template
SET status = CASE
  WHEN status IN ('published', 'enabled') THEN 'enabled'
  ELSE 'disabled'
END
WHERE status NOT IN ('enabled', 'disabled');
