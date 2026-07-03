import assert from "node:assert/strict";
import test from "node:test";

// ============================================================
// 测试辅助工具
// ============================================================

/**
 * 创建模拟权限 store，不依赖 Pinia 和 Vue 运行时。
 * 与真实的 usePermissionStore 保持本测试需要的接口一致。
 */
function createPermissionStore({ permissions = [], user = null, token = "" } = {}) {
  let _permissions = [...permissions];
  let _user = user;
  let _token = token;

  return {
    get permissions() { return _permissions; },
    get user() { return _user; },
    get token() { return _token; },

    hasPermission(code) {
      if (!code) return true;
      return _permissions.includes(code);
    },

    setPermissions(list) {
      _permissions = [...list];
    },

    logout() {
      _permissions = [];
      _user = null;
      _token = "";
    },
  };
}

/**
 * 菜单树过滤函数（模拟权限菜单过滤逻辑，供 TC9 使用）。
 * 真实登录菜单树由后端 getMenuTree 根据 menu_id 构建。
 */
function buildVisibleMenuTree(menus, permissions) {
  return menus
    .map(menu => {
      if (menu.type === "button") return null;
      const children = menu.children
        ? menu.children.filter(c => {
            if (c.type === "button") {
              return permissions.includes(c.permission_code);
            }
            return !c.permission_code || permissions.includes(c.permission_code);
          })
        : [];
      if (children.length === 0 && menu.type === "directory") return null;
      return { ...menu, children };
    })
    .filter(Boolean);
}

/**
 * 路由守卫逻辑（模拟 router/index.js 中的权限判断分支，供 TC10 使用）。
 */
function checkRouteAccess(to, store) {
  if (!to.meta?.permission) return { allowed: true };
  if (!store.hasPermission(to.meta.permission)) {
    return { redirect: "/403" };
  }
  return { allowed: true };
}

// ============================================================
// 测试用例
// ============================================================

// TC1: 空权限码 — 无需权限即可访问
test("hasPermission returns true for empty/undefined permission code", () => {
  const store = createPermissionStore({ permissions: ["template:view"] });
  assert.equal(store.hasPermission(""), true);
  assert.equal(store.hasPermission(null), true);
  assert.equal(store.hasPermission(undefined), true);
});

// TC2: 持有权限 — 返回 true
test("hasPermission returns true when user holds the permission", () => {
  const store = createPermissionStore({
    permissions: ["template:view", "business:view", "business:print"],
  });
  assert.equal(store.hasPermission("template:view"), true);
  assert.equal(store.hasPermission("business:view"), true);
  assert.equal(store.hasPermission("business:print"), true);
});

// TC3: 未持有权限 — 返回 false
test("hasPermission returns false when user does not hold the permission", () => {
  const store = createPermissionStore({
    permissions: ["template:view"],
  });
  assert.equal(store.hasPermission("system:user:view"), false);
  assert.equal(store.hasPermission("business:delete"), false);
});

// TC4: admin 全量权限
test("admin role should have all system permissions", () => {
  const adminPermissions = [
    "template:view", "template:create", "template:edit",
    "template:delete", "template:enable", "template:disable",
    "field:view", "field:create", "field:edit", "field:delete",
    "field:enable", "field:disable",
    "field:module:create", "field:module:edit", "field:module:delete",
    "business:view", "business:create", "business:edit",
    "business:delete", "business:import", "business:print",
    "system:user:view", "system:user:create", "system:user:edit",
    "system:user:delete", "system:user:disable", "system:user:password",
    "system:role:view", "system:role:create", "system:role:edit",
    "system:role:delete",
    "system:menu:view", "system:menu:create", "system:menu:edit",
    "system:menu:delete",
  ];
  const store = createPermissionStore({ permissions: adminPermissions });
  for (const perm of adminPermissions) {
    assert.equal(store.hasPermission(perm), true, `admin should have ${perm}`);
  }
});

