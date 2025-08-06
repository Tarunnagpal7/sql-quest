import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiCrosshair, GiPistolGun, GiSailboat } from "react-icons/gi";
import { FaSkull } from "react-icons/fa";
import MobileControls from '../MobileControls';

const Level4 = ({ onComplete }) => {
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
    bullets: 7,
    enemiesKilled: 0,
    totalEnemies: 5,
    showQueryInput: false,
    gamePhase: 'shooting', // 'shooting', 'building', 'completed'
    aimPosition: { x: 400, y: 250 },
    isQueryComplete: false
  });

  const [sqlQuery, setSqlQuery] = useState('SELECT    FROM guide_book WHERE category =    AND instructions    OR instructions   ;');
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

  const correctQueries = [
     // Without parentheses (original format)
  "SELECT instructions FROM guide_book WHERE category = 'raft' AND instructions LIKE '%bamboo%' OR instructions LIKE '%vines%';",
  "select instructions from guide_book where category = 'raft' and instructions like '%bamboo%' or instructions like '%vines%';",
  
  // With parentheses (better SQL practice)
  "SELECT instructions FROM guide_book WHERE category = 'raft' AND (instructions LIKE '%bamboo%' OR instructions LIKE '%vines%');",
  "select instructions from guide_book where category = 'raft' and (instructions like '%bamboo%' or instructions like '%vines%');",
  
  // Variations without spaces
  "SELECT instructions FROM guide_book WHERE category='raft' AND instructions LIKE'%bamboo%' OR instructions LIKE'%vines%';",
  "select instructions from guide_book where category='raft' and instructions like'%bamboo%' or instructions like'%vines%';"
];

