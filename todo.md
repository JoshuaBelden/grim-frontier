# TODO

## Next

- NPCs will use tools in inventory
- Camps increase noteriety
- Improve npc info panel layout
- NPCs track their age
- All stats go from 0 to 10, 
- NPCs build loyalty, stats reveal
  - NPCs in camp will leave if their morale drops
- NPC skills and traits improve their chores

## Upcoming

- NPCs can give/take items
- NPCs all have generated images
- Add NPCs that can start camps
- Players can create their own npc and name it
- Add soundtrack audio

## Systems Ideas

- Wardrobes
- Encumbrence
- Making Money
- Fishing & Hunting
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

## Bugs

- NPCs aren't gathering fuel.
- Gather actions don't actually take a game hour. If you start it right before the hour, it will automatically add it.
- Resting from the NPC Info Panel causes "already taking an action" error. Rest action button should toggle to Resting
- NPC avatar always says "At Camp"
- Hunger and Fatigue should happen globally, not just to npcs at camp.
- Traveling back to camp shows the wrong location