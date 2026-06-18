<template>
  <div class="designer">
    <!-- Toolbar -->
    <div class="designer-top">
      <div style="display:flex;align-items:center;gap:12px;">
        <a-button type="link" @click="goBack">
          <ArrowLeftOutlined /> 返回列表
        </a-button>
        <a-button-group>
          <a-button :disabled="!history.length" @click="undo"><UndoOutlined /></a-button>
          <a-button :disabled="!future.length" @click="redo"><RedoOutlined /></a-button>
        </a-button-group>
        <a-input
          id="templateName"
          v-model:value="templateName"
          placeholder="模板名称"
          size="small"
          style="width:180px"
        />
        <span class="designer-size-editor">
          <span class="designer-size-label">宽</span>
          <a-input-number id="templateWidth" v-model:value="templateWidth" :min="1" :step="0.5" size="small" style="width:62px" @change="onSizeChange" />
          <span>×</span>
          <span class="designer-size-label">高</span>
          <a-input-number id="templateHeight" v-model:value="templateHeight" :min="1" :step="0.5" size="small" style="width:62px" @change="onSizeChange" />
          <span class="designer-unit-text">mm</span>
        </span>
      </div>
      <div class="toolbar-actions">
        <a-button :loading="saving" type="primary" @click="handleSave">
          <SaveOutlined /> 保存
        </a-button>
