import { Modal } from 'bootstrap';
import {
  COMPONENTS,
  FIELD_DICT,
  PX_PER_MM,
  STATUS_CLASS,
  STATUS_LABEL,
  SUPPORTED_TYPES,
  TYPE_LABEL,
} from '../data/constants.js';
import { createSeedTemplates } from '../data/mockData.js';
import {
  createTemplate as apiCreateTemplate,
  copyTemplate as apiCopyTemplate,
  exportTemplate as apiExportTemplate,
  generateAiTemplate,
  importTemplate as apiImportTemplate,
  listFields as apiListFields,
  listOperationLogs,
  listTemplates,
  publishTemplate as apiPublishTemplate,
  recordDesignLog,
  updateTemplate,
  updateTemplateName,
  deleteTemplate as apiDeleteTemplate,
  downloadPrintPdf,
} from '../api/templateApi.js';
import {
  listBusinessData as apiListBusinessData,
  getBusinessData as apiGetBusinessData,
  createBusinessData as apiCreateBusinessData,
  updateBusinessData as apiUpdateBusinessData,
  deleteBusinessData as apiDeleteBusinessData,
} from '../api/businessDataApi.js';
import { sampleByType, fieldExists, toDsl, fromDsl } from '../services/templateDslService.js';
import { validateTemplateDsl } from '../services/validationService.js';
import { parseAiPromptToTemplate } from '../services/aiTemplateService.js';
import { TemplateList } from '../pages/TemplateList.js';
import { TemplateDesigner } from '../pages/TemplateDesigner.js';
import { FieldDictionary } from '../pages/FieldDictionary.js';
import { BusinessData } from '../pages/BusinessData.js';


