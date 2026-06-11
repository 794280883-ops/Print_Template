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
        <span class="designer-size-editor">
          <span class="designer-size-label">宽</span>
          <a-input-number v-model:value="templateWidth" :min="1" :step="0.5" size="small" style="width:62px" @change="onSizeChange" />
          <span>×</span>
          <span class="designer-size-label">高</span>
          <a-input-number v-model:value="templateHeight" :min="1" :step="0.5" size="small" style="width:62px" @change="onSizeChange" />
          <span class="designer-unit-text">mm</span>
        </span>
      </div>
      <div class="toolbar-actions">
        <a-button size="small" @click="zoomOut">-</a-button>
        <span style="min-width:36px;text-align:center">{{ Math.round(zoom * 100) }}%</span>
        <a-button size="small" @click="zoomIn">+</a-button>
        <a-switch v-model:checked="showGrid" size="small" style="margin-left:8px" /> 网格
        <a-button :loading="saving" type="primary" @click="handleSave" style="margin-left:8px">
          <SaveOutlined /> 保存
        </a-button>
        <a-button :disabled="!validation.canPublish" @click="handlePublish">
          <SendOutlined /> 发布
        </a-button>
        <a-button @click="handlePreview">
          <EyeOutlined /> 预览
        </a-button>
      </div>
    </div>

    <!-- Body -->
    <div class="designer-body">
      <!-- Left Component Panel -->
      <aside class="toolbox">
        <div class="tool-section">
          <h3>组件区</h3>
          <div class="component-list">
            <div v-for="comp in COMPONENTS" :key="comp.type + comp.label"
              class="component-btn" draggable="true"
              @dragstart="handleDragStart($event, comp)"
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
            <code>{{ field.code }}</code>
          </div>
        </div>
      </aside>

      <!-- Center Canvas -->
      <section class="canvas-shell">
        <div class="canvas-toolbar">
          <div class="toolbar-actions">
            <a-button size="small" @click="copySelected">复制</a-button>
            <a-button size="small" @click="pasteSelected">粘贴</a-button>
            <a-button size="small" danger @click="deleteSelected">删除</a-button>
          </div>
          <div class="toolbar-actions">
            <a-select v-model:value="zoom" style="width:90px" size="small">
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
              <div v-else-if="el.type === 'barcode'" class="barcode" :title="el.bindField"></div>
              <!-- checkbox -->
              <div v-else-if="el.type === 'checkbox'" class="checkbox-content">
                <span class="checkbox-mark" :class="{ checked: el.checked }">{{ el.checked ? '✓' : '' }}</span>
                <span v-if="el.text" class="checkbox-label">{{ el.text }}</span>
              </div>
              <!-- line/rect: no inner content -->
              <!-- resize handles -->
              <template v-if="selectedElementId === el.id">
                <span v-for="h in ['nw','n','ne','e','se','s','sw','w']" :key="h"
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
              {{ validation.canPublish ? '可启用' : '不可启用' }}
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
                <a-col :span="12"><a-form-item label="宽 mm"><a-input-number v-model:value="selectedElement.width" :min="1" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="高 mm"><a-input-number v-model:value="selectedElement.height" :min="1" :step="0.5" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="层级"><a-input-number v-model:value="selectedElement.zIndex" :min="1" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="旋转"><a-select v-model:value="selectedElement.rotate" @change="onPropChange"><a-select-option :value="0">0°</a-select-option><a-select-option :value="90">90°</a-select-option><a-select-option :value="180">180°</a-select-option><a-select-option :value="270">270°</a-select-option></a-select></a-form-item></a-col>
              </a-row>
              <!-- Text-specific props -->
              <template v-if="selectedElement.type === 'text'">
                <a-row :gutter="8">
                  <a-col :span="24"><a-form-item label="文本类型"><a-radio-group v-model:value="selectedElement.textKind" button-style="solid" @change="onPropChange"><a-radio-button value="static">静态文本</a-radio-button><a-radio-button value="field">动态字段</a-radio-button></a-radio-group></a-form-item></a-col>
                  <a-col v-if="selectedElement.textKind === 'field'" :span="24"><a-form-item label="绑定字段"><a-select v-model:value="selectedElement.bindField" @change="onPropChange"><a-select-option value="">请选择字段</a-select-option><a-select-option v-for="f in currentFields" :key="f.code" :value="f.code">{{ f.name }}</a-select-option></a-select></a-form-item></a-col>
                  <a-col v-else :span="24"><a-form-item label="静态内容"><a-textarea v-model:value="selectedElement.text" :rows="2" @change="onPropChange" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="字号 px"><a-input-number v-model:value="selectedElement.fontSize" :min="1" :step="1" style="width:100%" @change="onPropChange" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label=" "><a-checkbox v-model:checked="selectedElement.bold" @change="onPropChange">加粗</a-checkbox></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="对齐"><a-select v-model:value="selectedElement.align" @change="onPropChange"><a-select-option value="left">左对齐</a-select-option><a-select-option value="center">居中</a-select-option><a-select-option value="right">右对齐</a-select-option></a-select></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="颜色"><a-input type="color" v-model:value="selectedElement.color" @change="onPropChange" /></a-form-item></a-col>
                </a-row>
              </template>
              <!-- QR/Barcode props -->
              <template v-if="selectedElement.type === 'qrcode' || selectedElement.type === 'barcode'">
                <a-form-item label="绑定字段"><a-select v-model:value="selectedElement.bindField" @change="onPropChange"><a-select-option value="">请选择字段</a-select-option><a-select-option v-for="f in currentFields" :key="f.code" :value="f.code">{{ f.name }}</a-select-option></a-select></a-form-item>
              </template>
              <!-- Checkbox props -->
              <template v-if="selectedElement.type === 'checkbox'">
                <a-form-item><a-checkbox v-model:checked="selectedElement.checked" @change="onPropChange">选中</a-checkbox></a-form-item>
                <a-form-item label="固定文字"><a-input v-model:value="selectedElement.text" @change="onPropChange" placeholder="例如：易碎 / 已复核" /></a-form-item>
                <a-form-item label="边框颜色"><a-input type="color" v-model:value="selectedElement.color" @change="onPropChange" /></a-form-item>
              </template>
              <!-- Rect props -->
              <template v-if="selectedElement.type === 'rect'">
                <a-form-item label="背景色"><a-input type="color" v-model:value="selectedElement.backgroundColor" @change="onPropChange" /></a-form-item>
              </template>
              <!-- Line props -->
              <template v-if="selectedElement.type === 'line'">
                <a-form-item label="线条颜色"><a-input type="color" v-model:value="selectedElement.color" @change="onPropChange" /></a-form-item>
              </template>
              <a-button danger block style="margin-top:12px" @click="deleteSelected"><DeleteOutlined /> 删除元素</a-button>
            </a-form>
          </template>
          <div v-else class="empty-state">点击画布元素后编辑属性；也可从左侧组件区添加新元素。</div>
        </div>
      </aside>
    </div>

    <!-- Preview Modal -->
    <a-modal v-model:open="previewVisible" title="模板预览" width="760px" :footer="false">
      <div class="preview-wrap">
        <div class="preview-card">
          <div class="label-canvas" :style="previewCanvasStyle">
            <div v-for="el in template.elements" :key="el.id"
              class="template-el" :class="[`el-${el.type}`]"
              :style="getPreviewElementStyle(el)">
              <div v-if="el.type === 'text'" class="el-content">{{ getTextDisplay(el) }}</div>
              <div v-else-if="el.type === 'qrcode'" class="qr" :title="el.bindField"></div>
              <div v-else-if="el.type === 'barcode'" class="barcode" :title="el.bindField"></div>
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  UndoOutlined, RedoOutlined, SaveOutlined, SendOutlined,
  EyeOutlined, ArrowLeftOutlined, DeleteOutlined,
} from '@ant-design/icons-vue';
import { getTemplate, updateTemplate, enableTemplate } from '../../api/templateApi.js';
import { COMPONENTS, FIELD_DICT, PX_PER_MM, TYPE_LABEL, STATUS_LABEL } from '../../data/constants.js';
import { validateTemplateDsl } from '../../services/validationService.js';
import { sampleByType } from '../../services/templateDslService.js';
import { getPrintableTemplate } from '../../services/printRotationService.js';

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

