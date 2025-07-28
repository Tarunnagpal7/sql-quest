import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiWoodBeam, GiTreasureMap, GiSailboat } from "react-icons/gi";
import { FaHammer } from "react-icons/fa";

const Level4 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  
  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    explorersFound: 0,
    totalExplorers: 0,
    raftProgress: 0,
    raftMaterials: 0,
    totalMaterials: 8, // Reduced from 15
    showQueryInput: false,
    allExplorersFound: false,
    stormIntensity: 0
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
    build: false
  });

  // Expected correct queries
  const correctQueries = [
    'SELECT * FROM jungle_explorers WHERE artifact_found = TRUE;',
    'select * from jungle_explorers where artifact_found = true;',
    'SELECT * FROM jungle_explorers WHERE artifact_found = TRUE',
    'select * from jungle_explorers where artifact_found = true',
    'SELECT * FROM jungle_explorers WHERE artifact_found=TRUE;',
    'select * from jungle_explorers where artifact_found=true;'
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
      setQueryError('Query failed! Find all jungle explorers who have found artifacts.');
      setTimeout(() => setQueryError(''), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, enemies, explorers, materials, walls, raft;
    let cursors, spaceKey, buildKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      canBuild: true,
      attackCooldown: 400,
      buildCooldown: 800,
      explorersFound: 0,
      totalExplorers: 6, // Reduced
      raftProgress: 0,
      raftMaterials: 0,
      totalMaterials: 8, // Reduced
      allExplorersFound: false,
      queryComplete: false,
      stormIntensity: 0,
      timeLimit: 180000, // Increased to 3 minutes
      timeRemaining: 180000,
      explorersData: [],
      buildingZone: { x: 650, y: 350, radius: 70 }
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      // --- Create Wizard Character with better spacing ---
      const playerGraphics = this.add.graphics();
      
      // Wizard robe (main body)
      playerGraphics.fillStyle(0x1e3a8a, 1);
      playerGraphics.fillCircle(20, 30, 16); // Larger and more centered
      playerGraphics.fillRect(4, 18, 32, 24);
      
      // Wizard hood
      playerGraphics.fillStyle(0x1e40af, 1);
      playerGraphics.fillCircle(20, 15, 12);
      
      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(20, 20, 8);
      
      // Eyes with glow
      playerGraphics.fillStyle(0x60a5fa, 0.7);
      playerGraphics.fillCircle(17, 19, 3);
      playerGraphics.fillCircle(23, 19, 3);
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(17, 19, 2);
      playerGraphics.fillCircle(23, 19, 2);
      
      // Robe details
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillRect(4, 24, 32, 3);
      playerGraphics.fillRect(18, 18, 4, 28);
      
      // Magic staff
      playerGraphics.lineStyle(4, 0x92400e);
      playerGraphics.beginPath();
      playerGraphics.moveTo(28, 42);
      playerGraphics.lineTo(30, 22);
      playerGraphics.strokePath();
      playerGraphics.fillStyle(0x8b5cf6, 0.8);
      playerGraphics.fillCircle(30, 20, 5);
      
      playerGraphics.generateTexture('player', 40, 50);
      playerGraphics.destroy();
      
      // --- Create Jungle Explorers with better graphics ---
      const explorerTypes = ['artifact_holder', 'empty_handed'];
      const explorerColors = [0x00ff00, 0xff6666];
      
      explorerTypes.forEach((type, index) => {
        const explorerGraphics = this.add.graphics();
        const color = explorerColors[index];
        
        // Explorer body - larger and clearer
        explorerGraphics.fillStyle(0x8b4513, 1);
        explorerGraphics.fillRect(10, 25, 20, 18);
        
        // Explorer head
        explorerGraphics.fillStyle(0xfdbcb4, 1);
        explorerGraphics.fillCircle(20, 18, 10);
        
        // Explorer hair
        explorerGraphics.fillStyle(0x4a4a4a, 1);
        explorerGraphics.fillCircle(20, 12, 11);
        
        // Explorer eyes
        explorerGraphics.fillStyle(0x000000, 1);
        explorerGraphics.fillCircle(16, 17, 2);
        explorerGraphics.fillCircle(24, 17, 2);
        
        // Clear artifact indicator
        if (type === 'artifact_holder') {
          explorerGraphics.fillStyle(color, 0.4);
          explorerGraphics.fillCircle(20, 25, 30); // Larger glow
          
          // Show artifact in hands - more visible
          explorerGraphics.fillStyle(0xffd700, 1);
          explorerGraphics.fillCircle(30, 30, 4);
          explorerGraphics.fillStyle(0xffff00, 0.8);
          explorerGraphics.fillCircle(30, 30, 3);
          
          // Sparkle effects
          explorerGraphics.fillStyle(0xffffff, 1);
          explorerGraphics.fillCircle(28, 27, 1);
          explorerGraphics.fillCircle(32, 32, 1);
        } else {
          explorerGraphics.fillStyle(color, 0.3);
          explorerGraphics.fillCircle(20, 25, 25);
        }
        
        // Explorer equipment
        explorerGraphics.fillStyle(0x666666, 1);
        explorerGraphics.fillRect(8, 22, 4, 10); // Backpack
        explorerGraphics.fillRect(28, 27, 10, 3); // Tool
        
        explorerGraphics.generateTexture(`explorer_${type}`, 40, 45);
        explorerGraphics.destroy();
      });
      
      // --- Create Fewer, Weaker Enemies ---
      const enemyTypes = ['storm_beast', 'wind_demon'];
      const enemyColors = [0x4b0082, 0x00ffff];
      
      enemyTypes.forEach((type, index) => {
        const enemyGraphics = this.add.graphics();
        const color = enemyColors[index];
        
        if (type === 'storm_beast') {
          // Storm beast - clearer graphics
          enemyGraphics.fillStyle(color, 1);
          enemyGraphics.fillEllipse(20, 30, 24, 20);
          enemyGraphics.fillCircle(32, 22, 10);
          
          // Lightning effects
          enemyGraphics.fillStyle(0xffff00, 0.8);
          enemyGraphics.fillRect(15, 18, 3, 10);
          enemyGraphics.fillRect(25, 18, 3, 10);
          
          // Glowing eyes
          enemyGraphics.fillStyle(0xff0000, 1);
          enemyGraphics.fillCircle(29, 20, 3);
          enemyGraphics.fillCircle(35, 20, 3);
          
        } else if (type === 'wind_demon') {
          // Wind demon - flying creature
          enemyGraphics.fillStyle(color, 0.8);
          enemyGraphics.fillRect(10, 22, 20, 24);
          enemyGraphics.fillCircle(20, 15, 12);
          
          // Wings - more visible
          enemyGraphics.fillStyle(color, 0.6);
          enemyGraphics.fillEllipse(5, 25, 15, 10);
          enemyGraphics.fillEllipse(35, 25, 15, 10);
          
          // Wind swirls
          enemyGraphics.fillStyle(0xffffff, 0.8);
          for (let i = 0; i < 4; i++) {
            const x = 10 + (i * 7);
            enemyGraphics.fillCircle(x, 30, 2);
          }
        }
        
        enemyGraphics.generateTexture(type, 40, 50);
        enemyGraphics.destroy();
      });
      
      // --- Create Raft Building Materials with better graphics ---
      const materialTypes = ['wood_log', 'rope'];
      const materialColors = [0x8b4513, 0xdaa520];
      
      materialTypes.forEach((type, index) => {
        const materialGraphics = this.add.graphics();
        const color = materialColors[index];
        
        if (type === 'wood_log') {
          // Wood log - larger and clearer
          materialGraphics.fillStyle(color, 1);
          materialGraphics.fillRect(8, 15, 24, 10);
          
          // Wood rings
          materialGraphics.fillStyle(0x654321, 1);
          materialGraphics.fillCircle(10, 20, 4);
          materialGraphics.fillCircle(30, 20, 4);
          
        } else if (type === 'rope') {
          // Rope coil - more visible
          materialGraphics.fillStyle(color, 1);
          materialGraphics.fillCircle(20, 20, 10);
          
          // Rope texture
          materialGraphics.fillStyle(0xb8860b, 1);
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = 20 + Math.cos(angle) * 8;
            const y = 20 + Math.sin(angle) * 8;
            materialGraphics.fillCircle(x, y, 3);
          }
        }
        
        // Glowing effect for all materials
        materialGraphics.fillStyle(color, 0.3);
        materialGraphics.fillCircle(20, 20, 25);
        
        materialGraphics.generateTexture(type, 40, 40);
        materialGraphics.destroy();
      });
      
      // Create other textures
      this.add.graphics().fillStyle(0x654321).fillRect(0, 0, 40, 40).generateTexture('jungle_wall', 40, 40);
      this.add.graphics().fillStyle(0x228b22).fillRect(0, 0, 800, 500).generateTexture('jungle_background', 800, 500);
      
      // Build zone indicator - clearer
      const buildZoneGraphics = this.add.graphics();
      buildZoneGraphics.lineStyle(5, 0x00ff00, 0.8);
      buildZoneGraphics.strokeCircle(70, 70, 68);
      buildZoneGraphics.fillStyle(0x00ff00, 0.15);
      buildZoneGraphics.fillCircle(70, 70, 68);
      
      buildZoneGraphics.generateTexture('build_zone', 140, 140);
      buildZoneGraphics.destroy();
    }

    function create() {
      this.add.image(400, 250, 'jungle_background');
      
      walls = this.physics.add.staticGroup();
      enemies = this.physics.add.group();
      explorers = this.physics.add.group();
      materials = this.physics.add.group();
      
      player = this.physics.add.sprite(100, 250, 'player');
      player.setCollideWorldBounds(true).body.setSize(30, 40).setOffset(5, 5);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      buildKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      
      this.physics.add.collider(player, walls);
      this.physics.add.collider(enemies, walls);
      this.physics.add.collider(explorers, walls);
      this.physics.add.collider(materials, walls);
      this.physics.add.collider(enemies, enemies);
      
      this.physics.add.overlap(player, explorers, findExplorer, null, this);
      this.physics.add.overlap(player, materials, collectMaterial, null, this);
      this.physics.add.overlap(player, enemies, hitByEnemy, null, this);
      
      // Add methods to scene
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;
      
      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      enemies.clear(true, true);
      explorers.clear(true, true);
      materials.clear(true, true);
      walls.clear(true, true);
      
      gameState.explorersFound = 0;
      gameState.raftProgress = 0;
      gameState.raftMaterials = 0;
      gameState.allExplorersFound = false;
      gameState.queryComplete = false;
      gameState.stormIntensity = 0;
      gameState.timeRemaining = gameState.timeLimit;
      gameState.explorersData = [];
      
      // Create simpler jungle walls
      createSimpleJungleWalls.call(this);
      
      // Create fewer explorers
      createExplorers.call(this);
      
      // Create fewer, weaker enemies
      createWeakerEnemies.call(this);
      
      // Create fewer materials
      createFewerMaterials.call(this);
      
      // Create building zone
      createBuildingZone.call(this);
      
      // Start timer (longer now)
      startTimer.call(this);
      
      player.setPosition(100, 250).setVelocity(0, 0);
      gameState.totalExplorers = explorers.children.entries.length;
    }
    
    function createSimpleJungleWalls() {
      // Much simpler wall layout with clear paths
      const wallPositions = [
        // Outer walls only
        [40, 40], [120, 40], [200, 40], [280, 40], [360, 40], [440, 40], [520, 40], [600, 40], [680, 40], [760, 40],
        [40, 460], [120, 460], [200, 460], [280, 460], [360, 460], [440, 460], [520, 460], [600, 460], [680, 460], [760, 460],
        [40, 120], [40, 200], [40, 280], [40, 360],
        [760, 120], [760, 200], [760, 280], [760, 360],
        
        // Only a few interior walls to create simple paths
        [200, 150], [200, 230], [200, 310], [200, 390],
        [400, 120], [400, 200], [400, 280], [400, 360],
        [600, 150], [600, 230], [600, 310]
      ];
      
      wallPositions.forEach(pos => {
        const wall = walls.create(pos[0], pos[1], 'jungle_wall');
        wall.body.setSize(35, 35); // Smaller collision box
      });
    }
    
    function createExplorers() {
      const explorerData = [
        // Artifact holders (TRUE) - 3 instead of 4
        { x: 150, y: 180, type: 'artifact_holder', artifact_found: true, name: 'Maya' },
        { x: 320, y: 140, type: 'artifact_holder', artifact_found: true, name: 'Jin' },
        { x: 480, y: 200, type: 'artifact_holder', artifact_found: true, name: 'Elena' },
        
        // Empty handed explorers (FALSE) - 3 decoys
        { x: 140, y: 320, type: 'empty_handed', artifact_found: false, name: 'Tom' },
        { x: 350, y: 280, type: 'empty_handed', artifact_found: false, name: 'Sarah' },
        { x: 500, y: 340, type: 'empty_handed', artifact_found: false, name: 'Mike' }
      ];
      
      explorerData.forEach(data => {
        const explorer = explorers.create(data.x, data.y, `explorer_${data.type}`);
        explorer.setCollideWorldBounds(true).body.setSize(30, 35).setOffset(5, 5);
        explorer.explorerData = data;
        explorer.found = false;
        explorer.hasArtifact = data.artifact_found;
        
        // Add floating animation
        sceneRef.tweens.add({
          targets: explorer,
          y: explorer.y - 8,
          duration: 2000 + (Math.random() * 1000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Add name text above explorer - more visible
        const nameText = sceneRef.add.text(data.x, data.y - 35, data.name, {
          fontSize: '14px',
          fontFamily: 'Courier New',
          color: data.artifact_found ? '#00ff00' : '#ff6666',
          fontStyle: 'bold',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        
        explorer.nameText = nameText;
        gameState.explorersData.push(data);
      });
    }
    
    function createWeakerEnemies() {
      // Only 4 enemies instead of 8, and weaker
      const enemyPositions = [
        { x: 180, y: 200, type: 'storm_beast' },
        { x: 320, y: 180, type: 'wind_demon' },
        { x: 280, y: 320, type: 'storm_beast' },
        { x: 450, y: 260, type: 'wind_demon' }
      ];
      
      enemyPositions.forEach((pos, index) => {
        const enemy = enemies.create(pos.x, pos.y, pos.type);
        enemy.setCollideWorldBounds(true).body.setSize(30, 40).setOffset(5, 5);
        enemy.health = 60; // Reduced from 100
        enemy.maxHealth = 60;
        enemy.speed = 50; // Reduced from 80
        enemy.attackDamage = 15; // Reduced from 25
        enemy.patrolDistance = 80;
        enemy.startX = pos.x;
        enemy.startY = pos.y;
        enemy.direction = 1;
        enemy.monsterType = pos.type;
        enemy.aggroRange = 80; // Reduced from 100
        
        // Gentle animations
        sceneRef.tweens.add({
          targets: enemy,
          scaleX: 1.05,
          scaleY: 0.95,
          duration: 1500 + (index * 300),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
    
    function createFewerMaterials() {
      // Only 8 materials instead of 15, better positioned
      const materialPositions = [
        { x: 120, y: 160, type: 'wood_log' },
        { x: 160, y: 240, type: 'rope' },
        { x: 240, y: 180, type: 'wood_log' },
        { x: 280, y: 240, type: 'rope' },
        { x: 360, y: 160, type: 'wood_log' },
        { x: 420, y: 220, type: 'rope' },
        { x: 480, y: 300, type: 'wood_log' },
        { x: 520, y: 180, type: 'rope' }
      ];
      
      materialPositions.forEach(pos => {
        const material = materials.create(pos.x, pos.y, pos.type);
        material.setCollideWorldBounds(true).body.setSize(30, 30).setOffset(5, 5);
        material.materialType = pos.type;
        
        // Floating animation
        sceneRef.tweens.add({
          targets: material,
          y: material.y - 8,
          duration: 1800 + (Math.random() * 400),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Glowing effect
        sceneRef.tweens.add({
          targets: material,
          alpha: 0.8,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
    
    function createBuildingZone() {
      const buildZone = sceneRef.add.image(gameState.buildingZone.x, gameState.buildingZone.y, 'build_zone');
      buildZone.setAlpha(0.8);
      
      // Pulsing animation
      sceneRef.tweens.add({
        targets: buildZone,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.6,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Add build zone text
      const buildText = sceneRef.add.text(gameState.buildingZone.x, gameState.buildingZone.y - 90, 'RAFT BUILDING ZONE\nPress B to Build', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5);
      
      sceneRef.tweens.add({
        targets: buildText,
        alpha: 0.7,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    }
    
    function startTimer() {
      sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
          gameState.timeRemaining -= 1000;
          gameState.stormIntensity = Math.max(0, (gameState.timeLimit - gameState.timeRemaining) / gameState.timeLimit);
          
          if (gameState.timeRemaining <= 0) {
            gameOver('Time ran out! The storm has arrived!');
          }
          
          updateReactUI();
        },
        callbackScope: sceneRef,
        loop: true
      });
    }

    function update() {
      if (gameState.isLevelComplete) return;
      
      player.setVelocity(0);
      const speed = 200; // Slightly faster movement
      
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
      
      if ((Phaser.Input.Keyboard.JustDown(buildKey) || mobileControls.build) && gameState.canBuild) {
        buildRaft.call(this);
      }

      // Update enemies with simpler AI
      updateSimpleEnemies.call(this);
      
      // Check if player is in building zone
      const distanceToZone = Phaser.Math.Distance.Between(
        player.x, player.y, 
        gameState.buildingZone.x, gameState.buildingZone.y
      );
      
      if (distanceToZone <= gameState.buildingZone.radius) {
        player.setTint(0x90ee90);
      } else {
        player.clearTint();
      }
    }

    function updateSimpleEnemies() {
      enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
        
        if (distanceToPlayer < enemy.aggroRange) {
          // Simple chase
          sceneRef.physics.moveTo(enemy, player.x, player.y, enemy.speed);
          enemy.setTint(0xff8888);
          
          // Attack if close enough
          if (distanceToPlayer < 35 && (!enemy.lastAttack || sceneRef.time.now - enemy.lastAttack > 2000)) {
            enemy.lastAttack = sceneRef.time.now;
            gameState.health -= enemy.attackDamage;
            
            if (gameState.health <= 0) {
              gameOver('You were defeated by the storm monsters!');
            }
          }
        } else {
          // Simple patrol
          enemy.clearTint();
          const distanceFromStart = Phaser.Math.Distance.Between(enemy.x, enemy.startX, enemy.y, enemy.startY);
          
          if (distanceFromStart > enemy.patrolDistance) {
            enemy.direction *= -1;
          }
          
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.startX + (enemy.direction * enemy.patrolDistance), enemy.startY);
          enemy.setVelocity(Math.cos(angle) * (enemy.speed * 0.4), Math.sin(angle) * (enemy.speed * 0.4));
        }
      });
    }

    function attack() {
      gameState.canAttack = false;
      
      const attackRange = 100; // Increased range
      
      // Magical attack effects
      const attackEffect = sceneRef.add.circle(player.x, player.y, attackRange, 0x8b5cf6, 0.4);
      const innerEffect = sceneRef.add.circle(player.x, player.y, attackRange * 0.6, 0xfbbf24, 0.5);
      
      sceneRef.tweens.add({
        targets: attackEffect,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 300,
        onComplete: () => attackEffect.destroy()
      });
      
      sceneRef.tweens.add({
        targets: innerEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 250,
        onComplete: () => innerEffect.destroy()
      });
      
      enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (distance <= attackRange) {
          enemy.health -= 80; // More damage
          
          const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          enemy.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
          
          enemy.setTint(0x8b5cf6);
          sceneRef.time.delayedCall(150, () => {
            if (enemy.active) enemy.clearTint();
          });
          
          if (enemy.health <= 0) {
            const explosion = sceneRef.add.circle(enemy.x, enemy.y, 35, 0xff6b6b);
            sceneRef.tweens.add({
              targets: explosion,
              scaleX: 4,
              scaleY: 4,
              alpha: 0,
              duration: 500,
              onComplete: () => explosion.destroy()
            });
            
            enemy.destroy();
          }
        }
      });
      
      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });
    }

    function buildRaft() {
      const distanceToZone = Phaser.Math.Distance.Between(
        player.x, player.y, 
        gameState.buildingZone.x, gameState.buildingZone.y
      );
      
      if (distanceToZone > gameState.buildingZone.radius) {
        showMessage('You must be in the building zone to build the raft!', 2000);
        return;
      }
      
      if (!gameState.queryComplete) {
        showQueryInput();
        return;
      }
      
      if (gameState.raftMaterials < gameState.totalMaterials) {
        showMessage(`You need ${gameState.totalMaterials - gameState.raftMaterials} more materials!`, 2000);
        return;
      }
      
      if (gameState.explorersFound < 3) { // Only need 3 artifact holders
        showMessage(`You need ${3 - gameState.explorersFound} more artifact holders to help!`, 2000);
        return;
      }
      
      gameState.canBuild = false;
      
      // Build raft progress
      gameState.raftProgress += 50; // Faster building
      
      if (gameState.raftProgress >= 100) {
        showLevelComplete();
      } else {
        showMessage(`Raft ${gameState.raftProgress}% complete! Keep building!`, 1500);
        
        sceneRef.time.delayedCall(800, () => {
          gameState.canBuild = true;
        });
      }
      
      updateReactUI();
    }

    function findExplorer(player, explorer) {
      if (explorer.found) return;
      
      explorer.found = true;
      
      if (explorer.hasArtifact) {
        // Correct explorer (has artifact)
        gameState.explorersFound++;
        
        explorer.setTint(0x00ff00);
        if (explorer.nameText) explorer.nameText.setColor('#00ff00');
        
        // Success effect
        const successEffect = sceneRef.add.circle(explorer.x, explorer.y, 50, 0x00ff00, 0.6);
        sceneRef.tweens.add({
          targets: successEffect,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 0,
          duration: 600,
          onComplete: () => successEffect.destroy()
        });
        
        showMessage(`${explorer.explorerData.name} will help build the raft!`, 2000);
        
        sceneRef.time.delayedCall(1500, () => {
          explorer.destroy();
          if (explorer.nameText) explorer.nameText.destroy();
        });
        
      } else {
        // Wrong explorer (no artifact)
        gameState.health -= 10; // Less damage
        
        explorer.setTint(0xff0000);
        player.setTint(0xff0000);
        sceneRef.time.delayedCall(200, () => {
          if (player.active) player.clearTint();
        });
        
        showMessage(`${explorer.explorerData.name} cannot help - no artifact!`, 2000);
      }
      
      updateReactUI();
    }
    
    function collectMaterial(player, material) {
      gameState.raftMaterials++;
      
      // Visual collection effect
      const collectEffect = sceneRef.add.circle(material.x, material.y, 40, 0xffd700, 0.8);
      sceneRef.tweens.add({
        targets: collectEffect,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 400,
        onComplete: () => collectEffect.destroy()
      });
      
      material.destroy();
      updateReactUI();
    }
    
    function showQueryInput() {
      setUiState(prev => ({ ...prev, showQueryInput: true }));
    }
    
    function completeQuery() {
      gameState.queryComplete = true;
      showMessage('Query executed! You can now build the raft with artifact holders!', 3000);
      updateReactUI();
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
      
      const completionText = sceneRef.add.text(400, 120, '🚤 Raft Built Successfully! 🚤', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText2 = sceneRef.add.text(400, 180, 'SELECT * FROM jungle_explorers WHERE artifact_found = TRUE;', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#00ffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 250, `🔨 Materials: ${gameState.raftMaterials}/${gameState.totalMaterials}\n👥 Helpers: ${gameState.explorersFound}/3`, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 350, 'You escaped! Click to return to map', {
        fontSize: '18px',
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

    function hitByEnemy(player, enemy) {
      if (enemy.lastPlayerHit && sceneRef.time.now - enemy.lastPlayerHit < 2000) return;
      
      enemy.lastPlayerHit = sceneRef.time.now;
      gameState.health -= enemy.attackDamage;
      
      player.setTint(0xff0000);
      sceneRef.time.delayedCall(300, () => player.clearTint());
      
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      player.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
      
      if (gameState.health <= 0) {
        gameOver('You were defeated!');
      }
      updateReactUI();
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
        allExplorersFound: false
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
        explorersFound: gameState.explorersFound,
        totalExplorers: 3, // Only artifact holders count
        raftProgress: gameState.raftProgress,
        raftMaterials: gameState.raftMaterials,
        stormIntensity: Math.round(gameState.stormIntensity * 100)
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

  const handleBuild = () => {
    setMobileControls(prev => ({ ...prev, build: true }));
    setTimeout(() => {
      setMobileControls(prev => ({ ...prev, build: false }));
    }, 50);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the game elements as reference */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🧙</span>
          </div>
          <span>Your Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <GiTreasureMap size={20} color="#00ff00" />
          <span>Artifact Holders</span>
        </div>
        <div className="flex items-center gap-2">
          <GiWoodBeam size={20} color="#8b4513" />
          <span>Materials</span>
        </div>
        <div className="flex items-center gap-2">
          <GiSailboat size={20} color="#87ceeb" />
          <span>Building Zone</span>
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
        <div>Time: <span className="text-orange-400">3 minutes</span></div>
        <div>Artifact Holders: <span className="text-green-400">{uiState.explorersFound}/{uiState.totalExplorers}</span></div>
        <div>Materials: <span className="text-blue-400">{uiState.raftMaterials}/{uiState.totalMaterials}</span></div>
      </div>

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
            <h3 className="pixel-font text-xl text-yellow-400 mb-4 text-center">🚤 Build the Raft 🚤</h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              Write the SQL query to find explorers who can help build the raft:
            </p>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={3}
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
              Query Completed Successfully!
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded animate-pulse">
              Find explorers with artifacts to help build the raft
            </span>
          )}
        </div>
        <div className="text-bold text-slate-500 mt-2">
          Collect all artifacts , and list from  jungle_explorers where artifact_found TRUE
        </div>
      </div>

      {/* Controls section */}
      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>CONTROLS:</strong></div>
        
        {/* Desktop Controls */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Move</div>
            <div>SPACE Magic Attack</div>
            <div>B Build Raft</div>
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
                className="bg-green-600 hover:bg-green-500 active:bg-green-400 rounded-full w-20 h-20 text-white font-bold text-sm flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  handleBuild(); 
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleBuild();
                }}
                style={{ touchAction: 'none' }}
              >
                BUILD
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

export default Level4;
