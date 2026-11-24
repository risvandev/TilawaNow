import assert from "node:assert/strict";
import { test } from "node:test";
import { measureViewport } from "../src/hooks/useVisualViewport.ts";

const phone = {
  width: 390,
  layoutHeight: 844,
  visibleHeight: 844,
  offsetTop: 0,
  scale: 1,
  touch: true,
  editing: false,
};
const idle = measureViewport({ width: 0 }, phone);

test("the Android keyboard stays detected through subsequent viewport events", () => {
  const open = { ...phone, editing: true, layoutHeight: 524, visibleHeight: 524 };
  let state = measureViewport(idle, open);

  for (const sample of [open, { ...open, visibleHeight: 516 }, { ...open, editing: false }]) {
    state = measureViewport(state, sample);
    assert.equal(state.isKeyboardVisible, true);
    assert.equal(state.idleHeight, 844);
  }

  state = measureViewport(state, { ...phone, editing: true });
  assert.equal(state.isKeyboardVisible, false);
  assert.equal(state.viewportHeight, 0);
});

test("the iOS chat uses the visible viewport height and vertical offset", () => {
  const sample = { ...phone, editing: true, visibleHeight: 524.4, offsetTop: 58.3 };
  const state = measureViewport(idle, sample);

  assert.equal(state.isKeyboardVisible, true);
  assert.equal(state.viewportHeight, 524);
  assert.equal(state.viewportTop, 58);
  assert.equal(measureViewport(state, phone).viewportTop, 0);
});

test("pinch zoom, desktop resizing, and minor address bar changes keep navigation visible", () => {
  for (const sample of [
    { ...phone, visibleHeight: 424, scale: 1.9, editing: true },
    { ...phone, layoutHeight: 524, visibleHeight: 524, touch: false, editing: true },
    { ...phone, layoutHeight: 789, visibleHeight: 789, editing: true },
  ]) {
    assert.equal(measureViewport(idle, sample).isKeyboardVisible, false);
  }

  const focused = measureViewport(idle, { ...phone, editing: true });
  assert.equal(focused.isKeyboardVisible, false);
});

test("a width change starts a new baseline for the rotated viewport", () => {
  const landscape = { ...phone, width: 844, layoutHeight: 390, visibleHeight: 390 };
  const state = measureViewport(idle, landscape);
  assert.equal(state.idleHeight, 390);
  assert.equal(state.isKeyboardVisible, false);
  assert.equal(measureViewport(state, { ...landscape, editing: true, layoutHeight: 240, visibleHeight: 240 }).isKeyboardVisible, true);
});
