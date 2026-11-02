/* 查詢頁（index.html）、飯店位卡擺放圖（staff.html）、管理頁（admin.html）共用 */

// 平面圖上各桌的座標（舞台在上，背對舞台男左女右），依飯店桌圖固定不變
const PLAN = [
  { id: '主桌', x: 180, y: 148, r: 32 }, { id: '2', x: 264, y: 142 }, { id: '3', x: 307, y: 191 },
  { id: '5', x: 307, y: 263 }, { id: '6', x: 307, y: 334 }, { id: '7', x: 307, y: 406 }, { id: '8', x: 307, y: 475 },
  { id: '9', x: 233, y: 233 }, { id: '10', x: 233, y: 304 }, { id: '11', x: 233, y: 374 }, { id: '12', x: 233, y: 466 },
  { id: '13', x: 104, y: 150 }, { id: '15', x: 128, y: 233 }, { id: '16', x: 128, y: 304 }, { id: '17', x: 128, y: 374 },
  { id: '18', x: 128, y: 463 }, { id: '19', x: 50, y: 198 }, { id: '20', x: 50, y: 269 }, { id: '21', x: 50, y: 340 },
  { id: '22', x: 50, y: 409 }, { id: '23', x: 50, y: 478 }
];
const PLAN_IDS = PLAN.map(p => p.id);

function tableLabel(t) { return t.id === '主桌' ? '主桌' : '第 ' + t.id + ' 桌'; }
function hasTableName(t) { return !!t.name && t.name !== t.id; }

// 位卡預設名稱：與「桌卡位卡生成器」相同規則（去掉「(兒)」與「新郎／新娘」字樣）
function defaultCard(name) {
  return String(name || '').replace(/[（(]\s*兒\s*[)）]/g, '').replace(/^(新郎|新娘)\s*/, '').replace(/\s+/g, ' ').trim();
}

// 座位字串：'座位表上的名字|可搜尋的全名或別名|...|#child|@位卡名稱'
function parseSeat(raw) {
  const parts = String(raw).split('|');
  const name = parts[0];
  const card = parts.find(p => p[0] === '@');
  return {
    name,
    label: name.replace(/[（(]\s*兒\s*[)）]/g, '').trim(),
    aliases: parts.slice(1).filter(p => p && !/^[#@]/.test(p)),
    child: /[（(]\s*兒\s*[)）]/.test(name) || parts.includes('#child'),
    card: card ? card.slice(1) : defaultCard(name)
  };
}

// 依 seats.js 組出所有桌次：slots 為依序的座位（null 為空位），groups 為同行者的座位索引
function buildTables(seating) {
  const list = (seating && seating.tables) || [];
  const norm = t => {
    const out = Object.assign({ name: '', seats: 10, free: false, g: [] }, t, { id: String(t.id) });
    out.slots = [];
    out.groups = [];
    out.g.forEach(group => {
      if (group === '') { out.slots.push(null); return; }
      const idx = [];
      [].concat(group).forEach(raw => { idx.push(out.slots.length); out.slots.push(parseSeat(raw)); });
      out.groups.push(idx);
    });
    out.seats = Math.max(+out.seats || 10, out.slots.length);
    return out;
  };
  const tables = PLAN.map(p => Object.assign(norm(list.find(t => String(t.id) === p.id) || { id: p.id }), p));
  list.forEach(t => { if (!PLAN_IDS.includes(String(t.id))) tables.push(norm(t)); });
  return tables;
}

// 第 i 位（0 起算）的角度：第 1 位在正 12 點（靠舞台側），順時針平分 360 度
function seatAngle(t, i) { return i * 2 * Math.PI / t.seats; }

function svgEl(tag, attrs, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (text != null) el.textContent = text;
  return el;
}

function textWidth(s, size) {
  let w = 0;
  for (const ch of String(s)) w += ch.charCodeAt(0) > 255 ? size : size * 0.6;
  return w;
}

// 宴會廳平面圖；highlight 為要標示的桌號
function drawPlan(tables, highlight) {
  const svg = svgEl('svg', { viewBox: '0 0 360 560', role: 'img', 'aria-label': '宴會廳平面配置圖', class: 'plan' });
  svg.appendChild(svgEl('rect', { x: 6, y: 6, width: 348, height: 526, rx: 14, fill: '#fbf8f2', stroke: '#cdbfa6', 'stroke-width': 1.5 }));
  svg.appendChild(svgEl('rect', { x: 110, y: 18, width: 140, height: 62, rx: 6, fill: '#583217' }));
  svg.appendChild(svgEl('text', { x: 180, y: 46, 'text-anchor': 'middle', 'font-size': 16, 'letter-spacing': 6, style: 'fill:#f6f3ec' }, '舞台'));
  svg.appendChild(svgEl('text', { x: 180, y: 64, 'text-anchor': 'middle', 'font-size': 10, 'letter-spacing': 3, class: 'en-t', style: 'fill:#d8ccb6' }, 'STAGE'));
  svg.appendChild(svgEl('text', { x: 54, y: 54, 'text-anchor': 'middle', 'font-size': 12, 'letter-spacing': 2, style: 'fill:#8a6a53' }, '女方親友'));
  svg.appendChild(svgEl('text', { x: 306, y: 54, 'text-anchor': 'middle', 'font-size': 12, 'letter-spacing': 2, style: 'fill:#8a6a53' }, '男方親友'));
  svg.appendChild(svgEl('rect', { x: 172, y: 180, width: 16, height: 352, fill: '#d8ccb6' })); // 紅毯
  svg.appendChild(svgEl('text', { x: 180, y: 550, 'text-anchor': 'middle', 'font-size': 11, 'letter-spacing': 3, style: 'fill:#8a6a53' }, '入口 ENTRANCE'));
  tables.forEach(t => {
    if (t.x == null) return;
    const r = t.r || 24;
    const g = svgEl('g', { class: 'tbl' + (t.id === highlight ? ' on' : ''), 'data-id': t.id });
    g.appendChild(svgEl('circle', { class: 'ring', cx: t.x, cy: t.y, r }));
    g.appendChild(svgEl('circle', { class: 'body', cx: t.x, cy: t.y, r }));
    g.appendChild(svgEl('text', { x: t.x, y: t.y, style: t.id === '主桌' ? 'font-size:13px' : '' }, t.id));
    svg.appendChild(g);
  });
  return svg;
}
