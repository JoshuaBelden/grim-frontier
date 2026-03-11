# TODO

## Next

Add seasons, weather, and temperature.

Divide the year into four seasons based on date:
Spring: Mar 1 – May 31
Summer: Jun 1 – Aug 31
Fall: Sep 1 – Nov 30
Winter: Dec 1 – Feb 28

Rough averages:
Season	Avg High	Avg Low
Winter	48°F	28°F
Spring	70°F	48°F
Summer	93°F	72°F
Fall	72°F	50°F

Daily Temperature Generation
- Each day at 02:00, generate a high and low for the day.

Example logic:
baseHigh = seasonalHigh
baseLow  = seasonalLow
high = baseHigh + random(-6 to +6)
low  = baseLow  + random(-6 to +6)
if low >= high:
    low = high - random(5 to 10)

Hourly Temperature Curve
Time	Temperature
4am	lowest
8am	warming
12pm	warm
3pm	peak
8pm	cooling

Simple formula approach:

tempRange = high - low
hourFactor = curve[hour]
temperature = low + (tempRange * hourFactor)

Example curve (0–1 scale):
{
0:0.15,
3:0.05,
6:0.10,
9:0.35,
12:0.70,
15:1.0,
18:0.75,
21:0.45
}

Weather Generation
At 02:00 daily, generate weather for the day.

Weather types:
Clear
Partly Cloudy
Cloudy
Precipitating

Seasonal Weather Probabilities
Winter
Weather	Chance
Clear	30%
Partly Cloudy	30%
Cloudy	25%
Precipitating	15%
Spring (stormy)
Weather	Chance
Clear	25%
Partly Cloudy	25%
Cloudy	25%
Precipitating	25%
Summer
Weather	Chance
Clear	45%
Partly Cloudy	30%
Cloudy	15%
Precipitating	10%
Fall
Weather	Chance
Clear	35%
Partly Cloudy	35%
Cloudy	20%
Precipitating	10%

Precipitation Type

if precipitating:
    if temperature <= 32:
        weather = snow
    else if temperature >= 80:
        weather = thunderstorm
    else:
        weather = rain

Add wind as a daily modifier.
Calm
Breezy
Windy
Strong Wind

- AI Engine
  - NPCs may decide to wander
  - NPCs ask to join camp
  - NPCs start chores

- Players can create their own npc and name it
- Players can log out

## Ideas

- Add soundtrack audio
- NPCs get diseases
- NPCs have wardrobes for the seasons
- NPC can upgrade their bed rolls

## Bugs

- Data hangs with loading... and never refreshes
- Gather actions don't actually take a game hour. If you start it right before the hour, it will automatically add it.
- Resting from the NPC Info Panel causes "already taking an action" error. Rest action button should toggle to Resting
- Non-owned npcs are all dying from not resting or eating