export async function initWmsPrintTemplateApp() {

      // ── Constants ──

      // ── Bootstrap modals ──
      const genericModal = new Modal(document.getElementById("genericModal"));
      const largeModal = new Modal(document.getElementById("largeModal"));

      // ── State ──
      let state = defaultState();
      let isLoading = false;
      let loadError = "";
      let currentView = "templates";
      let currentTemplateId = null;
      let selectedElementId = null;
      let zoom = 1;
      let showGrid = true;
      let validation = { errors: [], warnings: [], tips: [], canPublish: false };
      let dragState = null;
      let history = [];
      let future = [];
      let clipboardElement = null;
      let filters = { name: "", type: "", status: "" };
      let pagination = { page: 1, pageSize: 20, total: 0 };
      let businessTab = "LOCATION";
      let selectedFieldType = "LOCATION";
      let selectedBusinessRows = new Set();
      let aiDraft = null;
      let businessDataState = { rows: [], total: 0 };
      let businessDataFilters = { type: "LOCATION", keyword: "", page: 1, pageSize: 20 };

      // ── Helpers ──
      function uid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`; }
      function nowText() {
        const d = new Date();
        const pad = n => String(n).padStart(2,"0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
      function deepClone(x) { return JSON.parse(JSON.stringify(x)); }
      function clamp(v,min,max) { return Math.max(min,Math.min(max,Number(v))); }
      function round1(v) { return Math.round(Number(v)*10)/10; }
      function num(v) { return Number.isFinite(Number(v))?round1(v):0; }
      function alignToFlex(a) { return a==="center"?"center":a==="right"?"flex-end":"flex-start"; }
      function normalizeColor(c) { return /^#[0-9a-f]{6}$/i.test(c)?c:"#111827"; }
      function escHtml(s) { return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
      function escAttr(s) { return escHtml(s); }

      function toast(msg) {
        const host = document.getElementById("toastHost");
        const el = document.createElement("div");
        el.className = "toast-box toast-success";
        el.textContent = msg;
        host.appendChild(el);
        setTimeout(()=>el.remove(),2400);
      }

      function currentTemplate() { return state.templates.find(t=>t.id===currentTemplateId)||state.templates[0]; }
      function addAppLog(action,target) { state.appLogs.unshift({time:nowText(),operator:"Admin",action,target}); }

      function defaultState() {
        return { templates: [], appLogs: [] };
      }

      async function hydrateState() {
        isLoading = true;
        loadError = "";
        render();
        try {
          const [templatesResult, operationLogs, locationFields, containerFields, productFields] = await Promise.all([
            listTemplates({ ...filters, page: pagination.page, pageSize: pagination.pageSize }),
            listOperationLogs(),
            apiListFields("LOCATION"),
            apiListFields("CONTAINER"),
            apiListFields("PRODUCT"),
          ]);
          FIELD_DICT.LOCATION = locationFields;
          FIELD_DICT.CONTAINER = containerFields;
          FIELD_DICT.PRODUCT = productFields;
          const templates = templatesResult.rows || templatesResult;
          pagination.total = templatesResult.total || 0;
          state = { templates, appLogs: normalizeOperationLogs(operationLogs) };
          currentTemplateId = currentTemplateId && templates.some((template) => template.id === currentTemplateId)
            ? currentTemplateId
            : templates[0]?.id || null;
        } catch (error) {
          state = defaultState();
          FIELD_DICT.LOCATION = [];
          FIELD_DICT.CONTAINER = [];
          FIELD_DICT.PRODUCT = [];
          currentTemplateId = null;
          loadError = error.message || "数据加载失败";
          toast(`数据加载失败：${loadError}`);
        } finally {
          isLoading = false;
          render();
        }
      }

      function saveState() {}

      function normalizeOperationLogs(rows) {
        return (rows || []).map((row) => ({
          time: row.operated_at || row.time || "",
          operator: row.operator || "Admin",
          action: row.action_name || row.action || "-",
          target: `${row.target_name || row.targetName || "-"}${row.target_id ? ` #${row.target_id}` : ""}`,
        }));
      }

      function renderLoadingOrError(root) {
        if (isLoading) {
          root.innerHTML = `<div class="card-panel"><div class="empty-state">数据加载中...</div></div>`;
          return true;
        }
        if (loadError && !state.templates.length) {
          root.innerHTML = `<div class="card-panel"><div class="empty-state">后端数据加载失败：${escHtml(loadError)}<br>请确认后端服务、MySQL 和迁移数据已就绪。</div></div>`;
          return true;
        }
        return false;
      }

      // ── View switching ──
      function setView(view) {
        currentView = view;
        document.querySelectorAll("#tabbarTabs .nav-tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view));
        document.querySelectorAll(".view-section").forEach(s=>s.classList.remove("active"));
        document.getElementById("view-"+view).classList.add("active");
        render();
      }

      function render() {
        if (currentView==="templates") renderTemplateList();
        if (currentView==="designer") renderDesigner();
        if (currentView==="fields") renderFields();
        if (currentView==="business") renderBusiness();
      }

      // ══════════════════════════════════════
      //  TEMPLATE LIST
      // ══════════════════════════════════════
      function renderTemplateList() { return TemplateList.renderTemplateList(appContext); }

      function renderTemplateListLegacy() {
        const root = document.getElementById("view-templates");
        if (renderLoadingOrError(root)) return;
        const rows = state.templates;

        root.innerHTML = `
          <div class="card-panel filter-panel">
            <div class="panel-body">
              <form class="row" id="filterForm">
                <div class="col-lg-3 col-md-6 mb-3">
                  <label class="form-label">模板名称</label>
                  <input class="form-control" id="filterName" value="${escAttr(filters.name)}" placeholder="右模糊查询">
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                  <label class="form-label">模板类型</label>
                  <select class="form-select" id="filterType">
                    <option value="">全部</option>
                    ${["LOCATION","CONTAINER","PRODUCT"].map(v=>`<option value="${v}" ${filters.type===v?"selected":""}>${TYPE_LABEL[v]}</option>`).join("")}
                  </select>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                  <label class="form-label">状态</label>
                  <select class="form-select" id="filterStatus">
                    <option value="">全部</option>
                    ${["draft","published"].map(v=>`<option value="${v}" ${filters.status===v?"selected":""}>${STATUS_LABEL[v]}</option>`).join("")}
                  </select>
                </div>
                <div class="col-12">
                  <div class="query-actions">
                    <button class="btn btn-primary-wms" id="queryBtn" type="submit">查询</button>
                    <button class="btn btn-secondary-wms" id="resetFilterBtn" type="reset">重置</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="card-panel">
            <div class="section-head">
              <div class="toolbar-actions">
                <button class="btn btn-primary-wms" id="newTemplateBtn">新增</button>
              </div>
              <span class="section-meta">共 ${pagination.total} 条</span>
            </div>
            <div class="table-wrap">
              <table class="table align-middle">
                <thead><tr>
                  <th class="text-center" style="width:56px">序号</th>
                  <th class="text-start">模板编码</th>
                  <th class="text-start">模板名称</th>
                  <th class="text-start">模板类型</th>
                  <th class="text-start">尺寸（宽×高）</th>
                  <th class="text-start">状态</th>
                  <th class="text-start">更新时间</th>
                  <th class="text-start">操作</th>
                </tr></thead>
                <tbody>${rows.map((t,i)=>`
                  <tr>
                    <td class="text-center">${(pagination.page-1)*pagination.pageSize + i + 1}</td>
                    <td class="text-start"><span class="text-link action-link" data-act="design" data-id="${t.id}">${t.templateCode}</span></td>
                    <td class="text-start">${t.templateName}</td>
                    <td class="text-start">${TYPE_LABEL[t.templateType]||t.templateType}</td>
                    <td class="text-start">${t.size.width} × ${t.size.height}</td>
                    <td class="text-start"><span class="status-pill ${STATUS_CLASS[t.status]}">${STATUS_LABEL[t.status]}</span></td>
                    <td class="text-start">${t.updatedAt}</td>
                    <td class="text-start">
                      <span class="action-link" data-act="preview" data-id="${t.id}">预览</span>
                      <span class="action-link" data-act="copy" data-id="${t.id}">复制</span>
                      <span class="action-link" data-act="publish" data-id="${t.id}">发布</span>
                      <span class="action-link text-danger" data-act="delete" data-id="${t.id}">删除</span>
                    </td>
                  </tr>
                `).join("")}</tbody>
              </table>
            </div>
            ${renderPagination()}
          </div>`;

        bindTemplateListEvents();
      }

      function renderPagination() {
        const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
        const page = pagination.page;
        let pageLinks = "";
        for (let i = 1; i <= totalPages; i++) {
          if (totalPages <= 7 || i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            pageLinks += `<button class="pagination-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
          } else if (i === page - 2 || i === page + 2) {
            pageLinks += `<span class="pagination-ellipsis">...</span>`;
          }
        }
        return `
          <div class="pagination-bar">
            <div class="pagination-info">显示第 ${(page-1)*pagination.pageSize + 1}-${Math.min(page*pagination.pageSize, pagination.total)} 条，共 ${pagination.total} 条</div>
            <div class="pagination-controls">
              <button class="pagination-btn" data-page="${page-1}" ${page<=1?"disabled":""}>上一页</button>
              ${pageLinks}
              <button class="pagination-btn" data-page="${page+1}" ${page>=totalPages?"disabled":""}>下一页</button>
              <span class="pagination-size-label">每页</span>
              <input class="pagination-size-input" id="pageSizeInput" type="number" min="1" max="200" value="${pagination.pageSize}">
              <span class="pagination-size-label">条</span>
              <button class="pagination-btn" id="pageSizeApplyBtn">确定</button>
            </div>
          </div>`;
      }

      function bindTemplateListEvents() {
        document.getElementById("newTemplateBtn").onclick = openNewTemplateModal;
        document.getElementById("resetFilterBtn").onclick = ()=>{ filters={name:"",type:"",status:""}; pagination.page=1; setTimeout(()=>hydrateState(),0); };

        document.getElementById("filterForm").addEventListener("submit",e=>{
          e.preventDefault();
          filters={
            name: document.getElementById("filterName").value.trim(),
            type: document.getElementById("filterType").value,
            status: document.getElementById("filterStatus").value
          };
          pagination.page = 1;
          hydrateState();
        });

        document.querySelectorAll("[data-act]").forEach(el=>{
          el.onclick = ()=>handleTemplateAction(el.dataset.act, el.dataset.id).catch(error=>toast(`操作失败：${error.message}`));
        });

        document.querySelectorAll(".pagination-btn").forEach(btn=>{
          btn.onclick = ()=>{
            const p = parseInt(btn.dataset.page, 10);
            if (p >= 1 && p <= Math.ceil(pagination.total / pagination.pageSize)) {
              pagination.page = p;
              hydrateState();
            }
          };
        });

        const pageSizeInput = document.getElementById("pageSizeInput");
        const pageSizeApplyBtn = document.getElementById("pageSizeApplyBtn");
        if (pageSizeInput && pageSizeApplyBtn) {
          const applyPageSize = ()=>{
            let v = parseInt(pageSizeInput.value, 10);
            if (isNaN(v) || v < 1) v = 1;
            if (v > 200) v = 200;
            pageSizeInput.value = v;
            pagination.pageSize = v;
            pagination.page = 1;
            hydrateState();
          };
          pageSizeApplyBtn.onclick = applyPageSize;
          pageSizeInput.addEventListener("keydown", (e)=>{
            if (e.key === "Enter") { e.preventDefault(); applyPageSize(); }
          });
          pageSizeInput.addEventListener("blur", ()=>{
            let v = parseInt(pageSizeInput.value, 10);
            if (isNaN(v) || v < 1) v = pagination.pageSize;
            pageSizeInput.value = v;
          });
        }
      }

      async function handleTemplateAction(action, id) {
        const t = state.templates.find(x=>x.id===id);
        if (!t) return;
        if (action==="design") { await enterTemplateDesigner(t); }
        if (action==="preview") openPreviewModal(t);
        if (action==="copy") {
          const copy = await apiCopyTemplate(t.id);
          state.templates.unshift(copy);
          addAppLog("复制模板",copy.templateName);
          saveState(); toast("已复制为草稿模板"); render();
        }
        if (action==="publish") publishTemplate(t);
        if (action==="delete") deleteTemplate(t);
      }

      async function deleteTemplate(t) {
        showConfirmModal(
          "确认删除",
          `确定删除模板「${escHtml(t.templateName)}」？此操作不可恢复。`,
          async () => {
            try {
              await apiDeleteTemplate(t.id);
              state.templates = state.templates.filter(x => x.id !== t.id);
              if (currentTemplateId === t.id) currentTemplateId = state.templates[0]?.id || null;
              addAppLog("删除模板", t.templateName);
              pagination.total = Math.max(0, pagination.total - 1);
              toast("模板已删除");
              render();
            } catch (err) {
              toast(`删除失败：${err.message}`);
            }
          }
        );
      }

      function showConfirmModal(title, message, onConfirm) {
        document.getElementById("genericModalTitle").textContent = title;
        document.getElementById("genericModalBody").innerHTML = `
          <div class="confirm-modal-body">
            <div class="confirm-icon">⚠</div>
            <p class="confirm-message">${message}</p>
          </div>`;
        document.getElementById("genericModalFoot").innerHTML = `
          <button class="btn btn-secondary-wms" data-bs-dismiss="modal">取消</button>
          <button class="btn btn-danger-wms" id="confirmDeleteBtn">确认删除</button>`;
        genericModal.show();

        document.getElementById("confirmDeleteBtn").onclick = async () => {
          genericModal.hide();
          await onConfirm();
        };
      }

      async function enterTemplateDesigner(t) {
        currentTemplateId=t.id;
        selectedElementId=t.elements[0]?.id||null;
        addAppLog("进入模板设计",`${t.templateName} ${t.templateCode}`);
        try {
          await recordDesignLog(t.id);
        } catch (error) {
          toast(`设计日志记录失败：${error.message}`);
        }
        setView("designer");
      }

      // ══════════════════════════════════════
      //  DESIGNER
      // ══════════════════════════════════════
      function renderDesigner() { return TemplateDesigner.renderDesigner(appContext); }

      function renderDesignerLegacy() {
        const t = currentTemplate();
        if (!t) {
          document.getElementById("view-designer").innerHTML = `<div class="card-panel"><div class="empty-state">暂无模板，请先在模板列表中新增模板。</div></div>`;
          return;
        }
        validation = validateTemplateDsl(t);
        const selected = t.elements.find(el=>el.id===selectedElementId)||null;
        document.getElementById("view-designer").innerHTML = `
          <div class="designer">
            <div class="designer-top">
              <div>
                <input class="designer-title-input" id="designerTemplateName" value="${escAttr(t.templateName)}" data-original-name="${escAttr(t.templateName)}" aria-label="模板名称">
                <span class="status-pill ${STATUS_CLASS[t.status]}" style="margin-left:8px">${STATUS_LABEL[t.status]}</span>
                <span class="section-meta" style="margin-left:8px">${TYPE_LABEL[t.templateType]}</span>
                <span class="designer-size-editor" aria-label="标签尺寸">
                  <span class="designer-size-label">宽</span>
                  <input class="designer-size-input" id="designerWidth" type="number" min="1" step="0.5" value="${num(t.size.width)}" title="宽度 mm">
                  <span>×</span>
                  <span class="designer-size-label">高</span>
                  <input class="designer-size-input" id="designerHeight" type="number" min="1" step="0.5" value="${num(t.size.height)}" title="高度 mm">
                  <span class="designer-unit-text" id="designerUnit">mm</span>
                </span>
              </div>
              <div class="toolbar-actions">
                <button class="btn btn-light-wms" id="backListBtn">返回列表</button>
                <button class="btn btn-light-wms" id="saveDraftBtn">保存草稿</button>
                <button class="btn btn-light-wms" id="previewBtn">预览</button>
                <button class="btn btn-light-wms" id="validateBtn">校验</button>
                <button class="btn btn-primary-wms" id="publishBtn" ${validation.errors.length?"disabled":""}>发布</button>
                <button class="btn btn-light-wms" id="designerImportBtn">导入 JSON</button>
                <button class="btn btn-light-wms" id="designerExportBtn">导出 JSON</button>
                <button class="btn btn-light-wms" id="designerAiBtn">AI 生成</button>
              </div>
            </div>
            <div class="designer-body">
              <aside class="toolbox">
                <div class="tool-section">
                  <h3>组件区</h3>
                  <div class="component-list">${COMPONENTS.map(c=>`
                    <div class="component-btn" data-component="${c.type}" title="添加${c.label}">
                      <strong>${c.icon}</strong><span>${c.label}</span>
                    </div>
                  `).join("")}</div>
                </div>
                <div class="tool-section" style="overflow:auto;flex:1">
                  <h3>字段字典</h3>
                  ${(FIELD_DICT[t.templateType]||[]).map(f=>`
                    <div class="field-chip" data-field="${f.code}" title="${escAttr(f.name)}">
                      <span>${f.name}</span>
                    </div>
                  `).join("")}
                </div>
              </aside>
              <section class="canvas-shell">
                <div class="canvas-toolbar">
                  <div class="toolbar-actions">
                    <button class="btn-icon-wms" id="undoBtn" title="撤销">↶</button>
                    <button class="btn-icon-wms" id="redoBtn" title="重做">↷</button>
                    <button class="btn btn-light-wms" id="copyBtn">复制</button>
                    <button class="btn btn-light-wms" id="pasteBtn">粘贴</button>
                    <button class="btn btn-light-wms" id="deleteBtn" style="color:#ef4444;border-color:#fecaca;">删除</button>
                  </div>
                  <div class="toolbar-actions">
                    <label class="checkbox-row"><input type="checkbox" id="gridToggle" ${showGrid?"checked":""}>网格</label>
                    <select class="form-select" id="zoomSelect" style="min-height:30px;width:90px">
                      <option value="0.75" ${zoom===0.75?"selected":""}>75%</option>
                      <option value="1" ${zoom===1?"selected":""}>100%</option>
                      <option value="1.25" ${zoom===1.25?"selected":""}>125%</option>
                    </select>
                  </div>
                </div>
                <div class="canvas-stage">
                  <div id="labelCanvas" class="label-canvas ${showGrid?"grid-on":""}" style="width:${t.size.width*PX_PER_MM*zoom}px;height:${t.size.height*PX_PER_MM*zoom}px">
                    ${t.elements.map(el=>renderElementHtml(el,t,false)).join("")}
                  </div>
                </div>
                ${renderValidationPanel(validation)}
              </section>
              <aside class="props-panel">
                <div class="section-head" style="border-bottom:1px solid var(--wms-line);border-radius:var(--wms-radius-lg) var(--wms-radius-lg) 0 0;">
                  <span style="font-weight:700">属性区</span>
                  <span class="section-meta">${selected?selected.id:"未选择元素"}</span>
                </div>
                <div class="props-body">${renderProps(selected,t)}</div>
              </aside>
            </div>
          </div>`;
        bindDesignerEvents();
      }

      function renderElementHtml(el, t, preview, data) {
        const selected = !preview && el.id===selectedElementId;
        const justify = ["qrcode","barcode","image"].includes(el.type)?"center":alignToFlex(el.align||"left");
        const style = [
          `left:${el.x*PX_PER_MM*zoom}px`,`top:${el.y*PX_PER_MM*zoom}px`,
          `width:${el.width*PX_PER_MM*zoom}px`,`height:${el.height*PX_PER_MM*zoom}px`,
          `z-index:${el.zIndex||1}`,`font-size:${(el.fontSize||12)*zoom}px`,
          `font-weight:${el.bold?700:400}`,`justify-content:${justify}`,
          `color:${el.color||"#111827"}`,`background:${el.backgroundColor||"transparent"}`,
          `transform:rotate(${el.rotate||0}deg)`
        ].join(";");
        const content = elementDisplay(el, t, preview, data);
        return `<div class="template-el ${selected?"selected":""} el-${el.type}" data-el="${el.id}" style="${style}">
          ${content}
          ${selected?["nw","n","ne","e","se","s","sw","w"].map(h=>`<span class="resize-handle ${h}" data-handle="${h}"></span>`).join(""):""}
        </div>`;
      }

      function dirArrow(v) {
        const map = { "向上": "↑", "向下": "↓", "向左": "←", "向右": "→" };
        return map[v] || v;
      }

      function elementDisplay(el, t, preview, data = sampleByType(t.templateType)) {
        if (el.type==="qrcode") return `<div class="qr" title="${el.bindField||""}"></div>`;
        if (el.type==="barcode") return `<div class="barcode" title="${el.bindField||""}"></div>`;
        if (el.type==="image") return el.imageUrl?`<img src="${escAttr(el.imageUrl)}" alt="" style="max-width:100%;max-height:100%">`:`<span class="section-meta">图片</span>`;
        if (el.type==="checkbox") return `<div class="checkbox-content"><span class="checkbox-mark ${el.checked?"checked":""}">${el.checked?"✓":""}</span>${el.text?`<span class="checkbox-label">${escHtml(el.text)}</span>`:""}</div>`;
        if (el.type==="line"||el.type==="rect") return "";
        // Preview/print mode: bindField takes priority (matches PDF logic)
        // Designer mode: respect textKind (static text as placeholder)
        const rawValue = (preview && el.bindField && data[el.bindField] !== undefined)
          ? String(data[el.bindField])
          : el.textKind==="field"
            ? (data[el.bindField] ?? `[${el.bindField||"未绑定"}]`)
            : (el.text ?? "静态文本");
        const value = dirArrow(String(rawValue));
        return `<div class="el-content">${escHtml(value)}</div>`;
      }

      function renderProps(el, t) {
        if (!el) return `<div class="empty-state">点击画布元素后编辑属性；也可从左侧组件区添加新元素。</div>`;
        const fields = FIELD_DICT[t.templateType]||[];
        const common = `
          <div class="form-grid">
            <div class="field"><label class="form-label">X 坐标 mm</label><input class="form-control" data-prop="x" type="number" step="0.5" value="${num(el.x)}"></div>
            <div class="field"><label class="form-label">Y 坐标 mm</label><input class="form-control" data-prop="y" type="number" step="0.5" value="${num(el.y)}"></div>
            <div class="field"><label class="form-label">宽度 mm</label><input class="form-control" data-prop="width" type="number" step="0.5" value="${num(el.width)}"></div>
            <div class="field"><label class="form-label">高度 mm</label><input class="form-control" data-prop="height" type="number" step="0.5" value="${num(el.height)}"></div>
            <div class="field"><label class="form-label">层级</label><input class="form-control" data-prop="zIndex" type="number" step="1" value="${el.zIndex||1}"></div>
            <div class="field"><label class="form-label">旋转</label><select class="form-select" data-prop="rotate">${[0,90,180,270].map(v=>`<option value="${v}" ${Number(el.rotate||0)===v?"selected":""}>${v}°</option>`).join("")}</select></div>
          </div>`;
        const styleProps = `
          <div class="form-grid" style="margin-top:10px">
            <div class="field"><label class="form-label">字号 px</label><input class="form-control" data-prop="fontSize" type="number" value="${el.fontSize||12}"></div>
            <label class="checkbox-row"><input data-prop="bold" type="checkbox" ${el.bold?"checked":""}>加粗</label>
            <div class="field"><label class="form-label">对齐</label><select class="form-select" data-prop="align">${["left","center","right"].map(v=>`<option value="${v}" ${(el.align||"left")===v?"selected":""}>${{left:"左对齐",center:"居中",right:"右对齐"}[v]}</option>`).join("")}</select></div>
            <div class="field"><label class="form-label">文字颜色</label><input class="form-control" data-prop="color" type="color" value="${normalizeColor(el.color||"#111827")}"></div>
          </div>`;
        const bindSelect = `<select class="form-select" data-prop="bindField"><option value="">请选择字段</option>${fields.map(f=>`<option value="${f.code}" ${el.bindField===f.code?"selected":""}>${f.name}</option>`).join("")}</select>`;
        if (el.type==="text") {
          // directionMark is always a field binding
          const isDirection = el.bindField === "directionMark";
          if (isDirection) el.textKind = "field";
          const isField = el.textKind === "field";
          const textStyleProps = isDirection ? `
            <div class="form-grid" style="margin-top:10px">
              <div class="field"><label class="form-label">字号 px</label><input class="form-control" data-prop="fontSize" type="number" value="${el.fontSize||12}"></div>
              <label class="checkbox-row"><input data-prop="bold" type="checkbox" ${el.bold?"checked":""}>加粗</label>
              <div class="field"><label class="form-label">文字颜色</label><input class="form-control" data-prop="color" type="color" value="${normalizeColor(el.color||"#111827")}"></div>
            </div>` : styleProps;
          return `${common}
            <div class="form-grid" style="margin-top:10px">
              ${isDirection ? '' : `<div class="field"><label class="form-label">文本类型</label><select class="form-select" data-prop="textKind"><option value="static" ${!isField?"selected":""}>静态文本</option><option value="field" ${isField?"selected":""}>动态字段</option></select></div>`}
              ${isField ? `<div class="field"><label class="form-label">绑定字段</label>${bindSelect}</div>` : ''}
              ${!isField ? `<div class="field span"><label class="form-label">静态内容</label><textarea class="form-control" data-prop="text" rows="3">${escHtml(el.text||"")}</textarea></div>` : ''}
            </div>${textStyleProps}`;
        }
        if (el.type==="qrcode"||el.type==="barcode") {
          if (!el.errorLevel) el.errorLevel = "M";
          return `${common}
            <div class="form-grid" style="margin-top:10px">
              <div class="field span"><label class="form-label">绑定字段</label>${bindSelect}</div>
            </div>`;
        }
        if (el.type==="image") {
          return `${common}<div class="field" style="margin-top:10px"><label class="form-label">图片地址</label><input class="form-control" data-prop="imageUrl" value="${escAttr(el.imageUrl||"")}" placeholder="原型可填写图片 URL"></div>`;
        }
        if (el.type==="checkbox") {
          return `${common}
            <div class="form-grid" style="margin-top:10px">
              <label class="checkbox-row"><input data-prop="checked" type="checkbox" ${el.checked?"checked":""}>选中</label>
              <div class="field span"><label class="form-label">固定文字</label><input class="form-control" data-prop="checkboxText" value="${escAttr(el.text||"")}" placeholder="例如：易碎 / 已复核"></div>
              <div class="field"><label class="form-label">边框颜色</label><input class="form-control" data-prop="color" type="color" value="${normalizeColor(el.color||"#111827")}"></div>
            </div>`;
        }
        if (el.type==="rect") {
          return `${common}
            <div class="form-grid" style="margin-top:10px">
              <div class="field"><label class="form-label">边框颜色</label><input class="form-control" data-prop="color" type="color" value="${normalizeColor(el.color||"#111827")}"></div>
              <div class="field"><label class="form-label">背景色</label><input class="form-control" data-prop="backgroundColor" type="color" value="${normalizeColor(el.backgroundColor||"#eaf4ff")}"></div>
            </div>`;
        }
        return `${common}<div class="form-grid" style="margin-top:10px"><div class="field"><label class="form-label">线条/边框颜色</label><input class="form-control" data-prop="color" type="color" value="${normalizeColor(el.color||"#111827")}"></div></div>`;
      }

      function bindDesignerEvents() {
        const t = currentTemplate();
        document.getElementById("backListBtn").onclick = ()=>setView("templates");
        document.getElementById("designerTemplateName").oninput = e=>{
          t.templateName = e.target.value;
          t.updatedAt = nowText();
        };
        document.getElementById("designerTemplateName").onblur = async e=>{
          const name = e.target.value.trim();
          if (!name) {
            e.target.value = t.templateName || "未命名模板";
            return toast("模板名称不能为空");
          }
          if (name === e.target.dataset.originalName) return;
          t.templateName = name;
          try {
            const updated = await updateTemplateName(t.id, name);
            replaceTemplate(updated);
            e.target.dataset.originalName = updated.templateName;
            e.target.value = updated.templateName;
            addAppLog("编辑模板名称", updated.templateName);
            toast("模板名称已保存");
          } catch (error) {
            e.target.value = e.target.dataset.originalName || t.templateName;
            toast(`模板名称保存失败：${error.message}`);
          }
        };
        const applyTemplateSize = ()=>{
          const width = Number(document.getElementById("designerWidth").value);
          const height = Number(document.getElementById("designerHeight").value);
          if (width <= 0 || height <= 0) return toast("宽度和长度必须大于 0");
          t.size = { ...t.size, width, height, unit: "mm" };
          t.updatedAt = nowText();
          saveState();
          renderDesigner();
        };
        document.getElementById("designerWidth").onchange = applyTemplateSize;
        document.getElementById("designerHeight").onchange = applyTemplateSize;
        document.getElementById("saveDraftBtn").onclick = async ()=>{
          try {
            const name = document.getElementById("designerTemplateName").value.trim();
            if (!name) return toast("模板名称不能为空");
            const width = Number(document.getElementById("designerWidth").value);
            const height = Number(document.getElementById("designerHeight").value);
            if (width <= 0 || height <= 0) return toast("宽度和长度必须大于 0");
            t.templateName = name;
            t.size = { ...t.size, width, height, unit: "mm" };
            t.status="draft"; t.updatedAt=nowText();
            const updated = await updateTemplate(t.id, t);
            replaceTemplate(updated);
            addAppLog("保存草稿",updated.templateName);
            toast("已保存草稿");
            render();
          } catch (error) {
            toast(`保存失败：${error.message}`);
          }
        };
        document.getElementById("previewBtn").onclick = ()=>openPreviewModal(t);
        document.getElementById("validateBtn").onclick = ()=>{ validation=validateTemplateDsl(t); toast(validation.errors.length?`发现 ${validation.errors.length} 个错误`:"校验通过，可发布"); renderDesigner(); };
        document.getElementById("publishBtn").onclick = ()=>publishTemplate(t);
        document.getElementById("designerImportBtn").onclick = ()=>openJsonModal("import");
        document.getElementById("designerExportBtn").onclick = ()=>openJsonModal("export",t);
        document.getElementById("designerAiBtn").onclick = openAiModal;
        document.getElementById("zoomSelect").onchange = e=>{ zoom=Number(e.target.value); renderDesigner(); };
        document.getElementById("gridToggle").onchange = e=>{ showGrid=e.target.checked; renderDesigner(); };
        document.getElementById("deleteBtn").onclick = deleteSelected;
        document.getElementById("copyBtn").onclick = copySelected;
        document.getElementById("pasteBtn").onclick = pasteSelected;
        document.getElementById("undoBtn").onclick = undo;
        document.getElementById("redoBtn").onclick = redo;

        document.querySelectorAll("[data-component]").forEach(btn=>btn.onclick=()=>addElement(btn.dataset.component));
        document.querySelectorAll("[data-field]").forEach(chip=>chip.onclick=()=>addElement("text",{textKind:"field",bindField:chip.dataset.field,width:34,height:8,fontSize:12}));
        document.querySelectorAll("[data-el]").forEach(elNode=>{ elNode.onpointerdown = e=>startElementPointer(e,elNode.dataset.el); });
        document.querySelectorAll("[data-prop]").forEach(input=>{
          input.onchange = input.oninput = ()=>updateElementProp(input.dataset.prop, readInputValue(input));
        });
        document.querySelectorAll(".validation-item[data-el]").forEach(item=>{
          item.onclick = ()=>{ selectedElementId=item.dataset.el; renderDesigner(); };
        });
      }

      function startElementPointer(e, id) {
        e.stopPropagation();
        const t = currentTemplate();
        const el = t.elements.find(x=>x.id===id);
        if (!el) return;
        if (selectedElementId!==id) selectedElementId=id;
        pushHistory();
        const handle = e.target.dataset.handle||"";
        dragState = { id, mode:handle?"resize":"drag", handle, startX:e.clientX, startY:e.clientY, original:deepClone(el) };
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", endPointerMove, {once:true});
      }

      function onPointerMove(e) {
        if (!dragState) return;
        const t = currentTemplate();
        const el = t.elements.find(x=>x.id===dragState.id);
        if (!el) return;
        const dx=(e.clientX-dragState.startX)/(PX_PER_MM*zoom);
        const dy=(e.clientY-dragState.startY)/(PX_PER_MM*zoom);
        const o=dragState.original;
        if (dragState.mode==="drag") {
          el.x=clamp(o.x+dx,-o.width+1,t.size.width-1);
          el.y=clamp(o.y+dy,-o.height+1,t.size.height-1);
        } else {
          resizeElement(el,o,dx,dy,dragState.handle,t);
        }
        redrawCanvasOnly();
      }

      function endPointerMove() {
        document.removeEventListener("pointermove",onPointerMove);
        dragState=null;
        currentTemplate().updatedAt=nowText();
        saveState(); renderDesigner();
      }

      function resizeElement(el,o,dx,dy,handle,t) {
        let x=o.x,y=o.y,w=o.width,h=o.height;
        if (handle.includes("e")) w=o.width+dx;
        if (handle.includes("s")) h=o.height+dy;
        if (handle.includes("w")) { x=o.x+dx; w=o.width-dx; }
        if (handle.includes("n")) { y=o.y+dy; h=o.height-dy; }
        w=Math.max(1,w); h=Math.max(1,h);
        x=clamp(x,-w+1,t.size.width-1); y=clamp(y,-h+1,t.size.height-1);
        el.x=round1(x); el.y=round1(y); el.width=round1(w); el.height=round1(h);
      }

      function redrawCanvasOnly() {
        const t=currentTemplate();
        const canvas=document.getElementById("labelCanvas");
        if (!canvas) return;
        canvas.innerHTML = t.elements.map(el=>renderElementHtml(el,t,false)).join("");
        document.querySelectorAll("[data-el]").forEach(elNode=>{
          elNode.onpointerdown = e=>startElementPointer(e,elNode.dataset.el);
        });
      }

      function updateElementProp(prop, value) {
        const t=currentTemplate();
        const el=t.elements.find(x=>x.id===selectedElementId);
        if (!el) return;
        pushHistory();
        if (prop==="text") {
          el.text=value;
          el.textKind="static";
          t.updatedAt=nowText();
          saveState();
          const textKindSelect = document.querySelector('[data-prop="textKind"]');
          if (textKindSelect) textKindSelect.value = "static";
          redrawCanvasOnly();
          return;
        }
        if (prop==="checkboxText") {
          el.text=value;
          t.updatedAt=nowText();
          saveState();
          redrawCanvasOnly();
          return;
        }
        if (["x","y","width","height","fontSize","zIndex","rotate"].includes(prop)) value=Number(value);
        if (prop==="bold" || prop==="checked") value=Boolean(value);
        el[prop]=value;
        if (prop==="textKind"&&value==="field"&&!el.bindField) el.bindField=(FIELD_DICT[t.templateType]||[])[0]?.code||"";
        if (prop==="textKind"&&value==="static") el.bindField="";
        if (prop==="bindField"&&value&&el.type==="text") el.textKind="field";
        el.x=clamp(Number(el.x||0),-Number(el.width||1)+1,t.size.width-1);
        el.y=clamp(Number(el.y||0),-Number(el.height||1)+1,t.size.height-1);
        el.width=Math.max(1,Number(el.width||1));
        el.height=Math.max(1,Number(el.height||1));
        t.updatedAt=nowText(); saveState(); renderDesigner();
      }

      function addElement(type, overrides={}) {
        const t=currentTemplate();
        const comp=COMPONENTS.find(c=>c.type===type)||COMPONENTS[0];
        pushHistory();
        const base = { id:uid(type), type, x:Math.max(4,Math.min(12+t.elements.length*2,t.size.width-12)), y:Math.max(4,Math.min(8+t.elements.length*2,t.size.height-8)), width:24, height:8, textKind:"static", text:comp.label, fontSize:12, bold:false, align:"left", color:"#111827", backgroundColor:"transparent", zIndex:t.elements.length+1 };
        const el = {...base,...comp.preset,...overrides};
        if ((el.type==="qrcode"||el.type==="barcode"||el.textKind==="field")&&!fieldExists(t.templateType,el.bindField)) {
          el.bindField=(FIELD_DICT[t.templateType]||[])[0]?.code||"";
        }
        t.elements.push(el);
        selectedElementId=el.id;
        t.updatedAt=nowText(); saveState(); renderDesigner();
      }

      function deleteSelected() {
        const t=currentTemplate();
        if (!selectedElementId) return;
        pushHistory();
        t.elements=t.elements.filter(el=>el.id!==selectedElementId);
        selectedElementId=t.elements[0]?.id||null;
        t.updatedAt=nowText(); saveState(); renderDesigner();
      }

      function copySelected() {
        const el=currentTemplate().elements.find(x=>x.id===selectedElementId);
        if (!el) return;
        clipboardElement=deepClone(el);
        toast("已复制元素");
      }

      function pasteSelected() {
        const t=currentTemplate();
        if (!clipboardElement) return;
        pushHistory();
        const el={...deepClone(clipboardElement),id:uid(clipboardElement.type),x:clipboardElement.x+3,y:clipboardElement.y+3};
        t.elements.push(el);
        selectedElementId=el.id;
        saveState(); renderDesigner();
      }

      function pushHistory() {
        const t=currentTemplate();
        if (!t) return;
        history.push(JSON.stringify(t));
        if (history.length>10) history.shift();
        future=[];
      }

      function undo() {
        if (!history.length) return;
        const t=currentTemplate();
        future.push(JSON.stringify(t));
        const prev=JSON.parse(history.pop());
        replaceTemplate(prev);
        selectedElementId=prev.elements[0]?.id||null;
        saveState(); renderDesigner();
      }

      function redo() {
        if (!future.length) return;
        const t=currentTemplate();
        history.push(JSON.stringify(t));
        const next=JSON.parse(future.pop());
        replaceTemplate(next);
        selectedElementId=next.elements[0]?.id||null;
        saveState(); renderDesigner();
      }

      function replaceTemplate(next) {
        const idx=state.templates.findIndex(t=>t.id===next.id);
        if (idx>=0) state.templates[idx]=next;
      }

      document.addEventListener("keydown", e=>{
        if (currentView!=="designer") return;
        const tag=document.activeElement?.tagName;
        if (["INPUT","TEXTAREA","SELECT"].includes(tag)) return;
        const t=currentTemplate();
        const el=t?.elements.find(x=>x.id===selectedElementId);
        if (!el) return;
        if (e.key==="Delete"||e.key==="Backspace") { e.preventDefault(); deleteSelected(); }
        if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="c") { e.preventDefault(); copySelected(); }
        if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="v") { e.preventDefault(); pasteSelected(); }
        if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z") { e.preventDefault(); e.shiftKey?redo():undo(); }
        if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="y") { e.preventDefault(); redo(); }
        if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
          e.preventDefault(); pushHistory();
          const step=e.shiftKey?5:1;
          if (e.key==="ArrowLeft") el.x=clamp(el.x-step,-el.width+1,t.size.width-1);
          if (e.key==="ArrowRight") el.x=clamp(el.x+step,-el.width+1,t.size.width-1);
          if (e.key==="ArrowUp") el.y=clamp(el.y-step,-el.height+1,t.size.height-1);
          if (e.key==="ArrowDown") el.y=clamp(el.y+step,-el.height+1,t.size.height-1);
          saveState(); renderDesigner();
        }
      });

      function renderValidationPanel(result) {
        const all = [
          ...result.errors.map(x=>({...x,level:"error",label:"错误"})),
          ...result.warnings.map(x=>({...x,level:"warning",label:"警告"})),
          ...result.tips.map(x=>({...x,level:"tip",label:"提示"}))
        ];
        return `<div class="validation-panel">
          <div class="validation-head">
            <span>校验结果</span>
            <span class="section-meta">${result.canPublish?"可发布":"不可发布"} · 错误 ${result.errors.length} / 警告 ${result.warnings.length} / 提示 ${result.tips.length}</span>
          </div>
          <div class="validation-list">
            ${all.length?all.map(item=>`<div class="validation-item ${item.level}" ${item.elementId?`data-el="${item.elementId}"`:""}>
              <strong>${item.label}</strong> ${escHtml(item.message)}${item.elementId?`<br><small>元素：${item.elementId}</small>`:""}
            </div>`).join(""):`<div class="empty-state">暂无校验结果</div>`}
          </div>
        </div>`;
      }

      async function publishTemplate(t) {
        try {
          const updated = await apiPublishTemplate(t.id);
          replaceTemplate(updated);
          addAppLog("发布模板",`${updated.templateName} ${updated.version}`);
          toast("模板已发布");
          render();
        } catch (error) {
          const result = error.response?.data;
          if (error.response?.code === 40002 && result) {
            validation=result; currentTemplateId=t.id; setView("designer"); toast("存在错误，不能发布");
            return;
          }
          toast(`发布失败：${error.message}`);
        }
      }

      // ══════════════════════════════════════
      //  AI / JSON / MODALS
      // ══════════════════════════════════════
      function openNewTemplateModal() {
        document.getElementById("genericModalTitle").textContent = "新增模板";
        document.getElementById("genericModalBody").innerHTML = `
          <div class="row">
            <div class="col-12 mb-3"><label class="form-label">模板名称 <span class="text-danger">*</span></label><input class="form-control" id="newName" placeholder="例如：库位标签-100x50-客户A"></div>
            <div class="col-md-6 mb-3"><label class="form-label">模板类型</label><select class="form-select" id="newType"><option value="LOCATION">库位模板</option><option value="CONTAINER">容器模板</option><option value="PRODUCT">商品模板</option></select></div>
            <div class="col-md-6 mb-3"><label class="form-label">初始尺寸</label><input class="form-control" id="newSizeHint" value="库位/容器默认 100×50mm，商品默认 30×70mm；可进入设计器后编辑" disabled></div>
            <div class="col-12 mb-3"><label class="form-label">备注</label><textarea class="form-control" id="newRemark" rows="3"></textarea></div>
          </div>`;
        document.getElementById("genericModalFoot").innerHTML = `
          <button class="btn btn-secondary-wms" data-bs-dismiss="modal">取消</button>
          <button class="btn btn-primary-wms" id="createTemplateConfirm">确定并进入设计器</button>`;
        genericModal.show();

        document.getElementById("createTemplateConfirm").onclick = async ()=>{
          const name=document.getElementById("newName").value.trim();
          if (!name) return toast("模板名称必填");
          const type=document.getElementById("newType").value;
          const defaultSize = type === "PRODUCT" ? { width: 30, height: 70, unit: "mm", dpi: 203 } : { width: 100, height: 50, unit: "mm", dpi: 203 };
          const tpl = {
            id:uid("tpl"), dslVersion:"1.0", templateCode:`TPL_${type}_${Date.now().toString().slice(-6)}`,
            templateName:name, templateType:type,
            areaWarehouseCodes: [],
            size: defaultSize,
            version:"V0", status:"draft", isDefault:false, remark:document.getElementById("newRemark").value.trim(), updatedAt:nowText(), elements:[]
          };
          try {
            const created = await apiCreateTemplate(tpl);
            state.templates.unshift(created); currentTemplateId=created.id; selectedElementId=null;
            addAppLog("新增模板",created.templateName);
            genericModal.hide(); setView("designer");
          } catch (error) {
            toast(`新增失败：${error.message}`);
          }
        };
      }

      async function openJsonModal(mode, template=currentTemplate()) {
        const isExport = mode==="export";
        let json = "";
        if (isExport) {
          try {
            json = JSON.stringify(await apiExportTemplate(template.id),null,2);
          } catch (error) {
            toast(`导出失败：${error.message}`);
            return;
          }
        }
        document.getElementById("largeModalTitle").textContent = isExport?"导出 JSON":"导入 JSON";
        document.getElementById("largeModalBody").innerHTML = `
          <div class="notice">${isExport?"当前模板 DSL JSON，可直接复制备份。":"粘贴模板 DSL JSON，导入后会生成草稿模板，不会直接发布。"}</div>
          <textarea id="jsonText" class="form-control json-box" placeholder="粘贴 JSON">${escHtml(json)}</textarea>`;
        document.getElementById("largeModalFoot").innerHTML = `
          <button class="btn btn-secondary-wms" data-bs-dismiss="modal">关闭</button>
          ${isExport?`<button class="btn btn-primary-wms" id="copyJsonBtn">复制 JSON</button>`:`<button class="btn btn-primary-wms" id="applyJsonBtn">导入为草稿</button>`}`;
        largeModal.show();

        if (isExport) {
          document.getElementById("copyJsonBtn").onclick = async ()=>{
            await navigator.clipboard?.writeText(document.getElementById("jsonText").value);
            toast("JSON 已复制");
          };
        } else {
          document.getElementById("applyJsonBtn").onclick = async ()=>{
            try {
              const raw=JSON.parse(document.getElementById("jsonText").value);
              const tpl=fromDsl(raw, uid, nowText);
              const result=validateTemplateDsl(tpl);
              if (raw.dslVersion&&raw.dslVersion!=="1.0") return toast("DSL 版本不兼容");
              if (result.errors.some(e=>/尺寸宽高|模板类型/.test(e.message))) return toast("导入失败：模板类型或尺寸不合法");
              tpl.id=uid("tpl"); tpl.templateCode=raw.templateCode||`TPL_IMPORT_${Date.now().toString().slice(-6)}`;
              tpl.templateName=`${tpl.templateName||"导入模板"}-导入草稿`; tpl.status="draft"; tpl.version="V0"; tpl.updatedAt=nowText();
              const created = await apiImportTemplate(tpl);
              state.templates.unshift(created); currentTemplateId=created.id; selectedElementId=created.elements[0]?.id||null;
              addAppLog("导入 JSON",created.templateName);
              largeModal.hide(); setView("designer"); toast("导入成功，已生成草稿");
            } catch(err) { toast(`JSON 格式错误：${err.message}`); }
          };
        }
      }

      function openAiModal() {
        document.getElementById("largeModalTitle").textContent = "AI 生成模板草稿";
        document.getElementById("largeModalBody").innerHTML = `
          <div class="notice">AI 为 mock 逻辑，只生成模板草稿。生成内容需人工确认并通过校验后发布。</div>
          <div class="row">
            <div class="col-md-6 mb-3"><label class="form-label">模板类型</label><select class="form-select" id="aiType"><option value="LOCATION">库位模板</option><option value="CONTAINER">容器模板</option><option value="PRODUCT">商品模板</option></select></div>
            <div class="col-md-6 mb-3"><label class="form-label">生成状态</label><input class="form-control" disabled value="草稿"></div>
            <div class="col-12 mb-3"><label class="form-label">自然语言描述</label><textarea class="form-control" id="aiPrompt" rows="5">帮我生成一个 10×5cm 的库位标签，顶部居中显示库位编码，左下角放二维码，右下角显示方向标，左上角显示库位前缀，黑底白字，加粗。</textarea></div>
            <div class="col-12 mb-3"><label class="form-label">JSON 预览</label><textarea id="aiJson" class="form-control json-box" placeholder="点击生成后展示系统 DSL JSON"></textarea></div>
          </div>`;
        document.getElementById("largeModalFoot").innerHTML = `
          <button class="btn btn-secondary-wms" data-bs-dismiss="modal">取消</button>
          <button class="btn btn-light-wms" id="aiGenerateBtn">生成 JSON</button>
          <button class="btn btn-primary-wms" id="aiApplyBtn" disabled>应用到画布</button>`;
        largeModal.show();

        document.getElementById("aiGenerateBtn").onclick = async ()=>{
          try {
            aiDraft = await generateAiTemplate({ prompt: document.getElementById("aiPrompt").value, templateType: document.getElementById("aiType").value });
            document.getElementById("aiJson").value = JSON.stringify(toDsl(aiDraft),null,2);
            document.getElementById("aiApplyBtn").disabled = false;
          } catch (error) {
            toast(`AI 生成失败：${error.message}`);
          }
        };
        document.getElementById("aiApplyBtn").onclick = async ()=>{
          if (!aiDraft) return;
          aiDraft.validationResult = validateTemplateDsl(aiDraft);
          try {
            const created = await apiCreateTemplate(aiDraft);
            state.templates.unshift(created); currentTemplateId=created.id; selectedElementId=created.elements[0]?.id||null;
            addAppLog("AI 生成草稿",created.templateName);
            largeModal.hide(); setView("designer"); toast("AI 已生成模板草稿，请校验后发布");
          } catch (error) {
            toast(`AI 草稿保存失败：${error.message}`);
          }
        };
      }

      function openPreviewModal(t, data=sampleByType(t.templateType)) {
        const oldZoom=zoom;
        const previewZoom=Math.min(2,360/(t.size.width*PX_PER_MM));
        zoom=previewZoom;
        const html = `<div class="preview-wrap">
          <div class="preview-card">
            <div class="label-canvas" style="width:${t.size.width*PX_PER_MM*zoom}px;height:${t.size.height*PX_PER_MM*zoom}px">
              ${t.elements.map(el=>renderElementHtml(el,t,true,data)).join("")}
            </div>
          </div>
          <div class="card-panel" style="box-shadow:none">
            <div class="section-head"><span style="font-weight:700">模板信息</span></div>
            <div style="padding:14px;display:grid;gap:8px">
              <div><b>模板名称：</b>${t.templateName}</div>
              <div><b>模板类型：</b>${TYPE_LABEL[t.templateType]}</div>
              <div><b>尺寸：</b>${t.size.width} × ${t.size.height}${t.size.unit}</div>
              <div><b>版本：</b>${t.version}</div>
              <div><b>状态：</b><span class="status-pill ${STATUS_CLASS[t.status]}">${STATUS_LABEL[t.status]}</span></div>
            </div>
          </div>
        </div>`;
        zoom=oldZoom;
        document.getElementById("largeModalTitle").textContent = "模板预览";
        document.getElementById("largeModalBody").innerHTML = html;
        document.getElementById("largeModalFoot").innerHTML = `<button class="btn btn-primary-wms" data-bs-dismiss="modal">关闭</button>`;
        largeModal.show();
      }

      // ══════════════════════════════════════
      //  FIELDS
      // ══════════════════════════════════════
      function renderFields() { return FieldDictionary.renderFields(appContext); }

      function renderFieldsLegacy() {
        const resources = [
          { type: "LOCATION", label: "库位", path: "/api/v1/template/fields/location",  desc: "库位模板可绑定字段定义，适用于库位标签及库位相关打印模板" },
          { type: "CONTAINER", label: "容器", path: "/api/v1/template/fields/container", desc: "容器模板可绑定字段定义，适用于容器标签及容器相关打印模板" },
          { type: "PRODUCT", label: "商品", path: "/api/v1/template/fields/product", desc: "商品模板可绑定字段定义，适用于商品标签及商品相关打印模板" }
        ];
        const current = resources.find(r=>r.type===selectedFieldType) || resources[0];
        const fields = FIELD_DICT[current.type] || [];
        document.getElementById("view-fields").innerHTML = `
          <div class="field-dict-layout">
            <aside class="field-tree">
              <div class="field-tree-head">字段字典 API</div>
              <div class="field-tree-group">
                <div class="field-tree-parent">模板字段</div>
                ${resources.map(r=>`
                  <button class="field-tree-node ${selectedFieldType===r.type?"active":""}" data-field-type="${r.type}" type="button">
                    <span class="field-tree-node-name">${r.label}</span>
                    <code>${r.path}</code>
                  </button>
                `).join("")}
              </div>
            </aside>
            <section class="field-dict-content">
              <div class="api-resource">
            <div class="api-endpoint">
              <span class="api-method get">GET</span>
              <span class="api-path">${current.path}</span>
              <span class="api-endpoint-desc">${current.label} · ${current.desc}</span>
            </div>
            <div class="api-params">
              ${fields.map(f=>`
              <div class="api-param">
                <div class="api-param-left">
                  <span class="api-param-name">${f.code}</span>
                  <span class="api-param-type">${f.type||"string"}</span>
                  <span class="api-param-required ${f.required?"is-yes":"is-no"}">${f.required?"必填":"可选"}</span>
                </div>
                <div class="api-param-right">
                  <div class="api-param-desc">${f.desc||f.name}</div>
                  <span class="api-param-example">${f.example}</span>
                </div>
              </div>
              `).join("")}
            </div>
              </div>
            </section>
          </div>`;
        document.querySelectorAll("[data-field-type]").forEach(node=>{
          node.onclick = ()=>{
            selectedFieldType = node.dataset.fieldType;
            renderFields();
          };
        });
      }

      // ══════════════════════════════════════
      //  BUSINESS PRINT SIMULATION
      // ══════════════════════════════════════
      function bizHeader(k) {
        const all=[...FIELD_DICT.LOCATION,...FIELD_DICT.CONTAINER,...FIELD_DICT.PRODUCT].find(f=>f.code===k);
        return all?all.name:k;
      }

      function businessCodeKeyByType(type) {
        if (type === "LOCATION") return "locationCode";
        if (type === "CONTAINER") return "containerCode";
        if (type === "PRODUCT") return "productCode";
        return "";
      }

      function renderBusiness() { return BusinessData.renderBusinessData(appContext); }

      async function renderBusinessData() {
        const root = document.getElementById("view-business");
        const type = businessDataFilters.type;
        const fields = FIELD_DICT[type] || [];

        // Fetch data
        try {
          const result = await apiListBusinessData(type, {
            keyword: businessDataFilters.keyword,
            page: businessDataFilters.page,
            pageSize: businessDataFilters.pageSize,
          });
          businessDataState = result || { rows: [], total: 0 };
        } catch (err) {
          businessDataState = { rows: [], total: 0 };
          if (err.message && !err.message.includes("请求失败")) toast(`加载业务数据失败：${err.message}`);
        }

        const { rows, total } = businessDataState;
        const totalPages = Math.max(1, Math.ceil(total / businessDataFilters.pageSize));
        const currentPage = businessDataFilters.page;

        root.innerHTML = `
          <div class="card-panel filter-panel">
            <div class="panel-body">
              <div class="row align-items-end">
                <div class="col-auto">
                  <div class="inline-tabs" style="margin-bottom:0">
                    <div class="inline-tab ${type==="LOCATION"?"active":""}" data-biz-tab="LOCATION">库位管理</div>
                    <div class="inline-tab ${type==="CONTAINER"?"active":""}" data-biz-tab="CONTAINER">容器管理</div>
                    <div class="inline-tab ${type==="PRODUCT"?"active":""}" data-biz-tab="PRODUCT">商品管理</div>
                  </div>
                </div>
                <div class="col-md-3">
                  <input class="form-control" id="bizKeyword" placeholder="搜索编码..." value="${escAttr(businessDataFilters.keyword)}">
                </div>
                <div class="col-auto">
                  <button class="btn btn-primary-wms" id="bizQueryBtn">查询</button>
                  <button class="btn btn-secondary-wms" id="bizResetBtn">重置</button>
                </div>
              </div>
            </div>
          </div>
          <div class="card-panel">
            <div class="section-head">
              <div class="toolbar-actions">
                <button class="btn btn-primary-wms" id="bizAddBtn">新增</button>
                <button class="btn btn-light-wms" id="templatePrintBtn">模板打印</button>
              </div>
              <div>
                <span class="section-meta">共 ${total} 条</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="table align-middle">
                <thead><tr>
                  <th class="selection-cell"><input id="bizCheckAll" type="checkbox"></th>
                  ${["编码", ...fields.map(f=>f.name), "操作"].map(h=>`<th class="text-start">${h}</th>`).join("")}
                </tr></thead>
                <tbody>${rows.length ? rows.map(r=>`<tr>
                  <td class="selection-cell"><input class="bizRowCheck" type="checkbox" value="${r.id}" ${selectedBusinessRows.has(String(r.id))?"checked":""}></td>
                  <td class="text-start" style="font-weight:600">${escHtml(r.businessCode)}</td>
                  ${fields.map(f=>`<td class="text-start">${escHtml(r.fields[f.code] ?? "-")}</td>`).join("")}
                  <td class="text-start">
                    <span class="action-link" data-biz-act="edit" data-biz-id="${r.id}">编辑</span>
                    <span class="action-link" data-biz-act="delete" data-biz-id="${r.id}">删除</span>
                  </td>
                </tr>`).join("") : `<tr><td colspan="${fields.length+3}"><div class="empty-state">暂无业务数据，请点击新增。</div></td></tr>`}</tbody>
              </table>
            </div>
            ${renderBusinessPagination(currentPage, totalPages, total)}
          </div>`;

        // Bind events
        document.querySelectorAll("[data-biz-tab]").forEach(tab => {
          tab.onclick = () => {
            businessDataFilters = { type: tab.dataset.bizTab, keyword: "", page: 1, pageSize: 20 };
            businessTab = tab.dataset.bizTab;
            selectedBusinessRows.clear();
            renderBusiness();
          };
        });
        document.getElementById("bizQueryBtn").onclick = () => {
          businessDataFilters.keyword = document.getElementById("bizKeyword").value.trim();
          businessDataFilters.page = 1;
          renderBusiness();
        };
        document.getElementById("bizResetBtn").onclick = () => {
          businessDataFilters = { type: businessDataFilters.type, keyword: "", page: 1, pageSize: 20 };
          renderBusiness();
        };
        document.getElementById("bizKeyword").onkeydown = e => { if (e.key==="Enter") document.getElementById("bizQueryBtn").click(); };
        document.getElementById("bizAddBtn").onclick = () => openBizDataModal();
        document.getElementById("templatePrintBtn").onclick = () => {
          if (selectedBusinessRows.size === 0) return toast("请先勾选要打印的业务数据");
          // Map selected IDs to data objects
          const selectedData = rows.filter(r => selectedBusinessRows.has(String(r.id))).map(r => ({ _id: r.id, ...r.fields }));
          openPrintModal(null, selectedData);
        };
        // Select-all checkbox
        const bizCheckAll = document.getElementById("bizCheckAll");
        if (bizCheckAll) {
          bizCheckAll.checked = rows.length > 0 && rows.every(r => selectedBusinessRows.has(String(r.id)));
          bizCheckAll.onchange = () => {
            document.querySelectorAll(".bizRowCheck").forEach(chk => {
              chk.checked = bizCheckAll.checked;
              if (bizCheckAll.checked) selectedBusinessRows.add(chk.value);
              else selectedBusinessRows.delete(chk.value);
            });
          };
        }
        // Individual row checkboxes
        document.querySelectorAll(".bizRowCheck").forEach(chk => {
          chk.onchange = () => {
            if (chk.checked) selectedBusinessRows.add(chk.value);
            else selectedBusinessRows.delete(chk.value);
            // Sync select-all
            const allChk = document.getElementById("bizCheckAll");
            if (allChk) allChk.checked = rows.length > 0 && rows.every(r => selectedBusinessRows.has(String(r.id)));
          };
        });
        document.querySelectorAll("[data-biz-act]").forEach(el => {
          el.onclick = () => {
            const act = el.dataset.bizAct;
            const id = el.dataset.bizId;
            if (act === "edit") openBizDataModal(id);
            if (act === "delete") deleteBizData(id);
          };
        });
        document.querySelectorAll("[data-biz-page]").forEach(btn => {
          btn.onclick = () => {
            const p = Number(btn.dataset.bizPage);
            if (p >= 1 && p <= totalPages) { businessDataFilters.page = p; renderBusiness(); }
          };
        });
      }

      function renderBusinessPagination(page, totalPages, total) {
        if (totalPages <= 1) return "";
        const pages = [];
        for (let i = Math.max(1, page-2); i <= Math.min(totalPages, page+2); i++) pages.push(i);
        if (pages[0] > 1) { pages.unshift(1); if (pages[1] > 2) pages.splice(1, 0, "..."); }
        if (pages[pages.length-1] < totalPages) { if (pages[pages.length-1] < totalPages-1) pages.push("..."); pages.push(totalPages); }
        return `<div class="pagination-bar"><div class="pagination-controls">
          <button class="pagination-btn" data-biz-page="${page-1}" ${page<=1?"disabled":""}>上一页</button>
          ${pages.map(p=>p==="..."?`<span class="pagination-ellipsis">…</span>`:`<button class="pagination-btn ${p===page?"active":""}" data-biz-page="${p}">${p}</button>`).join("")}
          <button class="pagination-btn" data-biz-page="${page+1}" ${page>=totalPages?"disabled":""}>下一页</button>
        </div><span class="section-meta">共 ${total} 条</span></div>`;
      }

      function openBizDataModal(editId = null) {
        const type = businessDataFilters.type;
        const fields = FIELD_DICT[type] || [];
        const isEdit = !!editId;
        let editData = null;

        const renderForm = async () => {
          if (isEdit) {
            try {
              editData = await apiGetBusinessData(editId);
            } catch (err) {
              toast(`获取数据失败：${err.message}`);
              return;
            }
          }
          const data = editData ? editData.fields : {};
          document.getElementById("genericModalTitle").textContent = isEdit ? "编辑业务数据" : "新增业务数据";
          document.getElementById("genericModalBody").innerHTML = `
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">业务类型</label>
                <input class="form-control" disabled value="${TYPE_LABEL[type]||type}">
              </div>
              ${fields.map(f => {
                const val = data[f.code] ?? "";
                const required = f.required;
                const isSelect = f.type === 'select';
                const options = isSelect ? (() => { try { return JSON.parse(f.example || '[]'); } catch { return []; } })() : [];
                const inputHtml = isSelect
                  ? `<select class="form-select biz-field-input" data-field="${f.code}" data-required="${required}">
                      <option value="">请选择</option>
                      ${options.map(opt => `<option value="${escAttr(opt)}" ${val === opt ? 'selected' : ''}>${escHtml(opt)}</option>`).join("")}
                    </select>`
                  : `<input class="form-control biz-field-input" data-field="${f.code}" data-required="${required}" type="${f.type==='integer'?'number':'text'}" value="${escAttr(val)}" placeholder="${escAttr(f.example||'')}">`;
                return `<div class="col-md-6 mb-3">
                  <label class="form-label">${f.name}${required?'<span style="color:red">*</span>':''}</label>
                  ${inputHtml}
                </div>`;
              }).join("")}
            </div>`;
          document.getElementById("genericModalFoot").innerHTML = `
            <button class="btn btn-secondary-wms" data-bs-dismiss="modal">取消</button>
            <button class="btn btn-primary-wms" id="bizSaveBtn">保存</button>`;
          genericModal.show();

          document.getElementById("bizSaveBtn").onclick = async () => {
            const bizData = {};
            let hasError = false;
            document.querySelectorAll(".biz-field-input").forEach(input => {
              const code = input.dataset.field;
              let val = input.value.trim();
              if (input.dataset.required === "true" && !val) {
                const label = fields.find(f => f.code === code)?.name || code;
                toast(`必填字段 [${label}] 不能为空`);
                hasError = true;
                return;
              }
              if (input.type === "number") val = val === "" ? "" : String(val);
              bizData[code] = val;
            });
            if (hasError) return;

            try {
              if (isEdit) {
                await apiUpdateBusinessData(editId, { businessData: bizData });
                toast("更新成功");
              } else {
                await apiCreateBusinessData({ businessType: type, businessData: bizData });
                toast("创建成功");
              }
              genericModal.hide();
              renderBusiness();
            } catch (err) {
              toast(`操作失败：${err.message}`);
            }
          };
        };
        renderForm();
      }

      async function deleteBizData(id) {
        if (!confirm("确定删除该业务数据？此操作不可恢复。")) return;
        try {
          await apiDeleteBusinessData(id);
          toast("删除成功");
          renderBusiness();
        } catch (err) {
          toast(`删除失败：${err.message}`);
        }
      }

      async function openPrintModal(template = null, preselectedData = null) {
        // Find all published templates matching the current business type
        const publishedTemplates = state.templates.filter(
          t => t.templateType === businessTab && t.status === "published"
        );

        if (!publishedTemplates.length) return toast(`暂无${TYPE_LABEL[businessTab]||businessTab}类型的已发布模板`);
        // Default to first published template when multiple exist (user can switch via dropdown)
        if (!template) template = publishedTemplates[0];

        // Track the currently active template (may change via dropdown)
        let activeTemplate = template;

        // Use preselected data if provided, otherwise fetch from backend
        let data = [];
        if (preselectedData && preselectedData.length) {
          data = preselectedData;
        } else {
          try {
            const result = await apiListBusinessData(activeTemplate.templateType, { pageSize: 200 });
            data = (result.rows || []).map(r => ({ _id: r.id, ...r.fields }));
          } catch { /* fallback to empty */ }
        }

        const fieldKeys = data.length ? Object.keys(data[0]).filter(k => k !== "_id") : [];
        // Pre-check all rows
        let printSelectedRows = new Set(data.map((_, i) => String(i)));

        // Template selector for multiple templates of same type
        const templateSelector = publishedTemplates.length > 1 ? `
          <div class="col-md-6 mb-3">
            <label class="form-label">选择模板 <span style="color:red">*</span></label>
            <select class="form-select" id="printTemplateSelect">
              ${publishedTemplates.map(t => `<option value="${t.id}" ${t.id === activeTemplate.id ? "selected" : ""}>${escHtml(t.templateName)}</option>`).join("")}
            </select>
          </div>` : `
          <div class="col-md-6 mb-3"><label class="form-label">模板名称</label><input class="form-control" disabled value="${escAttr(activeTemplate.templateName)}"></div>`;

        document.getElementById("genericModalTitle").textContent = "模板打印";
        document.getElementById("genericModalBody").innerHTML = `
          <div class="row">
            ${templateSelector}
            <div class="col-md-6 mb-3"><label class="form-label">模板类型</label><input class="form-control" disabled value="${TYPE_LABEL[activeTemplate.templateType]||activeTemplate.templateType}"></div>
            <div class="col-md-6 mb-3"><label class="form-label">打印份数</label><input class="form-control" id="printCopies" type="number" min="1" value="1"></div>
            <div class="col-md-6 mb-3"><label class="form-label">打印方式</label><select class="form-select"><option>PDF打印</option></select></div>
            <div class="col-12 mb-3">
              <label class="form-label">业务数据</label>
              <div class="table-wrap">
                <table class="table align-middle">
                  <thead><tr><th class="selection-cell"><input id="checkAllPrintRows" type="checkbox" checked></th>${fieldKeys.map(k=>`<th class="text-start">${bizHeader(k)}</th>`).join("")}</tr></thead>
                  <tbody>${data.map((r,i)=>`<tr>
                    <td class="selection-cell"><input class="printRowCheck" type="checkbox" value="${i}" checked></td>
                    ${fieldKeys.map(k=>`<td class="text-start">${escHtml(r[k])}</td>`).join("")}
                  </tr>`).join("") || `<tr><td colspan="${fieldKeys.length + 1}"><div class="empty-state">暂无业务数据，请先在业务数据模块中添加。</div></td></tr>`}</tbody>
                </table>
              </div>
            </div>
            <div class="col-12 mb-3"><label class="form-label">预览</label><div id="printPreview" class="preview-card"></div></div>
          </div>`;
        document.getElementById("genericModalFoot").innerHTML = `
          <button class="btn btn-secondary-wms" data-bs-dismiss="modal">取消</button>
          <button class="btn btn-primary-wms" id="printConfirmBtn">打印</button>`;
        genericModal.show();

        const selectedRows = ()=>[...printSelectedRows].map(i=>data[Number(i)]).filter(Boolean);
        const drawPreview = ()=>{
          const tpl=activeTemplate;
          const selected=selectedRows();
          const box=document.getElementById("printPreview");
          if (!tpl || !selected.length) { box.innerHTML=`<div class="empty-state">请选择业务数据</div>`; return; }
          const oldZoom=zoom;
          zoom=Math.min(1.4,340/(tpl.size.width*PX_PER_MM));
          box.innerHTML=`<div class="label-canvas" style="width:${tpl.size.width*PX_PER_MM*zoom}px;height:${tpl.size.height*PX_PER_MM*zoom}px">${tpl.elements.map(el=>renderElementHtml(el,tpl,true,selected[0])).join("")}</div>`;
          zoom=oldZoom;
        };
        drawPreview();

        // Template selector: switch template and redraw preview
        const templateSelect = document.getElementById("printTemplateSelect");
        if (templateSelect) {
          templateSelect.onchange = () => {
            activeTemplate = publishedTemplates.find(t => t.id === templateSelect.value) || activeTemplate;
            drawPreview();
          };
        }

        document.querySelectorAll(".printRowCheck").forEach(chk=>chk.onchange=e=>{
          e.target.checked?printSelectedRows.add(e.target.value):printSelectedRows.delete(e.target.value);
          drawPreview();
        });
        document.getElementById("checkAllPrintRows").onchange=e=>{
          printSelectedRows = new Set(e.target.checked?data.map((_,i)=>String(i)):[]);
          document.querySelectorAll(".printRowCheck").forEach(chk=>{ chk.checked=e.target.checked; });
          drawPreview();
        };
        document.getElementById("printConfirmBtn").onclick=async ()=>{
          const tpl=activeTemplate;
          if (!tpl) return toast("无可用模板");
          const selected=selectedRows();
          if (!selected.length) return toast("请先选择业务数据");
          const copies=Math.max(1,Number(document.getElementById("printCopies").value||1));
          const codeKey=businessCodeKeyByType(tpl.templateType);
          try {
            // Generate PDF and download (backend also logs the print operation)
            const pdfBlob = await downloadPrintPdf({
              templateId: tpl.id,
              templateCode: tpl.templateCode,
              rows: selected,
              copies,
              businessType: tpl.templateType,
              businessNo: selected.map(r=>r[codeKey]).join(", "),
              warehouseCode: selected[0]?.warehouseCode || "",
              printMode: "PDF打印",
            });

            // Trigger browser download
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement("a");
            a.href = url;
            const now = new Date();
            const pad = n => String(n).padStart(2, '0');
            const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
            const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            a.download = `${tpl.templateName}_${dateStr}_${timeStr}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addAppLog("模板打印",`${tpl.templateName} × ${selected.length*copies}`);
            genericModal.hide(); toast("打印成功，PDF 已下载");
          } catch (error) {
            toast(`打印失败：${error.message}`);
          }
        };
      }


      // ══════════════════════════════════════
      //  HELPERS
      // ══════════════════════════════════════
      function readInputValue(input) {
        if (input.type==="checkbox") return input.checked;
        return input.value;
      }

      const appContext = {
        get state() { return state; },
        set state(next) { state = next; },
        get currentView() { return currentView; },
        set currentView(next) { currentView = next; },
        get currentTemplateId() { return currentTemplateId; },
        set currentTemplateId(next) { currentTemplateId = next; },
        get selectedElementId() { return selectedElementId; },
        set selectedElementId(next) { selectedElementId = next; },
        get zoom() { return zoom; },
        set zoom(next) { zoom = next; },
        get showGrid() { return showGrid; },
        set showGrid(next) { showGrid = next; },
        get validation() { return validation; },
        set validation(next) { validation = next; },
        get dragState() { return dragState; },
        set dragState(next) { dragState = next; },
        get history() { return history; },
        set history(next) { history = next; },
        get future() { return future; },
        set future(next) { future = next; },
        get clipboardElement() { return clipboardElement; },
        set clipboardElement(next) { clipboardElement = next; },
        get filters() { return filters; },
        set filters(next) { filters = next; },
        get businessTab() { return businessTab; },
        set businessTab(next) { businessTab = next; },
        get selectedBusinessRows() { return selectedBusinessRows; },
        set selectedBusinessRows(next) { selectedBusinessRows = next; },
        get aiDraft() { return aiDraft; },
        set aiDraft(next) { aiDraft = next; },
        get businessDataState() { return businessDataState; },
        get businessDataFilters() { return businessDataFilters; },
        renderTemplateListLegacy,
        renderDesignerLegacy,
        renderFieldsLegacy,
        renderBusinessData,
      };

      // ── Init ──
      function initTime() {
        const updateTime = ()=>{
          const d=new Date();
          const pad=n=>String(n).padStart(2,"0");
          document.getElementById("timeDisplay").textContent = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };
        updateTime(); setInterval(updateTime, 1000);
      }

      function initLangSwitcher() {
        const ls = document.getElementById("languageSwitcher");
        if (ls) {
          document.documentElement.lang = ls.value;
          ls.addEventListener("change", ()=>{ document.documentElement.lang = ls.value; });
        }
      }

      // ── Tab clicks ──
      document.querySelectorAll("#tabbarTabs .nav-tab").forEach(tab=>{
        tab.addEventListener("click", ()=>setView(tab.dataset.view));
      });

      // ── Reset demo ──
      document.getElementById("resetDemoBtn")?.addEventListener("click", ()=>{
        if (!confirm("确认重新加载后端数据？")) return;
        state=defaultState(); currentTemplateId=null;
        selectedElementId=null; selectedBusinessRows.clear();
        hydrateState(); setView("templates");
      });

      // ── Bootstrap modal cleanup ──
      document.getElementById("genericModal").addEventListener("hidden.bs.modal", ()=>{
        document.getElementById("genericModalBody").innerHTML = "";
        document.getElementById("genericModalFoot").innerHTML = "";
      });
      document.getElementById("largeModal").addEventListener("hidden.bs.modal", ()=>{
        document.getElementById("largeModalBody").innerHTML = "";
        document.getElementById("largeModalFoot").innerHTML = "";
      });

      // ── STARTUP ──
      initTime();
      initLangSwitcher();
      await hydrateState();
}
