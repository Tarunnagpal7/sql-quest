import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiMagicSwirl, GiSwordman, GiShield, GiFire } from "react-icons/gi";
import { FaPlay, FaBolt, FaShieldAlt } from "react-icons/fa";

const Level10 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const [uiState, setUiState] = useState({
    health: 100,
    maxHealth: 100,
    opponentHealth: 100,
    opponentMaxHealth: 100,
    mana: 100,
    maxMana: 100,
    battleStarted: false,
    battleFinished: false,
    battlePaused: false,
    currentTurn: 'player',
    showSpellInput: false,
    spellType: null,
    battleTime: 0,
    spellsUsed: 0,
    damage: 0,
    shield: 0,
    summonedCreature: null,
    gamePhase: 'waiting'
  });

  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');
  const [querySuccess, setQuerySuccess] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Battle spell definitions with keywords - FIXED with proper mana costs
  const spellTypes = {
    attack: {
      correct: [
        "SELECT damage FROM spells WHERE element = 'fire' ORDER BY power DESC LIMIT 1;",
        "select damage from spells where element = 'fire' order by power desc limit 1;",
        "SELECT damage FROM spells WHERE element = 'fire' ORDER BY power DESC LIMIT 1",
        "select damage from spells where element = 'fire' order by power desc limit 1"
      ],
      description: "Cast the most powerful FIRE spell to damage your opponent",
      effect: "Deals 30-50 damage based on query accuracy",
      manaCost: 25, // FIXED: Added missing mana cost
      icon: "🔥",
      hint: "Use SELECT damage FROM spells table WHERE element = 'fire'",
      tableHint: "Tables: spells (id, name, element, power, damage, mana_cost)",
      example: "Find the highest damage fire spell",
      keywords: "SELECT, damage, FROM, spells, WHERE, element, ORDER BY, power, DESC, LIMIT"
    },
    defense: {
      correct: [
        "SELECT shield_strength FROM defenses WHERE type IN ('magic', 'physical');",
        "select shield_strength from defenses where type in ('magic', 'physical');",
        "SELECT shield_strength FROM defenses WHERE type IN ('magic','physical');",
        "select shield_strength from defenses where type in ('magic','physical')"
      ],
      description: "Create magical shields to protect against attacks",
      effect: "Absorbs 40-60 damage from next attack",
      manaCost: 20, // FIXED: Added missing mana cost
      icon: "🛡️",
      hint: "Use SELECT shield_strength FROM defenses table WHERE type IN (...)",
      tableHint: "Tables: defenses (id, shield_strength, type)",
      example: "Get shields that protect against magic AND physical attacks",
      keywords: "SELECT, shield_strength, FROM, defenses, WHERE, type, IN"
    },
    summon: {
      correct: [
        "SELECT * FROM creatures c JOIN abilities a ON c.id = a.creature_id WHERE c.rarity = 'legendary';",
        "select * from creatures c join abilities a on c.id = a.creature_id where c.rarity = 'legendary';",
        "SELECT * FROM creatures c JOIN abilities a ON c.id = a.creature_id WHERE c.rarity = 'legendary'",
        "select * from creatures c join abilities a on c.id = a.creature_id where c.rarity = 'legendary'"
      ],
      description: "Summon a LEGENDARY creature to fight alongside you",
      effect: "Summons ally that deals 15 damage per turn",
      manaCost: 40, // FIXED: Added missing mana cost
      icon: "🐉",
      hint: "Use JOIN to connect creatures with abilities WHERE rarity = 'legendary'",
      tableHint: "Tables: creatures (id, name, rarity, health, attack), abilities (id, creature_id, ability_name, damage)",
      example: "Join creatures table with abilities table to find legendary creatures",
      keywords: "SELECT, FROM, creatures, JOIN, abilities, ON, WHERE, rarity"
    },
    heal: {
      correct: [
        "SELECT healing_power FROM potions WHERE type = 'health' AND rarity >= 'rare';",
        "select healing_power from potions where type = 'health' and rarity >= 'rare';",
        "SELECT healing_power FROM potions WHERE type = 'health' AND rarity >= 'rare'",
        "select healing_power from potions where type = 'health' and rarity >= 'rare'"
      ],
      description: "Use rare healing potions to restore your health",
      effect: "Restores 30-45 health points",
      manaCost: 15, // FIXED: Added missing mana cost
      icon: "💚",
      hint: "Use SELECT healing_power FROM potions WHERE type = 'health' AND rarity >= 'rare'",
      tableHint: "Tables: potions (id, healing_power, type, rarity)",
      example: "Find health potions with rarity of 'rare' or better",
      keywords: "SELECT, healing_power, FROM, potions, WHERE, type, AND, rarity"
    }
  };

  const handleSpellCast = () => {
    if (!uiState.spellType) return;
    
    // More flexible normalization function
    const normalizeQuery = (query) => {
      return query
        .trim()                           // Remove leading/trailing spaces
        .toLowerCase()                    // Convert to lowercase
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .replace(/\s*=\s*/g, '=')        // Remove spaces around = signs
        .replace(/\s*;\s*$/g, '')        // Remove semicolon and spaces at end
        .replace(/\s*,\s*/g, ',')        // Remove spaces around commas
        .replace(/\s*\(\s*/g, '(')       // Remove spaces around opening parentheses
        .replace(/\s*\)\s*/g, ')')       // Remove spaces around closing parentheses
        .replace(/\s*'\s*/g, "'")        // Remove spaces around single quotes (but keep quotes)
        .replace(/'\s+/g, "'")           // Remove spaces after opening quotes
        .replace(/\s+'/g, "'")           // Remove spaces before closing quotes
        .replace(/\s*>=\s*/g, '>=')      // Remove spaces around >= operator
        .replace(/\s*<=\s*/g, '<=')      // Remove spaces around <= operator
        .replace(/\s*<>\s*/g, '<>')      // Remove spaces around <> operator
        .replace(/\s*!=\s*/g, '!=')      // Remove spaces around != operator
        .replace(/\s+on\s+/g, ' on ')    // Normalize ON keyword spacing
        .replace(/\s+in\s+/g, ' in ')    // Normalize IN keyword spacing
        .replace(/\s+and\s+/g, ' and ')  // Normalize AND keyword spacing
        .replace(/\s+or\s+/g, ' or ')    // Normalize OR keyword spacing
        .replace(/\s+where\s+/g, ' where ') // Normalize WHERE keyword spacing
        .replace(/\s+order\s+by\s+/g, ' order by ') // Normalize ORDER BY
        .replace(/\s+group\s+by\s+/g, ' group by ') // Normalize GROUP BY
        .replace(/\s+limit\s+/g, ' limit ') // Normalize LIMIT keyword
        .replace(/\s+desc\s*/g, ' desc')    // Normalize DESC keyword
        .replace(/\s+asc\s*/g, ' asc')      // Normalize ASC keyword
        .replace(/\s+join\s+/g, ' join ')   // Normalize JOIN keyword
        .replace(/\s+from\s+/g, ' from ')   // Normalize FROM keyword
        .replace(/\s+select\s+/g, 'select '); // Normalize SELECT keyword
    };

    const normalizedUserQuery = normalizeQuery(sqlQuery);
    const currentSpell = spellTypes[uiState.spellType];
    
    // Normalize all correct queries for comparison
    const normalizedCorrectQueries = currentSpell.correct.map(query => normalizeQuery(query));
    
    const isCorrect = normalizedCorrectQueries.some(correctQuery => 
      normalizedUserQuery === correctQuery
    );

    if (isCorrect) {
      setQuerySuccess(true);
      setQueryError('');
      setUiState(prev => ({ ...prev, showSpellInput: false }));
      setSqlQuery(''); // Clear the query
      
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].executeSpell(uiState.spellType);
      }
    } else {
      setQueryError(`Spell failed! ${currentSpell.description}`);
      setTimeout(() => setQueryError(''), 3000);
    }
  };

  const startBattle = () => {
    setUiState(prev => ({ ...prev, battleStarted: true, gamePhase: 'battle' }));
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].startBattle();
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, opponent, spellEffects, battleUI, arena;
    let cursors, oneKey, twoKey, threeKey, fourKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      opponentHealth: 100,
      opponentMaxHealth: 100,
      mana: 100,
      maxMana: 100,
      battleStarted: false,
      battleFinished: false,
      battlePaused: false,
      currentTurn: 'player',
      battleTime: 0,
      spellsUsed: 0,
      playerDamage: 0,
      playerShield: 0,
      opponentShield: 0,
      summonedCreature: null,
      opponentCreature: null,
      turnTimer: 15,
      currentTurnTime: 15,
      autoTurnTimer: null,
      battleData: {
        spells: [
          { id: 1, name: 'Fireball', element: 'fire', power: 50, damage: 45 },
          { id: 2, name: 'Lightning', element: 'lightning', power: 45, damage: 40 },
          { id: 3, name: 'Ice Shard', element: 'ice', power: 35, damage: 30 },
          { id: 4, name: 'Meteor', element: 'fire', power: 60, damage: 50 }
        ],
        creatures: [
          { id: 1, name: 'Fire Dragon', rarity: 'legendary', health: 80, attack: 15 },
          { id: 2, name: 'Ice Phoenix', rarity: 'legendary', health: 70, attack: 18 },
          { id: 3, name: 'Lightning Wolf', rarity: 'rare', health: 50, attack: 12 }
        ],
        abilities: [
          { id: 1, creature_id: 1, ability_name: 'Flame Breath', damage: 15 },
          { id: 2, creature_id: 2, ability_name: 'Frost Storm', damage: 18 },
          { id: 3, creature_id: 3, ability_name: 'Thunder Strike', damage: 12 }
        ],
        defenses: [
          { id: 1, shield_strength: 40, type: 'magic' },
          { id: 2, shield_strength: 50, type: 'physical' },
          { id: 3, shield_strength: 60, type: 'magic' }
        ],
        potions: [
          { id: 1, healing_power: 30, type: 'health', rarity: 'rare' },
          { id: 2, healing_power: 45, type: 'health', rarity: 'epic' },
          { id: 3, healing_power: 25, type: 'health', rarity: 'common' }
        ]
      }
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      sceneRef.gameState = gameState;
      
      // Create Battle Arena
      const arenaGraphics = this.add.graphics();
      
      arenaGraphics.fillStyle(0x2a0845, 1);
      arenaGraphics.fillRect(0, 0, 800, 500);
      
      arenaGraphics.lineStyle(3, 0x9c27b0, 0.8);
      arenaGraphics.strokeCircle(200, 400, 80);
      arenaGraphics.strokeCircle(600, 100, 80);
      
      arenaGraphics.fillStyle(0x512da8, 0.5);
      arenaGraphics.fillRect(0, 0, 800, 50);
      arenaGraphics.fillRect(0, 450, 800, 50);
      arenaGraphics.fillRect(0, 0, 50, 500);
      arenaGraphics.fillRect(750, 0, 50, 500);
      
      arenaGraphics.generateTexture('battle_arena', 800, 500);
      arenaGraphics.destroy();
      
      // Create Player Wizard
      const playerGraphics = this.add.graphics();
      
      playerGraphics.fillStyle(0x1976d2, 1);
      playerGraphics.fillCircle(25, 35, 20);
      playerGraphics.fillRect(8, 20, 34, 30);
      
      playerGraphics.fillStyle(0x0d47a1, 1);
      playerGraphics.fillTriangle(25, 5, 15, 25, 35, 25);
      
      playerGraphics.fillStyle(0xfdbcb4, 1);
      playerGraphics.fillCircle(25, 25, 10);
      
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(22, 23, 2);
      playerGraphics.fillCircle(28, 23, 2);
      
      playerGraphics.lineStyle(4, 0x8d6e63);
      playerGraphics.beginPath();
      playerGraphics.moveTo(40, 50);
      playerGraphics.lineTo(45, 15);
      playerGraphics.strokePath();
      
      playerGraphics.fillStyle(0x03a9f4, 0.8);
      playerGraphics.fillCircle(45, 12, 6);
      
      playerGraphics.generateTexture('player_wizard', 55, 60);
      playerGraphics.destroy();
      
      // Create Opponent Wizard
      const opponentGraphics = this.add.graphics();
      
      opponentGraphics.fillStyle(0xd32f2f, 1);
      opponentGraphics.fillCircle(25, 35, 20);
      opponentGraphics.fillRect(8, 20, 34, 30);
      
      opponentGraphics.fillStyle(0xb71c1c, 1);
      opponentGraphics.fillTriangle(25, 5, 15, 25, 35, 25);
      
      opponentGraphics.fillStyle(0xff1744, 1);
      opponentGraphics.fillCircle(22, 23, 3);
      opponentGraphics.fillCircle(28, 23, 3);
      
      opponentGraphics.lineStyle(4, 0x424242);
      opponentGraphics.beginPath();
      opponentGraphics.moveTo(10, 50);
      opponentGraphics.lineTo(5, 15);
      opponentGraphics.strokePath();
      
      opponentGraphics.fillStyle(0xe91e63, 0.8);
      opponentGraphics.fillCircle(5, 12, 6);
      
      opponentGraphics.generateTexture('opponent_wizard', 55, 60);
      opponentGraphics.destroy();
      
      // Create Spell Effects
      const spellEffectsTypes = ['fireball', 'shield', 'dragon', 'heal'];
      const spellColors = [0xff5722, 0x2196f3, 0x4caf50, 0x8bc34a];
      
      spellEffectsTypes.forEach((type, index) => {
        const effectGraphics = this.add.graphics();
        const color = spellColors[index];
        
        if (type === 'fireball') {
          effectGraphics.fillStyle(color, 0.9);
          effectGraphics.fillCircle(30, 30, 25);
          effectGraphics.fillStyle(0xffa726, 0.7);
          effectGraphics.fillCircle(30, 30, 18);
          effectGraphics.fillStyle(0xffeb3b, 0.5);
          effectGraphics.fillCircle(30, 30, 12);
        } else if (type === 'shield') {
          effectGraphics.fillStyle(color, 0.6);
          effectGraphics.fillCircle(30, 30, 35);
          effectGraphics.lineStyle(4, 0x00bcd4, 0.8);
          effectGraphics.strokeCircle(30, 30, 30);
          effectGraphics.strokeCircle(30, 30, 25);
        } else if (type === 'dragon') {
          effectGraphics.fillStyle(color, 0.8);
          effectGraphics.fillEllipse(30, 35, 40, 25);
          effectGraphics.fillCircle(40, 25, 12);
          effectGraphics.fillTriangle(45, 20, 50, 15, 50, 25);
        } else if (type === 'heal') {
          effectGraphics.fillStyle(color, 0.7);
          effectGraphics.fillCircle(30, 30, 30);
          effectGraphics.fillStyle(0x4caf50, 1);
          effectGraphics.fillRect(25, 20, 10, 3);
          effectGraphics.fillRect(28, 17, 4, 9);
        }
        
        effectGraphics.generateTexture(`spell_${type}`, 60, 60);
        effectGraphics.destroy();
      });
      
      // Create UI Elements
      const uiGraphics = this.add.graphics();
      
      uiGraphics.fillStyle(0x424242, 1);
      uiGraphics.fillRect(0, 0, 200, 20);
      
      uiGraphics.fillStyle(0x1a237e, 1);
      uiGraphics.fillRect(0, 25, 200, 15);
      
      uiGraphics.generateTexture('ui_bars', 200, 45);
      uiGraphics.destroy();
    }

    function create() {
      this.add.image(400, 250, 'battle_arena');
      
      createMysticalAtmosphere.call(this);
      
      spellEffects = this.physics.add.group();
      
      player = this.physics.add.sprite(200, 400, 'player_wizard');
      player.setCollideWorldBounds(true);
      player.setScale(1.2);
      
      opponent = this.physics.add.sprite(600, 100, 'opponent_wizard');
      opponent.setCollideWorldBounds(true);
      opponent.setScale(1.2);
      
      cursors = this.input.keyboard.createCursorKeys();
      oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
      
      this.startBattle = startBattle;
      this.executeSpell = executeSpell;
      this.showSpellInput = showSpellInput;
      
      createBattleArena.call(this);
      updateReactUI();
    }

    function createBattleArena() {
      gameState.battleStarted = false;
      gameState.battleFinished = false;
      gameState.battlePaused = false;
      gameState.health = 100;
      gameState.opponentHealth = 100;
      gameState.mana = 100;
      gameState.currentTurn = 'player';
      gameState.battleTime = 0;
      gameState.spellsUsed = 0;
      gameState.playerShield = 0;
      gameState.opponentShield = 0;
      gameState.summonedCreature = null;
      gameState.currentTurnTime = 15;
      
      if (gameState.autoTurnTimer) {
        sceneRef.time.removeEvent(gameState.autoTurnTimer);
        gameState.autoTurnTimer = null;
      }
      
      createBattleUI.call(this);
      
      showMessage('⚔️ Welcome to the SQL Battle Arena! Click START BATTLE to begin!', 4000);
      
      player.setPosition(200, 400);
      opponent.setPosition(600, 100);
    }
    
    function createMysticalAtmosphere() {
      for (let i = 0; i < 25; i++) {
        const particle = sceneRef.add.circle(
          Math.random() * 800,
          Math.random() * 500,
          2 + Math.random() * 3,
          [0x9c27b0, 0x673ab7, 0x3f51b5, 0x2196f3][Math.floor(Math.random() * 4)],
          0.7
        );
        
        sceneRef.tweens.add({
          targets: particle,
          y: particle.y - 50,
          x: particle.x + (Math.random() - 0.5) * 100,
          alpha: 0,
          duration: 4000 + Math.random() * 2000,
          repeat: -1,
          delay: Math.random() * 3000
        });
      }
      
      const aura1 = sceneRef.add.circle(200, 400, 100, 0x2196f3, 0.1);
      const aura2 = sceneRef.add.circle(600, 100, 100, 0xf44336, 0.1);
      
      sceneRef.tweens.add({
        targets: [aura1, aura2],
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.3,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    }
    
    function createBattleUI() {
      const playerHealthBg = sceneRef.add.image(120, 450, 'ui_bars');
      playerHealthBg.setScale(1, 0.4);
      sceneRef.playerHealthBg = playerHealthBg;
      
      const playerHealthBar = sceneRef.add.rectangle(120, 445, 200, 15, 0x4caf50);
      sceneRef.playerHealthBar = playerHealthBar;
      
      const playerHealthText = sceneRef.add.text(20, 440, 'Health: 100/100', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      sceneRef.playerHealthText = playerHealthText;
      
      const playerManaBar = sceneRef.add.rectangle(120, 465, 200, 10, 0x2196f3);
      sceneRef.playerManaBar = playerManaBar;
      
      const playerManaText = sceneRef.add.text(20, 468, 'Mana: 100/100', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#87ceeb'
      });
      sceneRef.playerManaText = playerManaText;
      
      const opponentHealthBg = sceneRef.add.image(680, 50, 'ui_bars');
      opponentHealthBg.setScale(1, 0.4);
      sceneRef.opponentHealthBg = opponentHealthBg;
      
      const opponentHealthBar = sceneRef.add.rectangle(680, 45, 200, 15, 0xf44336);
      sceneRef.opponentHealthBar = opponentHealthBar;
      
      const opponentHealthText = sceneRef.add.text(580, 40, 'Opponent: 100/100', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      sceneRef.opponentHealthText = opponentHealthText;
      
      const turnIndicator = sceneRef.add.text(400, 30, '', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 12, y: 6 },
        fontStyle: 'bold'
      }).setOrigin(0.5);
      sceneRef.turnIndicator = turnIndicator;
      
      const spellInstructions = sceneRef.add.text(20, 20, '', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      sceneRef.spellInstructions = spellInstructions;
      
      updateBattleUI();
    }
    
    function updateBattleUI() {
      if (sceneRef.playerHealthBar) {
        const healthPercent = gameState.health / gameState.maxHealth;
        sceneRef.playerHealthBar.setSize(200 * healthPercent, 15);
        sceneRef.playerHealthBar.x = 20 + (200 * healthPercent) / 2;
      }
      
      if (sceneRef.playerHealthText) {
        sceneRef.playerHealthText.setText(`Health: ${gameState.health}/${gameState.maxHealth}${gameState.playerShield > 0 ? ` (🛡️${gameState.playerShield})` : ''}`);
      }
      
      if (sceneRef.playerManaBar) {
        const manaPercent = gameState.mana / gameState.maxMana;
        sceneRef.playerManaBar.setSize(200 * manaPercent, 10);
        sceneRef.playerManaBar.x = 20 + (200 * manaPercent) / 2;
      }
      
      if (sceneRef.playerManaText) {
        sceneRef.playerManaText.setText(`Mana: ${gameState.mana}/${gameState.maxMana}`);
      }
      
      if (sceneRef.opponentHealthBar) {
        const opponentHealthPercent = gameState.opponentHealth / gameState.opponentMaxHealth;
        sceneRef.opponentHealthBar.setSize(200 * opponentHealthPercent, 15);
        sceneRef.opponentHealthBar.x = 580 + (200 * opponentHealthPercent) / 2;
      }
      
      if (sceneRef.opponentHealthText) {
        sceneRef.opponentHealthText.setText(`Opponent: ${gameState.opponentHealth}/${gameState.opponentMaxHealth}${gameState.opponentShield > 0 ? ` (🛡️${gameState.opponentShield})` : ''}`);
      }
      
      if (sceneRef.turnIndicator) {
        const turnText = gameState.currentTurn === 'player' ? 
          `🧙 YOUR TURN (${gameState.currentTurnTime}s)` : 
          `🔴 OPPONENT TURN (${gameState.currentTurnTime}s)`;
        sceneRef.turnIndicator.setText(turnText);
        sceneRef.turnIndicator.setColor(gameState.currentTurn === 'player' ? '#00ff00' : '#ff6666');
      }
      
      if (sceneRef.spellInstructions) {
        let instructions = 'Spells: ';
        if (gameState.currentTurn === 'player' && gameState.battleStarted && !gameState.battleFinished) {
          instructions += '1️⃣ Attack (🔥25 mana) | 2️⃣ Defense (🛡️20 mana) | 3️⃣ Summon (🐉40 mana) | 4️⃣ Heal (💚15 mana)';
        } else {
          instructions += 'Wait for your turn...';
        }
        sceneRef.spellInstructions.setText(instructions);
      }
    }
    
    function startBattle() {
      if (gameState.battleStarted) return;
      
      gameState.battleStarted = true;
      gameState.battlePaused = false;
      gameState.currentTurn = 'player';
      gameState.currentTurnTime = gameState.turnTimer;
      
      sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
          if (gameState.battleStarted && !gameState.battleFinished) {
            gameState.battleTime++;
            gameState.currentTurnTime--;
            
            if (gameState.currentTurnTime <= 0) {
              if (gameState.currentTurn === 'player') {
                opponentTurn();
              } else {
                gameState.currentTurn = 'player';
                gameState.currentTurnTime = gameState.turnTimer;
                // FIXED: Add mana regeneration
                gameState.mana = Math.min(gameState.maxMana, gameState.mana + 10);
              }
            }
            
            updateBattleUI();
            updateReactUI();
          }
        },
        callbackScope: sceneRef,
        loop: true
      });

      showMessage('⚔️ BATTLE STARTED! Cast your spells using number keys!', 3000);
      updateReactUI();
    }

    function update() {
      if (!gameState.battleStarted || gameState.battleFinished) return;
      
      if (gameState.currentTurn === 'player' && !gameState.battlePaused) {
        if (Phaser.Input.Keyboard.JustDown(oneKey) && gameState.mana >= 25) {
          showSpellInput('attack');
        }
        if (Phaser.Input.Keyboard.JustDown(twoKey) && gameState.mana >= 20) {
          showSpellInput('defense');
        }
        if (Phaser.Input.Keyboard.JustDown(threeKey) && gameState.mana >= 40) {
          showSpellInput('summon');
        }
        if (Phaser.Input.Keyboard.JustDown(fourKey) && gameState.mana >= 15) {
          showSpellInput('heal');
        }
      }
      
      updateCreatureAttacks();
      updateBattleUI();
    }
    
    function updateCreatureAttacks() {
      if (gameState.summonedCreature && gameState.currentTurn === 'opponent') {
        const damage = 15;
        const actualDamage = Math.max(0, damage - gameState.opponentShield);
        gameState.opponentHealth = Math.max(0, gameState.opponentHealth - actualDamage);
        gameState.opponentShield = Math.max(0, gameState.opponentShield - damage);
        
        if (actualDamage > 0) {
          createSpellEffect(600, 100, 'fireball');
          showFloatingText(600, 100, `-${actualDamage}`, '#ff6666');
        }
      }
      
      if (gameState.opponentHealth <= 0) {
        endBattle('victory');
      } else if (gameState.health <= 0) {
        endBattle('defeat');
      }
    }
    
    function showSpellInput(type) {
      gameState.battlePaused = true;
      setUiState(prev => ({ 
        ...prev, 
        showSpellInput: true, 
        spellType: type,
        gamePhase: 'casting'
      }));
    }
    
    function executeSpell(type) {
      gameState.battlePaused = false;
      const spell = spellTypes[type];
      
      // FIXED: Properly deduct mana using the spell's mana cost
      gameState.mana = Math.max(0, gameState.mana - spell.manaCost);
      gameState.spellsUsed++;
      
      if (type === 'attack') {
        const damage = 30 + Math.floor(Math.random() * 21);
        const actualDamage = Math.max(0, damage - gameState.opponentShield);
        gameState.opponentHealth = Math.max(0, gameState.opponentHealth - actualDamage);
        gameState.opponentShield = Math.max(0, gameState.opponentShield - damage);
        
        createSpellEffect(600, 100, 'fireball');
        showFloatingText(600, 100, `-${actualDamage}`, '#ff6666');
        showMessage(`🔥 Fireball deals ${actualDamage} damage!`, 2000);
        
      } else if (type === 'defense') {
        const shieldStrength = 40 + Math.floor(Math.random() * 21);
        gameState.playerShield += shieldStrength;
        
        createSpellEffect(200, 400, 'shield');
        showFloatingText(200, 400, `+${shieldStrength} 🛡️`, '#00ff00');
        showMessage(`🛡️ Shield absorbs ${shieldStrength} damage!`, 2000);
        
      } else if (type === 'summon') {
        gameState.summonedCreature = { name: 'Fire Dragon', attack: 15 };
        
        createSpellEffect(300, 300, 'dragon');
        showFloatingText(300, 300, '🐉 Dragon Summoned!', '#4caf50');
        showMessage('🐉 Fire Dragon summoned! Deals 15 damage per turn!', 2000);
        
      } else if (type === 'heal') {
        const healing = 30 + Math.floor(Math.random() * 16);
        gameState.health = Math.min(gameState.maxHealth, gameState.health + healing);
        
        createSpellEffect(200, 400, 'heal');
        showFloatingText(200, 400, `+${healing} ❤️`, '#4caf50');
        showMessage(`💚 Restored ${healing} health!`, 2000);
      }
      
      gameState.currentTurn = 'opponent';
      gameState.currentTurnTime = gameState.turnTimer;
      
      sceneRef.time.delayedCall(2000, () => {
        opponentTurn();
      });
      
      updateReactUI();
    }
    
    // FIXED: Improved opponent AI logic with better healing strategy
    function opponentTurn() {
      if (gameState.battleFinished) return;
      
      // IMPROVED: Smarter opponent AI
      let chosenSpell = 'attack'; // default
      
      // If opponent health is low (below 40%), prioritize healing
      if (gameState.opponentHealth < 40) {
        chosenSpell = 'heal';
      }
      // If opponent has no shield and player has summoned creature, get shield
      else if (gameState.opponentShield <= 0 && gameState.summonedCreature) {
        chosenSpell = 'defense';
      }
      // If player has high shield, try to outlast with healing
      else if (gameState.playerShield > 50) {
        chosenSpell = Math.random() < 0.6 ? 'heal' : 'attack';
      }
      // Random selection with bias towards attack and heal
      else {
        const spellOptions = ['attack', 'attack', 'heal', 'defense']; // Weighted towards attack and heal
        chosenSpell = spellOptions[Math.floor(Math.random() * spellOptions.length)];
      }
      
      if (chosenSpell === 'attack') {
        const damage = 25 + Math.floor(Math.random() * 16);
        const actualDamage = Math.max(0, damage - gameState.playerShield);
        gameState.health = Math.max(0, gameState.health - actualDamage);
        gameState.playerShield = Math.max(0, gameState.playerShield - damage);
        
        createSpellEffect(200, 400, 'fireball');
        showFloatingText(200, 400, `-${actualDamage}`, '#ff6666');
        showMessage(`🔴 Opponent attacks for ${actualDamage} damage!`, 2000);
        
      } else if (chosenSpell === 'defense') {
        const shield = 30 + Math.floor(Math.random() * 21);
        gameState.opponentShield += shield;
        
        createSpellEffect(600, 100, 'shield');
        showFloatingText(600, 100, `+${shield} 🛡️`, '#00ff00');
        showMessage(`🔴 Opponent casts shield (${shield})!`, 2000);
        
      } else if (chosenSpell === 'heal') {
        const healing = 20 + Math.floor(Math.random() * 16);
        gameState.opponentHealth = Math.min(gameState.opponentMaxHealth, gameState.opponentHealth + healing);
        
        createSpellEffect(600, 100, 'heal');
        showFloatingText(600, 100, `+${healing} ❤️`, '#4caf50');
        showMessage(`🔴 Opponent heals ${healing} health!`, 2000);
      }
      
      sceneRef.time.delayedCall(2500, () => {
        if (!gameState.battleFinished) {
          gameState.currentTurn = 'player';
          gameState.currentTurnTime = gameState.turnTimer;
          
          // FIXED: Add mana regeneration for player
          gameState.mana = Math.min(gameState.maxMana, gameState.mana + 10);
          updateReactUI(); // Update UI after mana regeneration
        }
      });
    }
    
    function createSpellEffect(x, y, type) {
      const effect = spellEffects.create(x, y, `spell_${type}`);
      effect.setScale(0.5);
      
      sceneRef.tweens.add({
        targets: effect,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 1000,
        onComplete: () => effect.destroy()
      });
    }
    
    function showFloatingText(x, y, text, color) {
      const floatingText = sceneRef.add.text(x, y, text, {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: color,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      sceneRef.tweens.add({
        targets: floatingText,
        y: y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => floatingText.destroy()
      });
    }
    
    function endBattle(result) {
      gameState.battleFinished = true;
      
      if (gameState.autoTurnTimer) {
        sceneRef.time.removeEvent(gameState.autoTurnTimer);
      }
      
      sceneRef.time.delayedCall(2000, () => {
        showBattleResults(result);
      });
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 250, text, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    function showBattleResults(result) {
      gameState.isLevelComplete = result === 'victory';
      updateReactUI();
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const resultEmoji = result === 'victory' ? '🏆' : '💀';
      const resultText = result === 'victory' ? 'VICTORY!' : 'DEFEAT!';
      const resultColor = result === 'victory' ? '#ffd700' : '#ff6666';
      
      const completionText = sceneRef.add.text(400, 80, `${resultEmoji} ${resultText} ${resultEmoji}`, {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: resultColor,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 150, 'Battle Statistics:', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(1001);
      
      const battleStats = sceneRef.add.text(400, 200, `⏱️ Battle Duration: ${Math.floor(gameState.battleTime / 60)}:${(gameState.battleTime % 60).toString().padStart(2, '0')}\n🧙 Spells Cast: ${gameState.spellsUsed}\n❤️ Health Remaining: ${gameState.health}/${gameState.maxHealth}\n🛡️ Shield: ${gameState.playerShield}\n🐉 Creatures: ${gameState.summonedCreature ? '1 Dragon' : 'None'}`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const sqlText = sceneRef.add.text(400, 300, 'SQL Spells Used in Battle:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#90ee90'
      }).setOrigin(0.5).setDepth(1001);
      
      const spellList = sceneRef.add.text(400, 340, '🔥 SELECT damage FROM spells WHERE element = \'fire\' ORDER BY power DESC LIMIT 1;\n🛡️ SELECT shield_strength FROM defenses WHERE type IN (\'magic\', \'physical\');\n🐉 SELECT * FROM creatures c JOIN abilities a ON c.id = a.creature_id WHERE c.rarity = \'legendary\';', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#87ceeb',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      if (result === 'victory') {
        const instructionText = sceneRef.add.text(400, 420, 'You mastered SQL Battle Magic! Click to return to map', {
          fontSize: '24px',
          fontFamily: 'Courier New',
          color: '#00ff00'
        }).setOrigin(0.5).setDepth(1001);
        
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
          onComplete();
        });
        
        sceneRef.tweens.add({
          targets: instructionText,
          alpha: 0.5,
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      } else {
        const restartText = sceneRef.add.text(400, 420, 'Click to try again and master your SQL spells!', {
          fontSize: '24px',
          fontFamily: 'Courier New',
          color: '#ff6666'
        }).setOrigin(0.5).setDepth(1001);
        
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
          overlay.destroy();
          completionText.destroy();
          statsText.destroy();
          battleStats.destroy();
          sqlText.destroy();
          spellList.destroy();
          restartText.destroy();
          
          createBattleArena.call(sceneRef);
          updateReactUI();
        });
        
        sceneRef.tweens.add({
          targets: restartText,
          alpha: 0.5,
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      }
    }

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: gameState.health,
        opponentHealth: gameState.opponentHealth,
        mana: gameState.mana,
        battleStarted: gameState.battleStarted,
        battleFinished: gameState.battleFinished,
        currentTurn: gameState.currentTurn,
        battleTime: gameState.battleTime,
        spellsUsed: gameState.spellsUsed,
        shield: gameState.playerShield,
        summonedCreature: gameState.summonedCreature,
        gamePhase: gameState.battleFinished ? 'finished' : gameState.battlePaused ? 'casting' : gameState.battleStarted ? 'battle' : 'waiting'
      }));
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }}},
      scene: { preload, create, update },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: gameContainerRef.current,
        expandParent: false,
        autoRound: true
      }
    };

    gameInstance.current = new Phaser.Game(config);

    return () => { gameInstance.current?.destroy(true); };
  }, [onComplete]);

  return (
    <div className="w-full flex flex-col items-center gap-2 sm:gap-4 text-white px-2 sm:px-4">
      {/* Battle HUD - Responsive layout */}
      <div className={`flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 mb-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
        <div className="flex items-center gap-1 sm:gap-2">
          <GiMagicSwirl size={isMobile ? 16 : 20} color="#2196f3" />
          <span className="whitespace-nowrap">Your Wizard</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <FaBolt size={isMobile ? 14 : 18} color="#ffff00" />
          <span className="whitespace-nowrap">Mana: {uiState.mana}/100</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <FaShieldAlt size={isMobile ? 14 : 18} color="#00ff00" />
          <span className="whitespace-nowrap">Shield: {uiState.shield}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <GiSwordman size={isMobile ? 16 : 20} color="#ff6666" />
          <span className="whitespace-nowrap">Turn: {uiState.currentTurn === 'player' ? 'YOU' : 'OPPONENT'}</span>
        </div>
      </div>

      {/* Game container - Responsive sizing */}
      <div className="w-full max-w-6xl">
        <div 
          ref={gameContainerRef} 
          className="w-full rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg mx-auto"
           style={{ maxWidth: '800px' }}
        />
      </div>
      
      {/* Battle controls - Responsive button layout */}
      <div className="w-full max-w-4xl flex justify-center gap-2 mb-2 sm:mb-4 px-2">
        {!uiState.battleStarted && (
          <button
            onClick={startBattle}
            className={`bg-purple-600 hover:bg-purple-500 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold ${isMobile ? 'text-base' : 'text-lg'} transition-colors flex items-center gap-2`}
          >
            <FaPlay size={isMobile ? 14 : 16} /> START BATTLE
          </button>
        )}
        
        {uiState.battleStarted && !uiState.battleFinished && uiState.currentTurn === 'player' && (
          <div className={`flex gap-1 sm:gap-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
            {uiState.mana >= 25 && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].showSpellInput('attack');
                  }
                }}
                className={`bg-red-600 hover:bg-red-500 text-white py-1 sm:py-2 px-2 sm:px-4 rounded font-bold ${isMobile ? 'text-xs' : 'text-sm'} transition-colors whitespace-nowrap`}
              >
                1️⃣ ATTACK 🔥
              </button>
            )}
            
            {uiState.mana >= 20 && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].showSpellInput('defense');
                  }
                }}
                className={`bg-blue-600 hover:bg-blue-500 text-white py-1 sm:py-2 px-2 sm:px-4 rounded font-bold ${isMobile ? 'text-xs' : 'text-sm'} transition-colors whitespace-nowrap`}
              >
                2️⃣ DEFENSE 🛡️
              </button>
            )}
            
            {uiState.mana >= 40 && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].showSpellInput('summon');
                  }
                }}
                className={`bg-green-600 hover:bg-green-500 text-white py-1 sm:py-2 px-2 sm:px-4 rounded font-bold ${isMobile ? 'text-xs' : 'text-sm'} transition-colors whitespace-nowrap`}
              >
                3️⃣ SUMMON 🐉
              </button>
            )}
            
            {uiState.mana >= 15 && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].showSpellInput('heal');
                  }
                }}
                className={`bg-yellow-600 hover:bg-yellow-500 text-white py-1 sm:py-2 px-2 sm:px-4 rounded font-bold ${isMobile ? 'text-xs' : 'text-sm'} transition-colors whitespace-nowrap`}
              >
                4️⃣ HEAL 💚
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Battle stats - Responsive grid */}
      <div className={`w-full max-w-4xl grid ${isMobile ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-4'} pixel-font text-xs sm:text-sm px-2`}>
        <div>Health: <span className="text-green-400">{uiState.health}/{uiState.maxHealth}</span></div>
        <div>Opponent: <span className="text-red-400">{uiState.opponentHealth}/{uiState.opponentMaxHealth}</span></div>
        <div>Battle Time: <span className="text-blue-400">{Math.floor(uiState.battleTime / 60)}:{(uiState.battleTime % 60).toString().padStart(2, '0')}</span></div>
        <div>Spells Cast: <span className="text-purple-400">{uiState.spellsUsed}</span></div>
      </div>

      {/* SQL Spell Modal - Responsive modal */}
      {uiState.showSpellInput && uiState.spellType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className={`bg-slate-800 p-3 sm:p-6 rounded-lg border border-slate-600 w-full mx-2 sm:mx-4 ${isMobile ? 'max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            <h3 className={`pixel-font ${isMobile ? 'text-lg' : 'text-xl'} text-purple-400 mb-3 sm:mb-4 text-center`}>
              ⚔️ CAST SPELL: {spellTypes[uiState.spellType].icon} {uiState.spellType.toUpperCase()} ⚔️
            </h3>
            
            <div className="text-center mb-3 sm:mb-4">
              <span className={`text-yellow-400 font-bold ${isMobile ? 'text-sm' : ''}`}>⏸️ BATTLE PAUSED FOR SPELLCASTING ⏸️</span>
            </div>
            
            <p className={`text-slate-300 mb-3 sm:mb-4 ${isMobile ? 'text-xs' : 'text-sm'} text-center`}>
              {spellTypes[uiState.spellType].description}
            </p>
            
            {/* Enhanced hint section with keywords - Responsive */}
            <div className={`bg-black p-2 sm:p-4 rounded border mb-3 sm:mb-4 space-y-1 sm:space-y-2`}>
              <p className={`text-green-400 ${isMobile ? 'text-xs' : 'text-xs'} font-mono`}>
                <strong>Effect:</strong> {spellTypes[uiState.spellType].effect}
              </p>
              <p className={`text-yellow-400 ${isMobile ? 'text-xs' : 'text-xs'} font-mono`}>
                <strong>Goal:</strong> {spellTypes[uiState.spellType].example}
              </p>
              <p className={`text-pink-400 ${isMobile ? 'text-xs' : 'text-xs'} font-mono`}>
                <strong>Expected Keywords:</strong> {spellTypes[uiState.spellType].keywords}
              </p>
            </div>
            
            {/* SQL Schema reference - Responsive */}
            <div className={`bg-slate-700 p-2 sm:p-3 rounded border mb-3 sm:mb-4 ${isMobile ? 'max-h-24' : 'max-h-32'} overflow-y-auto`}>
              <p className={`text-blue-400 ${isMobile ? 'text-xs' : 'text-xs'} font-mono mb-1 sm:mb-2`}><strong>Database Schema:</strong></p>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-mono text-slate-300`}>
                {uiState.spellType === 'attack' && (
                  <div>
                    <span className="text-red-400">spells:</span> id, name, <span className="text-yellow-300">element</span>, <span className="text-green-300">power</span>, <span className="text-orange-300">damage</span>, mana_cost
                    <br/>
                    <span className="text-gray-400">Key columns for fire attack: element='fire', power (for ordering), damage (result)</span>
                  </div>
                )}
                {uiState.spellType === 'defense' && (
                  <div>
                    <span className="text-blue-400">defenses:</span> id, <span className="text-green-300">shield_strength</span>, <span className="text-yellow-300">type</span>
                    <br/>
                    <span className="text-gray-400">Keywords: SELECT, FROM, WHERE, IN</span>
                  </div>
                )}
                {uiState.spellType === 'summon' && (
                  <div>
                    <span className="text-purple-400">creatures:</span> <span className="text-orange-300">id</span>, name, <span className="text-yellow-300">rarity</span>, health, attack<br/>
                    <span className="text-purple-400">abilities:</span> id, <span className="text-orange-300">creature_id</span>, ability_name, damage
                    <br/>
                    <span className="text-gray-400">Keywords: SELECT, FROM, JOIN, ON, WHERE, rarity='legendary'</span>
                  </div>
                )}
                {uiState.spellType === 'heal' && (
                  <div>
                    <span className="text-green-400">potions:</span> id, <span className="text-orange-300">healing_power</span>, <span className="text-yellow-300">type</span>, <span className="text-cyan-300">rarity</span>
                    <br/>
                    <span className="text-gray-400">Keywords: SELECT, FROM, WHERE, AND, type='health', rarity greater than equal to  'rare'</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Responsive textarea */}
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder={`Enter your SQL spell here...\nExample: ${spellTypes[uiState.spellType].hint}`}
              className={`w-full p-2 sm:p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}
              rows={isMobile ? 3 : 4}
              onKeyDown={(e) => e.stopPropagation()}
              style={{ outline: 'none' }}
            />
            
            {queryError && (
              <div className={`mt-2 p-2 bg-red-900/50 border border-red-600 rounded text-red-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {queryError}
              </div>
            )}
            
            {/* Responsive buttons */}
            <div className={`flex gap-2 mt-3 sm:mt-4 ${isMobile ? 'flex-col' : ''}`}>
              <button
                onClick={handleSpellCast}
                className={`flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded font-bold transition-colors ${isMobile ? 'text-sm' : ''}`}
              >
                ⚡ CAST SPELL
              </button>
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showSpellInput: false }));
                  setSqlQuery('');
                  setQueryError('');
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].gameState.battlePaused = false;
                  }
                }}
                className={`bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded font-bold transition-colors ${isMobile ? 'text-sm' : ''}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions - Responsive text */}
      <div className={`w-full max-w-4xl p-2 sm:p-4 bg-black/50 rounded-lg border border-slate-700 text-center ${isMobile ? 'text-xs' : ''}`}>
        <div className={`pixel-font text-slate-300 mb-1 sm:mb-2 ${isMobile ? 'text-sm' : ''}`}>⚔️ SQL Battle Arena - Mystical Wizard Combat:</div>
        <div className={`font-mono ${isMobile ? 'text-sm' : 'text-lg'}`}>
          {!uiState.battleStarted ? (
            <span className="text-purple-400 font-bold bg-purple-900/50 px-2 py-1 rounded">
              🧙 Click START BATTLE to enter the mystical arena!
            </span>
          ) : uiState.gamePhase === 'casting' ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              ⚡ Casting spell - Channel your SQL magic!
            </span>
          ) : uiState.currentTurn === 'player' ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              🧙 YOUR TURN - Cast spells using SQL queries!
            </span>
          ) : uiState.currentTurn === 'opponent' ? (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              🔴 OPPONENT TURN - Prepare your next spell!
            </span>
          ) : (
            <span className="text-blue-400 font-bold bg-blue-900/50 px-2 py-1 rounded">
              ⚔️ Epic SQL Battle in Progress!
            </span>
          )}
        </div>
        <div className={`text-slate-500 mt-1 sm:mt-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          Master SQL queries to cast powerful spells and defeat your magical opponent!
        </div>
      </div>

      <style >{`
        .pixel-font {
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0px rgba(0,0,0,0.8);
        }
        
        button {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }

        @media (max-width: 768px) {
          .pixel-font {
            text-shadow: 0.5px 0.5px 0px rgba(0,0,0,0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default Level10;
