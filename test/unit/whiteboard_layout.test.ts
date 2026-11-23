import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Interface representing a 2D bounding box
 */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function createBoundingBox(x: number, y: number, w: number, h: number): BoundingBox {
  return {
    x,
    y,
    w,
    h,
    left: x - w / 2,
    right: x + w / 2,
    top: y - h / 2,
    bottom: y + h / 2,
  };
}

/**
 * Checks whether two bounding boxes are strictly disjoint (no intersection)
 * If margin > 0, requires at least `margin` pixels of empty clearance between them
 */
export function areDisjoint(a: BoundingBox, b: BoundingBox, margin = 0): boolean {
  return (
    a.right + margin <= b.left ||
    a.left >= b.right + margin ||
    a.bottom + margin <= b.top ||
    a.top >= b.bottom + margin
  );
}

/**
 * Computes overlap area between two bounding boxes
 * Returns 0 if disjoint
 */
export function computeOverlap(a: BoundingBox, b: BoundingBox): { xOverlap: number; yOverlap: number; area: number } {
  const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return {
    xOverlap,
    yOverlap,
    area: xOverlap * yOverlap,
  };
}

/**
 * Mathematical model of Whiteboard Layout Generator as implemented in server.ts
 */
export function computeUnremediatedSpatialHubLayout(isVertical: boolean = false) {
  const canvasW = isVertical ? 1080 : 1920;
  const canvasH = isVertical ? 1920 : 1080;
  const centerX = Math.round(canvasW / 2);

  // Unremediated server.ts lines 2611-2630
  const centerW = isVertical ? 560 : 480;
  const centerH = 150;
  const centerY = isVertical ? 620 : 470;
  const centerBox = createBoundingBox(centerX, centerY, centerW, centerH);

  // Left spoke (index 0) and Right spoke (index 1)
  const spokeW = isVertical ? 440 : 400;
  const spokeH = 130;
  const leftX = isVertical ? centerX - 240 : centerX - 460;
  const leftY = isVertical ? 920 : 470;
  const leftSpoke = createBoundingBox(leftX, leftY, spokeW, spokeH);

  const rightX = isVertical ? centerX + 240 : centerX + 460;
  const rightY = isVertical ? 920 : 470;
  const rightSpoke = createBoundingBox(rightX, rightY, spokeW, spokeH);

  // Connection arrow and label from center to left spoke (horizontal in landscape)
  const arrowLabelText = 'يرتبط بـ';
  const labelFontSize = 34; // default in stage.js:1074
  // Approx text width for 'يرتبط بـ' at 34px hand font: ~130px
  const approxLabelW = 130;
  const approxLabelH = labelFontSize * 1.1;

  // In landscape: arrow connects (centerX, 470) to (leftX, 470)
  // Arrow midpoint X is midway between center and spoke:
  // Edge of center box: left = centerX - 240 = 720
  // Edge of left spoke: right = leftX + 200 = 700
  // Usable gap = 720 - 700 = 20px
  const gapLeft = centerBox.left - leftSpoke.right;
  const midX = (leftSpoke.right + centerBox.left) / 2;
  const midY = 470;
  const labelOffset = 34; // default in stage.js:1073
  const labelY = midY - labelOffset; // ny = -1 for dx < 0 or dx > 0
  const arrowLabelBox = createBoundingBox(midX, labelY, approxLabelW, approxLabelH);

  return {
    canvasW,
    canvasH,
    centerBox,
    leftSpoke,
    rightSpoke,
    gapLeft,
    arrowLabelBox,
    arrowLabelText,
  };
}

export function computeUnremediatedCausalFlowLayout(isVertical: boolean = false, boxCount: number = 3) {
  const canvasW = isVertical ? 1080 : 1920;
  const canvasH = isVertical ? 1920 : 1080;
  const centerX = Math.round(canvasW / 2);

  // Unremediated server.ts lines 2631-2663
  const boxes: BoundingBox[] = [];
  const arrowLabels: BoundingBox[] = [];
  const arrowLabelText = 'يؤدي إلى';
  const approxLabelW = 130;
  const labelH = 36;

  if (isVertical) {
    for (let i = 0; i < boxCount; i++) {
      const boxY = 540 + i * 320;
      boxes.push(createBoundingBox(centerX, boxY, 900, 150));
    }
  } else {
    const total = boxCount || 1;
    const totalSpan = Math.min(1500, total * 480);
    const colW = Math.min(440, Math.floor(totalSpan / total) - 30);
    const startX = centerX - totalSpan / 2 + colW / 2;
    const stepX = total > 1 ? (totalSpan - colW) / (total - 1) : 0;

    for (let i = 0; i < total; i++) {
      const curX = Math.round(startX + i * stepX);
      boxes.push(createBoundingBox(curX, 530, colW, 140));
    }

    for (let i = 1; i < total; i++) {
      const prev = boxes[i - 1];
      const curr = boxes[i];
      const midX = (prev.right + curr.left) / 2;
      const midY = 530 - 34;
      arrowLabels.push(createBoundingBox(midX, midY, approxLabelW, labelH));
    }
  }

  return {
    canvasW,
    canvasH,
    boxes,
    arrowLabels,
  };
}