// Canvas refs
const canvasRef = ref(null);
const canvasStageRef = ref(null);

// Drag state (non-reactive, managed via event listeners)
let dragState = null;

// ── Helpers ──
function uid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }
function deepClone(x) { return JSON.parse(JSON.stringify(x)); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v))); }
function round1(v) { return Math.round(Number(v) * 10) / 10; }
function normalizeColor(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : '#111827'; }
function alignToFlex(a) { return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start'; }

// ── Computed ──
const selectedElement = computed(() => {
  if (!template.value || !selectedElementId.value) return null;
  return template.value.elements.find(el => el.id === selectedElementId.value) || null;
});

const currentFields = computed(() => {
  if (!template.value) return [];
  return FIELD_DICT[template.value.templateType] || [];
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

const previewCanvasStyle = computed(() => {
  if (!template.value) return {};
  const tpl = getPrintableTemplate(template.value);
  const z = Math.min(1.4, 340 / (tpl.size.width * PX_PER_MM));
  return { width: `${tpl.size.width * PX_PER_MM * z}px`, height: `${tpl.size.height * PX_PER_MM * z}px` };
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
  const tpl = getPrintableTemplate(template.value);
  const z = Math.min(1.4, 340 / (tpl.size.width * PX_PER_MM));
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

function getTextDisplay(el) {
  if (el.type !== 'text') return '';
  if (el.textKind === 'field') return `[${el.bindField || '未绑定'}]`;
  return el.text || '静态文本';
}

// ── History ──
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
  runValidation();
}

function redo() {
  if (!future.value.length) return;
  history.value.push(deepClone(template.value.elements));
  template.value.elements = future.value.pop();
  selectedElementId.value = template.value.elements[0]?.id || null;
  runValidation();
}

// ── Validation ──
function runValidation() {
  if (!template.value) return;
  validation.value = validateTemplateDsl(template.value);
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
  if ((el.type === 'qrcode' || el.type === 'barcode' || el.textKind === 'field') &&
      (!el.bindField || !currentFields.value.some(f => f.code === el.bindField))) {
    el.bindField = currentFields.value[0]?.code || '';
  }
  template.value.elements.push(el);
  selectedElementId.value = el.id;
  runValidation();
}

function deleteSelected() {
  if (!selectedElementId.value || !template.value) return;
  pushHistory();
  template.value.elements = template.value.elements.filter(el => el.id !== selectedElementId.value);
  selectedElementId.value = template.value.elements[0]?.id || null;
  runValidation();
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
  runValidation();
}

function onPropChange() {
  runValidation();
}

function onSizeChange() {
  if (!template.value) return;
  pushHistory();
  template.value.size.width = templateWidth.value;
  template.value.size.height = templateHeight.value;
  runValidation();
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
    let x = o.x, y = o.y, w = o.width, h = o.height;
    if (dragState.handle.includes('e')) w = o.width + dx;
    if (dragState.handle.includes('s')) h = o.height + dy;
    if (dragState.handle.includes('w')) { x = o.x + dx; w = o.width - dx; }
    if (dragState.handle.includes('n')) { y = o.y + dy; h = o.height - dy; }
    w = Math.max(1, w); h = Math.max(1, h);
    el.x = round1(clamp(x, -w + 1, tw - 1));
    el.y = round1(clamp(y, -h + 1, th - 1));
    el.width = round1(w);
    el.height = round1(h);
  }
}

function endPointerMove() {
  document.removeEventListener('pointermove', onPointerMove);
  dragState = null;
  runValidation();
}

// ── Palette Drag & Drop ──
function handleDragStart(event, comp) {
  event.dataTransfer.setData('application/json', JSON.stringify(comp));
}

function handleFieldDragStart(event, field) {
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'text', preset: { textKind: 'field', bindField: field.code, width: 34, height: 8, fontSize: 12 },
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
  if ((el.type === 'qrcode' || el.type === 'barcode' || el.textKind === 'field') &&
      (!el.bindField || !currentFields.value.some(f => f.code === el.bindField))) {
    el.bindField = currentFields.value[0]?.code || '';
  }
  template.value.elements.push(el);
  selectedElementId.value = el.id;
  runValidation();
}

// ── Zoom ──
function zoomIn() {
  const steps = [0.75, 1, 1.25, 1.5];
  const idx = steps.indexOf(zoom.value);
  if (idx < steps.length - 1) zoom.value = steps[idx + 1];
}

function zoomOut() {
  const steps = [0.75, 1, 1.25, 1.5];
  const idx = steps.indexOf(zoom.value);
  if (idx > 0) zoom.value = steps[idx - 1];
}

// ── Save / Publish / Preview ──
async function handleSave() {
  if (!template.value) return;
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

async function handlePublish() {
  if (!validation.value.canPublish) return;
  await handleSave();
  try {
    await enableTemplate(template.value.id);
    template.value.status = 'enabled';
    message.success('模板已发布');
  } catch (error) {
    message.error(`发布失败：${error.message}`);
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
    runValidation();
  }
}

// ── Lifecycle ──
onMounted(async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const tpl = await getTemplate(id);
    template.value = tpl;
    templateWidth.value = tpl.size.width;
    templateHeight.value = tpl.size.height;
    if (tpl.elements?.length) selectedElementId.value = tpl.elements[0].id;
    runValidation();
  } catch (error) {
    message.error(`加载模板失败：${error.message}`);
  } finally {
    loading.value = false;
  }
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.designer :deep(.ant-form-item) { margin-bottom: 8px; }
.designer :deep(.ant-form-item-label) { padding-bottom: 2px; }
.designer :deep(.ant-form-item-label label) { height: 22px; font-size: 13px; color: #42536d; }
.designer :deep(input[type="color"]) { padding: 2px; height: 32px; cursor: pointer; }
</style>