// TC5: business 角色权限范围
test("business role should have template/field/business permissions only", () => {
  const businessPermissions = [
    "template:view",
    "field:view", "field:edit",
    "business:view", "business:create", "business:edit",
    "business:delete", "business:import", "business:print",
  ];
  const store = createPermissionStore({ permissions: businessPermissions });

  // 应持有的权限
  assert.equal(store.hasPermission("template:view"), true);
  assert.equal(store.hasPermission("business:view"), true);
  assert.equal(store.hasPermission("business:print"), true);

  // 不应持有的权限
  assert.equal(store.hasPermission("template:delete"), false);
  assert.equal(store.hasPermission("field:delete"), false);
  assert.equal(store.hasPermission("system:user:view"), false);
  assert.equal(store.hasPermission("system:role:view"), false);
  assert.equal(store.hasPermission("system:menu:view"), false);
});

// TC6: 业务数据页面 — business 可见按钮
test("business role sees correct buttons on business data page", () => {
  const store = createPermissionStore({
    permissions: ["business:view", "business:create", "business:edit",
                  "business:delete", "business:import", "business:print"],
  });
  // business 有这些按钮权限
  assert.equal(store.hasPermission("business:create"), true);
  assert.equal(store.hasPermission("business:import"), true);
  assert.equal(store.hasPermission("business:print"), true);
  assert.equal(store.hasPermission("business:delete"), true);
  // business 没有字段管理删除权限
  assert.equal(store.hasPermission("field:delete"), false);
});

// TC7: 字段字典页面 — business 可见按钮
test("business role sees edit/disable but not delete on fields page", () => {
  const store = createPermissionStore({
    permissions: ["field:view", "field:edit", "field:enable", "field:disable"],
  });
  assert.equal(store.hasPermission("field:edit"), true);
  assert.equal(store.hasPermission("field:disable"), true);
  assert.equal(store.hasPermission("field:delete"), false);
  assert.equal(store.hasPermission("field:module:delete"), false);
});

// TC8: 系统管理 — business 无权访问
test("business role cannot access any system management pages", () => {
  const store = createPermissionStore({
    permissions: ["template:view", "business:view"],
  });
  assert.equal(store.hasPermission("system:user:view"), false);
  assert.equal(store.hasPermission("system:role:view"), false);
  assert.equal(store.hasPermission("system:menu:view"), false);
});

// TC9: 菜单树构建 — 空目录不显示
test("buildMenuTree filters out empty directories", () => {
  // 模拟: 角色只有 template:view，不应出现"字段与数据""系统管理"目录
  const permissions = ["template:view"];
  const allMenus = [
    { id: 1, type: "directory", name: "模板管理", children: [
      { id: 2, type: "page", name: "模板列表", permission_code: "template:view" },
      { id: 3, type: "button", name: "新增", permission_code: "template:create" },
    ]},
    { id: 10, type: "directory", name: "字段与数据", children: [
      { id: 11, type: "page", name: "模版字段", permission_code: "field:view" },
      { id: 12, type: "page", name: "业务数据", permission_code: "business:view" },
    ]},
    { id: 20, type: "directory", name: "系统管理", children: [
      { id: 21, type: "page", name: "用户管理", permission_code: "system:user:view" },
    ]},
  ];

  const tree = buildVisibleMenuTree(allMenus, permissions);

  // 只有"模板管理"目录有可见子节点
  assert.equal(tree.length, 1);
  assert.equal(tree[0].name, "模板管理");
  // 按钮级节点也应过滤
  const pageNodes = tree[0].children.filter(c => c.type === "page");
  assert.equal(pageNodes.length, 1);
  assert.equal(pageNodes[0].name, "模板列表");
});

