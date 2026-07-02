<template>
  <div class="business-data">
    <a-card class="filter-card" size="small">
      <a-tabs v-model:activeKey="filters.type" class="business-type-tabs">
        <a-tab-pane
          v-for="module in moduleOptions"
          :key="module.code"
          :tab="module.name || module.code"
        />
      </a-tabs>
      <a-form layout="inline" class="search-form">
        <a-form-item label="业务编码">
          <a-input
            v-model:value="filters.keyword"
            placeholder="输入业务编码，支持逗号或空格分隔批量查询"
            allow-clear
            style="width:220px;"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item v-for="f in searchableFields" :key="f.code" :label="f.name">
          <a-input
            v-model:value="fieldFilters[f.code]"
            :placeholder="'输入' + f.name + '，支持逗号或空格分隔批量查询'"
            allow-clear
            style="width:220px;"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
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
        <a-button @click="handleBatchPrint" :disabled="!selectedRowKeys.length" v-permission="'business:print'">
          <printer-outlined /> 打印 {{ selectedRowKeys.length ? `(${selectedRowKeys.length})` : '' }}
        </a-button>
        <a-popconfirm title="确认删除选中的业务数据?" @confirm="handleBatchDelete">
          <a-button danger :disabled="!selectedRowKeys.length" v-permission="'business:delete'">
            <delete-outlined /> 删除 {{ selectedRowKeys.length ? `(${selectedRowKeys.length})` : '' }}
          </a-button>
        </a-popconfirm>
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
            <a v-if="hasPermission('business:edit')" @click.prevent="handleEdit(record)">{{ record[codeFieldCode] }}</a>
            <span v-else>{{ record[codeFieldCode] }}</span>
          </template>
        </template>
      </a-table>
      <div class="page-bar">
        <span class="page-total">共 {{ total }} 条</span>
        <a-pagination
          v-model:current="filters.page"
          v-model:pageSize="filters.pageSize"
          :total="total"
          :show-size-changer="true"

          :page-size-options="['10', '20', '50', '100']"
          size="small"
          @change="fetchData"
          @showSizeChange="onPageSizeChange"
        />
        <span class="page-divider">|</span>
        <span class="page-label">自定义每页</span>
        <a-input-number v-model:value="customPageSize" :min="1" :max="10000" size="small" style="width:80px" @press-enter="applyCustomPageSize" />
        <a-button size="small" type="primary" ghost @click="applyCustomPageSize">应用</a-button>
        <span class="page-suffix">条</span>
      </div>
    </a-card>

    <!-- Edit Modal -->
    <a-modal v-model:open="editing" title="编辑业务数据" cancel-text="取消" ok-text="确认" @ok="handleEditSave" width="520px" :confirm-loading="saving">
      <a-form layout="vertical" v-if="editRecord">
        <template v-for="f in currentFields" :key="f.code">
          <a-form-item :label="f.name" :required="f.required">
            <a-input-number v-if="f.type === 'integer'" v-model:value="editFields[f.code]" :disabled="f.code === codeFieldCode" :precision="0" style="width:100%" />
            <a-input-number v-else-if="f.type === 'number'" v-model:value="editFields[f.code]" :disabled="f.code === codeFieldCode" style="width:100%" />
            <a-date-picker v-else-if="f.type === 'date'" v-model:value="editFields[f.code]" :disabled="f.code === codeFieldCode" style="width:100%" />
            <a-input v-else v-model:value="editFields[f.code]" :disabled="f.code === codeFieldCode" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- Create Modal -->
    <a-modal v-model:open="creating" title="新增业务数据" cancel-text="取消" ok-text="确认" @ok="handleCreateSave" width="520px" :confirm-loading="saving">
      <a-form layout="vertical">
        <template v-for="f in currentFields" :key="f.code">
          <a-form-item :label="f.name" :required="f.required">
            <a-select v-if="f.type === 'select' && f.enumOptions" v-model:value="createFields[f.code]" allow-clear :placeholder="'请选择' + f.name">
              <a-select-option v-for="opt in f.enumOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
            </a-select>
            <a-input-number v-else-if="f.type === 'integer'" v-model:value="createFields[f.code]" :precision="0" style="width:100%" />
            <a-input-number v-else-if="f.type === 'number'" v-model:value="createFields[f.code]" style="width:100%" />
            <a-date-picker v-else-if="f.type === 'date'" v-model:value="createFields[f.code]" style="width:100%" />
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
                <div v-else-if="el.type === 'barcode'" class="barcode-box">
                  <div class="barcode" :style="getBarcodeBarStyle(el)"></div>
                  <div v-if="isBarcodeHumanTextVisible(el)" class="barcode-human-text" :style="getBarcodeHumanTextStyle(el)">
                    {{ getBarcodeHumanText(el, getPrintPreviewData()) }}
                  </div>
                </div>
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
import { SearchOutlined, PlusOutlined, UploadOutlined, PrinterOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { listBusinessData, deleteBusinessDataBatch, updateBusinessData, createBusinessData, importBusinessData, downloadImportTemplate as downloadImportTemplateApi } from '../../api/businessDataApi.js';
import { usePermissionStore } from '../../stores/permission.js';

const { hasPermission } = usePermissionStore();
import { listTemplates, getTemplate, downloadPrintPdf, listFields, getLastPrintTemplate } from '../../api/templateApi.js';
import { listBusinessModules } from '../../api/businessModuleApi.js';
import { FIELD_DICT, TYPE_LABEL, PX_PER_MM, FALLBACK_MODULES } from '../../data/constants.js';
import { getBarcodeBarStyle as getBarcodeBarStyleBase, getBarcodeHumanText, getBarcodeHumanTextFontSize, isBarcodeHumanTextVisible } from '../../services/barcodeHumanTextService.js';

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
const fieldFilters = reactive({});
const total = ref(0);
const customPageSize = ref(null);

function applyCustomPageSize() {
  const size = Number(customPageSize.value);
  if (!size || size < 1) {
    message.warning('每页条数需大于 0');
    return;
  }
  filters.pageSize = Math.min(size, 10000);
  filters.page = 1;
  fetchData();
}
const modules = ref([]);
const fieldsByType = ref({});

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => { selectedRowKeys.value = keys; },
}));

