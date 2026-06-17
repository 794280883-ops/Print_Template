<template>
  <div class="field-dict">
    <a-card size="small">
      <div class="field-toolbar">
        <a-space>
          <a-button type="primary" @click="openModuleModal" v-permission="'field:module:create'">新增模块</a-button>
          <a-button @click="openCreateFieldModal" :disabled="!activeType" v-permission="'field:create'">新增字段</a-button>
          <a-button @click="openEditModuleModal" :disabled="!activeModule" v-permission="'field:module:edit'">编辑模块</a-button>
          <a-popconfirm
            :title="`确认删除模块「${activeModule?.name || activeType}」?`"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDeleteModule"
          >
            <a-button danger type="primary" v-permission="'field:module:delete'">删除模块</a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <a-tabs v-model:activeKey="activeType">
        <a-tab-pane
          v-for="module in moduleOptions"
          :key="module.code"
          :tab="`${module.name}字段`"
        />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="fields"
        :loading="loadingFields"
        :pagination="false"
        size="middle"
        :scroll="{ x: 'max-content' }"
        @resizeColumn="onResizeColumn"
        row-key="code"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ TYPE_LABEL[record.type] || record.type }}
          </template>
          <template v-else-if="column.key === 'required'">
            <a-tag :color="record.required ? 'red' : 'default'">
              {{ record.required ? '必填' : '选填' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.enabled !== false ? 'green' : 'default'">
              {{ record.enabled !== false ? '启用' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'example'">
            <code>{{ record.example }}</code>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" type="link" @click="openEditFieldModal(record)" v-permission="'field:edit'">编辑</a-button>
              <template v-if="record.enabled !== false">
                <a-popconfirm v-if="hasPermission('field:disable')" title="确认停用该字段?" @confirm="handleDisableField(record)">
                  <a-button size="small" danger type="link">停用</a-button>
                </a-popconfirm>
              </template>
              <template v-else>
                <a-button size="small" type="link" @click="handleEnableField(record)" v-permission="'field:enable'">启用</a-button>
              </template>
              <a-popconfirm v-if="hasPermission('field:delete')" title="确认删除该字段? 此操作不可恢复" @confirm="handleDeleteField(record)">
                <a-button size="small" danger type="link">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="moduleModalOpen"
      :title="moduleEditing ? '编辑模块' : '新增模块'"
      cancel-text="取消"
      ok-text="确认"
      :confirm-loading="saving"
      @ok="handleSaveModule"
    >
      <a-form layout="vertical">
        <a-form-item label="模块编码" required>
          <a-input v-model:value="moduleForm.code" :disabled="moduleEditing" placeholder="例如 PALLET" />
        </a-form-item>
        <a-form-item label="模块名称" required>
          <a-input v-model:value="moduleForm.name" placeholder="例如 托盘" />
        </a-form-item>
        <a-form-item label="模板类型名称" required>
          <a-input v-model:value="moduleForm.templateLabel" placeholder="例如 托盘模板" />
        </a-form-item>
        <a-form-item label="业务数据名称" required>
          <a-input v-model:value="moduleForm.dataLabel" placeholder="例如 托盘数据" />
        </a-form-item>
        <a-form-item label="主键字段编码" required>
          <a-input v-model:value="moduleForm.codeField" :disabled="moduleEditing" placeholder="例如 palletCode" />
        </a-form-item>
        <a-form-item v-if="!moduleEditing" label="主键字段名称" required>
          <a-input v-model:value="moduleForm.codeFieldName" placeholder="例如 托盘编码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="fieldModalOpen"
      :title="fieldEditing ? '编辑字段' : '新增字段'"
      cancel-text="取消"
      ok-text="确认"
      :confirm-loading="saving"
      @ok="handleSaveField"
    >
      <a-form layout="vertical">
        <a-form-item label="字段编码" required>
          <a-input v-model:value="fieldForm.code" :disabled="fieldEditing" placeholder="例如 palletCode" />
        </a-form-item>
        <a-form-item label="中文名称" required>
          <a-input v-model:value="fieldForm.name" placeholder="例如 托盘编码" />
        </a-form-item>
        <a-form-item label="字段类型" required>
          <a-select v-model:value="fieldForm.type">
            <a-select-option value="string">字符</a-select-option>
            <a-select-option value="number">数值</a-select-option>
            <a-select-option value="integer">整数</a-select-option>
            <a-select-option value="date">日期</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-checkbox v-model:checked="fieldForm.required">必填</a-checkbox>
            <a-checkbox v-model:checked="fieldForm.sortable">支持排序</a-checkbox>
          </a-space>
        </a-form-item>
        <a-form-item label="示例值">
          <a-input v-model:value="fieldForm.example" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="fieldForm.sortNo" :min="0" style="width:100%" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="fieldForm.desc" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  createBusinessModule,
  createModuleField,
  deleteBusinessModule,
  deleteModuleField,
  disableModuleField,
  enableModuleField,
  listBusinessModules,
  updateBusinessModule,
  updateModuleField,
} from '../../api/businessModuleApi.js';
import { listFields } from '../../api/templateApi.js';
import { FIELD_DICT, FALLBACK_MODULES, BUILT_IN_MODULE_CODES } from '../../data/constants.js';
import { usePermissionStore } from '../../stores/permission.js';

const { hasPermission } = usePermissionStore();

const activeType = ref('LOCATION');
const modules = ref([]);
const fieldMap = ref({});
const loadingFields = ref(false);
const saving = ref(false);
const moduleModalOpen = ref(false);
const fieldModalOpen = ref(false);
const fieldEditing = ref(false);
const fieldEditingCode = ref('');
const moduleEditing = ref(false);

const TYPE_LABEL = { string: '字符', number: '数值', integer: '整数', date: '日期' };


const columns = ref([
  { title: '中文名称', dataIndex: 'name', key: 'name', resizable: true, width: 140 },
  { title: '字段编码', dataIndex: 'code', key: 'code', resizable: true, width: 180 },
  { title: '类型', dataIndex: 'type', key: 'type', resizable: true, width: 70 },
  { title: '必填', dataIndex: 'required', key: 'required', width: 70 },
  { title: '状态', key: 'status', width: 70 },
  { title: '示例值', key: 'example', resizable: true, width: 180 },
  { title: '说明', dataIndex: 'desc', key: 'desc', resizable: true, width: 200, ellipsis: true },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]);

function onResizeColumn(w, col) {
  const idx = columns.value.findIndex(c => c.key === col.key);
  if (idx >= 0) columns.value[idx].width = w;
}

const moduleForm = ref(emptyModuleForm());
const fieldForm = ref(emptyFieldForm());

const moduleOptions = computed(() => modules.value.length ? modules.value : FALLBACK_MODULES);
const builtInCodes = new Set(BUILT_IN_MODULE_CODES);
const activeModule = computed(() => moduleOptions.value.find(item => item.code === activeType.value));
const canDeleteActiveModule = computed(() => !!activeType.value && !builtInCodes.has(activeType.value));

const fields = computed(() => {
  return (fieldMap.value[activeType.value] || FIELD_DICT[activeType.value] || []).map(f => ({
    ...f,
    required: !!f.required,
  }));
});

async function fetchModules() {
  try {
    const result = await listBusinessModules();
    modules.value = Array.isArray(result) ? result : [];
    if (!modules.value.some(item => item.code === activeType.value)) {
      activeType.value = modules.value[0]?.code || 'LOCATION';
    }
  } catch (error) {
    modules.value = [];
    message.warning('模块配置加载失败，已使用本地默认字段');
  }
}

async function fetchFields(type) {
  if (!type) return;
  loadingFields.value = true;
  try {
    fieldMap.value = {
      ...fieldMap.value,
      [type]: await listFields(type),
    };
  } catch (error) {
    message.warning('字段配置加载失败，已使用本地默认字段');
  } finally {
    loadingFields.value = false;
  }
}

function emptyModuleForm() {
  return {
    code: '',
    name: '',
    templateLabel: '',
    dataLabel: '',
    codeField: '',
    codeFieldName: '',
  };
}

function emptyFieldForm() {
  return {
    code: '',
    name: '',
    type: 'string',
    required: false,
    sortable: false,
    example: '',
    desc: '',
    sortNo: 0,
  };
}

function openModuleModal() {
  moduleForm.value = emptyModuleForm();
  moduleEditing.value = false;
  moduleModalOpen.value = true;
}

function openEditModuleModal() {
  if (!activeModule.value) return;
  moduleEditing.value = true;
  moduleForm.value = {
    code: activeModule.value.code,
    name: activeModule.value.name || '',
    templateLabel: activeModule.value.templateLabel || '',
    dataLabel: activeModule.value.dataLabel || '',
    codeField: activeModule.value.codeField || '',
    codeFieldName: '',
  };
  moduleModalOpen.value = true;
}

function openCreateFieldModal() {
  fieldEditing.value = false;
  fieldEditingCode.value = '';
  fieldForm.value = emptyFieldForm();
  fieldModalOpen.value = true;
}

function openEditFieldModal(record) {
  fieldEditing.value = true;
  fieldEditingCode.value = record.code;
  fieldForm.value = {
    code: record.code,
    name: record.name,
    type: record.type || 'string',
    required: !!record.required,
    sortable: !!record.sortable,
    example: record.example || '',
    desc: record.desc || '',
    sortNo: Number(record.sortNo || 0),
  };
  fieldModalOpen.value = true;
}

async function handleCreateModule() {
  const form = moduleForm.value;
  if (!form.code.trim() || !form.name.trim() || !form.codeField.trim() || !form.codeFieldName.trim()) {
    message.error('请填写模块编码、模块名称、主键字段编码和主键字段名称');
    return;
  }
  saving.value = true;
  try {
    const created = await createBusinessModule({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      templateLabel: form.templateLabel.trim() || `${form.name.trim()}模板`,
      dataLabel: form.dataLabel.trim() || `${form.name.trim()}数据`,
      codeField: form.codeField.trim(),
      fields: [{
        code: form.codeField.trim(),
        name: form.codeFieldName.trim(),
        type: 'string',
        required: true,
        sortNo: 10,
      }],
    });
    message.success('模块创建成功');
    moduleModalOpen.value = false;
    await fetchModules();
    activeType.value = created.code;
    await fetchFields(created.code);
  } catch (error) {
    message.error('模块创建失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleUpdateModule() {
  const form = moduleForm.value;
  if (!form.name.trim() || !form.templateLabel.trim() || !form.dataLabel.trim()) {
    message.error('请填写模块名称、模板类型名称和业务数据名称');
    return;
  }
  saving.value = true;
  try {
    const updated = await updateBusinessModule(form.code, {
      name: form.name.trim(),
      templateLabel: form.templateLabel.trim(),
      dataLabel: form.dataLabel.trim(),
    });
    message.success('模块已更新');
    moduleModalOpen.value = false;
    await fetchModules();
    activeType.value = updated.code;
  } catch (error) {
    message.error('模块更新失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

function handleSaveModule() {
  if (moduleEditing.value) {
    return handleUpdateModule();
  }
  return handleCreateModule();
}

async function handleSaveField() {
  const form = fieldForm.value;
  if (!form.code.trim() || !form.name.trim()) {
    message.error('请填写字段编码和中文名称');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      required: !!form.required,
      sortable: !!form.sortable,
      example: form.example.trim(),
      desc: form.desc.trim(),
      sortNo: Number(form.sortNo || 0),
    };
    if (fieldEditing.value) {
      await updateModuleField(activeType.value, fieldEditingCode.value, payload);
      message.success('字段已更新');
    } else {
      await createModuleField(activeType.value, payload);
      message.success('字段已新增');
    }
    fieldModalOpen.value = false;
    await fetchFields(activeType.value);
  } catch (error) {
    message.error('字段保存失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleDisableField(record) {
  saving.value = true;
  try {
    await disableModuleField(activeType.value, record.code);
    message.success('字段已停用');
    await fetchFields(activeType.value);
  } catch (error) {
    message.error('字段停用失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleEnableField(record) {
  saving.value = true;
  try {
    await enableModuleField(activeType.value, record.code);
    message.success('字段已启用');
    await fetchFields(activeType.value);
  } catch (error) {
    message.error('字段启用失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleDeleteField(record) {
  saving.value = true;
  try {
    await deleteModuleField(activeType.value, record.code);
    message.success('字段已删除');
    await fetchFields(activeType.value);
  } catch (error) {
    message.error('字段删除失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

async function handleDeleteModule() {
  if (!canDeleteActiveModule.value) {
    message.warning('系统内置模块不能删除');
    return;
  }
  saving.value = true;
  try {
    await deleteBusinessModule(activeType.value);
    message.success('模块已删除');
    delete fieldMap.value[activeType.value];
    await fetchModules();
    await fetchFields(activeType.value);
  } catch (error) {
    message.error('模块删除失败：' + (error.message || ''));
  } finally {
    saving.value = false;
  }
}

watch(activeType, (type) => {
  fetchFields(type);
});

onMounted(async () => {
  await fetchModules();
  await fetchFields(activeType.value);
});
</script>

<style scoped>
.field-dict { padding: 0; }
.field-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
