import Anthropic from "@anthropic-ai/sdk"
import type { NPC } from "@grim-frontier/shared"

// SDK reads ANTHROPIC_API_KEY from env by default
const client = new Anthropic()

const npcItemSchema = {
  type: "object",
  required: ["name", "portraitDescription", "career", "characteristics", "nature", "traits", "skills", "origin"],
  properties: {
    name: { type: "string" },
    portraitDescription: {
      type: "string",
      description:
        "A single evocative sentence describing the character's physical appearance, suitable as an image generation prompt.",
    },
    career: {
      type: "string",
      enum: [
        "scout",
        "trapper",
        "prospector",
        "lawman",
        "bounty_hunter",
        "detective",
        "gunfighter",
        "rustler",
        "smuggler",
        "soldier",
        "deserter",
        "cowboy",
        "wrangler",
        "rancher",
        "homesteader",
        "blacksmith",
        "gunsmith",
        "leatherworker",
        "carpenter",
        "butcher",
        "barber",
        "dentist",
        "doctor",
        "merchant",
        "trader",
        "saloon_keeper",
        "gambler",
        "banker",
        "lawyer",
        "preacher",
        "teacher",
        "journalist",
      ],
    },
    characteristics: {
      type: "object",
      required: ["strength", "hand", "presence", "wit", "temper", "grit", "nerve", "luck"],
      properties: {
        strength: { type: "integer", minimum: 1, maximum: 10 },
        hand: { type: "integer", minimum: 1, maximum: 10 },
        presence: { type: "integer", minimum: 1, maximum: 10 },
        wit: { type: "integer", minimum: 1, maximum: 10 },
        temper: { type: "integer", minimum: 1, maximum: 10 },
        grit: { type: "integer", minimum: 1, maximum: 10 },
        nerve: { type: "integer", minimum: 1, maximum: 10 },
        luck: { type: "integer", minimum: 1, maximum: 10 },
      },
    },
    nature: {
      type: "object",
      required: ["disposition", "outlook"],
      properties: {
        disposition: {
          type: "object",
          required: ["generosity", "mercy", "courage", "contentment", "honesty"],
          properties: {
            generosity: { type: "integer", minimum: -5, maximum: 5 },
            mercy: { type: "integer", minimum: -5, maximum: 5 },
            courage: { type: "integer", minimum: -5, maximum: 5 },
            contentment: { type: "integer", minimum: -5, maximum: 5 },
            honesty: { type: "integer", minimum: -5, maximum: 5 },
          },
        },
        outlook: {
          type: "object",
          required: ["idealism", "willfulness", "trust", "humility"],
          properties: {
            idealism: { type: "integer", minimum: -5, maximum: 5 },
            willfulness: { type: "integer", minimum: -5, maximum: 5 },
            trust: { type: "integer", minimum: -5, maximum: 5 },
            humility: { type: "integer", minimum: -5, maximum: 5 },
          },
        },
      },
    },
    traits: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
        enum: [
          "dead_eye",
          "hair_trigger",
          "brawler",
          "hard_to_kill",
          "ruthless",
          "silver_tongue",
          "hard_stare",
          "poker_face",
          "man_of_his_word",
          "read_people",
          "steady_hands",
          "horse_whisperer",
          "tinkerer",
          "merchants_eye",
          "hard_living",
          "tracker",
          "last_man_standing",
          "field_medic",
          "cool_head",
          "gut_feeling",
          "paranoid",
          "grudge_holder",
          "outlaws_eye",
          "frontier_born",
          "campaigner",
          "gamblers_blood",
        ],
      },
    },
    skills: {
      type: "object",
      description: "Include only skills relevant to the character's career and background. Omit irrelevant skills.",
      properties: {
        shooting: { type: "integer", minimum: 1, maximum: 10 },
        brawling: { type: "integer", minimum: 1, maximum: 10 },
        quick_draw: { type: "integer", minimum: 1, maximum: 10 },
        ride: { type: "integer", minimum: 1, maximum: 10 },
        animal_handling: { type: "integer", minimum: 1, maximum: 10 },
        track: { type: "integer", minimum: 1, maximum: 10 },
        navigate: { type: "integer", minimum: 1, maximum: 10 },
        survive: { type: "integer", minimum: 1, maximum: 10 },
        scout: { type: "integer", minimum: 1, maximum: 10 },
        stealth: { type: "integer", minimum: 1, maximum: 10 },
        persuade: { type: "integer", minimum: 1, maximum: 10 },
        intimidate: { type: "integer", minimum: 1, maximum: 10 },
        deceive: { type: "integer", minimum: 1, maximum: 10 },
        command: { type: "integer", minimum: 1, maximum: 10 },
        negotiate: { type: "integer", minimum: 1, maximum: 10 },
        build: { type: "integer", minimum: 1, maximum: 10 },
        forge: { type: "integer", minimum: 1, maximum: 10 },
        leatherwork: { type: "integer", minimum: 1, maximum: 10 },
        tinker: { type: "integer", minimum: 1, maximum: 10 },
        doctor: { type: "integer", minimum: 1, maximum: 10 },
        appraise: { type: "integer", minimum: 1, maximum: 10 },
        trade: { type: "integer", minimum: 1, maximum: 10 },
        gamble: { type: "integer", minimum: 1, maximum: 10 },
        investigate: { type: "integer", minimum: 1, maximum: 10 },
        streetwise: { type: "integer", minimum: 1, maximum: 10 },
        gather: { type: "integer", minimum: 1, maximum: 10 },
      },
      additionalProperties: false,
    },
    origin: {
      type: "object",
      required: ["background", "scars", "pursuits"],
      properties: {
        background: {
          type: "object",
          required: ["origin", "family", "formativeEvent"],
          properties: {
            origin: { type: "string", enum: ["frontier", "small_town", "city", "foreign"] },
            family: { type: "string", enum: ["settled", "notable", "broken", "orphan", "outcast"] },
            formativeEvent: {
              type: "string",
              description: "A specific, personal narrative sentence describing what shaped this character.",
            },
          },
        },
        scars: {
          type: "array",
          minItems: 0,
          maxItems: 3,
          items: {
            type: "object",
            required: ["type", "description"],
            properties: {
              type: {
                type: "string",
                enum: ["physical", "loss", "debt", "reputation_mark", "obsession"],
              },
              description: { type: "string" },
              triggerCondition: { type: "string" },
            },
          },
        },
        pursuits: {
          type: "object",
          properties: {
            secret: { type: "string" },
            shortTerm: { type: "string" },
            longTerm: { type: "string" },
          },
        },
      },
    },
  },
}

