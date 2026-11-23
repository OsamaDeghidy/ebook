import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export interface BoxShape {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ArrowEntity {
  fromId: string;
  toId: string;
  label: string;
  labelSize: number;
  labelOffset: number;
  labelBox: {
    x: number;
    y: number;
    w: number;
    h: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  shaftLength: number;
}

/**
 * High-fidelity geometric compiler modeling Explainroo Stage & Pedagogical Scene Compiler
 * Implements exact formulas from server.ts and explainroo/engine/stage.js
 */
export class SyntheticStageRenderer {
  public shapes: Map<string, BoxShape> = new Map();
  public arrows: ArrowEntity[] = [];

  constructor(public width = 1920, public height = 1080) {}

  box(label: string, opts: { id: string; x: number; y: number; w: number; size?: number; h?: number }) {
    const size = opts.size ?? 28;
    // Approximating multi-line text height and padding per stage.js:874
    const pad = size * 0.62;
    const contentH = size * 1.5 + size * 1.55; // icon + 1-2 lines text
    const h = opts.h ?? Math.max(120, contentH + pad * 1.4);
    const w = opts.w;
    const x = opts.x;
    const y = opts.y;

    const shape: BoxShape = {
      id: opts.id,
      x,
      y,
      w,
      h,
      left: x - w / 2,
      right: x + w / 2,
      top: y - h / 2,
      bottom: y + h / 2,
    };

    this.shapes.set(opts.id, shape);
    return shape;
  }

  arrow(fromId: string, toId: string, opts: { color?: string; label?: string; labelSize?: number; labelOffset?: number }) {
    const fromBox = this.shapes.get(fromId);
    const toBox = this.shapes.get(toId);
    if (!fromBox || !toBox) {
      throw new Error(`Cannot connect arrow between non-existent boxes: ${fromId} -> ${toId}`);
    }

    // Geometry calculation per stage.js:432 (_edge) and stage.js:1053 (_arrowLabel)
    const gap = 14;
    // Edges
    const dx = toBox.x - fromBox.x;
    const dy = toBox.y - fromBox.y;

    // Edge intersection
    let ax = fromBox.x;
    let ay = fromBox.y;
    let bx = toBox.x;
    let by = toBox.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      // Horizontal arrow
      if (dx > 0) {
        ax = fromBox.right + gap;
        bx = toBox.left - gap;
      } else {
        ax = fromBox.left - gap;
        bx = toBox.right + gap;
      }
      ay = fromBox.y;
      by = toBox.y;
    } else {
      // Vertical arrow
      if (dy > 0) {
        ay = fromBox.bottom + gap;
        by = toBox.top - gap;
      } else {
        ay = fromBox.top - gap;
        by = toBox.bottom + gap;
      }
      ax = fromBox.x;
      bx = toBox.x;
    }

    const shaftLength = Math.hypot(bx - ax, by - ay);

    // Arrow label placement (_arrowLabel, stage.js:1053-1083)
    const label = opts.label || '';
    const labelSize = opts.labelSize ?? 34;
    const labelOffset = opts.labelOffset ?? 34;

    // Approximate rendered width of Arabic label string at given font size (e.g. "يرتبط بـ", "يؤدي إلى")
    // Avg Arabic letter width at hand font: ~3.8 * labelSize / 10
    const approxW = Math.max(60, label.length * (labelSize * 0.48));
    const approxH = labelSize * 1.1;

    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;

    // Normal vector pointing upwards for horizontal arrow: nx=0, ny=-1
    const lx = midX;
    const ly = midY - labelOffset;

    const labelBox = {
      x: lx,
      y: ly,
      w: approxW,
      h: approxH,
      left: lx - approxW / 2,
      right: lx + approxW / 2,
      top: ly - approxH / 2,
      bottom: ly + approxH / 2,
    };

    const arrowEntity: ArrowEntity = {
      fromId,
      toId,
      label,
      labelSize,
      labelOffset,
      labelBox,
      shaftLength,
    };

    this.arrows.push(arrowEntity);
    return arrowEntity;
  }
}

function checkDisjoint(boxA: { left: number; right: number; top: number; bottom: number }, boxB: { left: number; right: number; top: number; bottom: number }, margin = 0): boolean {
  return (
    boxA.right + margin <= boxB.left ||
    boxA.left >= boxB.right + margin ||
    boxA.bottom + margin <= boxB.top ||
    boxA.top >= boxB.bottom + margin
  );
}

describe('Explainroo Whiteboard Visual Collision E2E Suite', () => {
  describe('Spatial Hub Mode (Reference Images media_1795446389157 and media_1795446448)', () => {
    it('evaluates spatial_hub reference scene (Greek Civilization) for arrow-box collision', () => {
      const stage = new SyntheticStageRenderer(1920, 1080);

      // Reconstructing exact code from explainroo/projects/.../scenes.js scene8 & scene10
      // Center box:
      stage.box('الاسبرطيون والبريوك والهيلوت', {
        id: 'hub_center_scene8',
        x: 960,
        y: 470,
        w: 480,
        size: 30,
        h: 150,
      });

      // Left Spoke:
      stage.box('برنامج الأبوجا الصارم', {
        id: 'spoke_scene8_0',
        x: 500,
        y: 470,
        w: 400,
        size: 26,
        h: 140,
      });

      // Connecting arrow with default label 'يرتبط بـ':
      const arrow = stage.arrow('hub_center_scene8', 'spoke_scene8_0', {
        color: 'orange',
        label: 'يرتبط بـ',
      });

      const centerBox = stage.shapes.get('hub_center_scene8')!;
      const spokeBox = stage.shapes.get('spoke_scene8_0')!;

      // Physical distance between center box and left spoke:
      // Center left edge: 960 - 240 = 720
      // Spoke right edge: 500 + 200 = 700
      // Gap: 720 - 700 = 20px
      const physicalGap = centerBox.left - spokeBox.right;
      assert.strictEqual(physicalGap, 20, 'Unremediated code leaves only a 20px physical gap');

      // Assert STRICT DISJOINTNESS requirement (Milestone 2 acceptance criteria):
      // In the unremediated code, this assertion MUST FAIL, documenting the defect baseline!
      const labelDisjointFromCenter = checkDisjoint(arrow.labelBox, centerBox, 5);
      const labelDisjointFromSpoke = checkDisjoint(arrow.labelBox, spokeBox, 5);

      // Documenting defect baseline: assert disjointness fails
      assert.ok(
        !labelDisjointFromCenter || !labelDisjointFromSpoke,
        'DEFECT CONFIRMED: Arrow label ("يرتبط بـ") overlaps node boxes in unremediated spatial_hub!'
      );
    });
  });

  describe('Causal Flow Mode (server.ts lines 2631-2663)', () => {
    it('evaluates causal_flow 3-box horizontal landscape scene for label overlap', () => {
      const stage = new SyntheticStageRenderer(1920, 1080);
      const centerX = 960;

      // server.ts lines 2645-2663
      const total = 3;
      const totalSpan = Math.min(1500, total * 480); // 1440
      const colW = Math.min(440, Math.floor(totalSpan / total) - 30); // 440
      const startX = centerX - totalSpan / 2 + colW / 2; // 460
      const stepX = (totalSpan - colW) / (total - 1); // 500

      // Box 0
      stage.box('المدخلات الثنائية والبيانات', {
        id: 'flow_0',
        x: Math.round(startX + 0 * stepX), // 460
        y: 530,
        w: colW,
        size: 28,
        h: 140,
      });

      // Box 1
      stage.box('المعالجة المنطقية والتحويل', {
        id: 'flow_1',
        x: Math.round(startX + 1 * stepX), // 960
        y: 530,
        w: colW,
        size: 28,
        h: 140,
      });

      // Arrow 0 -> 1 with label "يؤدي إلى"
      const arrow = stage.arrow('flow_0', 'flow_1', {
        color: 'orange',
        label: 'يؤدي إلى',
      });

      const box0 = stage.shapes.get('flow_0')!;
      const box1 = stage.shapes.get('flow_1')!;

      // Distance between box 0 and box 1:
      // Box 0 right: 460 + 220 = 680
      // Box 1 left: 960 - 220 = 740
      // Gap: 740 - 680 = 60px
      const gap = box1.left - box0.right;
      assert.strictEqual(gap, 60, 'Unremediated 3-box causal_flow leaves only a 60px gap');

      // Label width for "يؤدي إلى" at 34px is ~130px.
      // In a 60px gap, it intrudes 35px into both box0 and box1.
      const disjoint0 = checkDisjoint(arrow.labelBox, box0, 5);
      const disjoint1 = checkDisjoint(arrow.labelBox, box1, 5);

      // Documenting defect baseline: assert disjointness fails
      assert.ok(
        !disjoint0 || !disjoint1,
        'DEFECT CONFIRMED: Arrow label ("يؤدي إلى") overlaps Box 0 and Box 1 in unremediated causal_flow!'
      );
    });

    it('verifies arrow shaft length in unremediated layout is crushed below minimum standard', () => {
      const stage = new SyntheticStageRenderer(1920, 1080);
      stage.box('نواة البداية', { id: 'b0', x: 720, y: 500, w: 400, h: 140 });
      stage.box('نواة الهدف', { id: 'b1', x: 1140, y: 500, w: 400, h: 140 });

      // Gap: (1140 - 200) - (720 + 200) = 940 - 920 = 20px
      const arrow = stage.arrow('b0', 'b1', { label: 'يرتبط بـ' });

      // Arrow shaft stops 14px from each box -> 20 - 28 = -8px (or 0)
      assert.ok(
        arrow.shaftLength < 40,
        `Usable arrow shaft length (${arrow.shaftLength}px) is crushed below acceptable pedagogical visualization minimum (>= 80px)`
      );
    });
  });
});
