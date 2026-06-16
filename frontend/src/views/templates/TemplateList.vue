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
            id="filterType"
            v-model:value="filters.type"
            placeholder="全部"
            allow-clear
            style="width: 140px"
          >
            <a-select-option
              v-for="module in moduleOptions"
              :key="module.code"
              :value="module.code"
            >
              {{ module.name || module.code }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            id="filterStatus"
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
      <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;color:#666">已选 {{ selectedRowKeys.length }} 项</span>
        <a-button size="small" type="primary" ghost @click="handleCreate" v-permission="'template:create'">
          <plus-outlined /> 新增
        </a-button>
        <a-button size="small" type="primary" ghost :disabled="!selectedRowKeys.length" @click="handleBatchToggleStatus('enabled')">批量启用</a-button>
        <a-button size="small" danger ghost :disabled="!selectedRowKeys.length" @click="handleBatchToggleStatus('disabled')">批量停用</a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :row-selection="rowSelection"
        :pagination="tablePagination"
        row-key="id"
        :scroll="{ x: 'max-content' }"
        @change="handleTableChange"
        @resizeColumn="onColumnResize"
      >
        <template #bodyCell="{ column, record }">
          <!-- 模板编码 - clickable link to designer -->
          <template v-if="column.key === 'templateCode'">
            <a
              href="javascript:void(0)"
              style="color: var(--wms-blue); font-weight: 500;"
              @click.prevent="gotoDesigner(record)"
            >{{ record.templateCode }}</a>
          </template>
          <!-- 类型 - tag -->
          <template v-else-if="column.key === 'type'">
            <a-tag>{{ getTemplateTypeLabel(record.templateType) }}</a-tag>
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
              <a-button size="small" type="link" @click="handlePreview(record)" v-permission="'template:view'">
                预览
              </a-button>
              <a-button size="small" type="link" @click="handleCopy(record)" v-permission="'template:create'">
                复制
              </a-button>
              <a-button size="small" type="link" danger @click="handleDelete(record)" v-permission="'template:delete'">
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Preview Modal -->
    <a-modal v-model:open="previewVisible" title="模板预览" width="760px" :footer="false">
      <div v-if="previewTemplate" class="preview-wrap">
        <div class="preview-card">
          <div class="label-canvas" :style="previewCanvasStyle">
            <div v-for="el in previewTemplate.elements" :key="el.id"
              class="template-el" :class="[`el-${el.type}`]"
              :style="getPreviewElementStyle(el)">
              <div v-if="el.type === 'text'" class="el-content">{{ getPreviewText(el) }}</div>
              <div v-else-if="el.type === 'qrcode'" class="qr"></div>
              <div v-else-if="el.type === 'barcode'" class="barcode"></div>
              <div v-else-if="el.type === 'checkbox'" class="checkbox-content">
                <span class="checkbox-mark" :class="{ checked: el.checked }">{{ el.checked ? '✓' : '' }}</span>
                <span v-if="el.text" class="checkbox-label">{{ el.text }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-panel" style="box-shadow:none">
          <div class="section-head"><span style="font-weight:700">模板信息</span></div>
          <div style="padding:14px;display:grid;gap:8px">
            <div><b>模板名称：</b>{{ previewTemplate.templateName }}</div>
            <div><b>模板类型：</b>{{ getTemplateTypeLabel(previewTemplate.templateType) }}</div>
            <div><b>尺寸：</b>{{ previewTemplate.size.width }} × {{ previewTemplate.size.height }}mm</div>
            <div><b>状态：</b><a-tag :color="previewTemplate.status === 'enabled' ? 'green' : 'red'">{{ STATUS_LABEL[previewTemplate.status] || previewTemplate.status }}</a-tag></div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- Print Modal -->
    <a-modal v-model:open="printVisible" title="模板打印" width="800px" :footer="null">
      <div v-if="printState" class="print-dialog">
        <div style="display:flex;gap:20px">
          <!-- Left: print settings -->
          <div style="width:260px;flex-shrink:0">
            <a-form layout="vertical" size="small">
              <a-form-item label="打印份数">
                <a-input-number v-model:value="printState.copies" :min="1" :max="99" style="width:100%" />
              </a-form-item>
              <a-form-item label="打印方式">
                <a-radio-group v-model:value="printState.printAll">
                  <a-radio :value="true">全部业务数据</a-radio>
                  <a-radio :value="false">选择业务数据</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item v-if="printState.businessList.length" label="数据预览">
                <div style="max-height:200px;overflow-y:auto">
                  <div v-for="(row, i) in printState.businessList" :key="i"
                    style="padding:4px 8px;margin:2px 0;border:1px solid #f0f0f0;border-radius:4px;font-size:12px;
                           display:flex;align-items:center;gap:6px">
                    <a-checkbox v-if="!printState.printAll"
                      :checked="printState.selectedRowIndices.includes(i)"
                      @change="(e) => {
                        const idx = printState.selectedRowIndices.indexOf(i);
                        if (e.target.checked && idx === -1) printState.selectedRowIndices.push(i);
                        if (!e.target.checked && idx !== -1) printState.selectedRowIndices.splice(idx, 1);
                      }" />
                    <template v-for="(v, k) in row.fields" :key="k">
                      <span style="color:#999">{{ k }}:</span> {{ v }}&nbsp;
                    </template>
                  </div>
                </div>
              </a-form-item>
            </a-form>
          </div>
          <!-- Right: print preview -->
          <div style="flex:1">
            <div class="print-preview" style="background:#eef2f7;padding:12px;border-radius:8px;min-height:200px">
              <div class="label-canvas" :style="printCanvasStyle">
                <div v-for="el in printState.previewElements" :key="el.id"
                  class="template-el" :class="[`el-${el.type}`]"
                  :style="getPrintPreviewStyle(el)">
                  <div v-if="el.type === 'text'" class="el-content">{{ getPreviewText(el) }}</div>
                  <div v-else-if="el.type === 'qrcode'" class="qr"></div>
                  <div v-else-if="el.type === 'barcode'" class="barcode"></div>
                  <div v-else-if="el.type === 'checkbox'" class="checkbox-content">
                    <span class="checkbox-mark" :class="{ checked: el.checked }">{{ el.checked ? '✓' : '' }}</span>
                    <span v-if="el.text" class="checkbox-label">{{ el.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align:right;margin-top:16px">
          <a-button @click="printVisible = false" style="margin-right:8px">取消</a-button>
          <a-button type="primary" :loading="printState.printing" @click="doPrint">确认打印</a-button>
        </div>
      </div>
    </a-modal>

    <!-- Create Modal -->
    <a-modal v-model:open="creating" title="新增模版" cancel-text="取消" ok-text="确认" @ok="handleCreateSave" width="440px" :confirm-loading="saving">
      <a-form layout="vertical">
        <a-form-item label="模版名称" required>
          <a-input v-model:value="createForm.templateName" placeholder="请输入模版名称" />
        </a-form-item>
        <a-form-item label="模版类型" required>
          <a-select v-model:value="createForm.templateType" placeholder="请选择模版类型">
            <a-select-option
              v-for="module in moduleOptions"
              :key="module.code"
              :value="module.code"
            >
              {{ module.name || module.templateLabel || module.code }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="尺寸(mm)">
          <a-space>
            <a-input-number v-model:value="createForm.width" :min="1" :max="500" placeholder="宽" style="width:120px" />
            <span>&times;</span>
            <a-input-number v-model:value="createForm.height" :min="1" :max="500" placeholder="高" style="width:120px" />
          </a-space>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="createForm.remark" placeholder="选填" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  enableTemplate,
  disableTemplate,
  deleteTemplate as apiDeleteTemplate,
  copyTemplate,
  downloadPrintPdf,
  batchUpdateTemplateStatus,
} from '../../api/templateApi.js';
import { listBusinessModules } from '../../api/businessModuleApi.js';
import { searchBusinessData } from '../../api/businessDataApi.js';
import { TYPE_LABEL, STATUS_LABEL, PX_PER_MM } from '../../data/constants.js';

const router = useRouter();

// -- State --
const rows = ref([]);
const loading = ref(false);
const selectedRowKeys = ref([]);
const modules = ref([]);

const fallbackModules = [
  { code: 'LOCATION', name: '库位', templateLabel: '库位模板', dataLabel: '库位数据' },
  { code: 'CONTAINER', name: '容器', templateLabel: '容器模板', dataLabel: '容器数据' },
  { code: 'PRODUCT', name: '商品', templateLabel: '商品模板', dataLabel: '商品数据' },
];

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

// Preview state
const previewVisible = ref(false);
const previewTemplate = ref(null);

// Create state
const creating = ref(false);
const saving = ref(false);
const createForm = reactive({
  templateName: '',
  templateType: undefined,
  width: 80,
  height: 40,
  remark: '',
});

// Print state
const printVisible = ref(false);
const printState = ref(null);

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

const moduleOptions = computed(() => modules.value.length ? modules.value : fallbackModules);

const moduleLabelMap = computed(() => {
  return Object.fromEntries(moduleOptions.value.map((item) => [item.code, item.name || item.code]));
});

const COLUMN_WIDTHS_KEY = 'wms_column_widths';

function loadColumnWidths() {
  try { return JSON.parse(localStorage.getItem(COLUMN_WIDTHS_KEY)) || {}; }
  catch { return {}; }
}

function saveColumnWidths(widths) {
  try { localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths)); } catch { /* noop */ }
}

const savedWidths = loadColumnWidths();
const columns = ref([
  { title: '模板编码', dataIndex: 'templateCode', key: 'templateCode', width: savedWidths.templateCode || 180, resizable: true },
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName', width: savedWidths.templateName || 200, resizable: true, ellipsis: true },
  { title: '类型', key: 'type', width: savedWidths.type || 120, resizable: true },
  { title: '状态', key: 'status', width: savedWidths.status || 100, resizable: true },
  { title: '尺寸(mm)', key: 'size', width: savedWidths.size || 130, resizable: true },
  { title: '操作', key: 'action', width: savedWidths.action || 220, fixed: 'right' },
]);

function onColumnResize(width, col) {
  const idx = columns.value.findIndex(c => c.key === col.key);
  if (idx >= 0) {
    columns.value[idx] = { ...columns.value[idx], width };
    const widths = {};
    columns.value.forEach(c => { if (c.width) widths[c.key] = c.width; });
    saveColumnWidths(widths);
  }
}

const previewCanvasStyle = computed(() => {
  if (!previewTemplate.value) return {};
  const tpl = previewTemplate.value;
  const z = Math.min(1.4, 340 / (tpl.size.width * PX_PER_MM));
  return { width: `${tpl.size.width * PX_PER_MM * z}px`, height: `${tpl.size.height * PX_PER_MM * z}px` };
});

const printCanvasStyle = computed(() => {
  if (!printState.value) return {};
  const tpl = printState.value.template;
  const z = Math.min(1.3, 300 / (tpl.size.width * PX_PER_MM));
  return { width: `${tpl.size.width * PX_PER_MM * z}px`, height: `${tpl.size.height * PX_PER_MM * z}px` };
});

function getPreviewElementStyle(el) {
  const tpl = previewTemplate.value;
  if (!tpl) return {};
  const z = Math.min(1.4, 340 / (tpl.size.width * PX_PER_MM));
  return {
    left: `${el.x * PX_PER_MM * z}px`,
    top: `${el.y * PX_PER_MM * z}px`,
    width: `${el.width * PX_PER_MM * z}px`,
    height: `${el.height * PX_PER_MM * z}px`,
    zIndex: el.zIndex || 1,
    fontSize: `${(el.fontSize || 12) * z}px`,
    fontWeight: el.bold ? 700 : 400,
    color: el.color || '#111827',
    background: el.type === 'line' ? (el.color || '#111827') : (el.backgroundColor || 'transparent'),
    transform: `rotate(${el.rotate || 0}deg)`,
  };
}

function getPrintPreviewStyle(el) {
  if (!printState.value) return {};
  const tpl = printState.value.template;
  const z = Math.min(1.3, 300 / (tpl.size.width * PX_PER_MM));
  return {
    left: `${el.x * PX_PER_MM * z}px`,
    top: `${el.y * PX_PER_MM * z}px`,
    width: `${el.width * PX_PER_MM * z}px`,
    height: `${el.height * PX_PER_MM * z}px`,
    zIndex: el.zIndex || 1,
    fontSize: `${(el.fontSize || 12) * z}px`,
    fontWeight: el.bold ? 700 : 400,
    color: el.color || '#111827',
    background: el.type === 'line' ? (el.color || '#111827') : (el.backgroundColor || 'transparent'),
    transform: `rotate(${el.rotate || 0}deg)`,
  };
}

function getPreviewText(el) {
  if (el.type !== 'text') return '';
  if (el.textKind === 'field') {
    if (el.bindField === 'directionMark') return '↑↓';
    return `[${el.bindField || '未绑定'}]`;
  }
  return el.text || '静态文本';
}

// -- Methods --
function getTemplateTypeLabel(type) {
  return moduleLabelMap.value[type] || TYPE_LABEL[type] || type;
}

async function fetchModules() {
  try {
    const result = await listBusinessModules();
    modules.value = Array.isArray(result) ? result : [];
  } catch {
    modules.value = [];
  }
}

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

function handleCreate() {
  createForm.templateName = '';
  createForm.templateType = undefined;
  createForm.width = null;
  createForm.height = null;
  createForm.remark = '';
  creating.value = true;
}

async function handleCreateSave() {
  if (!createForm.templateName?.trim()) {
    message.error('模版名称不能为空');
    return;
  }
  if (!createForm.templateType) {
    message.error('请选择模版类型');
    return;
  }
  if (!createForm.width || createForm.width < 1 || !createForm.height || createForm.height < 1) {
    message.error('尺寸宽高必须大于 0');
    return;
  }
  saving.value = true;
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const seq = String(Date.now() % 1000).padStart(3, '0');
    const templateCode = `${createForm.templateType}_${y}${m}${d}${seq}`;
    const created = await createTemplate({
      templateCode,
      templateName: createForm.templateName.trim(),
      templateType: createForm.templateType,
      size: { width: createForm.width, height: createForm.height, unit: 'mm', dpi: 203 },
      remark: createForm.remark.trim(),
      elements: [],
    });
    message.success('模版创建成功');
    creating.value = false;
    fetchData();
    // Navigate to designer to edit template fields
    router.push(`/templates/${created.id}/designer`);
  } catch (e) {
    message.error('创建失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handlePreview(record) {
  try {
    const tpl = await getTemplate(record.id);
    previewTemplate.value = tpl;
    previewVisible.value = true;
  } catch (error) {
    message.error('获取模板详情失败：' + error.message);
  }
}

async function handlePrint(record) {
  if (record.status !== 'enabled') {
    message.warning('模板未启用，不能打印');
    return;
  }
  try {
    const tpl = await getTemplate(record.id);
    // Map template type to business data type
    const bizType = tpl.templateType;
    let businessList = [];
    try {
      const result = await searchBusinessData({ bizType, pageSize: 20 });
      businessList = result?.rows || result?.data || [];
    } catch { /* no business data available */ }

    printState.value = {
      template: tpl,
      copies: 1,
      printAll: true,
      businessList,
      selectedRowIndices: businessList.map((_, idx) => idx),
      previewElements: tpl.elements || [],
      printing: false,
    };
    printVisible.value = true;
  } catch (error) {
    message.error('获取模板详情失败：' + error.message);
  }
}

async function doPrint() {
  if (!printState.value) return;
  const s = printState.value;
  s.printing = true;
  try {
    const allBiz = s.businessList || [];
    const bizList = s.printAll
      ? allBiz
      : allBiz.filter((_, idx) => s.selectedRowIndices.includes(idx));
    const rows = bizList.length
      ? bizList.map((item) => (item.fields ? { ...item.fields } : item))
      : [{}];
    const blob = await downloadPrintPdf({
      templateId: s.template.id,
      rows,
      copies: s.copies,
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = printFileName(s.template.templateType);
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('打印文件已下载');
    printVisible.value = false;
  } catch (error) {
    message.error('打印失败：' + error.message);
  } finally {
    s.printing = false;
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

function handleBatchToggleStatus(status) {
  const label = status === 'enabled' ? '启用' : '停用';
  Modal.confirm({
    title: `确认${label}`,
    content: `确定要批量${label}选中的 ${selectedRowKeys.value.length} 个模板吗？`,
    okText: label,
    cancelText: '取消',
    onOk: async () => {
      try {
        await batchUpdateTemplateStatus(selectedRowKeys.value, status);
        message.success(`已批量${label} ${selectedRowKeys.value.length} 个模板`);
        selectedRowKeys.value = [];
        fetchData();
      } catch (error) {
        message.error(`批量${label}失败：` + error.message);
      }
    },
  });
}

function printFileName(templateType) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Date.now() % 1000).padStart(3, '0');
  return `${templateType || 'PRINT'}_${y}${m}${d}${seq}.pdf`;
}

// Watch printAll toggle to auto-select/deselect all rows
watch(() => printState.value?.printAll, (isAll) => {
  if (isAll && printState.value) {
    printState.value.selectedRowIndices = printState.value.businessList.map((_, idx) => idx);
  }
});

// -- Lifecycle --
onMounted(() => {
  fetchModules();
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
.preview-wrap {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.preview-card {
  flex-shrink: 0;
  padding: 16px;
  background: #eef2f7;
  border-radius: 8px;
}
.label-canvas {
  position: relative;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.template-el {
  position: absolute;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
}
.el-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.qr {
  width: 100%;
  height: 100%;
  background: repeating-conic-gradient(#999 0% 25%, #fff 0% 50%) 50% / 8px 8px;
  border: 1px dashed #ddd;
}
.barcode {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(90deg, #333 0px 2px, #fff 2px 4px);
  border: 1px dashed #ddd;
}
.checkbox-content {
  display: flex;
  align-items: center;
  gap: 4px;
}
.checkbox-mark {
  width: 16px;
  height: 16px;
  border: 2px solid #999;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.checkbox-mark.checked {
  background: var(--wms-blue);
  border-color: var(--wms-blue);
  color: #fff;
}
.checkbox-label { font-size: 12px; }
.print-dialog { display: flex; flex-direction: column; }
</style>
