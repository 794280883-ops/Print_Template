<template>
  <div class="role-manage">
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleAdd" v-permission="'system:role:create'"><plus-outlined /> 新增角色</a-button>
      </a-space>
      <a-table :columns="columns" :data-source="roles" :pagination="false" row-key="id" size="middle">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'"><a-space wrap><a-tag v-for="p in record.permissions" :key="p" color="blue">{{ p }}</a-tag></a-space></template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)" v-permission="'system:role:edit'">编辑</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)"><a-button size="small" danger v-permission="'system:role:delete'">删除</a-button></a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑角色' : '新增角色'" width="640px" @ok="handleSave" @cancel="modalVisible = false">
      <a-form layout="vertical" :model="form">
        <a-form-item label="角色名称" required><a-input v-model:value="form.name" placeholder="请输入角色名称" /></a-form-item>
        <a-form-item label="角色编码" required><a-input v-model:value="form.code" placeholder="如 admin, operator" /></a-form-item>
        <a-form-item label="权限">
          <a-checkbox-group v-model:value="form.permissions">
            <a-row>
              <a-col :span="24"><strong>模板管理</strong></a-col>
              <a-col :span="12" v-for="p in permissionGroups.template" :key="p"><a-checkbox :value="p">{{ p }}</a-checkbox></a-col>
              <a-col :span="24" style="margin-top:8px;"><strong>业务数据</strong></a-col>
              <a-col :span="12" v-for="p in permissionGroups.business" :key="p"><a-checkbox :value="p">{{ p }}</a-checkbox></a-col>
              <a-col :span="24" style="margin-top:8px;"><strong>系统管理</strong></a-col>
              <a-col :span="12" v-for="p in permissionGroups.system" :key="p"><a-checkbox :value="p">{{ p }}</a-checkbox></a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';

const STORAGE_KEY = 'wms_roles';
const columns = [
  { title: '角色名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '角色编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '权限', dataIndex: 'permissions', key: 'permissions' },
  { title: '操作', key: 'action', width: 150 },
];
const permissionGroups = {
  template: ['template:view','template:create','template:edit','template:delete','template:publish'],
  business: ['business:view','business:create','business:edit','business:delete','business:import','field:view'],
  system: ['system:user:view','system:user:create','system:user:edit','system:user:delete','system:role:view','system:role:create','system:role:edit','system:role:delete','system:menu:view','system:menu:create','system:menu:edit','system:menu:delete'],
};

const roles = ref([]);
const modalVisible = ref(false);
const editingId = ref(null);
const form = reactive({ name: '', code: '', permissions: [] });

function seedData() {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (existing.length === 0) {
    existing.push({ id: 1, name: '管理员', code: 'admin', permissions: Object.values(permissionGroups).flat() });
    existing.push({ id: 2, name: '操作员', code: 'operator', permissions: ['template:view','template:publish','business:view','business:create','business:edit','field:view'] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
  return existing;
}
function loadData() { roles.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(roles.value)); }
function handleAdd() { editingId.value = null; form.name = ''; form.code = ''; form.permissions = []; modalVisible.value = true; }
function handleEdit(record) { editingId.value = record.id; form.name = record.name; form.code = record.code; form.permissions = [...record.permissions]; modalVisible.value = true; }
function handleSave() {
  if (!form.name || !form.code) { message.warning('请填写必填项'); return; }
  if (editingId.value) { const r = roles.value.find(r => r.id === editingId.value); if (r) { r.name = form.name; r.code = form.code; r.permissions = [...form.permissions]; } }
  else { roles.value.push({ id: Date.now(), name: form.name, code: form.code, permissions: [...form.permissions] }); }
  saveData(); loadData(); modalVisible.value = false; message.success('保存成功');
}
function handleDelete(record) { roles.value = roles.value.filter(r => r.id !== record.id); saveData(); loadData(); message.success('删除成功'); }
onMounted(() => { seedData(); loadData(); });
</script>
