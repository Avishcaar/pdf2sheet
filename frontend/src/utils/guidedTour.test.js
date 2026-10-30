import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemoryRouter } from 'react-router-dom';
import {
  consumeGuidedTourRequest,
  GUIDED_TOUR_EVENT,
  GUIDED_TOUR_STATE_KEY,
  launchGuidedTour,
} from './guidedTour.js';

test('launching from another page carries the tour request to the dashboard', () => {
  for (const pathname of ['/vendors', '/settings', '/simulate', '/review/invoice-1']) {
    const calls = [];
    launchGuidedTour((...args) => calls.push(args), pathname);
    assert.deepEqual(calls, [['/dashboard', { state: { [GUIDED_TOUR_STATE_KEY]: true } }]]);
  }
});

test('launching on the dashboard opens the tour without navigating away', () => {
  const originalWindow = globalThis.window;
  const eventTarget = new EventTarget();
  globalThis.window = eventTarget;
  let launches = 0;
  eventTarget.addEventListener(GUIDED_TOUR_EVENT, () => { launches += 1; });

  try {
    const navigate = () => assert.fail('The dashboard tour should not navigate');
    launchGuidedTour(navigate, '/dashboard');
    launchGuidedTour(navigate, '/dashboard/');
    assert.equal(launches, 2);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('consuming the request preserves other navigation state and prevents replay', () => {
  const state = { [GUIDED_TOUR_STATE_KEY]: true, source: 'vendor-directory' };
  const consumed = consumeGuidedTourRequest(state);
  assert.deepEqual(consumed, { remainingState: { source: 'vendor-directory' } });
  assert.equal(consumeGuidedTourRequest(consumed.remainingState), null);
  assert.equal(state[GUIDED_TOUR_STATE_KEY], true);
});

test('a request with no other navigation state clears back to null', () => {
  assert.deepEqual(consumeGuidedTourRequest({ [GUIDED_TOUR_STATE_KEY]: true }), { remainingState: null });
  for (const state of [undefined, null, false, {}, { [GUIDED_TOUR_STATE_KEY]: false }]) {
    assert.equal(consumeGuidedTourRequest(state), null);
  }
});

test('a completed route handoff cannot replay the tour through back and forward history', async () => {
  const router = createMemoryRouter([
    { path: '/vendors', element: null },
    { path: '/dashboard', element: null },
  ], { initialEntries: ['/vendors'] });

  try {
    await launchGuidedTour(router.navigate, router.state.location.pathname);
    assert.equal(router.state.location.pathname, '/dashboard');
    const request = consumeGuidedTourRequest(router.state.location.state);
    assert.ok(request);

    await router.navigate('/dashboard', { replace: true, state: request.remainingState });
    await router.navigate(-1);
    assert.equal(router.state.location.pathname, '/vendors');
    await router.navigate(1);
    assert.equal(router.state.location.pathname, '/dashboard');
    assert.equal(consumeGuidedTourRequest(router.state.location.state), null);
  } finally {
    router.dispose();
  }
});
