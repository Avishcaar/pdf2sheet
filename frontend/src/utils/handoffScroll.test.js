import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getHandoffScrollProgress } from './handoffScroll.js';

const desktopScene = {
  sceneHeight: 1200,
  panelHeight: 600,
  viewportTop: 76,
  stickyInset: 16,
};

test('the scene stays at its opening frame until it reaches the sticky inset', () => {
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: 200 }), 0);
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: 92 }), 0);
});

test('the scene reaches its midpoint and final frame along the sticky track', () => {
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: -208 }), 0.5);
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: -508 }), 1);
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: -900 }), 1);
});

test('scrolling upward reverses progress without retaining playback state', () => {
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: -388 }), 0.8);
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: -28 }), 0.2);
  assert.equal(getHandoffScrollProgress({ ...desktopScene, sceneTop: 120 }), 0);
});

test('nested desktop and window-based mobile viewports share relative scroll progress', () => {
  const nested = getHandoffScrollProgress({ ...desktopScene, sceneTop: -124 });
  const windowBased = getHandoffScrollProgress({
    sceneTop: -200,
    sceneHeight: 1200,
    panelHeight: 600,
    stickyInset: 16,
  });

  assert.equal(nested, 0.36);
  assert.equal(nested, windowBased);
});

test('the default viewport origin and sticky inset are zero', () => {
  assert.equal(getHandoffScrollProgress({
    sceneTop: -300,
    sceneHeight: 1200,
    panelHeight: 600,
  }), 0.5);
});

test('a short or missing sticky track remains finite and clamps within its endpoints', () => {
  for (const sceneHeight of [600.5, 600, 500]) {
    const dimensions = { sceneHeight, panelHeight: 600 };
    assert.equal(getHandoffScrollProgress({ ...dimensions, sceneTop: 1 }), 0);
    assert.equal(getHandoffScrollProgress({ ...dimensions, sceneTop: 0 }), 0);
    assert.equal(getHandoffScrollProgress({ ...dimensions, sceneTop: -0.5 }), 0.5);
    assert.equal(getHandoffScrollProgress({ ...dimensions, sceneTop: -2 }), 1);
  }
});

test('unmeasured and invalid geometry keeps the opening frame', () => {
  assert.equal(getHandoffScrollProgress(), 0);
  assert.equal(getHandoffScrollProgress({}), 0);

  const valid = { ...desktopScene, sceneTop: -208 };
  for (const key of Object.keys(valid)) {
    for (const invalid of [NaN, Infinity, -Infinity, '600', null]) {
      assert.equal(getHandoffScrollProgress({ ...valid, [key]: invalid }), 0);
    }
  }

  for (const key of ['sceneHeight', 'panelHeight']) {
    for (const invalid of [0, -1]) {
      assert.equal(getHandoffScrollProgress({ ...valid, [key]: invalid }), 0);
    }
  }
});
