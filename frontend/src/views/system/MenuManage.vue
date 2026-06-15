<template>
  <div class="menu-manage">
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleAddRoot" v-permission="'system:menu:create'"><plus-outlined /> 新增菜单</a-button>
      </a-space>
      <a-table :columns="columns" :data-source="menus" :pagination="false" row-key="id" size="middle" :defaultExpandAllRows="true">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleAddChild(record)" v-permission="'system:menu:create'">添加子菜单</a-button>
              <a-button size="small" @click="handleEdit(record)" v-permission="'system:menu:edit'">编辑</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)"><a-button size="small" danger v-permission="'system:menu:delete'">删除</a-button></a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑菜单' : '新增菜单'" @ok="handleSave" @cancel="modalVisible = false">
      <a-form layout="vertical" :model="form">
        <a-form-item label="菜单名称" required><a-input v-model:value="form.title" placeholder="如 模板列表" /></a-form-item>
        <a-form-item label="路由路径" required><a-input v-model:value="form.path" placeholder="如 /templates" /></a-form-item>
        <a-form-item label="图标"><a-input v-model:value="form.icon" placeholder="Ant Design 图标名" /></a-form-item>
        <a-form-item label="权限码"><a-input v-model:value="form.permission" placeholder="如 template:view" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="form.sort" :min="0" style="width:100%;" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';

const STORAGE_KEY = 'wms_menus';
const columns = [
  { title: '菜单名称', dataIndex: 'title', key: 'title' },
  { title: '路由路径', dataIndex: 'path', key: 'path' },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 100 },
  { title: '权限码', dataIndex: 'permission', key: 'permission' },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 260 },
];

const menus = ref([]);
const modalVisible = ref(false);
const editingId = ref(null);
const parentId = ref(null);
const form = reactive({ title: '', path: '', icon: '', permission: '', sort: 0 });

function seedData() {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (existing.length === 0) {
    existing.push(
      { id: 1, title: '模板列表', path: '/templates', icon: 'FileTextOutlined', permission: 'template:view', sort: 1, children: [] },
      { id: 2, title: '模版字段', path: '/fields', icon: 'DatabaseOutlined', permission: 'field:view', sort: 2, children: [] },
      { id: 3, title: '业务数据', path: '/business', icon: 'TableOutlined', permission: 'business:view', sort: 3, children: [] },
      { id: 4, title: '系统管理', path: '', icon: 'SettingOutlined', permission: '', sort: 99, children: [
        { id: 41, title: '用户管理', path: '/system/users', icon: 'UserOutlined', permission: 'system:user:view', sort: 1, children: [] },
        { id: 42, title: '角色管理', path: '/system/roles', icon: 'TeamOutlined', permission: 'system:role:view', sort: 2, children: [] },
        { id: 43, title: '菜单管理', path: '/system/menus', icon: 'MenuOutlined', permission: 'system:menu:view', sort: 3, children: [] },
      ]},
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
  return existing;
}
function loadData() { menus.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(menus.value)); }
function findMenu(items, id) { for (const item of items) { if (item.id === id) return item; if (item.children) { const f = findMenu(item.children, id); if (f) return f; } } return null; }
function removeMenu(items, id) { return items.filter(item => { if (item.id === id) return false; if (item.children) item.children = removeMenu(item.children, id); return true; }); }
function handleAddRoot() { editingId.value = null; parentId.value = null; form.title = ''; form.path = ''; form.icon = ''; form.permission = ''; form.sort = 0; modalVisible.value = true; }
function handleAddChild(parent) { editingId.value = null; parentId.value = parent.id; form.title = ''; form.path = ''; form.icon = ''; form.permission = ''; form.sort = 0; modalVisible.value = true; }
function handleEdit(record) { editingId.value = record.id; form.title = record.title; form.path = record.path; form.icon = record.icon || ''; form.permission = record.permission || ''; form.sort = record.sort || 0; modalVisible.value = true; }
function handleSave() {
  if (!form.title || !form.path) { message.warning('请填写必填项'); return; }
  if (editingId.value) { const m = findMenu(menus.value, editingId.value); if (m) Object.assign(m, { ...form }); }
  else if (parentId.value) { const p = findMenu(menus.value, parentId.value); if (p) { if (!p.children) p.children = []; p.children.push({ id: Date.now(), ...form, sort: form.sort || 0, children: [] }); } }
  else { menus.value.push({ id: Date.now(), ...form, sort: form.sort || 0, children: [] }); }
  saveData(); loadData(); modalVisible.value = false; message.success('保存成功');
}
function handleDelete(record) { menus.value = removeMenu(menus.value, record.id); saveData(); loadData(); message.success('删除成功'); }
onMounted(() => { seedData(); loadData(); });
</script>
