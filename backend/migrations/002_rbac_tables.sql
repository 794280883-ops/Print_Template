-- ============================================================
-- 002_rbac_tables.sql — RBAC 五表权限系统
-- ============================================================

CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(256) NOT NULL,
  nickname VARCHAR(64),
  avatar VARCHAR(256),
  email VARCHAR(128),
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sys_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sys_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT DEFAULT 0,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'page' COMMENT 'directory / page / button',
  path VARCHAR(256),
  component VARCHAR(256),
  permission_code VARCHAR(128),
  icon VARCHAR(64),
  sort_no INT DEFAULT 0,
  visible TINYINT DEFAULT 1,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sys_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sys_role_menu (
  role_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 种子数据 ==========

-- 角色
INSERT IGNORE INTO sys_role (id, code, name) VALUES (1, 'admin', '管理员');

-- 超级管理员 (admin / 123456)
INSERT IGNORE INTO sys_user (id, username, password, nickname) VALUES (1, 'admin', '$2b$10$fUzturQKN.l9lssZG6.5c.AqBwAVgerxorEnlq7NjbbssaFOEyo12', '系统管理员');
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);

-- 菜单
INSERT IGNORE INTO sys_menu (id, parent_id, name, type, path, permission_code, icon, sort_no, visible) VALUES
(1, 0, '模板管理', 'directory', NULL, NULL, NULL, 10, 1),
(2, 1, '模板列表', 'page', '/templates', 'template:view', 'FileTextOutlined', 10, 1),
(3, 2, '新增模板', 'button', NULL, 'template:create', NULL, 10, 1),
(4, 2, '编辑模板', 'button', NULL, 'template:edit', NULL, 20, 1),
(5, 2, '删除模板', 'button', NULL, 'template:delete', NULL, 30, 1),
(7, 2, '启用模板', 'button', NULL, 'template:enable', NULL, 50, 1),
(8, 2, '停用模板', 'button', NULL, 'template:disable', NULL, 60, 1),
(9, 2, '预览模板', 'button', NULL, 'template:preview', NULL, 70, 1),
(10, 0, '字段与数据', 'directory', NULL, NULL, NULL, 20, 1),
(11, 10, '模版字段', 'page', '/fields', 'field:view', 'DatabaseOutlined', 10, 1),
(12, 10, '业务数据', 'page', '/business', 'business:view', 'TableOutlined', 20, 1),
(13, 12, '新增业务数据', 'button', NULL, 'business:create', NULL, 10, 1),
(14, 12, '编辑业务数据', 'button', NULL, 'business:edit', NULL, 20, 1),
(15, 12, '删除业务数据', 'button', NULL, 'business:delete', NULL, 30, 1),
(16, 12, '导入业务数据', 'button', NULL, 'business:import', NULL, 40, 1),
(17, 12, '打印业务数据', 'button', NULL, 'business:print', NULL, 50, 1),
(20, 0, '系统管理', 'directory', NULL, NULL, NULL, 30, 1),
(21, 20, '用户管理', 'page', '/system/users', 'system:user:view', 'UserOutlined', 10, 1),
(22, 21, '新增用户', 'button', NULL, 'system:user:create', NULL, 10, 1),
(23, 21, '编辑用户', 'button', NULL, 'system:user:edit', NULL, 20, 1),
(24, 21, '删除用户', 'button', NULL, 'system:user:delete', NULL, 30, 1),
(42, 21, '停用/启用', 'button', NULL, 'system:user:disable', NULL, 35, 1),
(43, 21, '修改密码', 'button', NULL, 'system:user:password', NULL, 45, 1),
(25, 20, '角色管理', 'page', '/system/roles', 'system:role:view', 'TeamOutlined', 20, 1),
(26, 25, '新增角色', 'button', NULL, 'system:role:create', NULL, 10, 1),
(27, 25, '编辑角色', 'button', NULL, 'system:role:edit', NULL, 20, 1),
(28, 25, '删除角色', 'button', NULL, 'system:role:delete', NULL, 30, 1),
(29, 20, '菜单管理', 'page', '/system/menus', 'system:menu:view', 'MenuOutlined', 30, 1),
(30, 29, '新增菜单', 'button', NULL, 'system:menu:create', NULL, 10, 1),
(31, 29, '编辑菜单', 'button', NULL, 'system:menu:edit', NULL, 20, 1),
(32, 29, '删除菜单', 'button', NULL, 'system:menu:delete', NULL, 30, 1),
(37, 11, '新增模块', 'button', NULL, 'field:module:create', NULL, 5, 1),
(33, 11, '新增字段', 'button', NULL, 'field:create', NULL, 10, 1),
(38, 11, '编辑模块', 'button', NULL, 'field:module:edit', NULL, 15, 1),
(34, 11, '编辑字段', 'button', NULL, 'field:edit', NULL, 20, 1),
(39, 11, '删除模块', 'button', NULL, 'field:module:delete', NULL, 25, 1),
(35, 11, '停用字段', 'button', NULL, 'field:disable', NULL, 30, 1),
(40, 11, '启用字段', 'button', NULL, 'field:enable', NULL, 35, 1),
(36, 11, '删除字段', 'button', NULL, 'field:delete', NULL, 40, 1);

-- admin 角色拥有全部菜单权限
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE id BETWEEN 1 AND 43;
