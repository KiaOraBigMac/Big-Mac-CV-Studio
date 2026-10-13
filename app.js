(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'freecvstudio.web.v1';
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

  function blankEntry() { return { organisation: '', role: '', dates: '', location: '', details: '' }; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function lines(value) { return String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); }
  function splitSkills(value) { return String(value || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean); }

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
      summary: section('Professional Summary', `<p data-format-key="summary-text">${esc(String(data.summary || '')).replace(/\r?\n/g, '<br>')}</p>`, 'summary'),
      experience: section('Work Experience', (data.experience || []).map((x, i) => renderEntry(x, 'experience', i)).join(''), 'experience'),
      education: section('Education', (data.education || []).map((x, i) => renderEntry(x, 'education', i)).join(''), 'education'),
      projects: section('Projects', (data.projects || []).map((x, i) => renderEntry(x, 'projects', i)).join(''), 'projects'),
      skills: section('Skills', `<div class="skills" data-format-key="skills-text">${splitSkills(data.skills).map(esc).join(' · ')}</div>`, 'skills'),
      certifications: section('Certifications', lines(data.certifications).length ? `<ul>${lines(data.certifications).map((x, i) => `<li data-format-key="certification-${i}">${esc(x)}</li>`).join('')}</ul>` : '', 'certifications')
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
    page.innerHTML = resume.hasContent ? resume.header + resume.content : '<div class="empty-hint"><strong>Your CV preview will appear here.</strong><br><br>Start by entering your name and professional details.</div>';
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
    $('#previewHint').textContent = `A4 · ${Math.round(zoom * 100)}% · Updates automatically`;
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
    $('#formatTarget').textContent = selected ? `Selected: ${selected.textContent.trim().slice(0, 38) || 'text block'}` : 'Click text in the preview to select it';
    const style = (state.custom_styles || {})[selectedFormatKey] || {};
    $('#formatFont').value = style.fontFamily || '';
    $('#formatSize').value = String(style.fontSize || '').replace(/pt$/, '');
    $('#formatColor').value = /^#[0-9a-f]{6}$/i.test(style.color || '') ? style.color : '#222222';
    $('#formatAlign').value = style.textAlign || '';
    $('#formatLineHeight').value = style.lineHeight || '';
  }

  function applyFormatProperty(property, value) {
    if (!selectedFormatKey) { showToast('Click a text block in the preview first.'); return; }
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
    if (!selectedFormatKey) { showToast('Select a text block in the preview first.'); return; }
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
        if (from >= 0 && to >= 0) { order.splice(from, 1); order.splice(to, 0, draggedSectionKey); state.section_order = order; renderPreview(); showToast('Section order updated.'); }
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
      card.innerHTML = `<div class="entry-card-head"><strong>${kind === 'experience' ? 'Experience' : kind === 'education' ? 'Education' : 'Project'} ${index + 1}</strong><button type="button" class="remove-entry">Remove</button></div><div class="entry-fields"><label>Company / School<input data-entry-field="organisation" placeholder="Company or university" value="${esc(item.organisation)}"></label><label>Position / Degree<input data-entry-field="role" placeholder="Job title or degree" value="${esc(item.role)}"></label><label>Dates<input data-entry-field="dates" placeholder="Jan 2024 – Mar 2026" value="${esc(item.dates)}"></label><label>Location<input data-entry-field="location" placeholder="City, country" value="${esc(item.location)}"></label><label class="wide">Responsibilities / Details<textarea data-entry-field="details" rows="4" placeholder="Enter each responsibility or achievement on a separate line">${esc(item.details)}</textarea></label></div>`;
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
    $('#saveStatus').textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));
        $('#saveStatus').textContent = 'Saved locally';
      } catch (error) {
        $('#saveStatus').textContent = 'Not saved';
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
      if (key === 'summary' && d.summary.trim()) { addHeading('Professional Summary', 'section-summary-heading'); addTextParagraph(d.summary.trim(), 'summary-text'); }
      if (key === 'experience') addEntries('experience', 'Work Experience', 'section-experience-heading');
      if (key === 'education') addEntries('education', 'Education', 'section-education-heading');
      if (key === 'projects') addEntries('projects', 'Projects', 'section-projects-heading');
      if (key === 'skills' && skills.length) { addHeading('Skills', 'section-skills-heading'); addTextParagraph(skills.join(' · '), 'skills-text'); }
      if (key === 'certifications' && certifications.length) { addHeading('Certifications', 'section-certifications-heading'); certifications.forEach((x, i) => children.push(new Paragraph(paraOpts(`certification-${i}`, { text: x, bullet: { indent: 360 }, children: [new TextRun({ text: x, ...runOpts(`certification-${i}`) })] })))); }
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
    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getData())); } catch (_) { /* Storage may be unavailable. */ }
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
