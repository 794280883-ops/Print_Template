<template>
  <div class="business-data">
    <!-- Filter Card -->
    <a-card class="filter-card" size="small">
      <a-form layout="inline">
        <a-form-item label="数据类型">
          <a-select v-model:value="filters.type" style="width:140px;">
            <a-select-option
              v-for="module in moduleOptions"
              :key="module.code"
              :value="module.code"
            >
              {{ module.dataLabel || module.name || module.code }}
            </a-select-option>
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
        <a-button @click="handleBatchPrint" :disabled="!selectedRowKeys.length">
          <printer-outlined /> 打印 {{ selectedRowKeys.length ? `(${selectedRowKeys.length})` : '' }}
        </a-button>
      </a-space>

      <a-table
        :columns="dynamicColumns"
        :data-source="displayRows"
        :loading="loading"
        :pagination="tablePagination"
        :row-key="r => r.id"
        :row-selection="rowSelection"
        :show-sorter-tooltip="false"
        @change="handleTableChange"
        size="middle"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === codeFieldCode">
            <a @click.prevent="handleEdit(record)">{{ record[codeFieldCode] }}</a>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-popconfirm title="确认删除?" @confirm="handleDelete(record)">
              <a-button size="small" danger v-permission="'business:delete'">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Edit Modal -->
    <a-modal v-model:open="editing" title="编辑业务数据" cancel-text="取消" ok-text="确认" @ok="handleEditSave" width="520px" :confirm-loading="saving">
      <a-form layout="vertical" v-if="editRecord">
        <template v-for="f in currentFields" :key="f.code">
          <a-form-item :label="f.name" :required="f.required">
            <a-select v-if="f.code === 'directionMark'" v-model:value="editFields[f.code]" allow-clear placeholder="请选择方向">
              <a-select-option value="">空</a-select-option>
              <a-select-option value="向上">向上</a-select-option>
              <a-select-option value="向下">向下</a-select-option>
            </a-select>
            <a-input v-else v-model:value="editFields[f.code]" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- Create Modal -->
    <a-modal v-model:open="creating" title="新增业务数据" cancel-text="取消" ok-text="确认" @ok="handleCreateSave" width="520px" :confirm-loading="saving">
      <a-form layout="vertical">
        <template v-for="f in currentFields" :key="f.code">
          <a-form-item :label="f.name" :required="f.required">
            <a-select v-if="f.code === 'directionMark'" v-model:value="createFields[f.code]" allow-clear placeholder="请选择方向">
              <a-select-option value="">空</a-select-option>
              <a-select-option value="向上">向上</a-select-option>
              <a-select-option value="向下">向下</a-select-option>
            </a-select>
            <a-input v-else v-model:value="createFields[f.code]" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- Import Modal -->
    <a-modal v-model:open="importVisible" title="导入业务数据" width="440px">
      <template #footer>
        <a-button @click="importVisible = false">取消</a-button>
        <a-button type="primary" :loading="importing" :disabled="!importFile" @click="handleImportConfirm">确认导入</a-button>
      </template>
      <a-space direction="vertical" style="width:100%">
        <a-button @click="downloadImportTemplate" block>
          <template #icon><download-outlined /></template>
          下载导入模版
        </a-button>
        <div class="import-upload-area" @click="triggerImportFile" @dragover.prevent @drop.prevent="handleDropFile">
          <upload-outlined style="font-size:24px;color:#999" />
          <div v-if="!importFile" class="import-hint">点击或拖拽 .xlsx 文件</div>
          <div v-else class="import-file-name">{{ importFile.name }}</div>
          <a-button v-if="importFile" size="small" @click.stop="importFile = null" type="link" danger>移除</a-button>
        </div>
        <input ref="importFileRef" type="file" accept=".xlsx" style="display:none" @change="handleImportFile" />
      </a-space>
    </a-modal>

    <!-- Print Modal -->
    <a-modal v-model:open="printVisible" title="模版打印" width="760px" :footer="null">
      <div v-if="printTemplates.length" style="display:flex;gap:20px">
        <!-- Left: template selection & settings -->
        <div style="width:240px;flex-shrink:0">
          <a-form layout="vertical" size="small">
            <a-form-item label="选择模版">
              <div style="max-height:220px;overflow-y:auto">
                <div v-for="tpl in printTemplates" :key="tpl.id"
                  class="tpl-option" :class="{ selected: selectedTemplateId === tpl.id }"
                  @click="selectPrintTemplate(tpl)">
                  <div class="tpl-option-name">{{ tpl.templateName }}</div>
                  <div class="tpl-option-meta">{{ tpl.templateCode }} · {{ tpl.size?.width }}×{{ tpl.size?.height }}mm</div>
                </div>
              </div>
            </a-form-item>
            <a-form-item label="打印份数">
              <a-input-number v-model:value="printCopies" :min="1" :max="99" style="width:100%" />
            </a-form-item>
            <div style="font-size:12px;color:#999;line-height:1.6">
              已选 <b>{{ printRecords.length }}</b> 条{{ typeLabel }}数据，将按照所选模版排版打印
            </div>
          </a-form>
        </div>
        <!-- Right: template preview -->
        <div style="flex:1">
          <div class="print-preview-area">
            <div v-if="selectedTemplate" class="label-canvas" :style="printCanvasStyle">
              <div v-for="el in selectedTemplate.elements" :key="el.id"
                class="template-el" :class="[`el-${el.type}`]"
                :style="getPrintPreviewStyle(el)">
                <div v-if="el.type === 'text'" class="el-content">{{ getTemplatePreviewText(el) }}</div>
                <div v-else-if="el.type === 'qrcode'" class="qr"></div>
                <div v-else-if="el.type === 'barcode'" class="barcode"></div>
                <div v-else-if="el.type === 'line'" class="line-el"></div>
                <div v-else-if="el.type === 'rect'" class="rect-el"></div>
                <div v-else-if="el.type === 'checkbox'" class="checkbox-content">
                  <span class="checkbox-mark" :class="{ checked: el.checked }">{{ el.checked ? '✓' : '' }}</span>
                  <span v-if="el.text" class="checkbox-label">{{ el.text }}</span>
                </div>
              </div>
            </div>
            <div v-else class="print-preview-placeholder">请选择一个模版预览</div>
          </div>
        </div>
      </div>
      <div v-else style="text-align:center;padding:40px;color:#999">
        暂无{{ typeLabel }}类型的模版，请先在模版列表页创建
      </div>
      <div style="text-align:right;margin-top:16px">
        <a-button @click="printVisible = false" style="margin-right:8px">取消</a-button>
        <a-button type="primary" :loading="printLoading" :disabled="!selectedTemplateId || !printRecords.length" @click="doPrintRecord">确认打印</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined, UploadOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import { listBusinessData, deleteBusinessData, updateBusinessData, createBusinessData, importBusinessData, downloadImportTemplate as downloadImportTemplateApi } from '../../api/businessDataApi.js';