describe('Whiteboard Layout Geometric Collision Suite', () => {
  describe('Unremediated Baseline Defect Characterization', () => {
    it('demonstrates that unremediated spatial_hub in landscape has an unviable 20px gap', () => {
      const layout = computeUnremediatedSpatialHubLayout(false);
      // The clearance gap between center box and left spoke is exactly 20px
      assert.strictEqual(layout.gapLeft, 20);
      assert.ok(layout.gapLeft < 60, 'Gap is dangerously narrow');
    });

    it('demonstrates that unremediated spatial_hub arrow label collides with node boxes', () => {
      const layout = computeUnremediatedSpatialHubLayout(false);
      const overlapWithCenter = computeOverlap(layout.arrowLabelBox, layout.centerBox);
      const overlapWithSpoke = computeOverlap(layout.arrowLabelBox, layout.leftSpoke);

      // Label width is 130px, centered in a 20px gap -> extends 65px both sides
      // Left edge of center box = 720. Label right edge = 710 + 65 = 775 -> penetrates 55px into center box!
      assert.ok(overlapWithCenter.xOverlap > 0, `Expected horizontal overlap with center box, got ${overlapWithCenter.xOverlap}px`);
      assert.ok(overlapWithCenter.yOverlap > 0, `Expected vertical overlap with center box, got ${overlapWithCenter.yOverlap}px`);
      assert.ok(overlapWithCenter.area > 0, 'Label collides with center box interior');

      assert.ok(overlapWithSpoke.xOverlap > 0, `Expected horizontal overlap with spoke box, got ${overlapWithSpoke.xOverlap}px`);
      assert.ok(overlapWithSpoke.area > 0, 'Label collides with left spoke interior');

      // Strict disjointness fails on unremediated layout
      const disjoint = areDisjoint(layout.arrowLabelBox, layout.centerBox);
      assert.strictEqual(disjoint, false, 'Unremediated spatial_hub MUST fail disjointness before remediation');
    });

    it('demonstrates that unremediated causal_flow 3-box in landscape has a 60px gap and causes collision', () => {
      const layout = computeUnremediatedCausalFlowLayout(false, 3);
      assert.strictEqual(layout.boxes.length, 3);

      const box0 = layout.boxes[0];
      const box1 = layout.boxes[1];
      const gap = box1.left - box0.right;

      // Unremediated gap is exactly 60px
      assert.strictEqual(gap, 60);

      const label0 = layout.arrowLabels[0];
      const overlap0 = computeOverlap(label0, box0);
      const overlap1 = computeOverlap(label0, box1);

      // Label width 130px in 60px gap overshoots by (130-60)/2 = 35px into each box!
      assert.ok(overlap0.xOverlap > 0, `Expected overlap with box 0, got ${overlap0.xOverlap}px`);
      assert.ok(overlap1.xOverlap > 0, `Expected overlap with box 1, got ${overlap1.xOverlap}px`);
      assert.ok(!areDisjoint(label0, box0), 'Label 0 must overlap Box 0 in unremediated code');
    });
  });

  describe('Contract Specifications for Milestone 2 Remediation', () => {
    it('defines required safe margins for spatial_hub layout (clearance >= 140px)', () => {
      // Contract target: spoke offset widened to 540px and widths refined (centerW=420, spokeW=340)
      const centerX = 960;
      const centerW = 420;
      const spokeW = 340;
      const leftX = centerX - 540; // 420

      const centerBox = createBoundingBox(centerX, 470, centerW, 150);
      const leftSpoke = createBoundingBox(leftX, 470, spokeW, 130);

      const gap = centerBox.left - leftSpoke.right;
      // 750 - 590 = 160px
      assert.ok(gap >= 140, `Target gap must be >= 140px, got ${gap}px`);

      // Label at size 22 width ~85px
      const labelW = 85;
      const labelBox = createBoundingBox((leftSpoke.right + centerBox.left) / 2, 470 - 38, labelW, 26);

      assert.ok(areDisjoint(labelBox, centerBox, 10), 'Remediated target must be strictly disjoint with >= 10px margin');
      assert.ok(areDisjoint(labelBox, leftSpoke, 10), 'Remediated target must be strictly disjoint with >= 10px margin');
    });

    it('defines required safe margins for causal_flow layout (clearance >= 200px)', () => {
      // Contract target for 3 boxes: totalSpan 1600, colW 360, stepX 620
      const box0 = createBoundingBox(340, 530, 360, 140); // [160, 520]
      const box1 = createBoundingBox(960, 530, 360, 140); // [780, 1140]

      const gap = box1.left - box0.right; // 780 - 520 = 260px
      assert.ok(gap >= 200, `Target gap must be >= 200px, got ${gap}px`);

      const labelW = 95;
      const labelBox = createBoundingBox((box0.right + box1.left) / 2, 530 - 38, labelW, 28);

      assert.ok(areDisjoint(labelBox, box0, 20), 'Causal flow label must be disjoint with >= 20px margin');
      assert.ok(areDisjoint(labelBox, box1, 20), 'Causal flow label must be disjoint with >= 20px margin');
    });

    it('verifies vertical 9:16 reels mode avoids vertical box crowding', () => {
      // In 9:16 reels, vertical spacing must accommodate box height (150-180px)
      const centerY0 = 480;
      const centerY1 = 480 + 390; // step = 390px
      const box0 = createBoundingBox(540, centerY0, 900, 160);
      const box1 = createBoundingBox(540, centerY1, 900, 160);

      const verticalGap = box1.top - box0.bottom; // (870 - 80) - (480 + 80) = 790 - 560 = 230px
      assert.ok(verticalGap >= 150, `Vertical gap in Reels must be >= 150px, got ${verticalGap}px`);
    });
  });
});
