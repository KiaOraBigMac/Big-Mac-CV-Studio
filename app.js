(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'freecvstudio.web.v1';
  const LANGUAGE_KEY = 'bigmaccv.language';
  const PALETTES = {
    'Formal Black & White': '#111111',
    'Ocean Blue': '#326789',
    'Forest Green': '#426B52',
    'Burgundy': '#873D52',
    'Charcoal': '#374151'
  };
  const state = {
    name: '', title: '', email: '', phone: '', location: '', linkedin: '', summary: '', skills: '', certifications: '',
    template: 'Formal Black & White', layout_mode: 'Single Column', accent: '#111111', font: 'Arial', font_size: 10, margin: 15,
    experience: [blankEntry()], education: [blankEntry()], projects: [blankEntry()],
    section_order: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'], custom_styles: {}
  };
  let selectedFormatKey = null;
  let zoom = 1;
  let saveTimer = null;
  let toastTimer = null;
  let language = 'en';
  try { language = localStorage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en'; } catch (_) { /* Storage may be unavailable. */ }

  function blankEntry() { return { organisation: '', role: '', dates: '', location: '', details: '' }; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function lines(value) { return String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); }
  function splitSkills(value) { return String(value || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean); }

  const translations = {
    en: {brandSub:'Resume builder',build:'Build your CV',buildSub:'Edit your details and see changes live.',design:'Design settings',template:'Template',layout:'Layout',palette:'Colour palette',customColour:'Custom colour',font:'Font',fontSize:'Font size',margins:'Page margins',personal:'Personal',summaryTab:'Summary',experienceTab:'Experience',educationTab:'Education',projectsTab:'Projects',extrasTab:'Skills & Certifications',fullName:'Full name',title:'Professional title',email:'Email',phone:'Phone',location:'Location',linkedin:'LinkedIn / Website',summaryLabel:'Professional summary',summaryHint:'Tip: focus on your experience, strengths and the value you bring to the role.',experienceTitle:'Work experience',experienceHint:'Add roles, achievements and responsibilities.',addExperience:'+ Add experience',educationTitle:'Education',educationHint:'Add qualifications and relevant details.',addEducation:'+ Add education',projectsTitle:'Projects',projectsHint:'Highlight research, projects and outcomes.',addProject:'+ Add project',skillsLabel:'Skills',skillsHint:'Separate skills with commas, semicolons or new lines.',certLabel:'Certifications',clear:'Clear CV',footer:'Designed for local-first editing.',open:'Open .fcv',save:'Save .fcv',exportWord:'Export Word',exportPdf:'Export PDF',livePreview:'LIVE PREVIEW',formatting:'Text formatting',formattingHint:'Click any text in the CV preview, then format that block',size:'Size (pt)',colour:'Colour',alignment:'Alignment',lineSpacing:'Line spacing',reset:'Reset',selectText:'Click text in the preview to select it',guide:'User guide',gotIt:'Got it',saving:'Saving…',saved:'Saved locally',notSaved:'Not saved',summaryHeading:'Professional Summary',experienceHeading:'Work Experience',educationHeading:'Education',projectsHeading:'Projects',skillsHeading:'Skills',certHeading:'Certifications',emptyPreview:'Your CV preview will appear here.',emptyPreviewSub:'Start by entering your name and professional details.',sectionUpdated:'Section order updated.',selectFirst:'Click a text block in the preview first.',selectFirstReset:'Select a text block in the preview first.',guideTitle:'User Guide',guide1:'The system currently includes three layouts. “Classic” is the most versatile general-purpose layout.',guide2:'Drag the sections to change their order.',guide3:'Thank you for your support!',close:'Close guide',selected:'Selected',textBlock:'text block',default:'Default',left:'Left',center:'Center',right:'Right',justify:'Justify',entryExperience:'Experience',entryEducation:'Education',entryProject:'Project',remove:'Remove',organisation:'Company / School',role:'Position / Degree',dates:'Dates',entryLocation:'Location',details:'Responsibilities / Details',orgPlaceholder:'Company or university',rolePlaceholder:'Job title or degree',datesPlaceholder:'Jan 2024 – Mar 2026',locationPlaceholder:'City, country',detailsPlaceholder:'Enter each responsibility or achievement on a separate line',formal:'Formal Black & White',modern:'Modern',classic:'Classic',singleColumn:'Single Column',twoColumns:'Two Columns',ocean:'Ocean Blue',forest:'Forest Green',burgundy:'Burgundy',charcoal:'Charcoal',custom:'Custom...'},
    zh: {brandSub:'简历制作工具',build:'制作你的简历',buildSub:'编辑个人信息，实时查看简历效果。',design:'设计设置',template:'版式',layout:'布局',palette:'配色方案',customColour:'自定义颜色',font:'字体',fontSize:'字号',margins:'页边距',personal:'个人信息',summaryTab:'个人简介',experienceTab:'工作经历',educationTab:'教育经历',projectsTab:'项目经历',extrasTab:'技能与证书',fullName:'姓名',title:'职业头衔',email:'电子邮箱',phone:'电话',location:'所在地',linkedin:'LinkedIn / 个人网站',summaryLabel:'个人简介',summaryHint:'建议突出你的经验、优势以及能为岗位带来的价值。',experienceTitle:'工作经历',experienceHint:'添加职位、工作成果和职责。',addExperience:'+ 添加工作经历',educationTitle:'教育经历',educationHint:'添加学历及相关信息。',addEducation:'+ 添加教育经历',projectsTitle:'项目经历',projectsHint:'突出研究、项目及成果。',addProject:'+ 添加项目',skillsLabel:'技能',skillsHint:'技能之间可用逗号、分号或换行分隔。',certLabel:'证书',clear:'清空简历',footer:'本地编辑，自动保存。',open:'打开 .fcv',save:'保存 .fcv',exportWord:'导出 Word',exportPdf:'导出 PDF',livePreview:'实时预览',formatting:'文本格式',formattingHint:'点击简历预览中的文字，再调整该文本块的格式',size:'字号（pt）',colour:'颜色',alignment:'对齐方式',lineSpacing:'行距',reset:'重置',selectText:'点击预览中的文字以选择文本块',guide:'使用教程',gotIt:'知道了',saving:'正在保存…',saved:'已在本地保存',notSaved:'未能保存',summaryHeading:'个人简介',experienceHeading:'工作经历',educationHeading:'教育经历',projectsHeading:'项目经历',skillsHeading:'技能',certHeading:'证书',emptyPreview:'你的简历预览会显示在这里。',emptyPreviewSub:'请先填写姓名和个人信息。',sectionUpdated:'板块顺序已更新。',selectFirst:'请先点击预览中的一个文本块。',selectFirstReset:'请先选择一个文本块。',guideTitle:'使用教程',guide1:'目前系统里录入有三种版式，“Classic”是最通用的一款版式。',guide2:'拖动各板块即可实现改变板块的前后顺序。',guide3:'谢谢大家喜欢！',close:'关闭教程',selected:'已选择',textBlock:'文本块',default:'默认',left:'左对齐',center:'居中',right:'右对齐',justify:'两端对齐',entryExperience:'工作经历',entryEducation:'教育经历',entryProject:'项目',remove:'删除',organisation:'公司 / 学校',role:'职位 / 学位',dates:'日期',entryLocation:'所在地',details:'工作职责 / 详情',orgPlaceholder:'公司或大学名称',rolePlaceholder:'职位名称或学位',datesPlaceholder:'2024年1月 – 2026年3月',locationPlaceholder:'城市，国家',detailsPlaceholder:'每行填写一项职责或成果',formal:'黑白正式版',modern:'现代版',classic:'经典版',singleColumn:'单栏',twoColumns:'双栏',ocean:'海洋蓝',forest:'森林绿',burgundy:'勃艮第红',charcoal:'炭灰色',custom:'自定义…'}
  };
  const tr = key => (translations[language] || translations.en)[key] || translations.en[key] || key;
  function showTutorial() {
    $('#tutorialTitle').textContent = tr('guideTitle');
    $('#tutorialBody').innerHTML = `<ol><li>${esc(tr('guide1'))}</li><li>${esc(tr('guide2'))}</li><li>${esc(tr('guide3'))}</li></ol><p class="tutorial-signature">— Big Mac</p>`;
    $('#tutorialDoneBtn').textContent = tr('gotIt');
    $('#closeTutorialBtn').setAttribute('aria-label', tr('close'));
    $('#tutorialOverlay').hidden = false;
  }
  function closeTutorial() { $('#tutorialOverlay').hidden = true; }
  function setLabel(controlSelector, key) {
    const control = $(controlSelector); if (!control) return;
    const label = control.closest('label'); if (!label) return;
    const textNode = [...label.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (textNode) textNode.textContent = tr(key) + ' ';
  }
  function applyLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    $('#languageBtn').textContent = language === 'en' ? '中文' : 'English';
    const simple = {'.brand small':'brandSub','.panel-heading h1':'build','.panel-heading p':'buildSub','.settings-card summary':'design','.preview-toolbar strong':'livePreview','#clearBtn':'clear','#openProjectBtn':'open','#saveProjectBtn':'save','#exportWordBtn':'exportWord','#exportPdfBtn':'exportPdf','#tutorialBtn':'guide','#resetFormat':'reset','.editor-footer span':'footer','#tab-experience .section-title h2':'experienceTitle','#tab-experience .section-title p':'experienceHint','#tab-education .section-title h2':'educationTitle','#tab-education .section-title p':'educationHint','#tab-projects .section-title h2':'projectsTitle','#tab-projects .section-title p':'projectsHint','#tab-summary .hint':'summaryHint','#tab-extras .hint':'skillsHint','#formatTarget':'selectText'};
    Object.entries(simple).forEach(([sel,key]) => { const el=$(sel); if(el) el.textContent=tr(key); });
    const formatSummary=$('.format-panel summary'); if(formatSummary){formatSummary.childNodes[0].textContent=tr('formatting')+' '; const span=$('span',formatSummary); if(span)span.textContent=tr('formattingHint');}
    const labelMap = {'#template':'template','#layoutMode':'layout','#palette':'palette','#customAccent':'customColour','#font':'font','#fontSize':'fontSize','#margin':'margins','[data-field="name"]':'fullName','[data-field="title"]':'title','[data-field="email"]':'email','[data-field="phone"]':'phone','[data-field="location"]':'location','[data-field="linkedin"]':'linkedin','[data-field="summary"]':'summaryLabel','[data-field="skills"]':'skillsLabel','[data-field="certifications"]':'certLabel','#formatFont':'font','#formatSize':'size','#formatColor':'colour','#formatAlign':'alignment','#formatLineHeight':'lineSpacing'};
    Object.entries(labelMap).forEach(([sel,key])=>setLabel(sel,key));
    const tabMap={personal:'personal',summary:'summaryTab',experience:'experienceTab',education:'educationTab',projects:'projectsTab',extras:'extrasTab'};
    $$('.tab').forEach(el=>el.textContent=tr(tabMap[el.dataset.tab]));
    const addMap={'[data-add="experience"]':'addExperience','[data-add="education"]':'addEducation','[data-add="projects"]':'addProject'};Object.entries(addMap).forEach(([sel,key])=>{const el=$(sel);if(el)el.textContent=tr(key)});
    const placeholders = language==='zh' ? {'[data-field="name"]':'你的姓名','[data-field="title"]':'职业头衔','[data-field="email"]':'name@example.com','[data-field="phone"]':'+64 ...','[data-field="location"]':'奥克兰，新西兰','[data-field="linkedin"]':'linkedin.com/in/...','[data-field="summary"]':'填写简洁且针对目标岗位的个人简介。','[data-field="skills"]':'HACCP、HPLC、质量保证','[data-field="certifications"]':'每行填写一项证书'} : {'[data-field="name"]':'Your Name','[data-field="title"]':'Food Scientist','[data-field="email"]':'name@example.com','[data-field="phone"]':'+64 ...','[data-field="location"]':'Auckland, New Zealand','[data-field="linkedin"]':'linkedin.com/in/...','[data-field="summary"]':'Write a concise, role-specific summary.','[data-field="skills"]':'HACCP, HPLC, Quality Assurance','[data-field="certifications"]':'One certification per line'};
    Object.entries(placeholders).forEach(([sel,value])=>{const el=$(sel);if(el)el.placeholder=value});
    const options = {'#formatFont':[['','default']], '#formatSize':[['','default']], '#formatAlign':[['','default'],['left','left'],['center','center'],['right','right'],['justify','justify']], '#formatLineHeight':[['','default']]};
    Object.entries(options).forEach(([sel,values])=>{const el=$(sel);if(el)values.forEach(([value,key])=>{const opt=[...el.options].find(o=>o.value===value);if(opt)opt.textContent=tr(key)})});
    const selectTranslations = {
      '#template': [['Formal Black & White','formal'],['Modern','modern'],['Classic','classic']],
      '#layoutMode': [['Single Column','singleColumn'],['Two Columns','twoColumns']],
      '#palette': [['Formal Black & White','formal'],['Ocean Blue','ocean'],['Forest Green','forest'],['Burgundy','burgundy'],['Charcoal','charcoal'],['Custom...','custom']]
    };
    Object.entries(selectTranslations).forEach(([sel, pairs]) => { const el=$(sel); if(el) pairs.forEach(([value,key]) => { const opt=[...el.options].find(o=>o.value===value || o.textContent===value); if(opt) opt.textContent=tr(key); }); });
    ['experience','education','projects'].forEach(kind => renderEntryEditors(kind, readEntries(kind)));
    if (!$('#tutorialOverlay').hidden) showTutorial();
    renderPreview();
  }


  function getData() {
    const data = { ...state };
    $$('[data-field]').forEach(el => { data[el.dataset.field] = el.value; });
    data.template = $('#template').value;
    data.layout_mode = $('#layoutMode').value;
    data.font = $('#font').value;
    data.font_size = Number($('#fontSize').value);
    data.margin = Number($('#margin').value);
    data.accent = $('#customAccent').value;
    data.experience = readEntries('experience');
    data.education = readEntries('education');
    data.projects = readEntries('projects');
    data.section_order = Array.isArray(state.section_order) ? state.section_order : ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
    data.custom_styles = state.custom_styles && typeof state.custom_styles === 'object' ? state.custom_styles : {};
    return data;
  }

  function readEntries(kind) {
    return $$('.entry-card', $(`#${kind}List`)).map(card => {
      const item = {};
      $$('[data-entry-field]', card).forEach(input => { item[input.dataset.entryField] = input.value; });
      return item;
    });
  }

  function renderEntry(item, kind, index) {
    const org = String(item.organisation || '').trim();
    const role = String(item.role || '').trim();
    const dates = String(item.dates || '').trim();
    const location = String(item.location || '').trim();
    const details = lines(item.details || '');
    if (![org, role, dates, location, ...details].some(Boolean)) return '';
    let heading, subtitleParts;
    if (kind === 'education') { heading = org || role; subtitleParts = [org ? role : '', location]; }
    else { heading = role || org; subtitleParts = [role ? org : '', location]; }
    const prefix = `${kind}-${index}`;
    const subtitle = subtitleParts.filter(Boolean).map(esc).join(' · ');
    const bullets = details.length ? `<ul>${details.map((line, i) => `<li data-format-key="${prefix}-detail-${i}">${esc(line)}</li>`).join('')}</ul>` : '';
    return `<div class="entry"><div class="entry-head"><div class="entry-main"><div class="entry-title" data-format-key="${prefix}-title">${esc(heading)}</div><div class="entry-subtitle" data-format-key="${prefix}-subtitle">${subtitle}</div></div><div class="dates" data-format-key="${prefix}-dates">${esc(dates)}</div></div>${bullets}</div>`;
  }

  function section(heading, content, key) {
    if (!content || !content.trim()) return '';
    return `<section class="cv-section" data-section-key="${key}" draggable="true"><div class="section-drag-handle" title="Drag to reorder" aria-label="Drag to reorder ${esc(heading)}">⠿</div><h2 data-format-key="section-${key}-heading">${esc(heading)}</h2>${content}</section>`;
  }

  function buildResume(data) {
    const name = esc(String(data.name || '').trim() || 'Your Name');
    const title = String(data.title || '').trim() ? `<div class="job-title" data-format-key="header-title">${esc(data.title)}</div>` : '';
    const contacts = ['email', 'phone', 'location', 'linkedin'].filter(key => String(data[key] || '').trim()).map(key => esc(data[key].trim())).join(' | ');
    const contact = contacts ? `<div class="contact" data-format-key="header-contact">${contacts}</div>` : '';
    const header = `<header class="header"><h1 data-format-key="header-name">${name}</h1>${title}${contact}</header>`;
    const sections = {
      summary: section(tr('summaryHeading'), `<p data-format-key="summary-text">${esc(String(data.summary || '')).replace(/\r?\n/g, '<br>')}</p>`, 'summary'),
      experience: section(tr('experienceHeading'), (data.experience || []).map((x, i) => renderEntry(x, 'experience', i)).join(''), 'experience'),
      education: section(tr('educationHeading'), (data.education || []).map((x, i) => renderEntry(x, 'education', i)).join(''), 'education'),
      projects: section(tr('projectsHeading'), (data.projects || []).map((x, i) => renderEntry(x, 'projects', i)).join(''), 'projects'),
      skills: splitSkills(data.skills).length ? section(tr('skillsHeading'), `<div class="skills" data-format-key="skills-text">${splitSkills(data.skills).map(esc).join(', ')}</div>`, 'skills') : '',
      certifications: section(tr('certHeading'), lines(data.certifications).length ? `<ul>${lines(data.certifications).map((x, i) => `<li data-format-key="certification-${i}">${esc(x)}</li>`).join('')}</ul>` : '', 'certifications')
    };
    const defaultOrder = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
    const requestedOrder = Array.isArray(data.section_order) ? data.section_order : defaultOrder;
    const order = [...requestedOrder.filter(key => sections[key]), ...defaultOrder.filter(key => !requestedOrder.includes(key))];
    const content = `<div class="content-grid ${data.layout_mode === 'Two Columns' ? 'two-column' : 'single-column'}">${order.map(key => sections[key]).join('')}</div>`;
    return { header, content, hasContent: Boolean(data.name || data.title || data.summary || data.email || data.phone || data.location || data.linkedin || (data.experience || []).some(hasEntry) || (data.education || []).some(hasEntry) || (data.projects || []).some(hasEntry) || data.skills || data.certifications) };
  }
  function hasEntry(item) { return Object.values(item || {}).some(value => String(value || '').trim()); }

  function renderPreview() {
    const data = getData();
    const resume = buildResume(data);
    const page = $('#cvPage');
    page.style.setProperty('--accent', data.accent || '#111111');
    page.style.setProperty('--cv-font', `'${data.font || 'Arial'}'`);
    page.style.setProperty('--cv-size', `${Number(data.font_size) || 10}pt`);
    page.style.setProperty('--cv-margin', `${Number(data.margin) || 15}mm`);
    page.classList.toggle('template-modern', data.template === 'Modern');
    page.classList.toggle('template-classic', data.template === 'Classic');
    page.innerHTML = resume.hasContent ? resume.header + resume.content : `<div class="empty-hint"><strong>${esc(tr('emptyPreview'))}</strong><br><br>${esc(tr('emptyPreviewSub'))}</div>`;
    applyCustomStyles();
    updateFormatSelection();
    bindSectionDragging();
    applyZoom();
    $('#fontSizeValue').textContent = `${data.font_size} pt`;
    $('#marginValue').textContent = `${data.margin} mm`;
    scheduleSave();
  }

  function applyZoom() {
    const page = $('#cvPage');
    page.style.transform = `scale(${zoom})`;
    page.style.marginBottom = `${(zoom - 1) * 297}mm`;
    $('#previewHint').textContent = `A4 · ${Math.round(zoom * 100)}% · ${language === 'zh' ? '自动更新' : 'Updates automatically'}`;
  }

  function applyCustomStyles() {
    const styles = state.custom_styles || {};
    $$('[data-format-key]', $('#cvPage')).forEach(el => {
      const saved = styles[el.dataset.formatKey];
      if (saved) Object.entries(saved).forEach(([property, value]) => { if (value !== '' && value != null) el.style[property] = value; });
    });
  }

  function updateFormatSelection() {
    $$('[data-format-key]', $('#cvPage')).forEach(el => el.classList.toggle('format-selected', el.dataset.formatKey === selectedFormatKey));
    const selected = selectedFormatKey ? $(`[data-format-key="${CSS.escape(selectedFormatKey)}"]`, $('#cvPage')) : null;
    $('#formatTarget').textContent = selected ? `${tr('selected')}: ${selected.textContent.trim().slice(0, 38) || tr('textBlock')}` : tr('selectText');
    const style = (state.custom_styles || {})[selectedFormatKey] || {};
    $('#formatFont').value = style.fontFamily || '';
    $('#formatSize').value = String(style.fontSize || '').replace(/pt$/, '');
    $('#formatColor').value = /^#[0-9a-f]{6}$/i.test(style.color || '') ? style.color : '#222222';
    $('#formatAlign').value = style.textAlign || '';
    $('#formatLineHeight').value = style.lineHeight || '';
  }

  function applyFormatProperty(property, value) {
    if (!selectedFormatKey) { showToast(tr('selectFirst')); return; }
    state.custom_styles = state.custom_styles || {};
    state.custom_styles[selectedFormatKey] = { ...(state.custom_styles[selectedFormatKey] || {}), [property]: value };
    renderPreview();
    updateFormatSelection();
  }

  function applyFormatControl(id, value) {
    const properties = { formatFont: 'fontFamily', formatSize: 'fontSize', formatColor: 'color', formatAlign: 'textAlign', formatLineHeight: 'lineHeight' };
    const property = properties[id]; if (!property) return;
    if (!value) {
      if (selectedFormatKey && state.custom_styles && state.custom_styles[selectedFormatKey]) delete state.custom_styles[selectedFormatKey][property];
      renderPreview(); updateFormatSelection(); return;
    }
    if (property === 'fontSize') value = `${value}pt`;
    if (property === 'lineHeight') value = value;
    applyFormatProperty(property, value);
  }

  function resetSelectedFormat() {
    if (!selectedFormatKey) { showToast(tr('selectFirstReset')); return; }
    if (state.custom_styles) delete state.custom_styles[selectedFormatKey];
    renderPreview(); updateFormatSelection();
  }

  let draggedSectionKey = null;
  function bindSectionDragging() {
    $$('[data-section-key]', $('#cvPage')).forEach(sectionEl => {
      sectionEl.addEventListener('dragstart', event => {
        draggedSectionKey = sectionEl.dataset.sectionKey;
        sectionEl.classList.add('dragging-section');
        if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggedSectionKey); }
      });
      sectionEl.addEventListener('dragend', () => { sectionEl.classList.remove('dragging-section'); $$('[data-section-key]', $('#cvPage')).forEach(el => el.classList.remove('drop-target')); });
      sectionEl.addEventListener('dragover', event => { event.preventDefault(); if (draggedSectionKey && draggedSectionKey !== sectionEl.dataset.sectionKey) sectionEl.classList.add('drop-target'); });
      sectionEl.addEventListener('dragleave', () => sectionEl.classList.remove('drop-target'));
      sectionEl.addEventListener('drop', event => {
        event.preventDefault(); sectionEl.classList.remove('drop-target');
        const targetKey = sectionEl.dataset.sectionKey;
        if (!draggedSectionKey || draggedSectionKey === targetKey) return;
        const order = Array.isArray(state.section_order) ? [...state.section_order] : ['summary','experience','education','projects','skills','certifications'];
        const from = order.indexOf(draggedSectionKey), to = order.indexOf(targetKey);
        if (from >= 0 && to >= 0) { order.splice(from, 1); order.splice(to, 0, draggedSectionKey); state.section_order = order; renderPreview(); showToast(tr('sectionUpdated')); }
        draggedSectionKey = null;
      });
    });
  }

  function renderEntryEditors(kind, items) {
    const container = $(`#${kind}List`);
    container.innerHTML = '';
    (items.length ? items : [blankEntry()]).forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `<div class="entry-card-head"><strong>${tr(kind === 'experience' ? 'entryExperience' : kind === 'education' ? 'entryEducation' : 'entryProject')} ${index + 1}</strong><button type="button" class="remove-entry">${tr('remove')}</button></div><div class="entry-fields"><label>${tr('organisation')}<input data-entry-field="organisation" placeholder="${tr('orgPlaceholder')}" value="${esc(item.organisation)}"></label><label>${tr('role')}<input data-entry-field="role" placeholder="${tr('rolePlaceholder')}" value="${esc(item.role)}"></label><label>${tr('dates')}<input data-entry-field="dates" placeholder="${tr('datesPlaceholder')}" value="${esc(item.dates)}"></label><label>${tr('entryLocation')}<input data-entry-field="location" placeholder="${tr('locationPlaceholder')}" value="${esc(item.location)}"></label><label class="wide">${tr('details')}<textarea data-entry-field="details" rows="4" placeholder="${tr('detailsPlaceholder')}">${esc(item.details)}</textarea></label></div>`;
      $('.remove-entry', card).addEventListener('click', () => {
        const current = readEntries(kind);
        if (current.length <= 1) current[0] = blankEntry(); else current.splice(index, 1);
        renderEntryEditors(kind, current);
        renderPreview();
      });
      $$('[data-entry-field]', card).forEach(input => input.addEventListener('input', renderPreview));
      container.appendChild(card);
    });
  }

  function syncForm(data) {
    // Backward compatibility: older versions stored both categories in one `extras` field.
    if (!String(data.certifications || '').trim() && String(data.extras || '').trim()) data.certifications = data.extras;
    $$('[data-field]').forEach(el => { el.value = data[el.dataset.field] ?? ''; });
    $('#template').value = data.template || 'Formal Black & White';
    $('#layoutMode').value = data.layout_mode || 'Single Column';
    $('#font').value = data.font || 'Arial';
    $('#fontSize').value = String(data.font_size || 10);
    $('#margin').value = String(data.margin || 15);
    $('#customAccent').value = data.accent || '#111111';
    const matchingPalette = Object.keys(PALETTES).find(key => PALETTES[key].toLowerCase() === String(data.accent || '').toLowerCase());
    $('#palette').value = matchingPalette || 'Custom...';
    state.accent = data.accent || '#111111';
    state.section_order = Array.isArray(data.section_order) ? data.section_order : ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
    state.custom_styles = data.custom_styles && typeof data.custom_styles === 'object' ? data.custom_styles : {};
    ['experience', 'education', 'projects'].forEach(kind => renderEntryEditors(kind, Array.isArray(data[kind]) ? data[kind] : [blankEntry()]));
    renderPreview();
  }

  function scheduleSave() {
    $('#saveStatus').textContent = tr('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));
        $('#saveStatus').textContent = tr('saved');
      } catch (error) {
        $('#saveStatus').textContent = tr('notSaved');
      }
    }, 350);
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function safeFilename(name, extension) {
    const base = String(name || 'My_CV').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_') || 'My_CV';
    return `${base}.${extension}`;
  }

  function saveProject() {
    const data = getData();
    const payload = { app: 'Big Mac CV Builder', version: 1, savedAt: new Date().toISOString(), data };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), safeFilename(data.name || 'Big_Mac_CV_Builder_Project', 'fcv'));
    showToast('Project file saved. Keep the .fcv file as a backup.');
  }

  async function openProject(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!data || typeof data !== 'object') throw new Error('This file does not contain a valid CV project.');
    syncForm({ ...state, ...data });
    showToast('Project opened successfully.');
  }

  function exportPdf() {
    renderPreview();
    window.print();
  }

  async function exportWord() {
    const lib = window.docx;
    if (!lib || !lib.Document || !lib.Packer) {
      showToast('Word export library did not load. Check your internet connection and try again.'); return;
    }
    const d = getData();
    const children = [];
    const accent = String(d.accent || '#111111').replace('#', '').toUpperCase();
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = lib;
    const custom = d.custom_styles || {};
    const fmt = key => custom[key] || {};
    const alignment = value => ({ left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED })[value];
    const runOpts = (key, defaults = {}) => {
      const f = fmt(key), out = { ...defaults };
      if (f.fontFamily) out.font = f.fontFamily;
      if (f.fontSize) out.size = Math.round(parseFloat(f.fontSize) * 2) || out.size;
      if (f.color && /^#[0-9a-f]{6}$/i.test(f.color)) out.color = f.color.slice(1).toUpperCase();
      if (f.fontWeight === 'bold') out.bold = true;
      if (f.fontStyle === 'italic') out.italics = true;
      if (f.textDecoration === 'underline') out.underline = {};
      return out;
    };
    const paraOpts = (key, defaults = {}) => {
      const f = fmt(key), out = { ...defaults };
      if (alignment(f.textAlign)) out.alignment = alignment(f.textAlign);
      if (f.lineHeight) out.spacing = { ...(out.spacing || {}), line: Math.round((Number(f.lineHeight) || 1) * 240) };
      return out;
    };
    const addTextParagraph = (text, key, defaults = {}) => children.push(new Paragraph(paraOpts(key, { ...defaults, children: [new TextRun({ text, ...runOpts(key) })] })));
    const name = d.name.trim() || 'Your Name';
    children.push(new Paragraph(paraOpts('header-name', { text: name, heading: HeadingLevel.TITLE, alignment: d.template === 'Classic' ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: name, ...runOpts('header-name', { bold: true, color: accent, size: 36 }) })] })));
    if (d.title.trim()) addTextParagraph(d.title.trim(), 'header-title');
    const contact = ['email','phone','location','linkedin'].filter(k => d[k].trim()).map(k => d[k].trim()).join(' | ');
    if (contact) addTextParagraph(contact, 'header-contact');
    const addHeading = (text, key) => children.push(new Paragraph(paraOpts(key, { text, heading: HeadingLevel.HEADING_1, spacing: { before: 220, after: 100 }, children: [new TextRun({ text, ...runOpts(key, { bold: true, color: accent }) })] })));
    const addEntries = (kind, heading, headingKey) => {
      const items = d[kind].map((item, index) => ({ item, index })).filter(x => hasEntry(x.item)); if (!items.length) return;
      addHeading(heading, headingKey);
      items.forEach(({ item, index }) => {
        const prefix = `${kind}-${index}`;
        const main = kind === 'education' ? (item.organisation.trim() || item.role.trim()) : (item.role.trim() || item.organisation.trim());
        const subtitleParts = kind === 'education' ? [item.role, item.location] : [item.organisation, item.location];
        const headingRun = new TextRun({ text: main, ...runOpts(`${prefix}-title`, { bold: true }) });
        const runs = [headingRun];
        if (item.dates.trim()) runs.push(new TextRun({ text: `    ${item.dates.trim()}`, ...runOpts(`${prefix}-dates`, { italics: true }) }));
        children.push(new Paragraph(paraOpts(`${prefix}-title`, { spacing: { before: 100, after: 30 }, children: runs })));
        const subtitle = subtitleParts.map(x => x.trim()).filter(Boolean).join(' · ');
        if (subtitle) addTextParagraph(subtitle, `${prefix}-subtitle`);
        lines(item.details).forEach((line, detailIndex) => children.push(new Paragraph(paraOpts(`${prefix}-detail-${detailIndex}`, { text: line, bullet: { indent: 360 }, spacing: { after: 40 }, children: [new TextRun({ text: line, ...runOpts(`${prefix}-detail-${detailIndex}`) })] }))));
      });
    };
    const skills = splitSkills(d.skills);
    const certifications = lines(d.certifications);
    const addSectionByKey = key => {
      if (key === 'summary' && d.summary.trim()) { addHeading(tr('summaryHeading'), 'section-summary-heading'); addTextParagraph(d.summary.trim(), 'summary-text'); }
      if (key === 'experience') addEntries('experience', tr('experienceHeading'), 'section-experience-heading');
      if (key === 'education') addEntries('education', tr('educationHeading'), 'section-education-heading');
      if (key === 'projects') addEntries('projects', tr('projectsHeading'), 'section-projects-heading');
      if (key === 'skills' && skills.length) { addHeading(tr('skillsHeading'), 'section-skills-heading'); addTextParagraph(skills.join(', '), 'skills-text'); }
      if (key === 'certifications' && certifications.length) { addHeading(tr('certHeading'), 'section-certifications-heading'); certifications.forEach((x, i) => children.push(new Paragraph(paraOpts(`certification-${i}`, { text: x, bullet: { indent: 360 }, children: [new TextRun({ text: x, ...runOpts(`certification-${i}`) })] })))); }
    };
    (Array.isArray(d.section_order) ? d.section_order : ['summary','experience','education','projects','skills','certifications']).forEach(addSectionByKey);
    const marginTwips = Math.round((Number(d.margin) || 15) / 25.4 * 1440);
    const doc = new Document({ styles: { default: { document: { run: { font: d.font, size: (Number(d.font_size) || 10) * 2 } } } }, sections: [{ properties: { page: { margin: { top: marginTwips, bottom: marginTwips, left: marginTwips, right: marginTwips } } }, children }] });
    try {
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, safeFilename(d.name, 'docx'));
      showToast('Word document exported.');
    } catch (error) { console.error(error); showToast('Could not create the Word file. Please try again.'); }
  }

  function bind() {
    $$('.tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.toggle('active', x === tab));
      $$('.form-tab').forEach(x => x.classList.toggle('active', x.id === `tab-${tab.dataset.tab}`));
    }));
    $$('[data-field]').forEach(el => el.addEventListener('input', renderPreview));
    $('#cvPage').addEventListener('click', event => {
      const target = event.target.closest('[data-format-key]');
      if (!target) return;
      selectedFormatKey = target.dataset.formatKey; updateFormatSelection();
    });
    ['formatFont','formatSize','formatColor','formatAlign','formatLineHeight'].forEach(id => {
      const control = $(`#${id}`); if (control) control.addEventListener('change', () => applyFormatControl(id, control.value));
    });
    $('#formatBold').addEventListener('click', () => applyFormatProperty('fontWeight', 'bold'));
    $('#formatItalic').addEventListener('click', () => applyFormatProperty('fontStyle', 'italic'));
    $('#formatUnderline').addEventListener('click', () => applyFormatProperty('textDecoration', 'underline'));
    $('#resetFormat').addEventListener('click', resetSelectedFormat);
    ['template','layoutMode','font','fontSize','margin','customAccent'].forEach(id => $(`#${id}`).addEventListener('input', renderPreview));
    $('#palette').addEventListener('change', () => {
      const choice = $('#palette').value;
      if (PALETTES[choice]) $('#customAccent').value = PALETTES[choice];
      else if (choice === 'Custom...') $('#customAccent').focus();
      renderPreview();
    });
    $$('[data-add]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.add; const items = readEntries(kind); items.push(blankEntry()); renderEntryEditors(kind, items); renderPreview();
    }));
    $('#saveProjectBtn').addEventListener('click', saveProject);
    $('#openProjectBtn').addEventListener('click', () => $('#projectFileInput').click());
    $('#projectFileInput').addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      try { await openProject(file); } catch (error) { showToast(`Could not open project: ${error.message}`); }
      event.target.value = '';
    });
    $('#exportPdfBtn').addEventListener('click', exportPdf);
    $('#exportWordBtn').addEventListener('click', exportWord);
    $('#zoomIn').addEventListener('click', () => { zoom = Math.min(1.2, +(zoom + .1).toFixed(2)); applyZoom(); });
    $('#zoomOut').addEventListener('click', () => { zoom = Math.max(.45, +(zoom - .1).toFixed(2)); applyZoom(); });
    $('#zoomFit').addEventListener('click', () => {
      const stage = $('#previewStage'); const available = Math.max(250, stage.clientWidth - 40); zoom = Math.min(1, available / $('#cvPage').offsetWidth); zoom = Math.max(.45, zoom); applyZoom();
    });
    $('#languageBtn').addEventListener('click', () => { language = language === 'en' ? 'zh' : 'en'; try { localStorage.setItem(LANGUAGE_KEY, language); } catch (_) { /* Storage may be unavailable. */ } applyLanguage(); });
    $('#tutorialBtn').addEventListener('click', showTutorial);
    $('#closeTutorialBtn').addEventListener('click', closeTutorial);
    $('#tutorialDoneBtn').addEventListener('click', closeTutorial);
    $('#tutorialOverlay').addEventListener('click', event => { if (event.target === $('#tutorialOverlay')) closeTutorial(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeTutorial(); });
    $('#clearBtn').addEventListener('click', () => {
      if (!confirm('Clear all CV fields? This cannot be undone unless you saved a project file.')) return;
      const fresh = { ...state, experience: [blankEntry()], education: [blankEntry()], projects: [blankEntry()], section_order: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'], custom_styles: {} };
      syncForm(fresh); localStorage.removeItem(STORAGE_KEY); showToast('CV cleared.');
    });
  }

  function init() {
    bind();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { saved = null; }
    syncForm(saved && typeof saved === 'object' ? { ...state, ...saved } : state);
    applyLanguage();
    showTutorial();
    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getData())); } catch (_) { /* Storage may be unavailable. */ }
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
