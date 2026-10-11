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
    experience: [blankEntry()], education: [blankEntry()], projects: [blankEntry()]
  };
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
    return data;
  }

  function readEntries(kind) {
    return $$('.entry-card', $(`#${kind}List`)).map(card => {
      const item = {};
      $$('[data-entry-field]', card).forEach(input => { item[input.dataset.entryField] = input.value; });
      return item;
    });
  }

  function renderEntry(item, kind) {
    const org = String(item.organisation || '').trim();
    const role = String(item.role || '').trim();
    const dates = String(item.dates || '').trim();
    const location = String(item.location || '').trim();
    const details = lines(item.details || '');
    if (![org, role, dates, location, ...details].some(Boolean)) return '';
    let heading, subtitleParts;
    if (kind === 'education') { heading = org || role; subtitleParts = [org ? role : '', location]; }
    else { heading = role || org; subtitleParts = [role ? org : '', location]; }
    const subtitle = subtitleParts.filter(Boolean).map(esc).join(' · ');
    const bullets = details.length ? `<ul>${details.map(line => `<li>${esc(line)}</li>`).join('')}</ul>` : '';
    return `<div class="entry"><div class="entry-head"><div class="entry-main"><div class="entry-title">${esc(heading)}</div><div class="entry-subtitle">${subtitle}</div></div><div class="dates">${esc(dates)}</div></div>${bullets}</div>`;
  }

  function section(heading, content) {
    if (!content || !content.trim()) return '';
    return `<section><h2>${esc(heading)}</h2>${content}</section>`;
  }

  function buildResume(data) {
    const name = esc(data.name.trim() || 'Your Name');
    const title = data.title.trim() ? `<div class="job-title">${esc(data.title)}</div>` : '';
    const contacts = ['email', 'phone', 'location', 'linkedin'].filter(key => String(data[key] || '').trim()).map(key => esc(data[key].trim())).join(' | ');
    const contact = contacts ? `<div class="contact">${contacts}</div>` : '';
    const header = `<header class="header"><h1>${name}</h1>${title}${contact}</header>`;
    const summary = data.summary.trim() ? section('Professional Summary', `<p>${esc(data.summary).replace(/\r?\n/g, '<br>')}</p>`) : '';
    const experience = section('Work Experience', data.experience.map(x => renderEntry(x, 'experience')).join(''));
    const education = section('Education', data.education.map(x => renderEntry(x, 'education')).join(''));
    const projects = section('Projects', data.projects.map(x => renderEntry(x, 'projects')).join(''));
    const skills = section('Skills', `<div class="skills">${splitSkills(data.skills).map(esc).join(' · ')}</div>`);
    const certifications = section('Certifications', lines(data.certifications).length ? `<ul>${lines(data.certifications).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
    const content = data.layout_mode === 'Two Columns'
      ? `<div class="content-grid two-column"><main class="main-column">${summary}${experience}${projects}</main><aside class="side-column">${education}${skills}${certifications}</aside></div>`
      : `<div class="content-grid single-column">${summary}${experience}${education}${projects}${skills}${certifications}</div>`;
    return { header, content, hasContent: Boolean(data.name || data.title || data.summary || data.email || data.phone || data.location || data.linkedin || data.experience.some(hasEntry) || data.education.some(hasEntry) || data.projects.some(hasEntry) || data.skills || data.certifications) };
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
    const accent = d.accent.replace('#', '').toUpperCase();
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = lib;
    children.push(new Paragraph({ text: d.name.trim() || 'Your Name', heading: HeadingLevel.TITLE, alignment: d.template === 'Classic' ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: d.name.trim() || 'Your Name', bold: true, color: accent, size: 36 })] }));
    if (d.title.trim()) children.push(new Paragraph({ text: d.title.trim() }));
    const contact = ['email','phone','location','linkedin'].filter(k => d[k].trim()).map(k => d[k].trim()).join(' | ');
    if (contact) children.push(new Paragraph({ text: contact }));
    const addHeading = text => children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 220, after: 100 }, children: [new TextRun({ text, bold: true, color: accent })] }));
    const addEntries = (kind, heading) => {
      const items = d[kind].filter(hasEntry); if (!items.length) return;
      addHeading(heading);
      items.forEach(item => {
        const main = kind === 'education' ? (item.organisation.trim() || item.role.trim()) : (item.role.trim() || item.organisation.trim());
        const subtitleParts = kind === 'education' ? [item.role, item.location] : [item.organisation, item.location];
        children.push(new Paragraph({ spacing: { before: 100, after: 30 }, children: [new TextRun({ text: main, bold: true }), ...(item.dates.trim() ? [new TextRun({ text: `    ${item.dates.trim()}`, italics: true })] : [])] }));
        const subtitle = subtitleParts.map(x => x.trim()).filter(Boolean).join(' · ');
        if (subtitle) children.push(new Paragraph({ text: subtitle }));
        lines(item.details).forEach(line => children.push(new Paragraph({ text: line, bullet: { indent: 360 }, spacing: { after: 40 } })));
      });
    };
    if (d.summary.trim()) { addHeading('Professional Summary'); children.push(new Paragraph({ text: d.summary.trim() })); }
    addEntries('experience', 'Work Experience'); addEntries('education', 'Education'); addEntries('projects', 'Projects');
    const skills = splitSkills(d.skills); if (skills.length) { addHeading('Skills'); children.push(new Paragraph({ text: skills.join(' · ') })); }
    const certifications = lines(d.certifications); if (certifications.length) { addHeading('Certifications'); certifications.forEach(x => children.push(new Paragraph({ text: x, bullet: { indent: 360 } }))); }
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
      const fresh = { ...state, experience: [blankEntry()], education: [blankEntry()], projects: [blankEntry()] };
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