<a-button @click="handlePreview" style="margin-left:8px">
          <EyeOutlined /> 预览
        </a-button>
      </div>
    </div>

    <!-- Body -->
    <div v-if="template" class="designer-body">
      <!-- Left Component Panel -->
      <aside class="toolbox">
        <div class="tool-section">
          <h3>组件区</h3>
          <div class="component-list">
            <div v-for="comp in COMPONENTS" :key="comp.type + comp.label"
              class="component-btn" draggable="true"
              @dragstart="handleDragStart($event, comp)"
              @click="addElementFromData(comp)"
            >
              <strong>{{ comp.icon }}</strong><span>{{ comp.label }}</span>
            </div>
          </div>
        </div>
        <div class="tool-section" style="overflow:auto;flex:1">
          <h3>模版字段</h3>
          <div v-for="field in currentFields" :key="field.code"
            class="field-chip" draggable="true"
            @dragstart="handleFieldDragStart($event, field)"
          >
            <span>{{ field.name }}</span>
          </div>
        </div>
      </aside>

      <!-- Center Canvas -->
      <section class="canvas-shell">
        <div class="canvas-toolbar">
          <div class="toolbar-actions">
            <a-switch id="gridToggle" v-model:checked="showGrid" size="small" /> 网格
          </div>
          <div class="toolbar-actions">
            <a-select id="zoomSelect" v-model:value="zoom" style="width:90px" size="small">
              <a-select-option :value="0.75">75%</a-select-option>
              <a-select-option :value="1">100%</a-select-option>
              <a-select-option :value="1.25">125%</a-select-option>
              <a-select-option :value="1.5">150%</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="canvas-stage" ref="canvasStageRef" @click.self="deselect">
          <div class="label-canvas" :class="{ 'grid-on': showGrid }"
            :style="canvasStyle" ref="canvasRef"
            @drop.prevent="handleDrop" @dragover.prevent
          >
            <div v-for="el in template.elements" :key="el.id"
              class="template-el" :class="[`el-${el.type}`, { selected: selectedElementId === el.id }]"
              :style="getElementStyle(el)"
              @mousedown.stop="startElementDrag($event, el.id)"
            >
              <!-- text -->
              <div v-if="el.type === 'text'" class="el-content">{{ getTextDisplay(el) }}</div>
              <!-- qrcode/barcode -->
              <div v-else-if="el.type === 'qrcode'" class="qr" :title="el.bindField"></div>
              <div v-else-if="el.type === 'barcode'" class="barcode-box" :title="el.bindField">
                <div class="barcode"></div>
                <div v-if="isBarcodeHumanTextVisible(el)" class="barcode-human-text" :style="getBarcodeHumanTextStyle(el, zoom)">
                  {{ getBarcodeHumanText(el) }}
                </div>
              </div>
              <!-- checkbox -->
              <div v-else-if="el.type === 'checkbox'" class="checkbox-content">
                <span class="checkbox-mark" :class="{ checked: el.checked }">{{ el.checked ? '✓' : '' }}</span>
                <span v-if="el.text" class="checkbox-label">{{ el.text }}</span>
              </div>
              <!-- line/rect: no inner content -->
              <!-- resize handles -->
              <template v-if="selectedElementId === el.id">
                <span v-for="h in (el.type === 'line' ? lineResizeHandles(el) : ['nw','n','ne','e','se','s','sw','w'])" :key="h"
                  class="resize-handle" :class="h"
                  @mousedown.stop="startResize($event, el.id, h)"></span>
              </template>
            </div>
          </div>
        </div>
        <!-- Validation Panel -->
        <div class="validation-panel">
          <div class="validation-head">
            <span>校验结果</span>
            <span class="section-meta">
              {{ validation.canPublish ? '可保存' : '不可保存' }}
              · 错误 {{ validation.errors.length }} / 警告 {{ validation.warnings.length }} / 提示 {{ validation.tips.length }}
            </span>
          </div>
          <div class="validation-list">
            <template v-if="allValidationItems.length">
              <div v-for="(item, i) in allValidationItems" :key="i"
                class="validation-item" :class="item.level"
                @click="item.elementId && (selectedElementId = item.elementId)"
              >
                <strong>{{ item.label }}</strong> {{ item.message }}
                <br v-if="item.elementId" /><small v-if="item.elementId">元素：{{ item.elementId }}</small>
              </div>
            </template>
            <div v-else class="empty-state">暂无校验结果</div>
          </div>
        </div>
      </section>

      <!-- Right Properties Panel -->
      <aside class="props-panel">
        <div class="section-head" style="border-bottom:1px solid var(--wms-line)">
          <span style="font-weight:700">属性区</span>
          <span class="section-meta">{{ selectedElement ? selectedElement.id : '未选择元素' }}</span>
        </div>
        <div class="props-body">
          <template v-if="selectedElement">
            <a-form layout="vertical" size="small">
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="X mm"><a-input-number v-model:value="selectedElement.x" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="Y mm"><a-input-number v-model:value="selectedElement.y" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col v-if="selectedElement.type !== 'line'" :span="12"><a-form-item label="宽 mm"><a-input-number v-model:value="selectedElement.width" :min="1" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col v-if="selectedElement.type !== 'line'" :span="12"><a-form-item label="高 mm"><a-input-number v-model:value="selectedElement.height" :min="1" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="层级"><a-input-number v-model:value="selectedElement.zIndex" :min="1" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="旋转"><a-select v-model:value="selectedElement.rotate" data-prop="rotation" @change="onPropChange"><a-select-option :value="0">0°</a-select-option><a-select-option :value="90">90°</a-select-option><a-select-option :value="180">180°</a-select-option><a-select-option :value="270">270°</a-select-option></a-select></a-form-item></a-col>
              </a-row>
              <!-- Text-specific props -->
              <template v-if="selectedElement.type === 'text'">
                <a-row :gutter="8">
                  <a-col :span="24"><a-form-item label="文本类型"><a-radio-group v-model:value="selectedElement.textKind" data-prop="textType" button-style="solid" @change="onPropChange"><a-radio-button value="static">静态文本</a-radio-button><a-radio-button value="field">动态字段</a-radio-button></a-radio-group></a-form-item></a-col>
                  <a-col :span="24"><a-form-item label="绑定字段"><a-select id="bindField" v-model:value="selectedElement.bindField" data-prop="bindField" @change="onPropChange"><a-select-option value="">请选择字段</a-select-option><a-select-option v-for="f in currentFields" :key="f.code" :value="f.code">{{ f.name }}</a-select-option></a-select></a-form-item></a-col>
                  <a-col v-if="selectedElement.textKind === 'static'" :span="24"><a-form-item label="静态内容"><a-textarea v-model:value="selectedElement.text" data-prop="staticContent" :rows="2" @change="onPropChange" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="字号 px"><a-input-number v-model:value="selectedElement.fontSize" data-prop="fontSize" :min="1" :step="1" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label=" "><a-checkbox v-model:checked="selectedElement.bold" data-prop="bold" @change="onPropChange">加粗</a-checkbox></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="对齐"><a-select v-model:value="selectedElement.align" data-prop="textAlign" @change="onPropChange"><a-select-option value="left">左对齐</a-select-option><a-select-option value="center">居中</a-select-option><a-select-option value="right">右对齐</a-select-option></a-select></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="颜色"><a-input type="color" v-model:value="selectedElement.color" data-prop="color" @change="onPropChange" /></a-form-item></a-col>
                </a-row>
              </template>
              <!-- QR/Barcode props -->
              <template v-if="selectedElement.type === 'qrcode' || selectedElement.type === 'barcode'">
                <a-form-item label="绑定字段"><a-select v-model:value="selectedElement.bindField" data-prop="bindField" @change="onPropChange"><a-select-option value="">请选择字段</a-select-option><a-select-option v-for="f in currentFields" :key="f.code" :value="f.code">{{ f.name }}</a-select-option></a-select></a-form-item>
                <template v-if="selectedElement.type === 'barcode'">
                  <a-row :gutter="8">
                    <a-col :span="12"><a-form-item><a-checkbox v-model:checked="selectedElement.showHumanText" data-prop="showHumanText" @change="onPropChange">显示文字</a-checkbox></a-form-item></a-col>
                    <a-col :span="12"><a-form-item label="文字字号 px"><a-input-number v-model:value="selectedElement.humanTextFontSize" :min="6" :step="1" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                  </a-row>
                </template>
              </template>
              <!-- Checkbox props -->
              <template v-if="selectedElement.type === 'checkbox'">
                <a-form-item><a-checkbox v-model:checked="selectedElement.checked" data-prop="checked" @change="onPropChange">选中</a-checkbox></a-form-item>
                <a-form-item label="固定文字"><a-input v-model:value="selectedElement.text" data-prop="fixedText" @change="onPropChange" placeholder="例如：易碎 / 已复核" /></a-form-item>
                <a-form-item label="边框颜色"><a-input type="color" v-model:value="selectedElement.color" data-prop="borderColor" @change="onPropChange" /></a-form-item>
              </template>
              <!-- Rect props -->
              <template v-if="selectedElement.type === 'rect'">
                <a-form-item label="背景色"><a-input type="color" v-model:value="selectedElement.backgroundColor" data-prop="bgColor" @change="onPropChange" /></a-form-item>
              </template>
              <!-- Line props -->
              <template v-if="selectedElement.type === 'line'">
                <a-row :gutter="8">
                  <a-col :span="12">
                    <a-form-item label="方向">
                      <a-radio-group v-model:value="lineDirection" button-style="solid">
                        <a-radio-button value="horizontal">横向</a-radio-button>
                        <a-radio-button value="vertical">纵向</a-radio-button>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="长度 mm">
                      <a-input-number v-model:value="lineLength" :min="1" :step="0.5" style="width:100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="8">
                  <a-col :span="12">
                    <a-form-item label="粗细 mm">
                      <a-input-number v-model:value="lineThickness" :min="0.5" :step="0.5" style="width:100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-form-item label="线条颜色"><a-input type="color" v-model:value="selectedElement.color" data-prop="lineColor" @change="onPropChange" /></a-form-item>
              </template>
              <a-button danger block style="margin-top:12px" @click="deleteSelected"><DeleteOutlined /> 删除元素</a-button>
            </a-form>
          </template>
          <div v-else class="empty-state">点击画布元素后编辑属性；也可从左侧组件区添加新元素。</div>
        </div>
      </aside>
    </div>

    <!-- Preview Modal -->
    <a-modal v-if="template" v-model:open="previewVisible" title="模板预览" width="760px" :footer="false">
      <div class="preview-wrap">
        <div class="preview-card">
          <div class="label-canvas" :style="previewCanvasStyle">
            <div v-for="el in template.elements" :key="el.id"
              class="template-el" :class="[`el-${el.type}`]"
              :style="getPreviewElementStyle(el)">
              <div v-if="el.type === 'text'" class="el-content">{{ getTextDisplay(el) }}</div>
              <div v-else-if="el.type === 'qrcode'" class="qr" :title="el.bindField"></div>
              <div v-else-if="el.type === 'barcode'" class="barcode-box" :title="el.bindField">
                <div class="barcode"></div>
                <div v-if="isBarcodeHumanTextVisible(el)" class="barcode-human-text" :style="getBarcodeHumanTextStyle(el, previewZoom)">
                  {{ getBarcodeHumanText(el) }}
                </div>
              </div>
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
            <div><b>模板名称：</b>{{ template.templateName }}</div>
            <div><b>模板类型：</b>{{ TYPE_LABEL[template.templateType] || template.templateType }}</div>
            <div><b>尺寸：</b>{{ template.size.width }} × {{ template.size.height }}mm</div>
            <div><b>状态：</b><a-tag :color="template.status === 'enabled' ? 'green' : 'red'">{{ STATUS_LABEL[template.status] || template.status }}</a-tag></div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  UndoOutlined, RedoOutlined, SaveOutlined,
  EyeOutlined, ArrowLeftOutlined, DeleteOutlined,
} from '@ant-design/icons-vue';
import { getTemplate, updateTemplate, listFields } from '../../api/templateApi.js';
import { COMPONENTS, FIELD_DICT, PX_PER_MM, TYPE_LABEL, STATUS_LABEL } from '../../data/constants.js';
import { validateTemplateDsl } from '../../services/validationService.js';
import { resizeElementFromHandle } from '../../services/resizeService.js';
import { getBarcodeHumanText, getBarcodeHumanTextFontSize, isBarcodeHumanTextVisible } from '../../services/barcodeHumanTextService.js';
import { loadTemplateForDesigner, normalizeTemplateType, resolveTemplateFields } from './templateDesignerLoader.js';