import { listTemplates, getTemplate, downloadPrintPdf, listFields } from '../../api/templateApi.js';
import { listBusinessModules } from '../../api/businessModuleApi.js';
import { FIELD_DICT, TYPE_LABEL, PX_PER_MM } from '../../data/constants.js';

const rows = ref([]);
const loading = ref(false);
const selectedRowKeys = ref([]);
const editing = ref(false);
const editRecord = ref(null);
const editFields = ref({});
const creating = ref(false);
const createFields = ref({});
const importFileRef = ref(null);
const importVisible = ref(false);
const importFile = ref(null);
const importing = ref(false);
const saving = ref(false);
const printVisible = ref(false);
const printRecords = ref([]);
const printTemplates = ref([]);
const selectedTemplateId = ref(null);
const selectedTemplate = ref(null);
const printCopies = ref(1);
const printLoading = ref(false);
const filters = reactive({ type: 'LOCATION', keyword: '', page: 1, pageSize: 20, sortField: 'locationCode', sortDir: 'ASC' });
const total = ref(0);
const modules = ref([]);
const fieldsByType = ref({});

const fallbackModules = [
  { code: 'LOCATION', name: '库位', templateLabel: '库位模板', dataLabel: '库位数据', codeField: 'locationCode' },
  { code: 'CONTAINER', name: '容器', templateLabel: '容器模板', dataLabel: '容器数据', codeField: 'containerCode' },
  { code: 'PRODUCT', name: '商品', templateLabel: '商品模板', dataLabel: '商品数据', codeField: 'productCode' },
];

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

const moduleOptions = computed(() => modules.value.length ? modules.value : fallbackModules);

const currentModule = computed(() => moduleOptions.value.find((item) => item.code === filters.type) || null);

const currentFields = computed(() => {
  return (fieldsByType.value[filters.type] || FIELD_DICT[filters.type] || []).map((field) => ({
    ...field,
    required: !!field.required,
  }));
});

const codeFieldCode = computed(() => currentModule.value?.codeField || currentFields.value[0]?.code || '');
const typeLabel = computed(() => currentModule.value?.name || TYPE_LABEL[filters.type] || filters.type);

