import type { CVData } from '../lib/cv'

/** 6 genuinely distinct ATS-friendly CV templates. */

function section(title: string, inner: string, style: { accent: string; titleTransform: string }): string {
  return `<div style="margin:14px 0"><div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:${style.titleTransform};color:${style.accent};border-bottom:2px solid ${style.accent};padding-bottom:4px;margin-bottom:8px">${title}</div>${inner}</div>`
}

function eduList(d: CVData): string {
  return d.education.filter((e) => e.degree || e.institution).map((e) =>
    `<div style="margin-bottom:6px"><div style="font-weight:600">${e.degree}</div><div style="color:#555">${e.institution}${e.year ? ` — ${e.year}` : ''}</div></div>`
  ).join('')
}

function expList(d: CVData): string {
  return d.experience.filter((e) => e.title || e.org).map((e) =>
    `<div style="margin-bottom:8px"><div style="font-weight:600">${e.title}${e.org ? ` — ${e.org}` : ''}</div>${e.duration ? `<div style="color:#777;font-size:12px">${e.duration}</div>` : ''}${e.details ? `<div style="margin-top:2px">${e.details}</div>` : ''}</div>`
  ).join('')
}

function projList(d: CVData): string {
  return d.projects.filter((p) => p.name).map((p) =>
    `<div style="margin-bottom:6px"><div style="font-weight:600">${p.name}</div>${p.description ? `<div>${p.description}</div>` : ''}</div>`
  ).join('')
}

function skillLine(d: CVData): string {
  return d.skills.length > 0 ? `<div>${d.skills.join(' • ')}</div>` : ''
}

