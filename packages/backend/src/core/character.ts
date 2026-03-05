import type { Characteristics, CharacterOrigin, Nature } from "@grim-frontier/shared"

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generates randomized starting characteristics for a new player character. */
export function defaultCharacteristics(): Characteristics {
  return {
    strength: randomInt(3, 8),
    hand: randomInt(3, 8),
    presence: randomInt(3, 8),
    wit: randomInt(3, 8),
    temper: randomInt(3, 8),
    grit: randomInt(3, 8),
    nerve: randomInt(3, 8),
    luck: randomInt(3, 8),
  }
}

/** Returns neutral starting nature values for a new player character. */
export function defaultNature(): Nature {
  return {
    disposition: {
      generosity: 0,
      mercy: 0,
      courage: 0,
      contentment: 0,
      honesty: 0,
    },
    outlook: {
      idealism: 0,
      willfulness: 0,
      trust: 0,
      humility: 0,
    },
  }
}

/** Returns a generic frontier origin for a new player character. */
export function defaultOrigin(): CharacterOrigin {
  return {
    background: {
      origin: "frontier",
      family: "settled",
      formativeEvent: "Left home young, rode west with nothing but a bedroll and a name.",
    },
    scars: [],
    pursuits: {},
  }
}