const tablePagination = false;

// Flatten fields into row for dynamic column display
const displayRows = computed(() => {
  return rows.value.map(r => ({
    ...r,
    ...(r.fields || {}),
  }));
});

const moduleOptions = computed(() => modules.value.length ? modules.value : FALLBACK_MODULES);

const currentModule = computed(() => moduleOptions.value.find((item) => item.code === filters.type) || null);

const currentFields = computed(() => {
  return (fieldsByType.value[filters.type] || FIELD_DICT[filters.type] || [])
    .filter((field) => field.enabled !== false)
    .map((field) => ({
      ...field,
      required: !!field.required,
    }))
    .sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0));
});

const searchableFields = computed(() => {
  return currentFields.value.filter((f) => f.searchable && f.code !== codeFieldCode.value);
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
      sorter: field.sortable !== false,
      sortOrder: filters.sortField === field.code ? (filters.sortDir === 'ASC' ? 'ascend' : 'descend') : null,
    });
  }
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
  if (!type) return;
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
      fieldFilters: { ...fieldFilters },
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
function handleReset() { filters.keyword = ''; Object.keys(fieldFilters).forEach(k => delete fieldFilters[k]); filters.page = 1; fetchData(); }
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
function onPageSizeChange(current, size) {
  filters.pageSize = size;
  filters.page = 1;
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
async function downloadImportTemplate() {
  try {
    await downloadImportTemplateApi(filters.type);
  } catch (e) {
    message.error('下载失败: ' + (e.message || ''));
  }
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

  // Auto-select template: if only one enabled, select it;
  // if multiple, select the last one the user printed for this business type.
  if (printTemplates.value.length === 1) {
    selectPrintTemplate(printTemplates.value[0]);
  } else if (printTemplates.value.length > 1) {
    try {
      const data = await getLastPrintTemplate(filters.type);
      const lastId = data?.templateId;
      const matched = printTemplates.value.find(t => String(t.id) === String(lastId));
      if (matched) {
        selectPrintTemplate(matched);
      }
    } catch {
      // no last print record, leave unselected
    }
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

function getPrintPreviewData() {
  const first = printRecords.value[0];
  return first?.fields ? first.fields : (first || {});
}

function getBarcodeHumanTextStyle(el) {
  const tpl = selectedTemplate.value;
  const z = tpl ? Math.min(1.3, 300 / (tpl.size.width * PX_PER_MM)) : 1;
  return {
    fontSize: `${getBarcodeHumanTextFontSize(el, z)}px`,
    marginTop: `${2 * z}px`,
  };
}

function getBarcodeBarStyle(el) {
  const tpl = selectedTemplate.value;
  const z = tpl ? Math.min(1.3, 300 / (tpl.size.width * PX_PER_MM)) : 1;
  return getBarcodeBarStyleBase(el, z);
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
  const original = rows.value.find((r) => r.id === record.id) || record;
  editRecord.value = original;
  editFields.value = { ...(original.fields || {}) };
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

async function handleBatchDelete() {
  const selected = rows.value.filter(r => selectedRowKeys.value.includes(r.id));
  const codes = selected.map(r => r.businessCode).filter(Boolean);
  if (!codes.length) {
    message.warning('请先选择要删除的数据');
    return;
  }
  try {
    const result = await deleteBusinessDataBatch(filters.type, codes);
    message.success(`删除成功：${result.deleted || codes.length} 条`);
    selectedRowKeys.value = [];
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

watch(() => filters.type, async () => {
  filters.page = 1;
  filters.keyword = '';
  Object.keys(fieldFilters).forEach(k => delete fieldFilters[k]);
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
.search-form :deep(.ant-form-item) {
  margin-bottom: 12px;
}
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
.template-el.el-barcode .barcode-box { width: 100%; height: 100%; display: flex; flex-direction: column; }
.template-el.el-barcode .barcode { flex: 1; min-height: 0; width: 100%; background: repeating-linear-gradient(90deg, #333 0, #333 1px, #fff 1px, #fff 3px); }
.template-el.el-barcode .barcode-human-text { flex: 0 0 auto; width: 100%; line-height: 1; text-align: center; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
.page-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 16px;
  background: #fafbfc;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  flex-wrap: wrap;
}
.page-total {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
.page-divider {
  color: #e0e0e0;
  font-size: 14px;
}
.page-label {
  font-size: 13px;
  color: #888;
}
.page-suffix {
  font-size: 13px;
  color: #bbb;
}
</style>
