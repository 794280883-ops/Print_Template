<template>
  <div class="template-list">
    <!-- Filter Card -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filters">
        <a-form-item label="模板名称">
          <a-input
            v-model:value="filters.name"
            placeholder="模板名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="模板类型">
          <a-select
            v-model:value="filters.type"
            placeholder="全部"
            allow-clear
            style="width: 140px"
          >
            <a-select-option value="LOCATION">库位模板</a-select-option>
            <a-select-option value="CONTAINER">容器模板</a-select-option>
            <a-select-option value="PRODUCT">商品模板</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="filters.status"
            placeholder="全部"
            allow-clear
            style="width: 120px"
          >
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">停用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- Table Card -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :row-selection="rowSelection"
        :pagination="tablePagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 模板编码 - clickable link to designer -->
          <template v-if="column.key === 'templateCode'">
            <a-button type="link" size="small" @click="gotoDesigner(record)">
              {{ record.templateCode }}
            </a-button>
          </template>
          <!-- 类型 - tag -->
          <template v-else-if="column.key === 'type'">
            <a-tag>{{ TYPE_LABEL[record.templateType] || record.templateType }}</a-tag>
          </template>
          <!-- 状态 - colored tag -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">
              {{ STATUS_LABEL[record.status] || record.status }}
            </a-tag>
          </template>
          <!-- 尺寸(mm) -->
          <template v-else-if="column.key === 'size'">
            {{ record.size?.width }} &times; {{ record.size?.height }}
          </template>
          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                v-permission="'template:publish'"
                size="small"
                type="link"
                :disabled="record.status !== 'enabled'"
                @click="handlePrint(record)"
              >
                打印
              </a-button>
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item
                      v-permission="'template:publish'"
                      @click="handleToggleStatus(record)"
                    >
                      {{ record.status === 'enabled' ? '停用' : '启用' }}
                    </a-menu-item>
                    <a-menu-item
                      v-permission="'template:create'"
                      @click="handleCopy(record)"
                    >
                      复制
                    </a-menu-item>
                    <a-menu-item
                      v-permission="'template:delete'"
                      @click="handleDelete(record)"
                    >
                      <span style="color: #ff4d4f">删除</span>
                    </a-menu-item>
                  </a-menu>
                </template>
                <a-button size="small" type="link">
                  <more-outlined />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { MoreOutlined } from '@ant-design/icons-vue';
import {
  listTemplates,
  enableTemplate,
  disableTemplate,
  deleteTemplate as apiDeleteTemplate,
  copyTemplate,
  downloadPrintPdf,
} from '../../api/templateApi.js';
import { TYPE_LABEL, STATUS_LABEL } from '../../data/constants.js';

const router = useRouter();

// -- State --
const rows = ref([]);
const loading = ref(false);
const selectedRowKeys = ref([]);

const filters = reactive({
  name: '',
  type: undefined,
  status: undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// -- Computed --
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys;
  },
}));

const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total, range) =>
    `显示第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
}));

const columns = [
  { title: '模板编码', dataIndex: 'templateCode', key: 'templateCode', width: 180 },
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName', ellipsis: true },
  { title: '类型', key: 'type', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '尺寸(mm)', key: 'size', width: 130 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

// -- Methods --
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (filters.name) params.name = filters.name;
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;

    const result = await listTemplates(params);
    const data = result.rows || result;
    rows.value = Array.isArray(data) ? data : data?.rows || [];
    pagination.total =
      result.total || (Array.isArray(data) ? data.length : 0);
  } catch (error) {
    message.error('获取模板列表失败：' + error.message);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  filters.name = '';
  filters.type = undefined;
  filters.status = undefined;
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function gotoDesigner(record) {
  router.push(`/templates/${record.id}/designer`);
}

async function handlePrint(record) {
  if (record.status !== 'enabled') {
    message.warning('模板未启用，不能打印');
    return;
  }
  try {
    const blob = await downloadPrintPdf({ templateId: record.id });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.templateCode}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('打印文件已下载');
  } catch (error) {
    message.error('打印失败：' + error.message);
  }
}

async function handleToggleStatus(record) {
  try {
    if (record.status === 'enabled') {
      await disableTemplate(record.id);
      message.success('模板已停用');
    } else {
      await enableTemplate(record.id);
      message.success('模板已启用');
    }
    fetchData();
  } catch (error) {
    message.error('操作失败：' + error.message);
  }
}

async function handleCopy(record) {
  try {
    await copyTemplate(record.id);
    message.success('模板已复制');
    fetchData();
  } catch (error) {
    message.error('复制失败：' + error.message);
  }
}

function handleDelete(record) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除模板「${record.templateName}」？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await apiDeleteTemplate(record.id);
        message.success('模板已删除');
        fetchData();
      } catch (error) {
        message.error('删除失败：' + error.message);
      }
    },
  });
}

// -- Lifecycle --
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.filter-card {
  background: linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%);
}
</style>
