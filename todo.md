# TODO

## Next

- Improve npc info panel layout
- NPCs will use tools in inventory
- NPC skills and traits improve their chores
- Players can create their own npc and name it

## Bugs

- Gather actions don't actually take a game hour. If you start it right before the hour, it will automatically add it.
- Resting from the NPC Info Panel causes "already taking an action" error. Rest action button should toggle to Resting
- Hunger and Fatigue should happen globally, not just to npcs at camp.

## Systems Ideas

- NPC Loyalty
- Audio & SFX
- Wardrobes
- Encumbrence
- Making Money
- Fishing & Hunting
- Camp Noteriety
- Camp Upgrades
- Disease and Money
- Wagons and storage
- Quests
- Pursuits
- Hobbies and Games
- NPC Interactions and Needs
  - Add Ollama to docker-compose for local NPC conversation LLM (use llama3.2 or mistral, OpenAI-compatible API at port 11434, add ollama_models volume). Keep Claude for NPC generation, use Ollama for cheaper conversation turns.
- AI
  - NPC travel
  - NPC purchasing
- Death
- Taxes
- Crafting
- NPC Driven Camps
