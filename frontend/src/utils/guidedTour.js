export const GUIDED_TOUR_EVENT = 'open-guided-tour';
export const GUIDED_TOUR_STATE_KEY = 'startGuidedTour';

export function launchGuidedTour(navigate, pathname) {
  if (pathname.replace(/\/+$/, '') === '/dashboard') {
    window.dispatchEvent(new Event(GUIDED_TOUR_EVENT));
    return;
  }

  return navigate('/dashboard', { state: { [GUIDED_TOUR_STATE_KEY]: true } });
}

export function consumeGuidedTourRequest(state) {
  if (!state || typeof state !== 'object' || state[GUIDED_TOUR_STATE_KEY] !== true) {
    return null;
  }

  const remainingState = { ...state };
  delete remainingState[GUIDED_TOUR_STATE_KEY];
  return { remainingState: Object.keys(remainingState).length ? remainingState : null };
}
