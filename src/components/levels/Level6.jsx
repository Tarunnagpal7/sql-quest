import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiCrystalBall, GiTreasureMap, GiCampfire, GiCrystalCluster } from "react-icons/gi";
import { FaUsers } from "react-icons/fa";

const Level6 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  
  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    fragmentsCollected: 0,
    totalFragments: 7,
    crystalPower: 0,
    maxCrystalPower: 100,
    showQueryInput: false,
    memoryUnlocked: false,
    correctExplorers: 0,
    enemiesDefeated: 0,
    totalEnemies: 3
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');
  const [querySuccess, setQuerySuccess] = useState(false);

  // Mobile controls state
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    interact: false
  });

  // Expected correct queries
  const correctQueries = [
    "SELECT name, skill FROM jungle_explorers WHERE name LIKE '%a%' AND skill IN ('magic', 'healing');",
    "select name, skill from jungle_explorers where name like '%a%' and skill in ('magic', 'healing');",
    "SELECT name, skill FROM jungle_explorers WHERE name LIKE '%a%' AND skill IN ('magic', 'healing')",
    "select name, skill from jungle_explorers where name like '%a%' and skill in ('magic', 'healing')",
    "select name, skill from jungle_explorers where name = '%a%' and skill in ('magic' , 'healing')"
  ];

  const handleQuerySubmit = () => {
    const normalizedQuery = sqlQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = correctQueries.some(query => 
      normalizedQuery === query.toLowerCase().replace(/\s+/g, ' ')
    );

    if (isCorrect) {
      setQuerySuccess(true);
      setQueryError('');
      setUiState(prev => ({ ...prev, showQueryInput: false }));
      
      // Signal to game that query is complete
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeQuery();
      }
    } else {
      setQueryError('Query failed! Find explorers whose names contain "a" and have magic or healing skills.');
      setTimeout(() => setQueryError(''), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, crystalFragments, crystalAltar, enemies, walls, memorySpirits;
    let cursors, spaceKey, interactKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      canInteract: true,
      attackCooldown: 400,
      interactCooldown: 600,
      fragmentsCollected: 0,
      totalFragments: 7,
      crystalPower: 0,
      maxCrystalPower: 100,
      queryComplete: false,
      memoryUnlocked: false,
      correctExplorers: 0,
      enemiesDefeated: 0,
      totalEnemies: 3,
      explorerData: [
        // Names that CONTAIN 'a' - FRIENDLY (collectible fragments)
        { id: 1, name: 'Maya', skill: 'magic', collected: false, isMatch: true, hasA: true, hostile: false },
        { id: 2, name: 'Elena', skill: 'healing', collected: false, isMatch: true, hasA: true, hostile: false },
        { id: 3, name: 'Sara', skill: 'magic', collected: false, isMatch: true, hasA: true, hostile: false },
        { id: 4, name: 'Alex', skill: 'healing', collected: false, isMatch: true, hasA: true, hostile: false },
        { id: 5, name: 'Zara', skill: 'combat', collected: false, isMatch: false, hasA: true, hostile: false }, // Has 'a' but wrong skill
        
        // Names that DO NOT CONTAIN 'a' - HOSTILE ENEMIES (must fight)
        { id: 6, name: 'Tom', skill: 'combat', collected: false, isMatch: false, hasA: false, hostile: true, health: 60, maxHealth: 60 },
        { id: 7, name: 'Jin', skill: 'stealth', collected: false, isMatch: false, hasA: false, hostile: true, health: 50, maxHealth: 50 }
      ]
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      // --- Create Wizard Character ---
      const playerGraphics = this.add.graphics();
      
      // Wizard robe (main body)
      playerGraphics.fillStyle(0x1e3a8a, 1);
      playerGraphics.fillCircle(20, 30, 16);
      playerGraphics.fillRect(4, 18, 32, 24);
      
      // Wizard hood
      playerGraphics.fillStyle(0x1e40af, 1);
      playerGraphics.fillCircle(20, 15, 12);
      
      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(20, 20, 8);
      
      // Eyes
      playerGraphics.fillStyle(0x60a5fa, 0.7);
      playerGraphics.fillCircle(17, 19, 3);
      playerGraphics.fillCircle(23, 19, 3);
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(17, 19, 2);
      playerGraphics.fillCircle(23, 19, 2);
      
      // Crystal staff
      playerGraphics.lineStyle(4, 0x8b5cf6);
      playerGraphics.beginPath();
      playerGraphics.moveTo(28, 42);
      playerGraphics.lineTo(30, 22);
      playerGraphics.strokePath();
      
      // Crystal orb on staff
      playerGraphics.fillStyle(0x9370db, 0.8);
      playerGraphics.fillCircle(30, 20, 6);
      playerGraphics.fillStyle(0xffffff, 0.6);
      playerGraphics.fillCircle(30, 20, 3);
      
      playerGraphics.generateTexture('player', 45, 50);
      playerGraphics.destroy();
      
      // --- Create Crystal Fragments with Different Skills ---
      const skillColors = {
        magic: 0x9370db,    // Purple
        healing: 0x00ff00,  // Green
        combat: 0xff4500,   // Red
        stealth: 0x4169e1   // Blue
      };
      
      Object.keys(skillColors).forEach(skill => {
        const fragmentGraphics = this.add.graphics();
        const color = skillColors[skill];
        
        // Crystal fragment base
        fragmentGraphics.fillStyle(color, 0.8);
        fragmentGraphics.fillTriangle(15, 5, 25, 15, 15, 25);
        fragmentGraphics.fillTriangle(15, 25, 5, 15, 15, 5);
        
        // Inner crystal glow
        fragmentGraphics.fillStyle(0xffffff, 0.6);
        fragmentGraphics.fillTriangle(15, 8, 22, 15, 15, 22);
        
        // Crystal shine effect
        fragmentGraphics.fillStyle(0xffffff, 1);
        fragmentGraphics.fillCircle(12, 12, 2);
        fragmentGraphics.fillCircle(18, 18, 1);
        
        // Magical aura
        fragmentGraphics.fillStyle(color, 0.3);
        fragmentGraphics.fillCircle(15, 15, 25);
        
        fragmentGraphics.generateTexture(`fragment_${skill}`, 30, 30);
        fragmentGraphics.destroy();
      });
      
      // --- Create Hostile Enemy Sprites (for Tom and Jin) ---
      gameState.explorerData.forEach(explorer => {
        if (explorer.hostile) {
          const enemyGraphics = this.add.graphics();
          
          // Hostile explorer body (dark and menacing)
          enemyGraphics.fillStyle(0x8B0000, 1); // Dark red for hostility
          enemyGraphics.fillRect(8, 20, 16, 18);
          enemyGraphics.fillCircle(16, 15, 8);
          
          // Angry face
          enemyGraphics.fillStyle(0xff4444, 1);
          enemyGraphics.fillCircle(16, 15, 6);
          
          // Glowing angry eyes
          enemyGraphics.fillStyle(0xff0000, 1);
          enemyGraphics.fillCircle(13, 14, 2);
          enemyGraphics.fillCircle(19, 14, 2);
          
          // Hostile aura
          enemyGraphics.fillStyle(0xff0000, 0.4);
          enemyGraphics.fillCircle(16, 20, 35);
          
          // Weapon based on skill
          if (explorer.skill === 'combat') {
            // Sword for Tom
            enemyGraphics.fillStyle(0xc0c0c0, 1);
            enemyGraphics.fillRect(25, 12, 2, 16);
            enemyGraphics.fillRect(23, 12, 6, 3);
          } else if (explorer.skill === 'stealth') {
            // Daggers for Jin
            enemyGraphics.fillStyle(0x666666, 1);
            enemyGraphics.fillRect(6, 16, 1, 8);
            enemyGraphics.fillRect(26, 16, 1, 8);
          }
          
          enemyGraphics.generateTexture(`hostile_${explorer.name.toLowerCase()}`, 40, 45);
          enemyGraphics.destroy();
        }
      });
      
      // --- Create Explorer Holograms ---
      gameState.explorerData.forEach(explorer => {
        if (!explorer.hostile) {
          const hologramGraphics = this.add.graphics();
          const skillColor = skillColors[explorer.skill];
          
          // Holographic explorer body
          hologramGraphics.fillStyle(skillColor, 0.6);
          hologramGraphics.fillRect(8, 20, 16, 18);
          hologramGraphics.fillCircle(16, 15, 8);
          
          // Holographic face
          hologramGraphics.fillStyle(0xffffff, 0.8);
          hologramGraphics.fillCircle(16, 15, 6);
          
          // Holographic eyes
          hologramGraphics.fillStyle(skillColor, 1);
          hologramGraphics.fillCircle(13, 14, 2);
          hologramGraphics.fillCircle(19, 14, 2);
          
          // Skill aura
          hologramGraphics.fillStyle(skillColor, 0.4);
          hologramGraphics.fillCircle(16, 20, 30);
          
          // Holographic flicker effect
          hologramGraphics.fillStyle(0xffffff, 0.3);
          for (let i = 0; i < 5; i++) {
            const x = 8 + Math.random() * 16;
            const y = 10 + Math.random() * 20;
            hologramGraphics.fillCircle(x, y, 1);
          }
          
          hologramGraphics.generateTexture(`hologram_${explorer.name.toLowerCase()}`, 40, 45);
          hologramGraphics.destroy();
        }
      });
      
      // --- Create Crystal Altar ---
      const altarGraphics = this.add.graphics();
      
      // Altar base
      altarGraphics.fillStyle(0x2f4f4f, 1);
      altarGraphics.fillRect(10, 40, 60, 20);
      altarGraphics.fillRect(15, 30, 50, 15);
      altarGraphics.fillRect(20, 20, 40, 15);
      
      // Crystal mounting point
      altarGraphics.fillStyle(0x4169e1, 0.8);
      altarGraphics.fillCircle(40, 15, 15);
      
      // Mystical runes around altar
      altarGraphics.fillStyle(0x9370db, 0.6);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = 40 + Math.cos(angle) * 25;
        const y = 35 + Math.sin(angle) * 25;
        altarGraphics.fillCircle(x, y, 3);
      }
      
      altarGraphics.generateTexture('crystal_altar', 80, 60);
      altarGraphics.destroy();
      
      // --- Create Complete Memory Crystal ---
      const crystalGraphics = this.add.graphics();
      
      // Main crystal body
      crystalGraphics.fillStyle(0x9370db, 0.9);
      crystalGraphics.fillTriangle(20, 5, 35, 20, 20, 35);
      crystalGraphics.fillTriangle(20, 35, 5, 20, 20, 5);
      
      // Crystal facets
      crystalGraphics.fillStyle(0xffffff, 0.7);
      crystalGraphics.fillTriangle(20, 8, 30, 20, 20, 32);
      crystalGraphics.fillTriangle(20, 32, 10, 20, 20, 8);
      
      // Inner light
      crystalGraphics.fillStyle(0xffffff, 1);
      crystalGraphics.fillCircle(20, 20, 8);
      
      // Radiating energy
      crystalGraphics.fillStyle(0x9370db, 0.4);
      crystalGraphics.fillCircle(20, 20, 35);
      
      // Energy beams
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x1 = 20 + Math.cos(angle) * 15;
        const y1 = 20 + Math.sin(angle) * 15;
        const x2 = 20 + Math.cos(angle) * 30;
        const y2 = 20 + Math.sin(angle) * 30;
        
        crystalGraphics.lineStyle(3, 0xffffff, 0.8);
        crystalGraphics.beginPath();
        crystalGraphics.moveTo(x1, y1);
        crystalGraphics.lineTo(x2, y2);
        crystalGraphics.strokePath();
      }
      
      crystalGraphics.generateTexture('complete_crystal', 70, 70);
      crystalGraphics.destroy();
      
      // --- Create Cave Environment ---
      const caveWallGraphics = this.add.graphics();
      caveWallGraphics.fillStyle(0x2f2f2f, 1);
      caveWallGraphics.fillRect(0, 0, 40, 40);
      
      // Stone texture
      caveWallGraphics.fillStyle(0x404040, 1);
      caveWallGraphics.fillCircle(10, 10, 3);
      caveWallGraphics.fillCircle(30, 15, 4);
      caveWallGraphics.fillCircle(15, 30, 3);
      caveWallGraphics.fillCircle(35, 35, 2);
      
      caveWallGraphics.generateTexture('cave_wall', 40, 40);
      caveWallGraphics.destroy();
      
      // Create mystical cave background
      this.add.graphics().fillStyle(0x191970).fillRect(0, 0, 800, 500).generateTexture('cave_background', 800, 500);
    }

    function create() {
      // Create cave background with mystical atmosphere
      this.add.image(400, 250, 'cave_background');
      
      // Add cave atmosphere effects
      createCaveAtmosphere.call(this);
      
      walls = this.physics.add.staticGroup();
      crystalFragments = this.physics.add.group();
      enemies = this.physics.add.group();
      memorySpirits = this.physics.add.group();
      
      player = this.physics.add.sprite(100, 250, 'player');
      player.setCollideWorldBounds(true).body.setSize(35, 40).setOffset(5, 5);
      
      // Create crystal altar
      crystalAltar = this.physics.add.sprite(650, 250, 'crystal_altar');
      crystalAltar.setImmovable(true);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      
      this.physics.add.collider(player, walls);
      this.physics.add.collider(enemies, walls);
      this.physics.add.collider(enemies, enemies);
      
      this.physics.add.overlap(player, crystalFragments, collectFragment, null, this);
      this.physics.add.overlap(player, crystalAltar, interactWithAltar, null, this);
      this.physics.add.overlap(player, enemies, hitByEnemy, null, this);
      
      // Add methods to scene
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;
      
      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      crystalFragments.clear(true, true);
      enemies.clear(true, true);
      memorySpirits.clear(true, true);
      walls.clear(true, true);
      
      gameState.fragmentsCollected = 0;
      gameState.crystalPower = 0;
      gameState.queryComplete = false;
      gameState.memoryUnlocked = false;
      gameState.correctExplorers = 0;
      gameState.enemiesDefeated = 0;
      
      // Reset explorer data
      gameState.explorerData.forEach(explorer => {
        explorer.collected = false;
        if (explorer.hostile) {
          explorer.health = explorer.maxHealth;
        }
      });
      
      // Create cave walls for mystical environment
      createCaveWalls.call(this);
      
      // Spawn crystal fragments and enemies
      spawnExplorers.call(this);
      
      // Create crystal power display
      createCrystalPowerDisplay.call(this);
      
      player.setPosition(100, 250).setVelocity(0, 0);
    }
    
    function createCaveAtmosphere() {
      // Create mystical floating particles
      for (let i = 0; i < 15; i++) {
        const particle = sceneRef.add.circle(
          Math.random() * 800,
          Math.random() * 500,
          2 + Math.random() * 3,
          0x9370db,
          0.6
        );
        
        sceneRef.tweens.add({
          targets: particle,
          y: particle.y - 50,
          alpha: 0.2,
          duration: 3000 + Math.random() * 2000,
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2000
        });
      }
      
      // Create mystical light beams
      for (let i = 0; i < 3; i++) {
        const beam = sceneRef.add.rectangle(
          200 + (i * 200),
          0,
          20,
          500,
          0xffffff,
          0.1
        );
        
        sceneRef.tweens.add({
          targets: beam,
          alpha: 0.2,
          scaleX: 1.5,
          duration: 4000,
          yoyo: true,
          repeat: -1,
          delay: i * 1000
        });
      }
    }
    
    function createCaveWalls() {
      // Create mystical cave layout with open exploration areas
      const wallPositions = [
        // Outer cave walls
        [40, 40], [80, 40], [720, 40], [760, 40],
        [40, 460], [80, 460], [720, 460], [760, 460],
        [40, 80], [40, 120], [40, 160], [40, 200], [40, 280], [40, 320], [40, 360], [40, 420],
        [760, 80], [760, 120], [760, 160], [760, 200], [760, 280], [760, 320], [760, 360], [760, 420],
        
        // Inner cave formations (minimal to allow exploration)
        [200, 120], [200, 380],
        [400, 80], [400, 420],
        [600, 120], [600, 380]
      ];
      
      wallPositions.forEach(pos => {
        const wall = walls.create(pos[0], pos[1], 'cave_wall');
        wall.body.setSize(35, 35);
      });
    }
    
    function spawnExplorers() {
      const explorerPositions = [
        { x: 180, y: 160, explorer: 'Maya' },      // Has 'a' + magic - FRIENDLY
        { x: 320, y: 200, explorer: 'Elena' },     // Has 'a' + healing - FRIENDLY
        { x: 480, y: 180, explorer: 'Sara' },      // Has 'a' + magic - FRIENDLY
        { x: 520, y: 280, explorer: 'Alex' },      // Has 'a' + healing - FRIENDLY
        { x: 380, y: 320, explorer: 'Zara' },      // Has 'a' + combat - FRIENDLY (wrong skill)
        { x: 220, y: 350, explorer: 'Tom' },       // NO 'a' - ENEMY
        { x: 580, y: 180, explorer: 'Jin' }        // NO 'a' - ENEMY
      ];
      
      explorerPositions.forEach((pos, index) => {
        const explorerData = gameState.explorerData.find(e => e.name === pos.explorer);
        
        if (explorerData.hostile) {
          // Create hostile enemy (Tom and Jin - names without 'a')
          const enemy = enemies.create(pos.x, pos.y, `hostile_${explorerData.name.toLowerCase()}`);
          enemy.setCollideWorldBounds(true).body.setSize(30, 35).setOffset(5, 5);
          enemy.explorerData = explorerData;
          enemy.health = explorerData.health;
          enemy.maxHealth = explorerData.maxHealth;
          enemy.speed = 60;
          enemy.attackDamage = 15;
          enemy.aggroRange = 100;
          enemy.startX = pos.x;
          enemy.startY = pos.y;
          enemy.patrolDirection = 1;
          
          // Create health bar above enemy
          const healthBar = sceneRef.add.graphics();
          healthBar.x = pos.x - 15;
          healthBar.y = pos.y - 25;
          enemy.healthBar = healthBar;
          updateEnemyHealthBar(enemy);
          
          // Name text (red for enemies)
          const nameText = sceneRef.add.text(pos.x, pos.y - 40, pos.explorer, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ff4444',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          
          enemy.nameText = nameText;
          
          // Enemy patrol animation
          sceneRef.tweens.add({
            targets: enemy,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 1000 + (index * 200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
        } else {
          // Create collectible fragment (Maya, Elena, Sara, Alex, Zara - names with 'a')
          const fragment = crystalFragments.create(pos.x, pos.y, `fragment_${explorerData.skill}`);
          fragment.setCollideWorldBounds(true).body.setSize(25, 25).setOffset(2, 2);
          fragment.explorerData = explorerData;
          fragment.explorerName = pos.explorer;
          
          // Floating animation
          sceneRef.tweens.add({
            targets: fragment,
            y: fragment.y - 10,
            duration: 2000 + (index * 300),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Pulsing glow effect
          sceneRef.tweens.add({
            targets: fragment,
            alpha: 0.7,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1500 + (index * 200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Create floating name text above fragment
          const nameText = sceneRef.add.text(pos.x, pos.y - 40, pos.explorer, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: explorerData.isMatch ? '#00ff00' : '#ffaa00', // Green for correct match, orange for wrong skill
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          
          // Skill text
          const skillText = sceneRef.add.text(pos.x, pos.y - 25, explorerData.skill, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
          }).setOrigin(0.5);
          
          fragment.nameText = nameText;
          fragment.skillText = skillText;
          
          // Floating text animation
          sceneRef.tweens.add({
            targets: [nameText, skillText],
            y: nameText.y - 5,
            duration: 2000 + (index * 300),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    }
    
    function createCrystalPowerDisplay() {
      // Create crystal power meter
      const powerText = sceneRef.add.text(20, 20, 'Crystal Power:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      
      const powerBar = sceneRef.add.graphics();
      powerBar.x = 20;
      powerBar.y = 50;
      sceneRef.crystalPowerBar = powerBar;
      
      const powerValueText = sceneRef.add.text(120, 60, '', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      sceneRef.crystalPowerText = powerValueText;
      
      updateCrystalPowerDisplay();
    }
    
    function updateCrystalPowerDisplay() {
      if (!sceneRef.crystalPowerBar) return;
      
      sceneRef.crystalPowerBar.clear();
      
      // Background
      sceneRef.crystalPowerBar.fillStyle(0x333333, 1);
      sceneRef.crystalPowerBar.fillRect(0, 0, 200, 20);
      
      // Power fill
      const powerPercent = gameState.crystalPower / gameState.maxCrystalPower;
      const fillWidth = 196 * powerPercent;
      const color = powerPercent >= 0.8 ? 0x9370db : powerPercent >= 0.5 ? 0x4169e1 : 0x666666;
      
      sceneRef.crystalPowerBar.fillStyle(color, 1);
      sceneRef.crystalPowerBar.fillRect(2, 2, fillWidth, 16);
      
      // Update text
      if (sceneRef.crystalPowerText) {
        sceneRef.crystalPowerText.setText(`${gameState.crystalPower}%`);
      }
    }
    
    function updateEnemyHealthBar(enemy) {
      if (!enemy.healthBar) return;
      
      enemy.healthBar.clear();
      
      // Background
      enemy.healthBar.fillStyle(0x333333, 1);
      enemy.healthBar.fillRect(0, 0, 30, 4);
      
      // Health fill
      const healthPercent = enemy.health / enemy.maxHealth;
      const fillWidth = 28 * healthPercent;
      
      enemy.healthBar.fillStyle(0xff4444, 1);
      enemy.healthBar.fillRect(1, 1, fillWidth, 2);
    }

    function update() {
      if (gameState.isLevelComplete) return;
      
      player.setVelocity(0);
      const speed = 180;
      
      if (cursors.left.isDown || mobileControls.left) {
        player.setVelocityX(-speed);
      } else if (cursors.right.isDown || mobileControls.right) {
        player.setVelocityX(speed);
      }
      
      if (cursors.up.isDown || mobileControls.up) {
        player.setVelocityY(-speed);
      } else if (cursors.down.isDown || mobileControls.down) {
        player.setVelocityY(speed);
      }

      if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControls.attack) && gameState.canAttack) {
        attack.call(this);
      }
      
      if ((Phaser.Input.Keyboard.JustDown(interactKey) || mobileControls.interact) && gameState.canInteract) {
        // Check if near altar
        const distanceToAltar = Phaser.Math.Distance.Between(player.x, player.y, crystalAltar.x, crystalAltar.y);
        if (distanceToAltar <= 80) {
          interactWithAltar();
        }
      }
      
      // Update enemies
      updateEnemies.call(this);
    }
    
    function updateEnemies() {
      enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
        
        if (distanceToPlayer < enemy.aggroRange) {
          // Chase player
          sceneRef.physics.moveTo(enemy, player.x, player.y, enemy.speed);
          enemy.setTint(0xff6666);
          
          // Attack if close enough
          if (distanceToPlayer < 40 && (!enemy.lastAttack || sceneRef.time.now - enemy.lastAttack > 2000)) {
            enemy.lastAttack = sceneRef.time.now;
            gameState.health -= enemy.attackDamage;
            
            // Show damage effect
            showMessage(`${enemy.explorerData.name} attacks! -${enemy.attackDamage} health`, 1500);
            
            if (gameState.health <= 0) {
              gameOver('You were defeated by the hostile explorers!');
            }
            updateReactUI();
          }
        } else {
          // Patrol behavior
          enemy.clearTint();
          
          // Simple back and forth patrol
          const distanceFromStart = Math.abs(enemy.x - enemy.startX);
          if (distanceFromStart > 50) {
            enemy.patrolDirection *= -1;
          }
          
          enemy.setVelocityX(enemy.speed * 0.5 * enemy.patrolDirection);
        }
        
        // Update health bar position
        if (enemy.healthBar) {
          enemy.healthBar.x = enemy.x - 15;
          enemy.healthBar.y = enemy.y - 25;
        }
        
        if (enemy.nameText) {
          enemy.nameText.x = enemy.x;
          enemy.nameText.y = enemy.y - 40;
        }
      });
    }

    function attack() {
      gameState.canAttack = false;
      
      const attackRange = 100;
      
      // Mystical crystal attack effects
      const attackEffect = sceneRef.add.circle(player.x, player.y, attackRange, 0x9370db, 0.5);
      const innerEffect = sceneRef.add.circle(player.x, player.y, attackRange * 0.6, 0xffffff, 0.7);
      
      sceneRef.tweens.add({
        targets: attackEffect,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 400,
        onComplete: () => attackEffect.destroy()
      });
      
      sceneRef.tweens.add({
        targets: innerEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => innerEffect.destroy()
      });
      
      // Attack enemies
      enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (distance <= attackRange) {
          enemy.health -= 40;
          
          // Knockback
          const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          enemy.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
          
          // Damage effect
          enemy.setTint(0x8b5cf6);
          sceneRef.time.delayedCall(150, () => {
            if (enemy.active) enemy.clearTint();
          });
          
          updateEnemyHealthBar(enemy);
          
          if (enemy.health <= 0) {
            // Enemy defeated - drop their fragment
            dropEnemyFragment(enemy);
            
            gameState.enemiesDefeated++;
            
            enemy.destroy();
            if (enemy.healthBar) enemy.healthBar.destroy();
            if (enemy.nameText) enemy.nameText.destroy();
            
            showMessage(`${enemy.explorerData.name} defeated! Fragment dropped!`, 2000);
          }
        }
      });
      
      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });
      
      updateReactUI();
    }
    
    function dropEnemyFragment(enemy) {
      // When defeated, hostile explorers drop their fragments
      const fragment = crystalFragments.create(enemy.x, enemy.y, `fragment_${enemy.explorerData.skill}`);
      fragment.setCollideWorldBounds(true).body.setSize(25, 25).setOffset(2, 2);
      fragment.explorerData = enemy.explorerData;
      fragment.explorerName = enemy.explorerData.name;
      
      // Fragment appears with special effect
      fragment.setAlpha(0);
      sceneRef.tweens.add({
        targets: fragment,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        ease: 'Back.easeOut'
      });
      
      // Add floating animation
      sceneRef.tweens.add({
        targets: fragment,
        y: fragment.y - 10,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    function collectFragment(player, fragment) {
      if (fragment.explorerData.collected) return;
      
      fragment.explorerData.collected = true;
      gameState.fragmentsCollected++;
      
      // Add crystal power based on whether explorer matches criteria
      if (fragment.explorerData.isMatch) {
        gameState.crystalPower += 20;
        gameState.correctExplorers++;
        showMessage(`${fragment.explorerName} fragment collected! Perfect match! +20 Crystal Power`, 2000);
      } else {
        gameState.crystalPower += 10;
        showMessage(`${fragment.explorerName} fragment collected. Has 'a' but wrong skill. +10 Crystal Power`, 2000);
      }
      
      gameState.crystalPower = Math.min(gameState.maxCrystalPower, gameState.crystalPower);
      
      // Collection effect
      const collectEffect = sceneRef.add.circle(fragment.x, fragment.y, 50, 0x9370db, 0.8);
      sceneRef.tweens.add({
        targets: collectEffect,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 600,
        onComplete: () => collectEffect.destroy()
      });
      
      // Show holographic explorer
      spawnHologram(fragment.explorerName, fragment.x, fragment.y);
      
      fragment.destroy();
      if (fragment.nameText) fragment.nameText.destroy();
      if (fragment.skillText) fragment.skillText.destroy();
      
      updateCrystalPowerDisplay();
      updateReactUI();
    }
    
    function spawnHologram(explorerName, x, y) {
      const hologram = sceneRef.add.sprite(x, y, `hologram_${explorerName.toLowerCase()}`);
      hologram.setAlpha(0);
      
      // Hologram appearance animation
      sceneRef.tweens.add({
        targets: hologram,
        alpha: 0.8,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          sceneRef.tweens.add({
            targets: hologram,
            alpha: 0,
            duration: 500,
            onComplete: () => hologram.destroy()
          });
        }
      });
      
      // Floating effect
      sceneRef.tweens.add({
        targets: hologram,
        y: y - 20,
        duration: 3000,
        ease: 'Sine.easeInOut'
      });
    }
    
    function hitByEnemy(player, enemy) {
      if (enemy.lastPlayerHit && sceneRef.time.now - enemy.lastPlayerHit < 1500) return;
      
      enemy.lastPlayerHit = sceneRef.time.now;
      gameState.health -= enemy.attackDamage;
      
      player.setTint(0xff0000);
      sceneRef.time.delayedCall(300, () => player.clearTint());
      
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      player.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
      
      if (gameState.health <= 0) {
        gameOver('You were defeated by the hostile explorers!');
      }
      updateReactUI();
    }
    
    function interactWithAltar() {
      if (gameState.fragmentsCollected < gameState.totalFragments) {
        showMessage(`Collect all ${gameState.totalFragments} crystal fragments first! (${gameState.fragmentsCollected}/${gameState.totalFragments})`, 2500);
        return;
      }
      
      if (!gameState.queryComplete) {
        showQueryInput();
        return;
      }
      
      // Restore the memory crystal
      restoreMemoryCrystal();
    }
    
    function showQueryInput() {
      setUiState(prev => ({ ...prev, showQueryInput: true }));
    }
    
    function completeQuery() {
      gameState.queryComplete = true;
      showMessage('Query executed successfully! The crystal fragments resonate with your knowledge!', 3000);
      
      // Visual feedback - make altar glow
      crystalAltar.setTint(0x9370db);
      sceneRef.tweens.add({
        targets: crystalAltar,
        alpha: 0.7,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      updateReactUI();
    }
    
    function restoreMemoryCrystal() {
      gameState.memoryUnlocked = true;
      
      // Replace altar with complete crystal
      crystalAltar.setTexture('complete_crystal');
      crystalAltar.clearTint();
      crystalAltar.setScale(1.5);
      
      // Crystal restoration effect
      const restorationEffect = sceneRef.add.circle(crystalAltar.x, crystalAltar.y, 100, 0x9370db, 0.8);
      sceneRef.tweens.add({
        targets: restorationEffect,
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        duration: 2000,
        onComplete: () => restorationEffect.destroy()
      });
      
      // Show memory projections of matching explorers
      showMemoryProjections();
      
      // Level complete after short delay
      sceneRef.time.delayedCall(3000, () => {
        showLevelComplete();
      });
    }
    
    function showMemoryProjections() {
      const matchingExplorers = gameState.explorerData.filter(e => e.isMatch);
      
      matchingExplorers.forEach((explorer, index) => {
        sceneRef.time.delayedCall(500 * index, () => {
          const projection = sceneRef.add.sprite(
            crystalAltar.x + (index - 1.5) * 80,
            crystalAltar.y - 100,
            `hologram_${explorer.name.toLowerCase()}`
          );
          
          projection.setAlpha(0);
          projection.setScale(1.5);
          
          sceneRef.tweens.add({
            targets: projection,
            alpha: 0.9,
            y: projection.y - 50,
            duration: 1500,
            ease: 'Power2.easeOut'
          });
          
          // Memory text
          const memoryText = sceneRef.add.text(projection.x, projection.y + 80, `${explorer.name}\n"${explorer.skill} mastery"`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            backgroundColor: '#9370db',
            padding: { x: 6, y: 4 },
            align: 'center'
          }).setOrigin(0.5).setAlpha(0);
          
          sceneRef.tweens.add({
            targets: memoryText,
            alpha: 1,
            duration: 1000,
            delay: 800
          });
        });
      });
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 80, text, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      updateReactUI();
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 80, '🔮 Memory Crystal Restored! 🔮', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#9370db',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText = sceneRef.add.text(400, 120, 'Query Executed Successfully:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText2 = sceneRef.add.text(400, 140, "SELECT name, skill FROM jungle_explorers WHERE name LIKE '%a%' AND skill IN ('magic', 'healing');", {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#00ffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      // Show matching results
      const resultText = sceneRef.add.text(400, 170, 'Matching Explorers Found (names with "a" AND magic/healing):', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffff00'
      }).setOrigin(0.5).setDepth(1001);
      
      const matchingExplorers = gameState.explorerData.filter(e => e.isMatch);
      let resultsList = '';
      matchingExplorers.forEach(explorer => {
        resultsList += `${explorer.name} - ${explorer.skill}\n`;
      });
      
      const explorerResults = sceneRef.add.text(400, 210, resultsList, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#90ee90',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      // Show logic explanation
      const logicText = sceneRef.add.text(400, 270, 'Names WITHOUT "a" were hostile enemies:', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ff8888'
      }).setOrigin(0.5).setDepth(1001);
      
      const hostileList = gameState.explorerData.filter(e => e.hostile).map(e => e.name).join(', ');
      const hostileText = sceneRef.add.text(400, 290, hostileList, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ff4444',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 330, `🔮 Fragments Collected: ${gameState.fragmentsCollected}/${gameState.totalFragments}\n✨ Crystal Power: ${gameState.crystalPower}%\n🎯 Perfect Matches: ${gameState.correctExplorers}/4\n⚔️ Enemies Defeated: ${gameState.enemiesDefeated}/${gameState.totalEnemies}`, {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 420, 'The ancient memories are restored! Click to return to map', {
        fontSize: '16px',
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
    }
    
    function gameOver(message) {
      const gameOverText = sceneRef.add.text(400, 250, message, {
        fontSize: '22px',
        fontFamily: 'Courier New',
        color: '#ff4444',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5);
      
      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;
      
      // Reset UI state
      setUiState(prev => ({
        ...prev,
        showQueryInput: false,
        fragmentsCollected: 0,
        crystalPower: 0,
        enemiesDefeated: 0
      }));
      setSqlQuery('');
      setQueryError('');
      setQuerySuccess(false);
      
      sceneRef.time.delayedCall(3000, () => {
        gameOverText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
        fragmentsCollected: gameState.fragmentsCollected,
        crystalPower: gameState.crystalPower,
        memoryUnlocked: gameState.memoryUnlocked,
        correctExplorers: gameState.correctExplorers,
        enemiesDefeated: gameState.enemiesDefeated
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
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameInstance.current = new Phaser.Game(config);

    return () => { gameInstance.current?.destroy(true); };
  }, [onComplete]);

  // Mobile control handlers
  const handleMobileControlStart = (direction) => {
    setMobileControls(prev => {
      if (prev[direction]) return prev;
      return { ...prev, [direction]: true };
    });
  };

  const handleMobileControlEnd = (direction) => {
    setMobileControls(prev => {
      if (!prev[direction]) return prev;
      return { ...prev, [direction]: false };
    });
  };

  const handleAttack = () => {
    setMobileControls(prev => ({ ...prev, attack: true }));
    setTimeout(() => {
      setMobileControls(prev => ({ ...prev, attack: false }));
    }, 50);
  };

  const handleInteract = () => {
    setMobileControls(prev => ({ ...prev, interact: true }));
    setTimeout(() => {
      setMobileControls(prev => ({ ...prev, interact: false }));
    }, 50);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the game elements as reference */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🧙</span>
          </div>
          <span>Your Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <GiTreasureMap size={20} color="#9370db" />
          <span>Crystal Fragments</span>
        </div>
        <div className="flex items-center gap-2">
          <GiCrystalCluster size={20} color="#4169e1" />
          <span>Memory Altar</span>
        </div>
        <div className="flex items-center gap-2">
          <GiCampfire size={20} color="#ff4444" />
          <span>Hostile Enemies</span>
        </div>
      </div>

      {/* Responsive game container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg mx-auto"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>Health: <span className="text-rose-400">{uiState.health}/100</span></div>
        <div>Crystal Power: <span className="text-purple-400">{uiState.crystalPower}%</span></div>
        <div>Fragments: <span className="text-blue-400">{uiState.fragmentsCollected}/{uiState.totalFragments}</span></div>
        <div>Enemies: <span className="text-red-400">{uiState.enemiesDefeated}/{uiState.totalEnemies}</span></div>
      </div>

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="pixel-font text-xl text-purple-400 mb-4 text-center">🔮 Restore the Memory Crystal 🔮</h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              Write the SQL query to find the correct souls for crystal restoration:
            </p>
            
            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-green-400 text-xs font-mono">
                Find name and skills from jungle_explorers whose names contain 'a' AND have either 'magic' or 'healing' skills
              </p>
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={4}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              style={{ outline: 'none' }}
            />
            
            {queryError && (
              <div className="mt-2 p-2 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
                {queryError}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleQuerySubmit}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                Execute Query
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">SQL Query Challenge:</div>
        <div className="font-mono text-lg">
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              Memory Crystal Restored!
            </span>
          ) : uiState.fragmentsCollected === uiState.totalFragments ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              All fragments collected! Approach the altar and write the query
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              Collect fragments from explorers with 'a' in names • Fight those without 'a'
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Logic: Maya, Elena, Sara, Alex, Zara have 'a' → Friendly | Tom, Jin don't have 'a' → Enemies
        </div>
      </div>

      {/* Controls section */}
      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>CONTROLS:</strong></div>
        
        {/* Desktop Controls */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Move</div>
            <div>SPACE Crystal Magic</div>
            <div>E Interact with Altar</div>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            {/* D-Pad */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-1 w-36 h-36">
                <div></div>
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlStart('up'); 
                  }}
                  onTouchEnd={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlEnd('up'); 
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart('up');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd('up');
                  }}
                  onMouseLeave={() => handleMobileControlEnd('up')}
                  style={{ touchAction: 'none' }}
                >
                  ↑
                </button>
                <div></div>
                
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlStart('left'); 
                  }}
                  onTouchEnd={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlEnd('left'); 
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart('left');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd('left');
                  }}
                  onMouseLeave={() => handleMobileControlEnd('left')}
                  style={{ touchAction: 'none' }}
                >
                  ←
                </button>
                <div className="bg-slate-700 rounded"></div>
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlStart('right'); 
                  }}
                  onTouchEnd={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlEnd('right'); 
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart('right');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd('right');
                  }}
                  onMouseLeave={() => handleMobileControlEnd('right')}
                  style={{ touchAction: 'none' }}
                >
                  →
                </button>
                
                <div></div>
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlStart('down'); 
                  }}
                  onTouchEnd={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    handleMobileControlEnd('down'); 
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart('down');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd('down');
                  }}
                  onMouseLeave={() => handleMobileControlEnd('down')}
                  style={{ touchAction: 'none' }}
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                className="bg-purple-600 hover:bg-purple-500 active:bg-purple-400 rounded-full w-20 h-20 text-white font-bold text-sm flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  handleAttack(); 
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAttack();
                }}
                style={{ touchAction: 'none' }}
              >
                MAGIC
              </button>
              
              <button
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 rounded-full w-20 h-20 text-white font-bold text-sm flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  handleInteract(); 
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleInteract();
                }}
                style={{ touchAction: 'none' }}
              >
                ALTAR
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default Level6;