const dynamicColumns = computed(() => {
  const base = [];
  for (const field of currentFields.value) {
    base.push({
      title: field.name || field.code,
      dataIndex: field.code,
      key: field.code,
      ellipsis: true,
      width: field.code === codeFieldCode.value ? 160 : 150,
      sorter: true,
      sortOrder: filters.sortField === field.code ? (filters.sortDir === 'ASC' ? 'ascend' : 'descend') : null,
    });
  }
  base.push({ title: '操作', key: 'action', width: 80, fixed: 'right' });
  return base;
});

async function fetchModules() {
  try {
    const result = await listBusinessModules();
    modules.value = Array.isArray(result) ? result : [];
    if (!modules.value.some((item) => item.code === filters.type)) {
      filters.type = modules.value[0]?.code || 'LOCATION';
    }
  } catch {
    modules.value = [];
  }
}

async function fetchFields(type) {
  if (!type || fieldsByType.value[type]) return;
  try {
    fieldsByType.value = {
      ...fieldsByType.value,
      [type]: await listFields(type),
    };
  } catch {
    if (!FIELD_DICT[type]) message.warning('字段配置加载失败');
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await listBusinessData(filters.type, {
      keyword: filters.keyword,
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField,
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
function handleTableChange(pag, _filters, sorter) {
  filters.page = pag.current;
  filters.pageSize = pag.pageSize;
  if (sorter && sorter.order) {
    filters.sortField = sorter.field || codeFieldCode.value;
    filters.sortDir = sorter.order === 'ascend' ? 'ASC' : 'DESC';
  } else if (sorter && !sorter.order) {
    filters.sortField = codeFieldCode.value;
    filters.sortDir = 'ASC';
  }
  fetchData();
}
function handleCreate() {
  createFields.value = {};
  for (const f of currentFields.value) createFields.value[f.code] = '';
  creating.value = true;
}
async function handleCreateSave() {
  const codeField = currentFields.value.find((field) => field.code === codeFieldCode.value) || currentFields.value[0];
  if (codeField && !createFields.value[codeField.code]?.trim()) {
    message.error(`${codeField.name}不能为空`);
    return;
  }
  saving.value = true;
  try {
    await createBusinessData(filters.type, createFields.value);
    message.success('新增成功');
    creating.value = false;
    fetchData();
  } catch (e) {
    message.error('新增失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}
function handleImport() {
  importFile.value = null;
  importVisible.value = true;
}
function triggerImportFile() {
  importFileRef.value?.click();
}
function handleDropFile(e) {
  const file = e.dataTransfer?.files?.[0];
  if (file) importFile.value = file;
}
async function handleImportFile(e) {
  const file = e.target.files?.[0];
  if (file) importFile.value = file;
  e.target.value = '';
}
async function handleImportConfirm() {
  if (!importFile.value) return;
  importing.value = true;
  try {
    const res = await importBusinessData(filters.type, importFile.value);
    const data = res.data || res;
    const { total = 0, success = 0, errors = [] } = data;
    if (errors.length) {
      const errList = errors.map(e => e.message).join('\n');
      Modal.error({
        title: `导入完成：成功 ${success} 条，失败 ${errors.length} 条`,
        content: errList,
        width: 520,
      });
    } else {
      message.success(`导入完成：${success} 条全部成功`);
    }
    importVisible.value = false;
    importFile.value = null;
    fetchData();
  } catch (err) {
    message.error('导入失败: ' + (err.message || ''));
  } finally {
    importing.value = false;
  }
}
function downloadImportTemplate() {
  downloadImportTemplateApi(filters.type);
}
async function handleBatchPrint() {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要打印的数据');
    return;
  }
  const selected = rows.value.filter(r => selectedRowKeys.value.includes(r.id));
  printRecords.value = selected;
  selectedTemplateId.value = null;
  selectedTemplate.value = null;
  printCopies.value = 1;

  try {
    const result = await listTemplates({ type: filters.type, status: 'enabled', pageSize: 200 });
    printTemplates.value = (result.rows || []).filter(t => t.status === 'enabled');
  } catch {
    printTemplates.value = [];
  }

  printVisible.value = true;
}

function selectPrintTemplate(tpl) {
  selectedTemplateId.value = tpl.id;
  // Fetch full template with elements for preview
  getTemplate(tpl.id).then(full => {
    selectedTemplate.value = full;
  }).catch(() => {
    selectedTemplate.value = tpl;
  });
}

const printCanvasStyle = computed(() => {
  const tpl = selectedTemplate.value;
  if (!tpl) return {};
  const z = Math.min(1.3, 300 / (tpl.size.width * PX_PER_MM));
  return { width: `${tpl.size.width * PX_PER_MM * z}px`, height: `${tpl.size.height * PX_PER_MM * z}px` };
});

function getPrintPreviewStyle(el) {
  const tpl = selectedTemplate.value;
  if (!tpl) return {};
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

function printFileName(templateType) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Date.now() % 1000).padStart(3, '0');
  return `${templateType || 'PRINT'}_${y}${m}${d}${seq}.pdf`;
}

function getTemplatePreviewText(el) {
  if (el.type !== 'text') return '';
  if (el.textKind === 'field') {
    if (el.bindField === 'directionMark') return '↑↓';
    return `[${el.bindField || '未绑定'}]`;
  }
  return el.text || '静态文本';
}

async function doPrintRecord() {
  if (!selectedTemplateId.value || !printRecords.value.length) return;
  printLoading.value = true;
  try {
    const rows = printRecords.value.map(item => (item.fields ? { ...item.fields } : item));
    const blob = await downloadPrintPdf({
      templateId: selectedTemplateId.value,
      rows,
      copies: printCopies.value,
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = printFileName(selectedTemplate.value?.templateType);
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('打印文件已下载');
    printVisible.value = false;
  } catch (err) {
    message.error('打印失败: ' + (err.message || ''));
  } finally {
    printLoading.value = false;
  }
}
function handleEdit(record) {
  editRecord.value = record;
  editFields.value = { ...(record.fields || {}) };
  for (const field of currentFields.value) {
    if (editFields.value[field.code] === undefined) editFields.value[field.code] = '';
  }
  editing.value = true;
}

async function handleEditSave() {
  const codeField = currentFields.value.find((field) => field.code === codeFieldCode.value) || currentFields.value[0];
  if (codeField && !editFields.value[codeField.code]?.trim()) {
    message.error(`${codeField.name}不能为空`);
    return;
  }
  saving.value = true;
  try {
    await updateBusinessData(filters.type, editRecord.value.businessCode, editFields.value);
    message.success('保存成功');
    editing.value = false;
    fetchData();
  } catch (e) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(record) {
  try {
    await deleteBusinessData(filters.type, record.businessCode);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

watch(() => filters.type, async () => {
  filters.page = 1;
  await fetchFields(filters.type);
  filters.sortField = codeFieldCode.value || currentFields.value[0]?.code || 'businessCode';
  filters.sortDir = 'ASC';
  selectedRowKeys.value = [];
  fetchData();
});
onMounted(async () => {
  await fetchModules();
  await fetchFields(filters.type);
  filters.sortField = codeFieldCode.value || filters.sortField;
  fetchData();
});
</script>

<style scoped>
.business-data { display: flex; flex-direction: column; gap: 12px; }
.filter-card { background: linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%); }

.tpl-option {
  padding: 8px 10px;
  margin-bottom: 4px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.tpl-option:hover { border-color: #1677ff; }
.tpl-option.selected { border-color: #1677ff; background: #f0f5ff; }
.tpl-option-name { font-weight: 600; font-size: 13px; }
.tpl-option-meta { font-size: 11px; color: #999; margin-top: 2px; }

.print-preview-area {
  background: #eef2f7;
  padding: 12px;
  border-radius: 8px;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.print-preview-placeholder { color: #999; font-size: 13px; }

.label-canvas {
  position: relative;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}
.template-el { position: absolute; overflow: hidden; }
.template-el .el-content { width: 100%; height: 100%; display: flex; align-items: center; }
.template-el.el-qrcode .qr { width: 100%; height: 100%; background: repeating-linear-gradient(45deg, #333 0, #333 2px, #fff 2px, #fff 6px); }
.template-el.el-barcode .barcode { width: 100%; height: 100%; background: repeating-linear-gradient(90deg, #333 0, #333 1px, #fff 1px, #fff 3px); }
.template-el.el-line { border-bottom: 2px solid currentColor; }
.template-el.el-rect { border: 1px solid currentColor; }
.template-el .checkbox-mark { display: inline-block; width: 14px; height: 14px; border: 1px solid #999; margin-right: 4px; text-align: center; line-height: 13px; font-size: 11px; }
.template-el .checkbox-mark.checked { border-color: #333; }
.template-el .checkbox-label { font-size: 11px; }

.import-upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.import-upload-area:hover { border-color: #1677ff; }
.import-hint { margin-top: 8px; color: #999; font-size: 13px; }
.import-file-name { margin-top: 8px; font-weight: 600; font-size: 13px; }
</style>
