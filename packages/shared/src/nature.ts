/** Bipolar moral and behavioral axes, each ranging -5 to +5.
 * Negative = first named pole, positive = second named pole. */
export interface Disposition {
  generosity: number // -5 = Greedy,    +5 = Generous
  mercy: number // -5 = Cruel,     +5 = Merciful
  courage: number // -5 = Cautious,  +5 = Courageous
  contentment: number // -5 = Ambitious, +5 = Content
  honesty: number // -5 = Deceptive, +5 = Honest
}

/** Bipolar worldview axes, each ranging -5 to +5. */
export interface Outlook {
  idealism: number // -5 = Cynical,    +5 = Idealistic
  willfulness: number // -5 = Fatalistic, +5 = Willful
  trust: number // -5 = Suspicious, +5 = Trusting
  humility: number // -5 = Prideful,   +5 = Humble
}

/** The full nature of a character — disposition and outlook combined. */
export interface Nature {
  disposition: Disposition
  outlook: Outlook
}
