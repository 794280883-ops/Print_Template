<template>
  <div class="user-manage">
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleAdd" v-permission="'system:user:create'">
          <plus-outlined /> 新增用户
        </a-button>
      </a-space>
      <a-table :columns="columns" :data-source="users" :pagination="{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }" row-key="id" size="middle">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">{{ record.status === 'enabled' ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)" v-permission="'system:user:edit'">编辑</a-button>
              <a-button size="small" @click="handleToggle(record)" v-permission="'system:user:edit'">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)">
                <a-button size="small" danger v-permission="'system:user:delete'">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑用户' : '新增用户'" @ok="handleSave" @cancel="modalVisible = false">
      <a-form layout="vertical" :model="form">
        <a-form-item label="用户名" required><a-input v-model:value="form.username" placeholder="请输入用户名" /></a-form-item>
        <a-form-item label="昵称" required><a-input v-model:value="form.nickname" placeholder="请输入昵称" /></a-form-item>
        <a-form-item v-if="!editingId" label="密码" required><a-input-password v-model:value="form.password" placeholder="请输入密码" /></a-form-item>
        <a-form-item label="角色"><a-select v-model:value="form.roles" mode="multiple" placeholder="请选择角色"><a-select-option v-for="r in savedRoles" :key="r.id" :value="r.name">{{ r.name }}</a-select-option></a-select></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';

const STORAGE_KEY = 'wms_users';
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '角色', dataIndex: 'roles', key: 'roles' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 240 },
];

const users = ref([]);
const savedRoles = ref([]);
const modalVisible = ref(false);
const editingId = ref(null);
const form = reactive({ username: '', nickname: '', password: '', roles: [] });

function seedData() {
  savedRoles.value = JSON.parse(localStorage.getItem('wms_roles') || '[]');
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (existing.length === 0) {
    existing.push({ id: 1, username: 'admin', nickname: '系统管理员', roles: ['admin'], status: 'enabled', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
  }
  return existing;
}
function loadData() { users.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(users.value)); }
function handleAdd() { editingId.value = null; form.username = ''; form.nickname = ''; form.password = ''; form.roles = []; modalVisible.value = true; }
function handleEdit(record) { editingId.value = record.id; form.username = record.username; form.nickname = record.nickname; form.password = ''; form.roles = [...(record.roles || [])]; modalVisible.value = true; }
function handleSave() {
  if (!form.username || !form.nickname) { message.warning('请填写必填项'); return; }
  if (editingId.value) {
    const u = users.value.find(u => u.id === editingId.value);
    if (u) { u.username = form.username; u.nickname = form.nickname; u.roles = [...form.roles]; }
  } else {
    users.value.push({ id: Date.now(), username: form.username, nickname: form.nickname, roles: [...form.roles], status: 'enabled', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
  }
  saveData(); loadData(); modalVisible.value = false; message.success('保存成功');
}
function handleToggle(record) { record.status = record.status === 'enabled' ? 'disabled' : 'enabled'; saveData(); loadData(); }
function handleDelete(record) { users.value = users.value.filter(u => u.id !== record.id); saveData(); loadData(); message.success('删除成功'); }
onMounted(() => { seedData(); loadData(); });
</script>