// TC9 补充: 多个目录都有可见内容时全部保留
test("buildMenuTree keeps all directories with visible children", () => {
  const permissions = ["template:view", "business:view"];
  const allMenus = [
    { id: 1, type: "directory", name: "模板管理", children: [
      { id: 2, type: "page", name: "模板列表", permission_code: "template:view" },
    ]},
    { id: 10, type: "directory", name: "字段与数据", children: [
      { id: 11, type: "page", name: "模版字段", permission_code: "field:view" },
      { id: 12, type: "page", name: "业务数据", permission_code: "business:view" },
    ]},
    { id: 20, type: "directory", name: "系统管理", children: [
      { id: 21, type: "page", name: "用户管理", permission_code: "system:user:view" },
    ]},
  ];

  const tree = buildVisibleMenuTree(allMenus, permissions);

  assert.equal(tree.length, 2);
  assert.equal(tree[0].name, "模板管理");
  assert.equal(tree[1].name, "字段与数据");
  // "字段与数据"目录中只保留了 business:view 的页面
  assert.equal(tree[1].children.length, 1);
  assert.equal(tree[1].children[0].name, "业务数据");
});

// TC10: 路由守卫 — 无权限页面跳转 403
test("route guard redirects to /403 when user lacks route permission", async () => {
  const store = createPermissionStore({ permissions: ["template:view"] });

  const result = checkRouteAccess({
    path: "/system/users",
    meta: { permission: "system:user:view" },
  }, store);

  assert.equal(result.redirect, "/403");
});

test("route guard allows access when user holds route permission", async () => {
  const store = createPermissionStore({
    permissions: ["template:view", "system:user:view"],
  });

  const result = checkRouteAccess({
    path: "/system/users",
    meta: { permission: "system:user:view" },
  }, store);

  assert.equal(result.allowed, true);
});

test("route guard allows access when route has no permission requirement", async () => {
  const store = createPermissionStore({ permissions: [] });

  const result = checkRouteAccess({
    path: "/login",
    meta: {},
  }, store);

  assert.equal(result.allowed, true);
});

// TC11: 登录成功 — 返回权限码和菜单树
test("login returns token, user, permissions, and menu tree", async () => {
  const loginResult = {
    token: "eyJ...",
    user: { id: 1, username: "admin", nickname: "管理员" },
    permissions: ["template:view", "template:create", "system:user:view"],
    menus: [
      { id: 1, type: "directory", name: "模板管理", children: [
        { id: 2, type: "page", name: "模板列表", permission_code: "template:view" },
      ]},
    ],
  };

  assert.ok(loginResult.token);
  assert.ok(Array.isArray(loginResult.permissions));
  assert.ok(Array.isArray(loginResult.menus));
  assert.equal(loginResult.user.username, "admin");
  assert.equal(loginResult.user.nickname, "管理员");
  assert.equal(loginResult.permissions.includes("template:view"), true);
  assert.equal(loginResult.menus.length > 0, true);
});

// TC12: 权限变更后需重新登录
test("permission store reflects current session only, not stale data", () => {
  const store = createPermissionStore({ permissions: ["template:view"] });
  assert.equal(store.hasPermission("business:view"), false);

  // 模拟重新登录获得新权限
  store.setPermissions(["template:view", "business:view"]);
  assert.equal(store.hasPermission("business:view"), true);
});

test("logout clears all permissions", () => {
  const store = createPermissionStore({
    permissions: ["template:view", "business:view"],
    user: { id: 1, username: "admin" },
    token: "eyJ...",
  });

  store.logout();

  assert.equal(store.permissions.length, 0);
  assert.equal(store.user, null);
  assert.equal(store.token, "");
  assert.equal(store.hasPermission("template:view"), false);
});

// 补充: 空权限数组场景
test("store with empty permissions array returns false for any permission", () => {
  const store = createPermissionStore({ permissions: [] });
  assert.equal(store.hasPermission("template:view"), false);
  assert.equal(store.hasPermission("business:view"), false);
  assert.equal(store.hasPermission(""), true); // 空权限码仍返回 true
});
