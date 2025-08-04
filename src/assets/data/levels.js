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
    riddle: " Find all explorers whose courage level is greater than 80.",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT,
  artifact_found BOOLEAN
);`,
    unlocked: false,
    completed: false,
    type: "basic",
  },

  {
    id: 3,
    title: "Archery Castle Challenge",
    query:
      "SELECT * FROM artifacts WHERE found_by IS NOT NULL AND category IN ('weapons','raft');",
    riddle:
      " Use your crosshair to target the correct castle guardian. Only ONE castle contains artifacts with categories 'weapons' and 'raft'.",
    schema: `CREATE TABLE artifacts (
  id INT,
  name VARCHAR(255),
  found_by INT,
  category VARCHAR(255)
);`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 4,
    position: {
      desktop: { x: 70, y: 36 },
      mobile: { x: 85, y: 30 },
    },
    title: "Group the Spirits",
    query: "SELECT skill, COUNT(*) FROM jungle_explorers GROUP BY skill;",
    riddle:
      "Ancient spirits are lost within the temple. Awaken them from their statues and group them by their unique skill—Healer, Hunter, Magician, or Scout—to restore order.",
    schema:
      "CREATE TABLE jungle_explorers (\n  id INT,\n  name VARCHAR,\n  skill VARCHAR\n);",
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 5,
    position: {
      desktop: { x: 51, y: 37 },
      mobile: { x: 54, y: 29 },
    },
    title: "Free the Sacred Beast",
    query:
      "SELECT * FROM jungle_explorers ORDER BY courage_level DESC LIMIT 1;",
    riddle:
      "Free the monkey trapped in stone. Only the most courageous explorer can do it. Who is it?",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT
);`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 6,
    position: {
      desktop: { x: 33, y: 37 },
      mobile: { x: 23, y: 28 },
    },
    title: "Restore the Memory Crystal",
    query:
      "SELECT name, skill FROM jungle_explorers WHERE name LIKE '%a%' AND skill IN ('magic', 'healing');",
    riddle:
      "The shattered memory crystal needs specific souls to repair it. Find explorers whose names contain the letter 'a' and who possess either magic or healing skills.",
    schema: `CREATE TABLE jungle_explorers (
      id INT,
      name VARCHAR,
      skill VARCHAR
    );`,
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 7,
    position: {
      desktop: { x: 44, y: 28 },
      mobile: { x: 41, y: 24 },
    },
    title: "Arm the Heroes",
    query:
      "SELECT e.name, w.weapon_name FROM jungle_explorers e JOIN weapons w ON e.id = w.owner_id;",
    riddle:
      "The volcano erupts! Find which explorers have weapons to defend the evacuation route.",
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
    type: "advanced",
  },
  {
    id: 8,
    position: {
      desktop: { x: 58, y: 23 },
      mobile: { x: 65, y: 22 },
    },
    title: "SQL Speed Circuit - Average Courage Race",
    query: "SELECT AVG(courage_level) FROM jungle_explorers;",
    riddle:
      "Calculate the average courage level to determine your racing raft's optimal speed for the rescue from the river.",
    schema: `CREATE TABLE jungle_explorers (
  id INT,
  name VARCHAR,
  courage_level INT
);`,
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 9,
    position: {
      desktop: { x: 67, y: 20 },
      mobile: { x: 80, y: 20 },
    },
    title: "SQL Battle Arena - Mystic Duel",
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
    type: "expert",
  },
  {
    id: 10,
    position: {
      desktop: { x: 74, y: 14 },
      mobile: { x: 92, y: 16 },
    },
    title: "Ancient Jungle Temple Quest",
    query:
      "UPDATE royal_treasure SET door = 'opened' WHERE treasure_type = 'GOLD';",
    riddle:
      "🌿 The final quest awaits! Use UPDATE to open the ancient temple door, then SELECT to claim the legendary jungle treasure!",
    schema: `CREATE TABLE royal_treasure (
  id INT,
  treasure_name VARCHAR,
  gold_amount INT,
  door VARCHAR,
  treasure_type VARCHAR
);`,
    unlocked: false,
    completed: false,
    type: "legendary",
  },
];
