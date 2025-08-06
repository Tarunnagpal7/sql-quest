export const levels = [
  {
    id: 1,
    title: "Path to the Hidden Map",
    query: "SELECT * FROM map",
    riddle:
      "The jungle map is lost in data. Use the spell to reveal all hidden paths.",
    schema: `CREATE TABLE map ( id INT, location VARCHAR );`,
    unlocked: true,
    completed: false,
    type: "basic",
  },
  {
    id: 2,
    title: "🌿 Jungle River Adventure",
    query: "SELECT * FROM jungle_explorers WHERE courage_level > 80;",
    riddle:
      " Find all explorers whose courage level is greater than 80.",
      schema: `CREATE TABLE jungle_explorers (
      id INT,
      name VARCHAR,
      courage_level INT
      skill VARCHAR
    );`,
     
    unlocked: false,
    completed: false,
    type: "basic",
  },
  
  {
  id: 3,
  title: "Archery Castle Challenge",
  query: "SELECT * FROM artifacts WHERE found_by IS NOT NULL AND category IN ('weapons','raft');",
  riddle: " Use your crosshair to target the correct castle guardian. Only ONE castle contains artifacts with categories 'weapons' and 'raft'.",
  schema: `CREATE TABLE artifacts (
  id INT,
  name VARCHAR(255),
  found_by INT,
  category VARCHAR(255)
);`,
  unlocked: false,
  completed: false,
  type: "intermediate",
}
,
  {
    id: 4,
    title: "Build the Raft",
    query: "SELECT instructions FROM guide_book WHERE category = 'raft' and instructions LIKE '%bamboo%' OR instructions LIKE '%vines%';",
    riddle:
      "You are at port of rover ,kill eneimes by weapon you collected and build the raft .",
    schema: `Create Table guide_book (
  id INT,
  category TEXT,
  instructions TEXT,
  author TEXT,
  page_number INT
)`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 5,
    title: "Free the Sacred Beast",
    query:"SELECT name, power, durability FROM weapons WHERE agility >= 80 AND power > 70 AND weight < 10;",
    riddle:
      "Free the monkey trapped in stone. Only the most courageous explorer can do it. Who is it?",
    schema: `CREATE TABLE weapons (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  power INT,
  durability INT,
  agility INT,    
  weight INT       
);`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 6,
    title: "The Trap Tiles of Truth",
    query:
      `SELECT animal, COUNT(*) as frequency 
FROM floor_tiles 
GROUP BY animal 
HAVING COUNT(*) > 1;`,
    riddle:"The floor tells lies, but truth repeats.Step only where the animal speaks twice.The rest are traps waiting for fools.",
    schema: `CREATE TABLE floor_tiles (
  id INT,
  tile_x INT,
  tile_y INT,
  animal VARCHAR(100)
);`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 7,
    title: "Arm the Heroes",
    query:
      "SELECT  jungle_explorers.name AS explorer_name, jungle_explorers.skill, spells.name AS spell_name, spells.element FROM jungle_explorers JOIN spells ON jungle_explorers.id = spells.id;;",
    riddle:
      "The volcano erupts! Find which explorers have weapons to defend the evacuation route.",
    schema: `CREATE TABLE jungle_explorers (
      id INT,
      name VARCHAR,
      courage_level INT
      skill VARCHAR
    );
CREATE TABLE spells (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  power INT,
 Element VARCHAR    
);`,
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 8,
    title: "Jungle River Raft Race ",
    query: "SELECT AVG(courage_level) FROM jungle_explorers;",
    riddle:
      "Calculate the average courage level to determine your racing raft's optimal speed for the rescue from the river.",
    schema: `CREATE TABLE jungle_explorers (
      id INT,
      name VARCHAR,
      courage_level INT
      skill VARCHAR
    );`,
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 10,
    title: "FINAL - SQL Battle Arena ",
    query:
      "SELECT damage FROM spells WHERE element = 'fire' ORDER BY power DESC LIMIT 1;",
    riddle:
      "Enter the mystical battle arena! Cast SQL spells to defeat your magical opponent in epic wizard combat.",
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
    type: "legendary",
  },
  {
    id: 9,
    title: "Ancient Jungle Temple Quest",
    query:
      "UPDATE royal_treasure SET door = 'opened' WHERE treasure_type = 'GOLD';",
    riddle:
      "🌿 The final quest awaits! Use UPDATE to open the ancient temple door, to reach the final level.",
    schema: `CREATE TABLE royal_treasure (
  id INT,
  treasure_name VARCHAR,
  gold_amount INT,
  door VARCHAR,
  treasure_type VARCHAR
);`,
    unlocked: false,
    completed: false,
    type: "expert",
  },
];

