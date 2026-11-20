/**
 * Shared, mutable game state.
 *
 * control: who the player is driving right now
 *   'llama' – the whole llama, head on
 *   'body'  – the headless body (nearly blind)
 *   'head'  – the loose head, rolling
 *   'host'  – the head sitting on something (post, scarecrow, cow, tractor)
 */
export const state = {
  t: 0,
  started: false,
  paused: false,
  control: 'llama',
  camYaw: 0,
  camPitch: 0.35,
  found: 0,
  fogFarBase: 34,
  day: true,      // the sun is awake (see sky.js)
  dayT: 0,        // seconds into the current day or night
  dayMix: 1,      // 0 night .. 1 day, eased
};