const route = useRoute();
const router = useRouter();

// ── State ──
const template = ref(null);
const selectedElementId = ref(null);
const zoom = ref(1);
const showGrid = ref(true);
const history = ref([]);
const future = ref([]);
const validation = ref({ errors: [], warnings: [], tips: [], canPublish: false });
const loading = ref(false);
const saving = ref(false);
const previewVisible = ref(false);
const templateWidth = ref(100);
const templateHeight = ref(80);
const templateName = ref('');
const fieldsByType = ref({});

// Canvas refs
const canvasRef = ref(null);
const canvasStageRef = ref(null);

// Keep templateName in sync with loaded template
watch(() => template.value?.templateName, (val) => {
  if (val !== undefined && templateName.value !== val) {
    templateName.value = val;
  }
});
watch(templateName, (val) => {
  if (template.value && val !== template.value.templateName) {
    template.value.templateName = val;
  }
});

// Drag state (non-reactive, managed via event listeners)
let dragState = null;

// ── Helpers ──
function uid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }
function deepClone(x) { return JSON.parse(JSON.stringify(x)); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v))); }
function round1(v) { return Math.round(Number(v) * 10) / 10; }
function alignToFlex(a) { return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start'; }

// ── Computed ──
const selectedElement = computed(() => {
  if (!template.value || !selectedElementId.value) return null;
  return template.value.elements.find(el => el.id === selectedElementId.value) || null;
});

const currentFields = computed(() => {
  if (!template.value) return [];
  return resolveTemplateFields(template.value.templateType, fieldsByType.value, FIELD_DICT);
});

const canvasStyle = computed(() => {
  if (!template.value) return {};
  const w = template.value.size.width * PX_PER_MM * zoom.value;
  const h = template.value.size.height * PX_PER_MM * zoom.value;
  return { width: `${w}px`, height: `${h}px` };
});

const allValidationItems = computed(() => [
  ...validation.value.errors.map(x => ({ ...x, level: 'error', label: '错误' })),
  ...validation.value.warnings.map(x => ({ ...x, level: 'warning', label: '警告' })),
  ...validation.value.tips.map(x => ({ ...x, level: 'tip', label: '提示' })),
]);

const lineDirection = computed({
  get() {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return 'horizontal';
    return el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
  },
  set(val) {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return;
    if ((el.direction || (el.height <= el.width ? 'horizontal' : 'vertical')) !== val) {
      pushHistory();
      const w = el.width;
      el.width = el.height;
      el.height = w;
      el.direction = val;
    }
  },
});

const lineLength = computed({
  get() {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return 0;
    const dir = el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
    return dir === 'horizontal' ? el.width : el.height;
  },
  set(val) {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return;
    const dir = el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
    if (dir === 'horizontal') {
      el.width = Number(val);
    } else {
      el.height = Number(val);
    }
  },
});

const lineThickness = computed({
  get() {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return 1;
    const dir = el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
    return dir === 'horizontal' ? el.height : el.width;
  },
  set(val) {
    const el = selectedElement.value;
    if (!el || el.type !== 'line') return;
    const dir = el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
    if (dir === 'horizontal') {
      el.height = Number(val);
    } else {
      el.width = Number(val);
    }
  },
});

const previewCanvasStyle = computed(() => {
  if (!template.value) return {};
  const tpl = template.value;
  const availWidth = 480;
  const z = previewZoom.value;
  return { width: `${tpl.size.width * PX_PER_MM * z}px`, height: `${tpl.size.height * PX_PER_MM * z}px` };
});

const previewZoom = computed(() => {
  if (!template.value) return 1;
  const availWidth = 480;
  return Math.min(2, availWidth / (template.value.size.width * PX_PER_MM));
});

function getElementStyle(el) {
  const justify = ['qrcode', 'barcode', 'image'].includes(el.type) ? 'center' : alignToFlex(el.align || 'left');
  return {
    left: `${el.x * PX_PER_MM * zoom.value}px`,
    top: `${el.y * PX_PER_MM * zoom.value}px`,
    width: `${el.width * PX_PER_MM * zoom.value}px`,
    height: `${el.height * PX_PER_MM * zoom.value}px`,
    zIndex: el.zIndex || 1,
    fontSize: `${(el.fontSize || 12) * zoom.value}px`,
    fontWeight: el.bold ? 700 : 400,
    justifyContent: justify,
    color: el.color || '#111827',
    background: el.type === 'line' ? (el.color || '#111827') : (el.backgroundColor || 'transparent'),
    transform: `rotate(${el.rotate || 0}deg)`,
  };
}

function getPreviewElementStyle(el) {
  const tpl = template.value;
  const z = previewZoom.value;
  const justify = ['qrcode', 'barcode', 'image'].includes(el.type) ? 'center' : alignToFlex(el.align || 'left');
  return {
    left: `${el.x * PX_PER_MM * z}px`,
    top: `${el.y * PX_PER_MM * z}px`,
    width: `${el.width * PX_PER_MM * z}px`,
    height: `${el.height * PX_PER_MM * z}px`,
    zIndex: el.zIndex || 1,
    fontSize: `${(el.fontSize || 12) * z}px`,
    fontWeight: el.bold ? 700 : 400,
    justifyContent: justify,
    color: el.color || '#111827',
    background: el.type === 'line' ? (el.color || '#111827') : (el.backgroundColor || 'transparent'),
    transform: `rotate(${el.rotate || 0}deg)`,
  };
}

function getBarcodeHumanTextStyle(el, scale) {
  return {
    fontSize: `${getBarcodeHumanTextFontSize(el, scale)}px`,
    marginTop: `${2 * Number(scale || 1)}px`,
  };
}

function getTextDisplay(el) {
  if (el.type !== 'text') return '';
  if (el.textKind === 'field') {
    const f = currentFields.value.find(x => x.code === el.bindField);
    if (!f) return el.bindField || '未绑定';
    if (el.bindField === 'directionMark') return '↑↓';
    return f.name;
  }
  return el.text ?? '静态文本';
}

// ── History ──
function lineResizeHandles(el) {
  const dir = el.direction || (el.height <= el.width ? 'horizontal' : 'vertical');
  return dir === 'horizontal' ? ['e', 'w'] : ['n', 's'];
}

function pushHistory() {
  history.value.push(deepClone(template.value.elements));
  if (history.value.length > 10) history.value.shift();
  future.value = [];
}

function undo() {
  if (!history.value.length) return;
  future.value.push(deepClone(template.value.elements));
  template.value.elements = history.value.pop();
  selectedElementId.value = template.value.elements[0]?.id || null;
}

function redo() {
  if (!future.value.length) return;
  history.value.push(deepClone(template.value.elements));
  template.value.elements = future.value.pop();
  selectedElementId.value = template.value.elements[0]?.id || null;
}

// ── Element Operations ──
function selectElement(id) {
  if (id !== selectedElementId.value) pushHistory();
  selectedElementId.value = id;
}

function deselect() {
  selectedElementId.value = null;
}

function addElementFromData(data) {
  if (!template.value) return;
  pushHistory();
  const base = {
    id: uid(data.type || 'el'), type: data.type || 'text',
    x: Math.max(4, Math.min(12 + template.value.elements.length * 2, template.value.size.width - 12)),
    y: Math.max(4, Math.min(8 + template.value.elements.length * 2, template.value.size.height - 8)),
    width: 24, height: 8, textKind: 'static', text: data.label || '元素',
    fontSize: 12, bold: false, align: 'left', color: '#111827',
    backgroundColor: 'transparent', zIndex: template.value.elements.length + 1,
  };
  const el = { ...base, ...deepClone(data.preset || {}) };
  normalizeBarcodeElementOptions(el);
  if ((el.type === 'qrcode' || el.type === 'barcode' || el.textKind === 'field') &&
      (!el.bindField || !currentFields.value.some(f => f.code === el.bindField))) {
    el.bindField = currentFields.value[0]?.code || '';
  }
  if (el.type === 'text' && el.textKind === 'field') {
    const boundField = currentFields.value.find(f => f.code === el.bindField);
    if (boundField) el.text = boundField.name;
  }
  template.value.elements.push(el);
  selectedElementId.value = el.id;
}

function deleteSelected() {
  if (!selectedElementId.value || !template.value) return;
  pushHistory();
  template.value.elements = template.value.elements.filter(el => el.id !== selectedElementId.value);
  selectedElementId.value = template.value.elements[0]?.id || null;
}

let clipboardElement = null;
function copySelected() {
  const el = template.value?.elements.find(x => x.id === selectedElementId.value);
  if (!el) return message.info('请先选择元素');
  clipboardElement = deepClone(el);
  message.success('已复制元素');
}

function pasteSelected() {
  if (!clipboardElement || !template.value) return;
  pushHistory();
  const el = { ...deepClone(clipboardElement), id: uid(clipboardElement.type), x: clipboardElement.x + 3, y: clipboardElement.y + 3 };
  template.value.elements.push(el);
  selectedElementId.value = el.id;
}

function onPropChange() {}

function onSizeChange() {
  if (!template.value) return;
  pushHistory();
  template.value.size.width = templateWidth.value;
  template.value.size.height = templateHeight.value;
}

// ── Canvas Element Drag/Resize ──
function startElementDrag(event, elId) {
  const el = template.value?.elements.find(x => x.id === elId);
  if (!el) return;
  if (selectedElementId.value !== elId) pushHistory();
  selectedElementId.value = elId;
  dragState = {
    id: elId, mode: 'drag', handle: '',
    startX: event.clientX, startY: event.clientY,
    original: deepClone(el),
  };
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', endPointerMove, { once: true });
}

function startResize(event, elId, handle) {
  const el = template.value?.elements.find(x => x.id === elId);
  if (!el) return;
  if (selectedElementId.value !== elId) pushHistory();
  selectedElementId.value = elId;
  dragState = {
    id: elId, mode: 'resize', handle,
    startX: event.clientX, startY: event.clientY,
    original: deepClone(el),
  };
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', endPointerMove, { once: true });
}

function onPointerMove(event) {
  if (!dragState || !template.value) return;
  const el = template.value.elements.find(x => x.id === dragState.id);
  if (!el) return;
  const dx = (event.clientX - dragState.startX) / (PX_PER_MM * zoom.value);
  const dy = (event.clientY - dragState.startY) / (PX_PER_MM * zoom.value);
  const o = dragState.original;
  const tw = template.value.size.width;
  const th = template.value.size.height;

  if (dragState.mode === 'drag') {
    el.x = round1(clamp(o.x + dx, -o.width + 1, tw - 1));
    el.y = round1(clamp(o.y + dy, -o.height + 1, th - 1));
  } else {
    let { x, y, width: w, height: h } = resizeElementFromHandle(o, dragState.handle, { dx, dy });
    w = Math.max(1, w);
    h = Math.max(1, h);
    el.x = round1(clamp(x, -w + 1, tw - 1));
    el.y = round1(clamp(y, -h + 1, th - 1));
    el.width = round1(w);
    el.height = round1(h);
  }
}

function endPointerMove() {
  document.removeEventListener('pointermove', onPointerMove);
  dragState = null;
}

// ── Palette Drag & Drop ──
function handleDragStart(event, comp) {
  event.dataTransfer.setData('application/json', JSON.stringify(comp));
}

function handleFieldDragStart(event, field) {
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'text', preset: { textKind: 'field', bindField: field.code, text: field.name, width: 34, height: 8, fontSize: 12 },
  }));
}

