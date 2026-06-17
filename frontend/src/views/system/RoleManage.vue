<template>
  <div class="role-manage">
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleAdd" v-permission="'system:role:create'"><plus-outlined /> 新增角色</a-button>
      </a-space>
      <a-table :columns="columns" :data-source="roles" :pagination="false" row-key="id" size="middle" :loading="loading" :scroll="{ x: 'max-content' }" @resizeColumn="onResizeColumn">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'">
            <a-space wrap size="small">
              <a-tag v-for="label in record.permissionLabels" :key="label" color="blue">{{ label }}</a-tag>
            </a-space>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)" v-permission="'system:role:edit'">编辑</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)"><a-button size="small" danger v-permission="'system:role:delete'">删除</a-button></a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑角色' : '新增角色'" cancel-text="取消" ok-text="确认" width="720px" @ok="handleSave" @cancel="modalVisible = false" :confirm-loading="saving">
      <a-form layout="vertical" :model="form">
        <a-form-item label="角色名称" required><a-input v-model:value="form.name" placeholder="请输入角色名称" /></a-form-item>
        <a-form-item label="角色编码" required><a-input v-model:value="form.code" placeholder="例如 admin, operator" :disabled="!!editingId" /></a-form-item>
        <a-form-item label="权限分配">
          <div style="max-height:420px;overflow-y:auto;">
            <div v-for="dir in menuTree" :key="dir.id" style="background:#fafafa;border-radius:6px;padding:10px 14px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #e8e8e8;">
                <span style="font-weight:600;font-size:13px;color:#1677ff;">{{ dir.name }}</span>
                <span style="font-size:12px;color:#999;">
                  <a style="margin-right:8px;" @click="selectAllInDir(dir, true)">全选</a>
                  <a @click="selectAllInDir(dir, false)">清空</a>
                </span>
              </div>
              <div v-for="page in dir.children" :key="page.id" style="margin-bottom:6px;padding:4px 0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                  <a-checkbox :checked="selectedIds.has(page.id)" @change="toggleMenu(page.id)" style="font-size:13px;font-weight:500;">{{ page.name }}</a-checkbox>
                </div>
                <div v-if="selectedIds.has(page.id) && page.children?.length" style="padding-left:24px;display:flex;flex-wrap:wrap;gap:2px 6px;">
                  <a-tag
                    v-for="btn in page.children"
                    :key="btn.id"
                    :color="selectedIds.has(btn.id) ? 'blue' : 'default'"
                    style="cursor:pointer;font-size:12px;"
                    @click="toggleMenu(btn.id)"
                  >{{ btn.name }}</a-tag>
                </div>
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { listRoles, createRole, updateRole, deleteRole, getRoleMenus, assignRoleMenus } from '../../api/roleApi.js';
import { listMenus } from '../../api/menuApi.js';

const columns = ref([
  { title: '角色名称', dataIndex: 'name', key: 'name', resizable: true, width: 120 },
  { title: '角色编码', dataIndex: 'code', key: 'code', resizable: true, width: 120 },
  { title: '权限', dataIndex: 'permissions', key: 'permissions', resizable: true, width: 300 },
  { title: '操作', key: 'action', width: 150 },
]);

function onResizeColumn(w, col) {
  const idx = columns.value.findIndex(c => c.key === col.key);
  if (idx >= 0) columns.value[idx].width = w;
}

const roles = ref([]);
const loading = ref(false);
const saving = ref(false);
const modalVisible = ref(false);
const editingId = ref(null);
const form = reactive({ name: '', code: '', permissions: [] });
const menuTree = ref([]);
const allMenus = ref([]);
const selectedIds = ref(new Set());

function buildMenuTree(menus) {
  const dirs = menus.filter(m => m.parent_id === 0);
  return dirs.map(dir => {
    const pages = menus.filter(m => m.parent_id === dir.id);
    return {
      ...dir,
      children: pages.map(p => {
        const buttons = menus.filter(m => m.parent_id === p.id);
        return { ...p, children: buttons };
      }),
    };
  });
}

function selectAllInDir(dir, checked) {
  for (const page of dir.children || []) {
    if (checked) {
      selectedIds.value.add(page.id);
      for (const btn of page.children || []) selectedIds.value.add(btn.id);
    } else {
      selectedIds.value.delete(page.id);
      for (const btn of page.children || []) selectedIds.value.delete(btn.id);
    }
  }
  // 触发响应式
  selectedIds.value = new Set(selectedIds.value);
}

function toggleMenu(id) {
  const s = new Set(selectedIds.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  selectedIds.value = s;
}

async function loadData() {
  loading.value = true;
  try {
    const [roleList, menuList] = await Promise.all([listRoles(), listMenus()]);
    allMenus.value = menuList;
    roles.value = roleList.map(r => {
      const pms = roleList.find(rr => rr.id === r.id);
      return { ...r, permissionLabels: [] };
    });
    // Resolve permission labels for display
    for (const role of roles.value) {
      const mids = await getRoleMenus(role.id);
      const labels = menuList.filter(m => mids.includes(m.id) && m.type !== 'directory').map(m => m.name);
      role.permissionLabels = labels;
    }
  } catch (e) {
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleAdd() {
  editingId.value = null;
  form.name = '';
  form.code = '';
  menuTree.value = buildMenuTree(allMenus.value);
  selectedIds.value = new Set();
  modalVisible.value = true;
}

async function handleEdit(record) {
  editingId.value = record.id;
  form.name = record.name;
  form.code = record.code;
  const mids = await getRoleMenus(record.id);
  menuTree.value = buildMenuTree(allMenus.value);
  selectedIds.value = new Set(mids);
  modalVisible.value = true;
}

async function handleSave() {
  if (!form.name || !form.code) { message.warning('请填写必填项'); return; }
  const menuIds = [...selectedIds.value];
  saving.value = true;
  try {
    if (editingId.value) {
      await updateRole(editingId.value, { name: form.name, code: form.code });
      await assignRoleMenus(editingId.value, menuIds);
    } else {
      const created = await createRole({ name: form.name, code: form.code });
      await assignRoleMenus(created.id, menuIds);
    }
    message.success('保存成功');
    modalVisible.value = false;
    loadData();
  } catch (e) {
    message.error('保存失败：' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(record) {
  try {
    await deleteRole(record.id);
    message.success('删除成功');
    loadData();
  } catch (e) {
    message.error('删除失败：' + (e.message || ''));
  }
}

onMounted(() => { loadData(); });
</script>