const generateNpcPoolTool: Anthropic.Tool = {
  name: "generate_npc_pool",
  description: "Generate a batch of unique NPC drifters for the world pool.",
  input_schema: {
    type: "object",
    required: ["npcs"],
    properties: {
      npcs: {
        type: "array",
        items: npcItemSchema,
      },
    },
  },
}

const SYSTEM_PROMPT = `You are a character generator for a grim, grounded 1890s American frontier world simulation. Generate morally complex NPC drifters who feel rooted in frontier realism — not romanticized heroes.

Guidelines:
- Each character's career, traits, and skills must be internally coherent. A scout should have track/navigate/survive skills; a gambler should have gamble/deceive/read_people traits.
- Keep skills sparse — only include skills the character would genuinely have developed. Typically 3–6 skills.
- Traits (1–3) should reflect lived experience, not just the career. A frontier_born gambler is different from a city-raised one.
- Nature values should feel earned — a man who survived a massacre might be courageous but cruel; a preacher might be honest but deeply suspicious.
- Characteristics should match the life they've lived. A blacksmith has high strength; a detective has high wit.
- formativeEvent must be specific and personal — not generic. Avoid phrases like "left home young" or "rode west." Name places, people, circumstances.
- Pursuits should feel real: a secret the character keeps hidden, a near-term goal driving their movement, a long-term hope or fear.
- portraitDescription must be a single, evocative sentence suitable as an image generation prompt — physical description only, no backstory.
- Generate diverse characters: varied careers, backgrounds, ages, dispositions, and origins (including foreign-born where appropriate).`

/** Generates a pool of AI-created NPC drifters ready to insert into MongoDB. */
export async function generateNpcPool(count: number): Promise<NPC[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set")
  }

  const model = process.env.CLAUDE_MODEL ?? "claude-opus-4-6"

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tool_choice: { type: "any" },
    tools: [generateNpcPoolTool],
    messages: [
      {
        role: "user",
        content: `Generate exactly ${count} unique NPC drifters. Each must have a distinct career, personality, and backstory. No two characters should feel alike.`,
      },
    ],
  })

  const toolUseBlock = response.content.find(block => block.type === "tool_use")
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use response")
  }

  const input = toolUseBlock.input as { npcs: unknown[] }
  const now = new Date()

  return input.npcs.map(raw => {
    const data = raw as Omit<NPC, "status" | "relationships" | "createdAt" | "updatedAt">
    return {
      ...data,
      health: 10,
      morale: 10,
      status: "drifting" as const,
      relationships: [],
      createdAt: now,
      updatedAt: now,
    }
  })
}
