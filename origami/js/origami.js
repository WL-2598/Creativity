/**
 * origami.js — 纸境的折痕核心（纯逻辑，可独立测试）
 * 种子裁决一张折纸折痕图：水平/垂直折痕的峰线与谷线。
 * 赋值规则经构造保证每个顶点满足马氏（Maekawa）定理：峰谷数之差恒为 ±2。
 *
 * 规则（可证明）：
 *   行折痕（水平线，行号 j）峰  <=> j 为奇数（或偶数，随变体）
 *   列折痕（垂直线，左上格 (i,j)）峰 <=> (i+j) 为偶数（或奇数，随变体）
 *   任一内部顶点处，两条行折痕同态、两条列折痕异态，
 *   故峰数 = 2·(j 奇偶) + 1 ∈ {1,3}，恒满足 |峰 − 谷| = 2。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const FOLD_STYLES = {
  crane: { label: '千羽', paper: '#f5f0e6', line: '#8a5a4a' },
  plain: { label: '素白', paper: '#f2f2f0', line: '#4a4a52' },
  indigo: { label: '靛青', paper: '#e8ecf2', line: '#2a3a5a' },
  crimson: { label: '朱红', paper: '#f4e8e4', line: '#7a2a2a' },
};

/** 折痕族：row=水平线，col=垂直线 */
export const FAMILY_LABELS = { row: '横线', col: '纵线' };

/**
 * 生成一张折痕图案。
 * @param {number} seed
 * @param {{grid?: number, style?: string, families?: string}} opts families: 'row'|'col'|'rowcol'
 */
export function generateOrigami(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const styles = Object.keys(FOLD_STYLES);
  const style = opts.style && FOLD_STYLES[opts.style] ? opts.style : styles[Math.floor(rng() * styles.length)];
  const S = FOLD_STYLES[style];
  const n = Math.max(3, Math.min(24, opts.grid ?? 8 + Math.floor(rng() * 10)));

  // 变体：0 或 1，翻转奇偶基准，制造不同肌理
  const variant = rng() < 0.5 ? 0 : 1;
  const families = opts.families === 'row' ? ['row']
    : opts.families === 'col' ? ['col']
    : ['row', 'col'];

  // 规则
  const rowPeak = (j) => (j % 2 === 1) ^ (variant === 1);   // 行峰 <=> j 奇（变体翻转）
  const colPeakBoth = (i, j) => ((i + j) % 2 === 0) ^ (variant === 1);
  const colPeakOnly = (i) => (i % 2 === 0) ^ (variant === 1);

  const segments = [];
  // 行折痕：每条水平线 j 上有 n 段
  if (families.includes('row')) {
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i < n; i++) {
        segments.push({ type: 'row', x1: i, y1: j, x2: i + 1, y2: j, peak: !!rowPeak(j) });
      }
    }
  }
  // 列折痕：每条垂直线 i 上有 n 段
  if (families.includes('col')) {
    const colRule = families.length === 1 ? colPeakOnly : colPeakBoth;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        segments.push({
          type: 'col', x1: i, y1: j, x2: i, y2: j + 1,
          peak: !!(families.length === 1 ? colRule(i) : colRule(i, j)),
        });
      }
    }
  }

  // 马氏定理统计：内部顶点（行、列折痕均存在时）
  let valid = 0, checked = 0;
  for (let x = 1; x < n - 1; x++) {
    for (let y = 1; y < n - 1; y++) {
      if (!families.includes('row') || !families.includes('col')) break;
      const lines = collectLinesAt(segments, x, y);
      if (lines.length >= 4) {
        checked++;
        const peaks = lines.filter(l => l.peak).length;
        if (Math.abs(peaks * 2 - lines.length) === 2) valid++;
      }
    }
  }

  return {
    style,
    styleLabel: S.label,
    paper: S.paper,
    lineColor: S.line,
    grid: n,
    families,
    variant,
    segments,
    stats: {
      grid: n,
      folds: segments.length,
      families: families.length,
      maekawaVertices: valid,
      maekawaTotal: checked,
    },
  };
}

/** 收集某顶点相交的折痕（含端点：顶点可落在两段折痕的共享端点上） */
function collectLinesAt(segments, x, y) {
  const lines = [];
  for (const s of segments) {
    if (s.type === 'row') {
      if (s.y1 === y && s.x1 <= x && x <= s.x2) lines.push(s);
    } else {
      if (s.x1 === x && s.y1 <= y && y <= s.y2) lines.push(s);
    }
  }
  return lines;
}