function handleDrop(event) {
  if (!canvasRef.value || !template.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const data = JSON.parse(event.dataTransfer.getData('application/json'));
  const x = round1((event.clientX - rect.left) / zoom.value / PX_PER_MM);
  const y = round1((event.clientY - rect.top) / zoom.value / PX_PER_MM);
  pushHistory();
  const base = {
    id: uid(data.type || 'el'), type: data.type || 'text',
    x: Math.max(0, Math.min(x, template.value.size.width - 10)),
    y: Math.max(0, Math.min(y, template.value.size.height - 10)),
    width: 24, height: 8, textKind: 'static', text: data.label || '元素',
    fontSize: 12, bold: false, align: 'left', color: '#111827',
    backgroundColor: 'transparent', zIndex: template.value.elements.length + 1,
  };
  const el = { ...base, ...deepClone(data.preset || {}) };
  normalizeBarcodeElementOptions(el);
  if ((el.type === 'qrcode' || el.type === 'barcode' || el.textKind === 'field') &&
      (!el.bindField || !currentFields.value.some(f => f.code === el.bindField))) {
    el.bindField = currentFields.value[0]?.code || '';
  }
  if (el.type === 'text' && el.textKind === 'field') {
    const boundField = currentFields.value.find(f => f.code === el.bindField);
    if (boundField) el.text = boundField.name;
  }
  template.value.elements.push(el);
  selectedElementId.value = el.id;
}

// ── Save / Preview ──
async function handleSave() {
  if (!template.value) return;
  validation.value = validateTemplateDsl(template.value, currentFields.value);
  const { errors, warnings } = validation.value;
  if (errors.length || warnings.length) {
    message.error(`校验未通过：${errors.length} 个错误，${warnings.length} 个警告，请修复后再保存`);
    setTimeout(() => {
      document.querySelector('.validation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return;
  }
  saving.value = true;
  try {
    const payload = deepClone(template.value);
    await updateTemplate(template.value.id, payload);
    message.success('模板已保存');
  } catch (error) {
    message.error(`保存失败：${error.message}`);
  } finally {
    saving.value = false;
  }
}

function handlePreview() {
  previewVisible.value = true;
}

function goBack() {
  router.push('/templates');
}

// ── Keyboard Shortcuts ──
function handleKeyDown(event) {
  if (!template.value) return;
  const tag = document.activeElement?.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  const el = template.value.elements.find(x => x.id === selectedElementId.value);
  if (!el) return;

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    copySelected();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
    event.preventDefault();
    pasteSelected();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    pushHistory();
    const step = event.shiftKey ? 5 : 1;
    const tw = template.value.size.width;
    const th = template.value.size.height;
    if (event.key === 'ArrowLeft') el.x = round1(clamp(el.x - step, -el.width + 1, tw - 1));
    if (event.key === 'ArrowRight') el.x = round1(clamp(el.x + step, -el.width + 1, tw - 1));
    if (event.key === 'ArrowUp') el.y = round1(clamp(el.y - step, -el.height + 1, th - 1));
    if (event.key === 'ArrowDown') el.y = round1(clamp(el.y + step, -el.height + 1, th - 1));
  }
}

// ── Lifecycle ──
let loadVersion = 0;

async function loadDesignerTemplate(id) {
  if (!id) return;
  const version = ++loadVersion;
  loading.value = true;
  try {
    const tpl = await loadTemplateForDesigner(id, { getTemplate, fetchFields });
    if (version !== loadVersion) return;
    (tpl.elements || []).forEach(normalizeBarcodeElementOptions);
    template.value = tpl;
    templateWidth.value = tpl.size.width;
    templateHeight.value = tpl.size.height;
    if (tpl.elements?.length) selectedElementId.value = tpl.elements[0].id;
    else selectedElementId.value = null;
    history.value = [];
    future.value = [];
    validation.value = { errors: [], warnings: [], tips: [], canPublish: false };
  } catch (error) {
    if (version !== loadVersion) return;
    message.error(`加载模板失败：${error.message}`);
  } finally {
    if (version === loadVersion) loading.value = false;
  }
}

function normalizeBarcodeElementOptions(el) {
  if (el?.type !== 'barcode') return;
  if (el.showHumanText === undefined) el.showHumanText = true;
  if (!el.humanTextFontSize) el.humanTextFontSize = 8;
}

watch(() => route.params.id, (id) => {
  loadDesignerTemplate(id);
}, { immediate: true });

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

async function fetchFields(templateType) {
  const normalizedType = normalizeTemplateType(templateType);
  if (!normalizedType) return;
  try {
    fieldsByType.value = {
      ...fieldsByType.value,
      [normalizedType]: await listFields(normalizedType),
    };
  } catch {
    if (!FIELD_DICT[normalizedType]) message.warning('模板字段加载失败');
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* ── Layout ── */
.designer {
  display: flex; flex-direction: column;
  height: calc(100vh - 80px);
  gap: 10px;
}
.designer-top {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
  padding: 8px 14px; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  gap: 8px;
}
.designer-size-editor { display: flex; align-items: center; gap: 4px; }
.designer-size-label { font-size: 13px; color: var(--wms-muted); }
.designer-unit-text { font-size: 13px; color: var(--wms-muted); }
.toolbar-actions { display: flex; align-items: center; gap: 4px; }

.designer-body {
  flex: 1; display: flex; gap: 10px; overflow: hidden; min-height: 0;
}

/* ── Left: Component Panel ── */
.toolbox {
  width: 170px; flex-shrink: 0;
  background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  padding: 12px; display: flex; flex-direction: column; overflow-y: auto;
  gap: 12px;
}
.tool-section h3 { font-size: 14px; margin-bottom: 8px; color: var(--wms-text); }
.component-list { display: flex; flex-direction: column; gap: 6px; }
.component-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border: 1px solid #e8edf2; border-radius: 6px;
  cursor: grab; font-size: 13px; user-select: none;
}
.component-btn:hover { border-color: var(--wms-blue); background: #f0f7ff; }
.component-btn strong { color: var(--wms-blue); width: 20px; text-align: center; }
.field-chip {
  display: flex; flex-direction: column; gap: 2px;
  padding: 6px 10px; margin-bottom: 4px; border: 1px solid #e8edf2; border-radius: 6px;
  cursor: grab; font-size: 13px; user-select: none;
}
.field-chip:hover { border-color: var(--wms-blue); background: #f0f7ff; }
.field-chip code { font-size: 11px; color: var(--wms-muted); }

/* ── Center: Canvas ── */
.canvas-shell {
  flex: 1; display: flex; flex-direction: column; gap: 8px; overflow: hidden;
}
.canvas-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 12px; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
}
.canvas-stage {
  flex: 1; overflow: auto;
  background: #eef2f7; border: 1px solid #f0f0f0; border-radius: 8px;
  padding: 20px; display: flex; align-items: flex-start; justify-content: center;
}
.label-canvas {
  position: relative; background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.label-canvas.grid-on {
  background-image:
    linear-gradient(to right, #e8edf2 1px, transparent 1px),
    linear-gradient(to bottom, #e8edf2 1px, transparent 1px);
  background-size: 5mm 5mm;
}

/* ── Template Elements ── */
.template-el {
  position: absolute; cursor: move; overflow: hidden;
  display: flex; align-items: center;
  border: 1px solid transparent;
  box-sizing: border-box;
}
.template-el.selected { border-color: var(--wms-blue); outline: 2px solid rgba(0,128,255,0.25); }
.el-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.el-qrcode, .el-barcode { background: #f9f9f9; }
.qr { width: 100%; height: 100%; background: repeating-conic-gradient(#999 0% 25%, #fff 0% 50%) 50% / 8px 8px; border: 1px dashed #ddd; }
.barcode-box { width: 100%; height: 100%; display: flex; flex-direction: column; }
.barcode { flex: 1; min-height: 0; width: 100%; background: repeating-linear-gradient(90deg, #333 0px 2px, #fff 2px 4px); border: 1px dashed #ddd; }
.barcode-human-text { flex: 0 0 auto; width: 100%; line-height: 1; text-align: center; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.checkbox-content { display: flex; align-items: center; gap: 4px; }
.checkbox-mark { width: 16px; height: 16px; border: 2px solid #999; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.checkbox-mark.checked { background: var(--wms-blue); border-color: var(--wms-blue); color: #fff; }
.checkbox-label { font-size: 12px; }

/* Resize handles */
.resize-handle { position: absolute; width: 8px; height: 8px; background: #fff; border: 1.5px solid var(--wms-blue); border-radius: 2px; z-index: 10; }
.resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle.n { top: -4px; left: 50%; margin-left: -4px; cursor: n-resize; }
.resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
.resize-handle.e { top: 50%; margin-top: -4px; right: -4px; cursor: e-resize; }
.resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
.resize-handle.s { bottom: -4px; left: 50%; margin-left: -4px; cursor: s-resize; }
.resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.resize-handle.w { top: 50%; margin-top: -4px; left: -4px; cursor: w-resize; }

/* ── Validation Panel ── */
.validation-panel {
  background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  margin-top: 4px; max-height: 120px; overflow-y: auto;
}
.validation-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
  font-size: 13px; font-weight: 600;
}
.validation-list { padding: 6px 12px; }
.validation-item { padding: 4px 0; font-size: 12px; cursor: pointer; border-bottom: 1px solid #fafafa; }
.validation-item.error { color: #ef4444; }
.validation-item.warning { color: #f59e0b; }
.validation-item.tip { color: #6d7b92; }
.validation-item strong { margin-right: 4px; }
.empty-state { color: var(--wms-muted); font-size: 13px; padding: 8px 0; text-align: center; }

/* ── Right: Properties Panel ── */
.props-panel {
  width: 240px; flex-shrink: 0;
  background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  display: flex; flex-direction: column; overflow-y: auto;
}
.section-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; font-size: 13px;
}
.section-meta { font-size: 12px; color: var(--wms-muted); }
.props-body { flex: 1; overflow-y: auto; padding: 14px; }

/* ── Preview Modal ── */
.preview-wrap { display: flex; gap: 20px; align-items: flex-start; }
.preview-card { flex-shrink: 0; padding: 16px; background: #eef2f7; border-radius: 8px; }

/* ── Deep styles for AntDV form items inside designer ── */
.designer :deep(.ant-form-item) { margin-bottom: 8px; }
.designer :deep(.ant-form-item-label) { padding-bottom: 2px; }
.designer :deep(.ant-form-item-label label) { height: 22px; font-size: 13px; color: #42536d; }
.designer :deep(input[type="color"]) { padding: 2px; height: 32px; cursor: pointer; }
</style>