export const TEMPLATES: Record<string, { name: string; desc: string; render: (d: CVData) => string }> = {
  classic: {
    name: 'Classic',
    desc: 'Timeless single-column, maximum ATS compatibility',
    render: (d) => `
      <div style="font-family:Georgia,serif;color:#1a1a1a;max-width:700px;line-height:1.5;font-size:14px">
        <div style="text-align:center;border-bottom:3px double #333;padding-bottom:12px;margin-bottom:8px">
          <div style="font-size:26px;font-weight:700">${d.fullName || 'Your Name'}</div>
          <div style="color:#555;font-size:13px">${[d.email, d.phone, d.city].filter(Boolean).join(' | ')}</div>
        </div>
        ${d.objective ? section('Objective', `<div>${d.objective}</div>`, { accent: '#333', titleTransform: 'uppercase' }) : ''}
        ${section('Education', eduList(d), { accent: '#333', titleTransform: 'uppercase' })}
        ${d.experience.length > 0 ? section('Experience', expList(d), { accent: '#333', titleTransform: 'uppercase' }) : ''}
        ${d.projects.length > 0 ? section('Projects', projList(d), { accent: '#333', titleTransform: 'uppercase' }) : ''}
        ${d.skills.length > 0 ? section('Skills', skillLine(d), { accent: '#333', titleTransform: 'uppercase' }) : ''}
      </div>`,
  },
  modern: {
    name: 'Modern',
    desc: 'Clean sans-serif with teal accents, sidebar-free ATS safe',
    render: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#222;max-width:700px;line-height:1.55;font-size:14px">
        <div style="background:#0d7377;color:#fff;padding:20px 24px;margin-bottom:8px">
          <div style="font-size:28px;font-weight:700">${d.fullName || 'Your Name'}</div>
          <div style="font-size:13px;opacity:0.9">${[d.email, d.phone, d.city].filter(Boolean).join('  •  ')}</div>
        </div>
        <div style="padding:0 4px">
        ${d.objective ? section('Profile', `<div>${d.objective}</div>`, { accent: '#0d7377', titleTransform: 'uppercase' }) : ''}
        ${section('Education', eduList(d), { accent: '#0d7377', titleTransform: 'uppercase' })}
        ${d.experience.length > 0 ? section('Experience', expList(d), { accent: '#0d7377', titleTransform: 'uppercase' }) : ''}
        ${d.projects.length > 0 ? section('Projects', projList(d), { accent: '#0d7377', titleTransform: 'uppercase' }) : ''}
        ${d.skills.length > 0 ? section('Skills', `<div style="display:flex;flex-wrap:wrap;gap:6px">${d.skills.map((s) => `<span style="background:#e6f4f4;color:#0d7377;padding:3px 10px;border-radius:12px;font-size:13px">${s}</span>`).join('')}</div>`, { accent: '#0d7377', titleTransform: 'uppercase' }) : ''}
        </div>
      </div>`,
  },
  minimal: {
    name: 'Minimal',
    desc: 'Ultra-clean, lots of whitespace, content-first',
    render: (d) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111;max-width:650px;line-height:1.7;font-size:14px;padding:10px">
        <div style="font-size:32px;font-weight:300;letter-spacing:2px;margin-bottom:2px">${d.fullName || 'Your Name'}</div>
        <div style="color:#888;font-size:13px;margin-bottom:20px">${[d.email, d.phone, d.city].filter(Boolean).join(' · ')}</div>
        ${d.objective ? `<div style="margin-bottom:18px;font-style:italic;color:#444">${d.objective}</div>` : ''}
        ${['Education', 'Experience', 'Projects', 'Skills'].map((t) => {
          const body = t === 'Education' ? eduList(d) : t === 'Experience' ? expList(d) : t === 'Projects' ? projList(d) : skillLine(d)
          if (!body) return ''
          return `<div style="margin-bottom:16px"><div style="font-size:11px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:6px">${t}</div>${body}</div>`
        }).join('')}
      </div>`,
  },
  bold: {
    name: 'Bold Header',
    desc: 'Strong dark header, confident presence',
    render: (d) => `
      <div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:700px;line-height:1.5;font-size:14px">
        <div style="background:#1a1a2e;color:#fff;padding:28px;margin-bottom:12px">
          <div style="font-size:30px;font-weight:800;letter-spacing:1px">${(d.fullName || 'Your Name').toUpperCase()}</div>
          <div style="color:#aaa;font-size:13px;margin-top:4px">${[d.email, d.phone, d.city].filter(Boolean).join(' | ')}</div>
        </div>
        <div style="padding:0 8px">
        ${d.objective ? `<div style="border-left:4px solid #e94560;padding-left:12px;margin-bottom:16px">${d.objective}</div>` : ''}
        ${section('EDUCATION', eduList(d), { accent: '#e94560', titleTransform: 'uppercase' })}
        ${d.experience.length > 0 ? section('EXPERIENCE', expList(d), { accent: '#e94560', titleTransform: 'uppercase' }) : ''}
        ${d.projects.length > 0 ? section('PROJECTS', projList(d), { accent: '#e94560', titleTransform: 'uppercase' }) : ''}
        ${d.skills.length > 0 ? section('SKILLS', skillLine(d), { accent: '#e94560', titleTransform: 'uppercase' }) : ''}
        </div>
      </div>`,
  },
  academic: {
    name: 'Academic',
    desc: 'Formal serif layout for research & grad school',
    render: (d) => `
      <div style="font-family:'Times New Roman',serif;color:#000;max-width:700px;line-height:1.6;font-size:14px">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:24px;font-weight:700">${d.fullName || 'Your Name'}</div>
          <div style="font-size:13px">${[d.email, d.phone, d.city].filter(Boolean).join(' | ')}</div>
        </div>
        ${d.objective ? `<div style="margin-bottom:14px"><b>Research Interests.</b> ${d.objective}</div>` : ''}
        <div style="margin-bottom:14px"><b>Education.</b>${eduList(d)}</div>
        ${d.experience.length > 0 ? `<div style="margin-bottom:14px"><b>Experience.</b>${expList(d)}</div>` : ''}
        ${d.projects.length > 0 ? `<div style="margin-bottom:14px"><b>Projects.</b>${projList(d)}</div>` : ''}
        ${d.skills.length > 0 ? `<div><b>Skills.</b> ${d.skills.join(', ')}</div>` : ''}
      </div>`,
  },
  compact: {
    name: 'Compact',
    desc: 'Dense two-part flow, fits more on one page',
    render: (d) => `
      <div style="font-family:Verdana,sans-serif;color:#222;max-width:700px;line-height:1.45;font-size:13px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:10px">
          <div style="font-size:22px;font-weight:700;color:#1e40af">${d.fullName || 'Your Name'}</div>
          <div style="font-size:11px;color:#666;text-align:right">${[d.email, d.phone].filter(Boolean).join('<br>')}</div>
        </div>
        <div style="columns:2;column-gap:24px">
          <div style="break-inside:avoid;margin-bottom:12px"><div style="font-weight:700;color:#1e40af;font-size:12px;text-transform:uppercase;margin-bottom:4px">Education</div>${eduList(d)}</div>
          <div style="break-inside:avoid;margin-bottom:12px"><div style="font-weight:700;color:#1e40af;font-size:12px;text-transform:uppercase;margin-bottom:4px">Skills</div>${skillLine(d)}</div>
          ${d.experience.length > 0 ? `<div style="break-inside:avoid;margin-bottom:12px"><div style="font-weight:700;color:#1e40af;font-size:12px;text-transform:uppercase;margin-bottom:4px">Experience</div>${expList(d)}</div>` : ''}
          ${d.projects.length > 0 ? `<div style="break-inside:avoid;margin-bottom:12px"><div style="font-weight:700;color:#1e40af;font-size:12px;text-transform:uppercase;margin-bottom:4px">Projects</div>${projList(d)}</div>` : ''}
        </div>
        ${d.objective ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd"><b>Objective:</b> ${d.objective}</div>` : ''}
      </div>`,
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES)