const handleQuerySubmit = () => {
  // Normalize user input - remove extra spaces and convert to lowercase
  const normalizedInput = sqlQuery.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Check for required keywords that must be present in the query
  const requiredKeywords = [
    'select',
    'instructions', 
    'from',
    'guide_book',
    'where',
    'category',
    '=',
    "'raft'",
    'and',
    'instructions',
    'like',
    "'%bamboo%'",
    'or',
    'instructions',
    'like', 
    "'%vines%'"
  ];

  // Verify all required keywords exist in the normalized input
  const hasAllKeywords = requiredKeywords.every(keyword => 
    normalizedInput.includes(keyword)
  );

  if (hasAllKeywords) {
    setQueryError('');
    setUiState(prev => ({ 
      ...prev, 
      showQueryInput: false, 
      isQueryComplete: true, 
      gamePhase: 'completed' 
    }));
    
    // Complete the level
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].completeLevel();
    }
  } else {
    setQueryError('Wrong! expected keywords : instructions , raft , like , %, bamboo , vines');
    setTimeout(() => setQueryError(''), 5000);
  }
};

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, enemies, bullets, aimCrosshair, riverPort;
    let cursors, spaceKey;
    
    const gameState = {
      health: 100,
      bullets: 7,
      maxBullets: 7,
      enemiesKilled: 0,
      totalEnemies: 5,
      gamePhase: 'shooting',
      aimPosition: { x: 400, y: 250 },
      canShoot: true,
      shootCooldown: 500,
      invulnerable: false,
      invulnerabilityTime: 1000,
      isLevelComplete: false
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      // Create tactical wizard (corner position)
      const wizardGraphics = this.add.graphics();
      
      // Wizard with gun
      wizardGraphics.fillStyle(0x1e40af, 1); // Blue robe
      wizardGraphics.fillCircle(15, 20, 12);
      wizardGraphics.fillRect(3, 12, 24, 18);
      
      // Wizard face
      wizardGraphics.fillStyle(0xfbbf24, 1);
      wizardGraphics.fillCircle(15, 15, 6);
      
      // Eyes
      wizardGraphics.fillStyle(0x000000, 1);
      wizardGraphics.fillCircle(12, 14, 1.5);
      wizardGraphics.fillCircle(18, 14, 1.5);
      
      // Gun in hands
      wizardGraphics.fillStyle(0x666666, 1);
      wizardGraphics.fillRect(25, 18, 12, 4); // Gun body
      wizardGraphics.fillRect(37, 19, 4, 2); // Gun barrel
      
      // Gun details
      wizardGraphics.fillStyle(0x333333, 1);
      wizardGraphics.fillRect(26, 19, 2, 2); // Trigger
      wizardGraphics.fillRect(30, 17, 4, 1); // Sight
      
      wizardGraphics.generateTexture('tactical_wizard', 45, 35);
      wizardGraphics.destroy();
      
      // Create river port enemies
      const enemyTypes = ['bandit', 'pirate', 'mercenary', 'guard', 'assassin'];
      const enemyColors = [0x8b4513, 0x000080, 0x8b0000, 0x556b2f, 0x2f2f2f];
      
      enemyTypes.forEach((type, index) => {
        const enemyGraphics = this.add.graphics();
        const color = enemyColors[index];
        
        // Enemy body
        enemyGraphics.fillStyle(color, 1);
        enemyGraphics.fillRect(8, 20, 16, 18);
        enemyGraphics.fillCircle(16, 12, 8);
        
        // Enemy weapon
        enemyGraphics.fillStyle(0x666666, 1);
        if (type === 'bandit') {
          enemyGraphics.fillRect(26, 18, 8, 3); // Rifle
        } else if (type === 'pirate') {
          enemyGraphics.fillRect(26, 19, 6, 2); // Pistol
          enemyGraphics.fillRect(24, 15, 3, 8); // Hook hand
        } else if (type === 'mercenary') {
          enemyGraphics.fillRect(26, 17, 10, 4); // Machine gun
        } else if (type === 'guard') {
          enemyGraphics.fillRect(26, 18, 8, 3); // Rifle
          enemyGraphics.fillRect(24, 12, 6, 3); // Helmet
        } else if (type === 'assassin') {
          enemyGraphics.fillRect(26, 19, 6, 2); // Silenced pistol
          enemyGraphics.fillStyle(0x000000, 1);
          enemyGraphics.fillRect(14, 10, 4, 4); // Mask
        }
        
        // Enemy eyes (red glow)
        enemyGraphics.fillStyle(0xff0000, 1);
        enemyGraphics.fillCircle(13, 10, 1.5);
        enemyGraphics.fillCircle(19, 10, 1.5);
        
        enemyGraphics.generateTexture(type, 35, 40);
        enemyGraphics.destroy();
      });
      
      // Create crosshair
      const crosshairGraphics = this.add.graphics();
      crosshairGraphics.lineStyle(3, 0xff0000, 1);
      crosshairGraphics.beginPath();
      crosshairGraphics.moveTo(-15, 0);
      crosshairGraphics.lineTo(-5, 0);
      crosshairGraphics.moveTo(5, 0);
      crosshairGraphics.lineTo(15, 0);
      crosshairGraphics.moveTo(0, -15);
      crosshairGraphics.lineTo(0, -5);
      crosshairGraphics.moveTo(0, 5);
      crosshairGraphics.lineTo(0, 15);
      crosshairGraphics.strokePath();
      
      // Center dot
      crosshairGraphics.fillStyle(0xff0000, 1);
      crosshairGraphics.fillCircle(0, 0, 2);
      
      crosshairGraphics.generateTexture('crosshair', 30, 30);
      crosshairGraphics.destroy();
      
      // Create bullet
      const bulletGraphics = this.add.graphics();
      bulletGraphics.fillStyle(0xffd700, 1);
      bulletGraphics.fillCircle(3, 3, 3);
      bulletGraphics.fillStyle(0xffff00, 0.8);
      bulletGraphics.fillCircle(3, 3, 2);
      bulletGraphics.generateTexture('bullet', 6, 6);
      bulletGraphics.destroy();
      
      // Create river port background
      const portGraphics = this.add.graphics();
      
      // Water
      portGraphics.fillStyle(0x4682b4, 1);
      portGraphics.fillRect(0, 0, 800, 500);
      
      // Wooden dock
      portGraphics.fillStyle(0x8b4513, 1);
      portGraphics.fillRect(0, 400, 800, 100);
      
      // Dock planks
      portGraphics.fillStyle(0x654321, 1);
      for (let i = 0; i < 20; i++) {
        portGraphics.fillRect(0, 402 + (i * 5), 800, 2);
      }
      
      // Dock posts
      for (let i = 0; i < 8; i++) {
        const x = 100 + (i * 100);
        portGraphics.fillStyle(0x8b4513, 1);
        portGraphics.fillRect(x, 350, 8, 50);
      }
      
      // Raft building area
      portGraphics.fillStyle(0x654321, 1);
      portGraphics.fillRect(350, 420, 100, 60);
      portGraphics.fillStyle(0xffd700, 1);
      portGraphics.fillRect(360, 430, 80, 40);
      
      portGraphics.generateTexture('river_port_bg', 800, 500);
      portGraphics.destroy();
      
      // Create explosion effect
      const explosionGraphics = this.add.graphics();
      explosionGraphics.fillStyle(0xff6b35, 1);
      explosionGraphics.fillCircle(15, 15, 15);
      explosionGraphics.fillStyle(0xffd23f, 1);
      explosionGraphics.fillCircle(15, 15, 10);
      explosionGraphics.fillStyle(0xffff00, 1);
      explosionGraphics.fillCircle(15, 15, 5);
      explosionGraphics.generateTexture('explosion', 30, 30);
      explosionGraphics.destroy();
    }

    function create() {
      // Background
      this.add.image(400, 250, 'river_port_bg');
      
      // Physics groups
      enemies = this.physics.add.group();
      bullets = this.physics.add.group();
      
      // Player wizard (fixed in corner)
      player = this.physics.add.sprite(60, 420, 'tactical_wizard');
      player.body.setImmovable(true);
      player.body.setSize(35, 30);
      
      // Crosshair
      aimCrosshair = this.add.sprite(gameState.aimPosition.x, gameState.aimPosition.y, 'crosshair');
      aimCrosshair.setDepth(100);
      
      // Controls
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // Collision detection
      this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
      this.physics.add.overlap(player, enemies, enemyHitPlayer, null, this);
      
      // Add methods
      this.completeLevel = completeLevel;
      this.restartLevel = restartLevel;
      
      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      // Clear existing entities
      enemies.clear(true, true);
      bullets.clear(true, true);
      
      // Reset game state
      gameState.health = 100;
      gameState.bullets = 7;
      gameState.enemiesKilled = 0;
      gameState.gamePhase = 'shooting';
      gameState.aimPosition = { x: 400, y: 250 };
      gameState.canShoot = true;
      gameState.invulnerable = false;
      gameState.isLevelComplete = false;
      
      // Reset player
      player.setPosition(60, 420);
      player.clearTint();
      
      // Reset crosshair
      aimCrosshair.setPosition(gameState.aimPosition.x, gameState.aimPosition.y);
      
      // Create enemies around the port
      createEnemies.call(this);
      
      showMessage('🎯 Defend the River Port! Use your weapons from Level 3!\n7 bullets, 5 enemies. Aim carefully!', 4000);
      updateReactUI();
    }

    function createEnemies() {
      const enemyPositions = [
        { x: 200, y: 200, type: 'bandit' },
        { x: 400, y: 150, type: 'pirate' },
        { x: 600, y: 180, type: 'mercenary' },
        { x: 300, y: 300, type: 'guard' },
        { x: 500, y: 320, type: 'assassin' }
      ];
      
      enemyPositions.forEach((pos, index) => {
        const enemy = enemies.create(pos.x, pos.y, pos.type);
        enemy.setCollideWorldBounds(true);
        enemy.body.setSize(25, 35);
        enemy.health = 100;
        enemy.enemyType = pos.type;
        enemy.attackDamage = 20;
        enemy.lastAttack = 0;
        enemy.attackRate = 2000 + (index * 500); // Different attack rates
        
        // Enemy movement pattern
        enemy.patrolStart = pos.x - 50;
        enemy.patrolEnd = pos.x + 50;
        enemy.direction = 1;
        enemy.speed = 30 + (Math.random() * 20);
        
        // Add floating animation
        sceneRef.tweens.add({
          targets: enemy,
          y: enemy.y - 5,
          duration: 1500 + (index * 200),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Add enemy glow
        sceneRef.tweens.add({
          targets: enemy,
          alpha: 0.8,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      });
    }

    function update() {
      if (gameState.isLevelComplete || gameState.gamePhase === 'completed') return;
      
      const aimSpeed = 300;
      
      // Crosshair aiming controls
      if (cursors.up.isDown || mobileControlsRef.current.up) {
        gameState.aimPosition.y = Math.max(50, gameState.aimPosition.y - aimSpeed * this.game.loop.delta / 1000);
        aimCrosshair.setPosition(gameState.aimPosition.x, gameState.aimPosition.y);
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        gameState.aimPosition.y = Math.min(350, gameState.aimPosition.y + aimSpeed * this.game.loop.delta / 1000);
        aimCrosshair.setPosition(gameState.aimPosition.x, gameState.aimPosition.y);
      }
      
      if (cursors.left.isDown || mobileControlsRef.current.left) {
        gameState.aimPosition.x = Math.max(150, gameState.aimPosition.x - aimSpeed * this.game.loop.delta / 1000);
        aimCrosshair.setPosition(gameState.aimPosition.x, gameState.aimPosition.y);
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
        gameState.aimPosition.x = Math.min(750, gameState.aimPosition.x + aimSpeed * this.game.loop.delta / 1000);
        aimCrosshair.setPosition(gameState.aimPosition.x, gameState.aimPosition.y);
      }
      
      // Shooting
      if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControlsRef.current.attack) && gameState.canShoot && gameState.bullets > 0) {
        shoot.call(this);
      }
      
      // Update bullets
      bullets.children.entries.forEach(bullet => {
        if (!bullet.active) return;
        
        // Remove bullets that go off screen
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 500) {
          bullet.destroy();
        }
      });
      
      // Enemy AI and attacks
      enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        // Simple patrol movement
        enemy.x += enemy.direction * enemy.speed * this.game.loop.delta / 1000;
        
        if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
          enemy.direction *= -1;
        }
        
        // Enemy attacks
        if (sceneRef.time.now - enemy.lastAttack > enemy.attackRate) {
          enemyAttack(enemy);
          enemy.lastAttack = sceneRef.time.now;
        }
      });
      
      // Check win condition
      if (gameState.enemiesKilled >= gameState.totalEnemies && gameState.gamePhase === 'shooting') {
        allEnemiesDefeated();
      }
      
      // Check lose condition
      if (gameState.bullets <= 0 && enemies.children.entries.length > 0 && gameState.gamePhase === 'shooting') {
        gameOver('Out of bullets! You failed to secure the port!');
      }
      
      updateReactUI();
    }

    function shoot() {
      if (!gameState.canShoot || gameState.bullets <= 0) return;
      
      gameState.canShoot = false;
      gameState.bullets--;
      
      // Create bullet
      const bullet = bullets.create(player.x + 20, player.y, 'bullet');
      bullet.setCollideWorldBounds(false);
      bullet.body.setSize(5, 5);
      
      // Calculate trajectory to crosshair
      const angle = Phaser.Math.Angle.Between(player.x, player.y, gameState.aimPosition.x, gameState.aimPosition.y);
      const speed = 600;
      
      bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      bullet.setRotation(angle);
      
      // Muzzle flash effect
      const flash = sceneRef.add.circle(player.x + 25, player.y, 8, 0xffff00, 0.8);
      sceneRef.tweens.add({
        targets: flash,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 100,
        onComplete: () => flash.destroy()
      });
      
      // Screen shake
      sceneRef.cameras.main.shake(100, 0.01);
      
      // Cooldown
      sceneRef.time.delayedCall(gameState.shootCooldown, () => {
        gameState.canShoot = true;
      });
      
      updateReactUI();
    }

    function bulletHitEnemy(bullet, enemy) {
      enemy.health -= 100; // One shot kill
      
      // Explosion effect
      const explosion = sceneRef.add.sprite(enemy.x, enemy.y, 'explosion');
      sceneRef.tweens.add({
        targets: explosion,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => explosion.destroy()
      });
      
      // Screen shake
      sceneRef.cameras.main.shake(200, 0.02);
      
      // Remove enemy and bullet
      gameState.enemiesKilled++;
      enemy.destroy();
      bullet.destroy();
      
      updateReactUI();
    }

    function enemyAttack(enemy) {
      if (gameState.invulnerable) return;
      
      // Enemy shoots at player
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      const accuracy = Math.max(0.3, 1 - (distance / 400)); // Closer = more accurate
      
      if (Math.random() < accuracy) {
        // Hit player
        gameState.health -= enemy.attackDamage;
        gameState.invulnerable = true;
        
        player.setTint(0xff0000);
        sceneRef.cameras.main.shake(300, 0.02);
        
        // Muzzle flash from enemy
        const enemyFlash = sceneRef.add.circle(enemy.x + 15, enemy.y, 6, 0xff6666, 0.8);
        sceneRef.tweens.add({
          targets: enemyFlash,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 150,
          onComplete: () => enemyFlash.destroy()
        });
        
        if (gameState.health <= 0) {
          gameOver('💀 The port defenders overwhelmed you!');
          return;
        }
        
        // Remove invulnerability
        sceneRef.time.delayedCall(gameState.invulnerabilityTime, () => {
          gameState.invulnerable = false;
          if (player.active) player.clearTint();
        });
      } else {
        // Miss - show muzzle flash only
        const enemyFlash = sceneRef.add.circle(enemy.x + 15, enemy.y, 6, 0xff6666, 0.6);
        sceneRef.tweens.add({
          targets: enemyFlash,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 150,
          onComplete: () => enemyFlash.destroy()
        });
      }
      
      updateReactUI();
    }

    function allEnemiesDefeated() {
      gameState.gamePhase = 'building';
      
      // Success effect
      const victoryEffect = sceneRef.add.circle(400, 250, 100, 0x00ff00, 0.6);
      sceneRef.tweens.add({
        targets: victoryEffect,
        scaleX: 5,
        scaleY: 5,
        alpha: 0,
        duration: 1500,
        onComplete: () => victoryEffect.destroy()
      });
      
      showMessage('🎯 All enemies defeated! Now access the guide book to build your raft!', 3000);
      
      // Auto-open query after delay
      sceneRef.time.delayedCall(3000, () => {
        setUiState(prev => ({ ...prev, showQueryInput: true }));
      });
      
      updateReactUI();
    }

    function enemyHitPlayer(player, enemy) {
      // This handles melee contact (rare)
      if (gameState.invulnerable) return;
      
      gameState.health -= 30;
      gameState.invulnerable = true;
      
      player.setTint(0xff0000);
      sceneRef.cameras.main.shake(400, 0.03);
      
      if (gameState.health <= 0) {
        gameOver('💀 An enemy got too close!');
        return;
      }
      
      // Knockback enemy
      const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      enemy.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      
      // Remove invulnerability
      sceneRef.time.delayedCall(gameState.invulnerabilityTime, () => {
        gameState.invulnerable = false;
        if (player.active) player.clearTint();
      });
      
      updateReactUI();
    }

    function completeLevel() {
      gameState.isLevelComplete = true;
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 120, '🚤 River Port Secured! Raft Built! 🚤', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      
      const statsText = sceneRef.add.text(400, 250, `🎯 Enemies Defeated: ${gameState.enemiesKilled}/${gameState.totalEnemies}\n🔫 Bullets Used: ${gameState.maxBullets - gameState.bullets}/${gameState.maxBullets}\n💚 Health Remaining: ${gameState.health}/100`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#90ee90',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const skillsText = sceneRef.add.text(400, 340, '🏆 Skills Mastered:\n• Tactical shooting & aiming\n• Fill-in-the-blank SQL queries\n• Resource management (bullets)\n• Level 3 weapons utilized', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 430, 'Click to continue your adventure', {
        fontSize: '28px',
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
      const gameOverText = sceneRef.add.text(400, 200, `💀 MISSION FAILED 💀\n${message}`, {
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
        bullets: 7,
        enemiesKilled: 0,
        gamePhase: 'shooting',
        showQueryInput: false,
        isQueryComplete: false,
        aimPosition: { x: 400, y: 250 }
      }));
      
      setSqlQuery('SELECT    FROM guide_book WHERE category =    AND instructions    OR instructions   ;');
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
        bullets: gameState.bullets,
        enemiesKilled: gameState.enemiesKilled,
        gamePhase: gameState.gamePhase,
        aimPosition: { ...gameState.aimPosition }
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
          <GiCrosshair size={20} color="#ff0000" />
          <span>Tactical Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <FaSkull size={20} color="#8b0000" />
          <span>Port Enemies</span>
        </div>
        <div className="flex items-center gap-2">
          <GiSailboat size={20} color="#4682b4" />
          <span>River Port</span>
        </div>
      </div>



      {/* Game Container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-red-500 shadow-lg mx-auto bg-gradient-to-b from-blue-400 to-blue-700"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      {/* Game Stats */}
      <div className="w-full max-w-3xl grid grid-cols-3 gap-4 text-sm">
        <div>Health: <span className={`${uiState.health > 60 ? 'text-green-400' : uiState.health > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          {uiState.health}/100
        </span></div>
        <div>Bullets: <span className={`${uiState.bullets > 3 ? 'text-green-400' : uiState.bullets > 1 ? 'text-yellow-400' : 'text-red-400'}`}>
          {uiState.bullets}/7
        </span></div>
        <div>Enemies: <span className="text-red-400">{uiState.totalEnemies - uiState.enemiesKilled}/{uiState.totalEnemies}</span></div>
      </div>

      {/* SQL Query Modal - Fill in the blanks */}
      {/* SQL Query Modal - Fill in the blanks with LIKE conditions */}
{uiState.showQueryInput && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
      <h3 className="text-xl text-green-400 mb-4 text-center">📖 Raft Building Guide Book 📖</h3>
      <p className="text-slate-300 mb-4 text-sm text-center">
        Port secured! Fill in the blanks to find raft instructions with specific materials:
      </p>
      
      <div className="bg-black p-3 rounded border mb-4">
        <p className="text-cyan-400 text-xs font-mono mb-2"><strong>Schema:</strong></p>
        <p className="text-yellow-300 text-xs">guide_book: id, instructions, category, author , page_number</p>
        <p className="text-slate-400 text-xs mt-1">Find  instructions containing "bamboo" or "vines" where category is raft.</p>
      </div>
      
      <textarea
        value={sqlQuery}
        onChange={(e) => setSqlQuery(e.target.value)}
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
          🚤 Build Raft & Escape!
        </button>
      </div>
    </div>
  </div>
)}

        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs text-center text-yellow-300 mb-2">
              📱 D-pad: Move red crosshair • ATTACK: Shoot bullets
            </div>
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
          </div>
        </div>
      {/* Game Instructions */}
      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="text-slate-300 mb-2">🎯 Tactical Port Defense:</div>
        <div className="text-lg">
          {uiState.gamePhase === 'shooting' ? (
            <span className="text-red-400 font-bold">
              🔫 Aim with crosshair!
            </span>
          ) : uiState.gamePhase === 'building' ? (
            <span className="text-yellow-400 font-bold animate-pulse">
              📖 Port secured! Fill in the SQL blanks to build your escape raft!
            </span>
          ) : (
            <span className="text-cyan-400 font-bold">
              ✅ Mission complete! Port defended and raft built!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          🎮 Fixed position tactical shooter! Aim carefully - limited ammo!
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl p-3 hidden md:block bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="text-slate-400 text-sm mb-2 text-center"><strong> CONTROLS:</strong></div>
        
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→: Move Crosshair</div>
            <div>SPACE: Shoot</div>
          </div>
        </div>

      </div>

      <style >{`
        .pixel-font {
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
};

export default Level4;
