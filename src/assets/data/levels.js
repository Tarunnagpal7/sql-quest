export const levels = [
  {
    id: 1,
    x: 50,
    y: 15,
    title: "Path to the Hidden Map",
    query: "SELECT * FROM map",
    riddle: "The jungle map is lost in data. Use the spell to reveal all hidden paths.",
    schema: `CREATE TABLE map ( id INT, location VARCHAR );`,
    unlocked: true,
    completed: false,
    type: 'basic'
  },
  {
    id: 2,
    x: 25,
    y: 25,
    title: "The Brave Shall Pass",
    query: "SELECT * FROM jungle_explorers WHERE courage_level > 80;",
    riddle: "The dragons only fear the brave. Find all explorers whose courage level is greater than 80.",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT,
  artifact_found BOOLEAN
);`,
    unlocked: false,
    completed: false,
    type: 'basic'
  },
  {
    id: 3,
    x: 70,
    y: 30,
    title: "Open the Temple Gates",
    query: "SELECT * FROM artifacts WHERE found_by IS NOT NULL;",
    riddle: "Open the temple door by finding all artifacts discovered by NOT NULL.",
    schema: `CREATE TABLE artifacts (
  id INT,
  name VARCHAR,
  found_by INT
);
CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR
);`,
    unlocked: false,
    completed: false,
    type: 'basic'
  },
  {
    id: 4,
    x: 40,
    y: 40,
    title: "Build the Raft",
    query: "SELECT * FROM jungle_explorers WHERE artifact_found = TRUE;",
    riddle: "You must build a raft. Only those who have found artifacts can assist. Find them.",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  artifact_found BOOLEAN
);`,
    unlocked: false,
    completed: false,
    type: 'basic'
  },
  {
    id: 5,
    x: 80,
    y: 45,
    title: "Free the Sacred Beast",
    query: "SELECT * FROM jungle_explorers ORDER BY courage_level DESC LIMIT 1;",
    riddle: "Free the monkey trapped in stone. Only the most courageous explorer can do it. Who is it?",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT
);`,
    unlocked: false,
    completed: false,
    type: 'intermediate'
  },
{
  id: 6,
  x: 20,
  y: 55,
  title: "Restore the Memory Crystal",
  query: "SELECT name, skill FROM jungle_explorers WHERE name LIKE '%a%' AND skill IN ('magic', 'healing');",
  riddle: "The shattered memory crystal needs specific souls to repair it. Find explorers whose names contain the letter 'a' and who possess either magic or healing skills.",
  schema: `CREATE TABLE jungle_explorers (
    id INT,
    name VARCHAR,
    skill VARCHAR
  );`,
  unlocked: false,
  completed: false,
  type: 'intermediate'
},
{
  id: 7,
  x: 60,
  y: 60,
  title: "Arm the Heroes",
  query: "SELECT e.name, w.weapon_name FROM jungle_explorers e JOIN weapons w ON e.id = w.owner_id;",
  riddle: "The volcano erupts! Find which explorers have weapons to defend the evacuation route.",
  schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT
);
CREATE TABLE weapons (
  id INT,
  weapon_name VARCHAR,
  owner_id INT
);`,
  unlocked: false,
  completed: false,
  type: 'advanced'
},
{
  id: 8,
  x: 35,
  y: 70,
  title: "SQL Speed Circuit - Average Courage Race",
  query: "SELECT AVG(courage_level) FROM jungle_explorers;",
  riddle: "alculate the average courage level to determine your racing raft's optimal speed for the rescue from the river.",
  schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT
);`,
  unlocked: false,
  completed: false,
  type: 'advanced'
},
{
  id: 9,
  x: 75,
  y: 70,
  title: "SQL Battle Arena - Mystic Duel",
  query: "SELECT damage FROM spells WHERE element = 'fire' ORDER BY power DESC LIMIT 1;",
  riddle: "Enter the mystical battle arena! Cast SQL spells to defeat your magical opponent in epic wizard combat.",
  schema: `CREATE TABLE spells (
  id INT,
  name VARCHAR,
  element VARCHAR,
  power INT,
  damage INT,
  mana_cost INT
);
CREATE TABLE creatures (
  id INT,
  name VARCHAR,
  rarity VARCHAR,
  health INT,
  attack INT
);
CREATE TABLE abilities (
  id INT,
  creature_id INT,
  ability_name VARCHAR,
  damage INT
);
CREATE TABLE defenses (
  id INT,
  shield_strength INT,
  type VARCHAR
);
CREATE TABLE potions (
  id INT,
  healing_power INT,
  type VARCHAR,
  rarity VARCHAR
);`,
  unlocked: false,
  completed: false,
  type: 'expert'
},
{
  id: 10,
  x: 50,
  y: 90,
  title: "Ancient Jungle Temple Quest",
  query: "UPDATE royal_treasure SET door = 'opened' WHERE treasure_type = 'GOLD';",
  riddle: "🌿 The final quest awaits! Use UPDATE to open the ancient temple door, then SELECT to claim the legendary jungle treasure!",
  schema: `CREATE TABLE royal_treasure (
  id INT,
  treasure_name VARCHAR,
  gold_amount INT,
  door VARCHAR,
  treasure_type VARCHAR
);`,
  unlocked: false,
  completed: false,
  type: 'legendary'
}


];
