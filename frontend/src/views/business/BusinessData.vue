<template>
  <div class="business-data">
    <!-- Filter Card -->
    <a-card class="filter-card" size="small">
      <a-form layout="inline">
        <a-form-item label="数据类型">
          <a-select v-model:value="filters.type" style="width:140px;">
            <a-select-option value="LOCATION">库位数据</a-select-option>
            <a-select-option value="CONTAINER">容器数据</a-select-option>
            <a-select-option value="PRODUCT">商品数据</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model:value="filters.keyword" placeholder="搜索..." allow-clear style="width:200px;" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left:8px;" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- Table Card -->
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleCreate" v-permission="'business:create'">
          <plus-outlined /> 新增
        </a-button>
        <a-button @click="handleImport" v-permission="'business:import'">
          <upload-outlined /> 导入
        </a-button>
      </a-space>

      <a-table
        :columns="dynamicColumns"
        :data-source="displayRows"
        :loading="loading"
        :pagination="tablePagination"
        :row-key="r => r.id"
        :row-selection="rowSelection"
        @change="handleTableChange"
        size="middle"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)" v-permission="'business:edit'">编辑</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)">
                <a-button size="small" danger v-permission="'business:delete'">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { listBusinessData, deleteBusinessData } from '../../api/businessDataApi.js';

const rows = ref([]);
const loading = ref(false);
const selectedRowKeys = ref([]);
const filters = reactive({ type: 'LOCATION', keyword: '', page: 1, pageSize: 20, sortDir: 'ASC' });
const total = ref(0);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => { selectedRowKeys.value = keys; },
}));

const tablePagination = computed(() => ({
  current: filters.page,
  pageSize: filters.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t) => `共 ${t} 条`,
}));

// Flatten fields into row for dynamic column display
const displayRows = computed(() => {
  return rows.value.map(r => ({
    ...r,
    ...(r.fields || {}),
  }));
});

const dynamicColumns = computed(() => {
  const base = [{ title: 'ID', dataIndex: 'id', key: 'id', width: 80 }];
  if (displayRows.value.length > 0) {
    const first = displayRows.value[0];
    for (const key of Object.keys(first)) {
      if (key === 'id' || key === 'fields') continue;
      base.push({ title: key, dataIndex: key, key, ellipsis: true, width: 150 });
    }
  }
  base.push({ title: '操作', key: 'action', width: 150, fixed: 'right' });
  return base;
});

async function fetchData() {
  loading.value = true;
  try {
    const result = await listBusinessData(filters.type, {
      keyword: filters.keyword,
      page: filters.page,
      pageSize: filters.pageSize,
      sortDir: filters.sortDir,
    });
    rows.value = result.rows || [];
    total.value = result.total || 0;
  } catch (e) {
    message.error('加载失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
}

function handleSearch() { filters.page = 1; fetchData(); }
function handleReset() { filters.keyword = ''; filters.page = 1; fetchData(); }
function handleTableChange(pag) { filters.page = pag.current; filters.pageSize = pag.pageSize; fetchData(); }
function handleCreate() { message.info('新增功能：后续对接完整表单'); }
function handleImport() { message.info('导入功能：后续对接文件上传'); }
function handleEdit(record) { message.info(`编辑: ${record.id}`); }

async function handleDelete(record) {
  try {
    await deleteBusinessData(filters.type, record.businessCode);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

watch(() => filters.type, () => { filters.page = 1; fetchData(); });
onMounted(() => { fetchData(); });
</script>

<style scoped>
.business-data { display: flex; flex-direction: column; gap: 12px; }
.filter-card { background: linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%); }
</style>
