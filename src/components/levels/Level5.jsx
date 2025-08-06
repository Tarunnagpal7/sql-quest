import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiRun, GiSkeletonKey, GiMonkey, GiSwordClash } from "react-icons/gi";
import { FaSkull } from "react-icons/fa";
import MobileControls from '../MobileControls';

const Level5 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
  });
  
  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    gamePhase: 'running',
    showQueryInput: false,
    canAttack: false,
    distanceToSafety: 100,
    enemyDefeated: false,
    mazeProgress: 0
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');

  // Mobile controls state
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false
  });

  // Memoized mobile control handlers
  const handleMobileControlStart = useCallback((direction) => {
    mobileControlsRef.current[direction] = true;
    setMobileControls((prev) => {
      if (prev[direction]) return prev;
      return { ...prev, [direction]: true };
    });
  }, []);

  const handleMobileControlEnd = useCallback((direction) => {
    mobileControlsRef.current[direction] = false;
    setMobileControls((prev) => {
      if (!prev[direction]) return prev;
      return { ...prev, [direction]: false };
    });
  }, []);

  const handleAttack = useCallback(() => {
    mobileControlsRef.current.attack = true;
    setMobileControls((prev) => ({ ...prev, attack: true }));
    setTimeout(() => {
      mobileControlsRef.current.attack = false;
      setMobileControls((prev) => ({ ...prev, attack: false }));
    }, 100);
  }, []);

  // Expected correct query - weapons table
  const correctQueries = [
    "SELECT name, power, durability FROM weapons WHERE agility >= 80 AND power > 70 AND weight < 10;",
    "select name, power, durability from weapons where agility >= 80 and power > 70 and weight < 10;",
    "SELECT name, power, durability FROM weapons WHERE agility>=80 AND power>70 AND weight<10;",
    "select name, power, durability from weapons where agility>=80 and power>70 and weight<10;"
  ];

  const handleQuerySubmit = () => {
  // Fix: Better normalization that preserves important spaces
  const normalizedUserQuery = sqlQuery.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Updated correct queries with your exact format
  const correctQueries = [
    "SELECT name, power, durability FROM weapons WHERE agility >= 80 AND power > 70 AND weight < 10;",
    "select name, power, durability from weapons where agility >= 80 and power > 70 and weight < 10;",
    "SELECT name, power, durability FROM weapons WHERE agility>=80 AND power>70 AND weight<10;",
    "select name, power, durability from weapons where agility>=80 and power>70 and weight<10;",
    // Add variations with different spacing
    "select name , power , durability from weapons where agility >= 80 and power > 70 and weight < 10;",
    "SELECT name , power , durability FROM weapons WHERE agility >= 80 AND power > 70 AND weight < 10;"
  ];

  const isCorrect = correctQueries.some(query => {
    const normalizedExpected = query.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalizedUserQuery === normalizedExpected;
  });

  if (isCorrect) {
    setQueryError('');
    setUiState(prev => ({ 
      ...prev, 
      showQueryInput: false, 
      isQueryComplete: true, 
      canAttack: true,
      gamePhase: 'fighting'
    }));
    
    // Enable combat mode
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].enableCombat();
    }
  } else {
    setQueryError('Wrong query! Select name, power, durability from weapons where agility >= 80 AND power > 70 AND weight < 10');
    setTimeout(() => setQueryError(''), 5000);
  }
};


  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, enemy, monkey, safeZone, wallLayer;
    let cursors, spaceKey;
    
    const TILE_SIZE = 32;
    const MAZE_WIDTH = 15;
    const MAZE_HEIGHT = 15;
    
    // More complex jungle maze layout: 0 = walkable, 1 = wall
    const MAZE_MAP = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,1,0,1,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      gamePhase: 'running',
      isQueryComplete: false,
      canAttack: false,
      enemyDefeated: false,
      isLevelComplete: false,
      invulnerable: false,
      invulnerabilityTime: 1500,
      playerSpeed: 120,
      enemySpeed: 80,
      lastEnemyMove: 0,
      enemyMoveInterval: 500
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      // Create running wizard sprite (jungle explorer style)
      const wizardGraphics = this.add.graphics();
      
      // Wizard in jungle explorer outfit
      wizardGraphics.fillStyle(0x8b4513, 1); // Brown explorer outfit
      wizardGraphics.fillCircle(16, 20, 10);
      wizardGraphics.fillRect(6, 14, 20, 16);
      
      // Running legs
      wizardGraphics.fillStyle(0x654321, 1);
      wizardGraphics.fillRect(12, 28, 3, 6);
      wizardGraphics.fillRect(17, 30, 3, 4);
      
      // Explorer hat
      wizardGraphics.fillStyle(0x2f4f4f, 1);
      wizardGraphics.fillEllipse(16, 12, 14, 6);
      
      // Face
      wizardGraphics.fillStyle(0xfdbcb4, 1);
      wizardGraphics.fillCircle(16, 16, 5);
      
      // Eyes (determined)
      wizardGraphics.fillStyle(0x000000, 1);
      wizardGraphics.fillCircle(14, 15, 1);
      wizardGraphics.fillCircle(18, 15, 1);
      
      // Jungle machete
      wizardGraphics.lineStyle(2, 0x8b4513);
      wizardGraphics.beginPath();
      wizardGraphics.moveTo(24, 22);
      wizardGraphics.lineTo(26, 12);
      wizardGraphics.strokePath();
      wizardGraphics.fillStyle(0xc0c0c0, 1);
      wizardGraphics.fillRect(25, 10, 3, 6);
      
      wizardGraphics.generateTexture('jungle_explorer', 32, 36);
      wizardGraphics.destroy();
      
      // Create single jungle beast (relentless chaser)
      const beastGraphics = this.add.graphics();
      
      // Jungle beast body
      beastGraphics.fillStyle(0x8b4513, 1);
      beastGraphics.fillEllipse(16, 20, 24, 14);
      beastGraphics.fillCircle(24, 14, 6);
      
      // Beast legs
      beastGraphics.fillRect(6, 26, 3, 6);
      beastGraphics.fillRect(11, 28, 3, 4);
      beastGraphics.fillRect(19, 26, 3, 6);
      beastGraphics.fillRect(24, 28, 3, 4);
      
      // Beast face features
      beastGraphics.fillStyle(0x654321, 1);
      beastGraphics.fillCircle(24, 14, 5);
      
      // Glowing eyes
      beastGraphics.fillStyle(0xff4444, 1);
      beastGraphics.fillCircle(22, 12, 2);
      beastGraphics.fillCircle(26, 12, 2);
      
      // Claws
      beastGraphics.fillStyle(0xffffff, 1);
      beastGraphics.fillTriangle(28, 14, 30, 11, 32, 14);
      beastGraphics.fillTriangle(28, 18, 30, 21, 32, 18);
      
      // Danger aura
      beastGraphics.fillStyle(0xff4444, 0.4);
      beastGraphics.fillCircle(16, 20, 20);
      
      beastGraphics.generateTexture('jungle_beast', 32, 36);
      beastGraphics.destroy();
      
      // Create trapped monkey in jungle cage
      const monkeyGraphics = this.add.graphics();
      
      // Bamboo cage
      monkeyGraphics.fillStyle(0x9acd32, 1);
      monkeyGraphics.fillRect(8, 12, 32, 32);
      
      // Bamboo bars
      monkeyGraphics.fillStyle(0x556b2f, 1);
      for (let i = 0; i < 4; i++) {
        monkeyGraphics.fillRect(10 + (i * 6), 12, 2, 32);
      }
      for (let i = 0; i < 3; i++) {
        monkeyGraphics.fillRect(8, 14 + (i * 7), 32, 2);
      }
      
      // Sacred monkey inside
      monkeyGraphics.fillStyle(0x8b4513, 1);
      monkeyGraphics.fillCircle(24, 24, 5);
      monkeyGraphics.fillRect(21, 28, 5, 6);
      
      // Monkey face
      monkeyGraphics.fillStyle(0xfdbcb4, 1);
      monkeyGraphics.fillCircle(24, 24, 4);
      
      // Pleading eyes
      monkeyGraphics.fillStyle(0x000000, 1);
      monkeyGraphics.fillCircle(22, 23, 1);
      monkeyGraphics.fillCircle(26, 23, 1);
      
      // Sacred glow
      monkeyGraphics.fillStyle(0xffd700, 0.3);
      monkeyGraphics.fillCircle(24, 28, 20);
      
      monkeyGraphics.generateTexture('trapped_monkey', 48, 48);
      monkeyGraphics.destroy();
      
      // Create jungle wall tiles (vines and trees)
      const wallGraphics = this.add.graphics();
      wallGraphics.fillStyle(0x228b22, 1);
      wallGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Tree bark texture
      wallGraphics.fillStyle(0x8b4513, 0.8);
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        wallGraphics.fillCircle(x, y, 1 + Math.random() * 2);
      }
      
      // Vine details
      wallGraphics.fillStyle(0x32cd32, 0.7);
      wallGraphics.fillRect(2, 0, 2, TILE_SIZE);
      wallGraphics.fillRect(TILE_SIZE - 4, 0, 2, TILE_SIZE);
      
      wallGraphics.generateTexture('jungle_wall', TILE_SIZE, TILE_SIZE);
      wallGraphics.destroy();
      
      // Create safe zone around cage
      const safeZoneGraphics = this.add.graphics();
      safeZoneGraphics.lineStyle(3, 0x00ff00, 0.8);
      safeZoneGraphics.strokeCircle(24, 24, 20);
      safeZoneGraphics.fillStyle(0x00ff00, 0.2);
      safeZoneGraphics.fillCircle(24, 24, 20);
      safeZoneGraphics.generateTexture('safe_zone', 48, 48);
      safeZoneGraphics.destroy();
      
      // Create jungle background
      const jungleGraphics = this.add.graphics();
      jungleGraphics.fillStyle(0x006400, 1);
      jungleGraphics.fillRect(0, 0, 800, 500);
      
      // Jungle floor texture
      jungleGraphics.fillStyle(0x8b4513, 0.4);
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        jungleGraphics.fillCircle(x, y, 2 + Math.random() * 3);
      }
      
      // Leaf shadows
      jungleGraphics.fillStyle(0x228b22, 0.3);
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        jungleGraphics.fillEllipse(x, y, 6 + Math.random() * 4, 3 + Math.random() * 2);
      }
      
      jungleGraphics.generateTexture('jungle_bg', 800, 500);
      jungleGraphics.destroy();
    }

    function create() {
      // Jungle background
      this.add.image(400, 250, 'jungle_bg');
      
      // Create tilemap for walls
      const map = this.make.tilemap({ 
        data: MAZE_MAP, 
        tileWidth: TILE_SIZE, 
        tileHeight: TILE_SIZE 
      });
      const tileset = map.addTilesetImage('jungle_wall');
      wallLayer = map.createLayer(0, tileset, 120, 20);
      
      // Set collision on wall tiles
      wallLayer.setCollisionByExclusion([0]); // 0 = walkable, everything else = collision
      
      // Create safe zone around monkey cage
      safeZone = this.add.image(
        13 * TILE_SIZE + TILE_SIZE / 2 + 120,
        13 * TILE_SIZE + TILE_SIZE / 2 + 20,
        'safe_zone'
      );
      
      // Trapped monkey in cage
      monkey = this.physics.add.sprite(
        13 * TILE_SIZE + TILE_SIZE / 2 + 120,
        13 * TILE_SIZE + TILE_SIZE / 2 + 20,
        'trapped_monkey'
      );
      monkey.body.setImmovable(true);
      monkey.body.setSize(40, 40);
      
      // Player jungle explorer starts at grid position (1,1)
      player = this.physics.add.sprite(
        1 * TILE_SIZE + TILE_SIZE / 2 + 120,
        1 * TILE_SIZE + TILE_SIZE / 2 + 20,
        'jungle_explorer'
      );
      player.setCollideWorldBounds(true);
      player.body.setSize(20, 28); // Proper body size to prevent wall clipping
      
      // Single jungle beast enemy starts behind player
      enemy = this.physics.add.sprite(
        1 * TILE_SIZE + TILE_SIZE / 2 + 120,
        4 * TILE_SIZE + TILE_SIZE / 2 + 20,
        'jungle_beast'
      );
      enemy.setCollideWorldBounds(true);
      enemy.body.setSize(20, 28); // Same size as player
      enemy.health = 100;
      
      // Controls
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // CRITICAL: Set up proper collisions
      this.physics.add.collider(player, wallLayer); // Player cannot pass through walls
      this.physics.add.collider(enemy, wallLayer);  // Enemy cannot pass through walls
      
      // Overlap detection for damage and interaction
      this.physics.add.overlap(player, enemy, enemyHitPlayer, null, this);
      this.physics.add.overlap(player, monkey, reachMonkey, null, this);
      
      // Add methods
      this.enableCombat = enableCombat;
      this.completeLevel = completeLevel;
      this.restartLevel = restartLevel;
      
      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      // Reset game state
      gameState.health = 100;
      gameState.gamePhase = 'running';
      gameState.isQueryComplete = false;
      gameState.canAttack = false;
      gameState.enemyDefeated = false;
      gameState.isLevelComplete = false;
      gameState.invulnerable = false;
      
      // Reset positions
      player.setPosition(
        1 * TILE_SIZE + TILE_SIZE / 2 + 120,
        1 * TILE_SIZE + TILE_SIZE / 2 + 20
      );
      player.clearTint();
      player.setVelocity(0, 0);
      
      enemy.setPosition(
        1 * TILE_SIZE + TILE_SIZE / 2 + 120,
        4 * TILE_SIZE + TILE_SIZE / 2 + 20
      );
      enemy.clearTint();
      enemy.health = 100;
      enemy.setVelocity(0, 0);
      
      // Show initial message
      showMessage('🌿 Escape through the jungle maze! A relentless beast is chasing you!', 4000);
      updateReactUI();
    }

    function update() {
      if (gameState.isLevelComplete) return;
      
      // Player movement with proper physics
      player.setVelocity(0);
      
      if (cursors.left.isDown || mobileControlsRef.current.left) {
        player.setVelocityX(-gameState.playerSpeed);
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
        player.setVelocityX(gameState.playerSpeed);
      }
      
      if (cursors.up.isDown || mobileControlsRef.current.up) {
        player.setVelocityY(-gameState.playerSpeed);
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        player.setVelocityY(gameState.playerSpeed);
      }
      
      // Enemy constantly chases player (relentless pursuit)
      if (gameState.gamePhase === 'running' && !gameState.enemyDefeated) {
        // Move enemy towards player every frame
        sceneRef.physics.moveToObject(enemy, player, gameState.enemySpeed);
        
        // Make enemy more aggressive by highlighting it
        enemy.setTint(0xff6666);
      }
      
      // Attack (only when enabled)
      if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControlsRef.current.attack) 
          && gameState.canAttack && !gameState.enemyDefeated) {
        attackEnemy.call(this);
      }
      
      // Calculate progress based on distance to cage
      const distX = Math.abs(player.x - monkey.x);
      const distY = Math.abs(player.y - monkey.y);
      const distance = Math.sqrt(distX * distX + distY * distY);
      gameState.mazeProgress = Math.max(0, 100 - (distance / 10));
      
      updateReactUI();
    }

    function enemyHitPlayer(player, enemy) {
      if (gameState.invulnerable || gameState.gamePhase !== 'running') return;
      
      // Damage player
      gameState.health -= 25;
      gameState.invulnerable = true;
      
      // Visual feedback
      player.setTint(0xff0000);
      sceneRef.cameras.main.shake(200, 0.02);
      
      // Show damage message
      showMessage(`Beast attacks! -25 Health! Remaining: ${gameState.health}/100`, 1500);
      
      // Knockback effect
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      
      // Check if health depleted
      if (gameState.health <= 0) {
        gameOver('💀 The jungle beast overwhelmed you! You ran out of health!');
        return;
      }
      
      // Remove invulnerability
      sceneRef.time.delayedCall(gameState.invulnerabilityTime, () => {
        gameState.invulnerable = false;
        if (player.active) player.clearTint();
      });
      
      updateReactUI();
    }

    function reachMonkey(player, monkey) {
      if (gameState.gamePhase === 'running') {
        // Player reached safety!
        gameState.gamePhase = 'safe';
        
        // Stop enemy movement
        enemy.setVelocity(0, 0);
        enemy.clearTint();
        
        // Safe zone visual effect
        const safeEffect = sceneRef.add.circle(monkey.x, monkey.y, 40, 0x00ff00, 0.6);
        sceneRef.tweens.add({
          targets: safeEffect,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 1000,
          onComplete: () => safeEffect.destroy()
        });
        
        showMessage('🛡️ Safe in the jungle sanctuary! The beast cannot reach you here! Solve the query!', 4000);
        
        // Auto-open query after delay
        sceneRef.time.delayedCall(4000, () => {
          setUiState(prev => ({ ...prev, showQueryInput: true }));
        });
        
        updateReactUI();
      }
    }

    function enableCombat() {
      gameState.canAttack = true;
      gameState.gamePhase = 'fighting';
      
      showMessage('⚔️ Query complete! You can now fight the jungle beast!', 3000);
      
      // Make enemy aggressive again
      enemy.setTint(0xff4444);
      
      updateReactUI();
    }

    function attackEnemy() {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      
      if (distance > 60) {
        showMessage('Get closer to the jungle beast to attack!', 1500);
        return;
      }
      
      // Attack the beast
      enemy.health -= 50;
      
      // Attack effects
      const attackEffect = sceneRef.add.circle(enemy.x, enemy.y, 30, 0x8b5cf6, 0.6);
      sceneRef.tweens.add({
        targets: attackEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 400,
        onComplete: () => attackEffect.destroy()
      });
      
      // Knockback enemy
      const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      enemy.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
      
      enemy.setTint(0xffffff);
      sceneRef.time.delayedCall(200, () => {
        if (enemy.active) enemy.setTint(0xff4444);
      });
      
      if (enemy.health <= 0) {
        // Beast defeated!
        gameState.enemyDefeated = true;
        enemy.destroy();
        
        sceneRef.time.delayedCall(1000, () => {
          completeLevel();
        });
      }
      
      updateReactUI();
    }

    function completeLevel() {
      gameState.isLevelComplete = true;
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 80, '🐒 Sacred Monkey Freed! 🐒', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      
      const instructionText = sceneRef.add.text(400, 420, 'Mission Complete! Click to continue', {
        fontSize: '32px',
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
      const gameOverText = sceneRef.add.text(400, 200, `💀 GAME OVER 💀\n${message}`, {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ff4444',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 15, y: 8 }
      }).setOrigin(0.5).setDepth(1000);
      
      const restartText = sceneRef.add.text(400, 300, 'Restarting in 3 seconds...', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.cameras.main.flash(500, 255, 0, 0);
      
      // Auto-restart after 3 seconds
      sceneRef.time.delayedCall(3000, () => {
        gameOverText.destroy();
        restartText.destroy();
        restartLevel();
      });
    }

    function restartLevel() {
      // Reset UI state
      setUiState(prev => ({
        ...prev,
        health: 100,
        gamePhase: 'running',
        showQueryInput: false,
        isQueryComplete: false,
        canAttack: false,
        enemyDefeated: false,
        mazeProgress: 0,
        distanceToSafety: 100
      }));
      
      setSqlQuery('');
      setQueryError('');
      
      createLevel.call(sceneRef);
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 50, text, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.time.delayedCall(duration, () => {
        if (messageText.active) messageText.destroy();
      });
    }

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: Math.max(0, gameState.health),
        gamePhase: gameState.gamePhase,
        canAttack: gameState.canAttack,
        enemyDefeated: gameState.enemyDefeated,
        mazeProgress: gameState.mazeProgress,
        distanceToSafety: Math.round(Phaser.Math.Distance.Between(player.x, player.y, monkey.x, monkey.y) / TILE_SIZE)
      }));
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
      scene: { preload, create, update },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameInstance.current = new Phaser.Game(config);

    return () => { if (gameInstance.current) { gameInstance.current.destroy(true); } };
  }, [onComplete]);

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Game Status Display */}
      <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <GiRun size={20} color="#8b4513" />
          <span>Jungle Explorer</span>
        </div>
        <div className="flex items-center gap-2">
          <FaSkull size={20} color="#ff4444" />
          <span>Relentless Beast</span>
        </div>
        <div className="flex items-center gap-2">
          <GiMonkey size={20} color="#8b4513" />
          <span>Sacred Monkey</span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="w-full max-w-3xl">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>🌿 Health</span>
          <span>{uiState.health}/100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-300 ${
              uiState.health > 75 ? 'bg-green-500' : 
              uiState.health > 50 ? 'bg-yellow-500' : 
              uiState.health > 25 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(2, uiState.health)}%` }}
          ></div>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-green-600 shadow-lg mx-auto bg-gradient-to-b from-green-800 to-green-900"
          style={{ maxWidth: '800px' }}
        />
      </div>
        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs text-center text-yellow-300 mb-2">
              📱 D-pad: Move through jungle  • ATTACK: Fight beast 
            </div>
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
          </div>
        </div>
      

      {/* SQL Query Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="text-xl text-green-400 mb-4 text-center">🐒 Free the Sacred Monkey 🐒</h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              You reached the jungle sanctuary! Query the weapons database to unlock combat mode:
            </p>
            
            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-cyan-400 text-xs font-mono mb-2"><strong>Schema:</strong></p>
              <p className="text-yellow-300 text-xs">weapons: name, power, durability, agility, weight</p>
              <p className="text-slate-400 text-xs mt-1">Find weapons (name , power , durability) with agility greater than and equal too 80, power greater than 70, weight less than 10</p>
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT name, power, durability FROM weapons WHERE..."
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={4}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              style={{ outline: 'none' }}
            />
            
            {queryError && (
              <div className="mt-2 p-2 bg-red-900/50 border border-red-600 rounded text-red-300 text-xs">
                {queryError}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleQuerySubmit}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                ⚔️ Enable Jungle Combat!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="text-slate-300 mb-2">🌿 Jungle Survival Challenge:</div>
        <div className="text-lg">
          {uiState.gamePhase === 'running' ? (
            <span className="text-red-400 font-bold animate-pulse">
              🏃 Navigate to the monkey cage! One relentless beast is constantly chasing you!
            </span>
          ) : uiState.gamePhase === 'safe' ? (
            <span className="text-yellow-400 font-bold">
              🛡️ Safe in the sanctuary! Write the SQL query to fight back!
            </span>
          ) : uiState.gamePhase === 'fighting' ? (
            uiState.enemyDefeated ? (
              <span className="text-green-400 font-bold">
                ✅ Jungle beast defeated! Sacred monkey is free!
              </span>
            ) : (
              <span className="text-orange-400 font-bold">
                ⚔️ Combat enabled! Defeat the jungle beast to free the monkey!
              </span>
            )
          ) : (
            <span className="text-cyan-400 font-bold">
              🏆 Jungle conquered! Beast defeated and monkey rescued!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          🎮 Fixed wall collision • Single pursuing enemy • Health-based survival system!
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl p-3 hidden md:block bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="text-slate-400 text-sm mb-2 text-center"><strong>CONTROLS:</strong></div>
        
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→: Navigate Jungle </div>
            <div>SPACE: Attack Beast </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .pixel-font {
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
};

export default Level5;
