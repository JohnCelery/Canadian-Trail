import landmarks from '../data/landmarks.json' assert { type: 'json' };

export function getNextLandmark(state) {
  return landmarks[state.progress.landmarkIndex] || null;
}

export function milesToNext(state) {
  const next = getNextLandmark(state);
  if (!next) return 0;
  return Math.max(0, next.mile - state.progress.milesTraveled);
}

export function checkArrival(state) {
  const index = state.progress.landmarkIndex;
  const next = landmarks[index];
  if (next && state.progress.milesTraveled >= next.mile) {
    state.progress.landmarkIndex = index + 1;
    return { arrived: true, landmark: next, index };
  }
  return { arrived: false, landmark: null, index };
}

export { landmarks };
