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
};
