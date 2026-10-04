/**
 * Settings for this web build. Change them here, commit, and GitHub Pages
 * serves the new version in a minute or two.
 */
export const CONFIG = {
  /**
   * Where Moments, a paused moment and the story rotation are kept.
   *  'local'   = this browser keeps them until she deletes them (or clears site data).
   *  'session' = forgotten when the tab is closed.
   * Either way they stay in this browser only and are NOT encrypted (the phone app encrypts them).
   */
  storage: 'local',

  /**
   * The AI relay (the phone app's relay/ Worker). Empty = "My own words" uses
   * the on-device matcher only and Translate isn't shown. If you set it, the
   * relay must allow requests from your GitHub Pages address (CORS).
   */
  relayUrl: '',

  /** A link testers can use to send feedback (a Google Form, say). Empty = no link. */
  feedbackUrl: '',

  /** The "Test build" line at the top of every screen. */
  showTestBanner: true,

  /** Shown in Settings → About. */
  version: '1.0.0-web',
};
