import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiCrossedSwords, GiVolcano } from "react-icons/gi";
import { FaExclamationTriangle } from "react-icons/fa";
import MobileControls from '../MobileControls'; // Import the component

const Level7 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    interact: false // Added interact control
  });
  
  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    explorersFound: 0,
    totalExplorers: 4,
    weaponsFound: 0,
    totalWeapons: 3,
    armedHeroes: 0,
    totalArmedHeroes: 3,
    showQueryInput: false,
    evacuationComplete: false,
    timeRemaining: 120
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');
  const [querySuccess, setQuerySuccess] = useState(false);

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    interact: false
  });

  // Memoized mobile control handlers
  const handleMobileControlStart = useCallback((direction) => {
    // Update both ref and state
    mobileControlsRef.current[direction] = true;
    setMobileControls((prev) => {
      if (prev[direction]) return prev;
      return { ...prev, [direction]: true };
    });
  }, []);

  const handleMobileControlEnd = useCallback((direction) => {
    // Update both ref and state
    mobileControlsRef.current[direction] = false;
    setMobileControls((prev) => {
      if (!prev[direction]) return prev;
      return { ...prev, [direction]: false };
    });
  }, []);

  const handleAttack = useCallback(() => {
    // Update both ref and state
    mobileControlsRef.current.attack = true;
    setMobileControls((prev) => ({ ...prev, attack: true }));
    setTimeout(() => {
      mobileControlsRef.current.attack = false;
      setMobileControls((prev) => ({ ...prev, attack: false }));
    }, 50);
  }, []);

  const handleInteract = useCallback(() => {
    // Update both ref and state
    mobileControlsRef.current.interact = true;
    setMobileControls((prev) => ({ ...prev, interact: true }));
    setTimeout(() => {
      mobileControlsRef.current.interact = false;
      setMobileControls((prev) => ({ ...prev, interact: false }));
    }, 50);
  }, []);

  // Expected correct queries
  const correctQueries = [
    "SELECT e.name, w.weapon_name FROM jungle_explorers e JOIN weapons w ON e.id = w.owner_id;",
    "select e.name, w.weapon_name from jungle_explorers e join weapons w on e.id = w.owner_id;",
    "SELECT e.name, w.weapon_name FROM jungle_explorers e JOIN weapons w ON e.id = w.owner_id",
    "select e.name, w.weapon_name from jungle_explorers e join weapons w on e.id = w.owner_id"
  ];

  const handleQuerySubmit = () => {
    // Check if there's still time
    if (gameInstance.current?.scene?.scenes[0]?.gameState?.timeRemaining <= 0) {
      setQueryError('Time expired! Level restarting...');
      return;
    }
    
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
      setQueryError('Query failed! Use JOIN to find which explorers have weapons.');
      setTimeout(() => setQueryError(''), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, explorers, weapons, volcanoMonsters, walls, evacuationZone;
    let cursors, spaceKey, interactKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      canInteract: true,
      attackCooldown: 400,
      explorersFound: 0,
      totalExplorers: 4,
      weaponsFound: 0,
      totalWeapons: 3,
      armedHeroes: 0,
      totalArmedHeroes: 3,
      queryComplete: false,
      evacuationComplete: false,
      timeRemaining: 120,
      timeLimit: 120,
      explorersData: [
        { id: 1, name: 'Maya', courage_level: 85, found: false, hasWeapon: true, weaponName: 'Fire Sword' },
        { id: 2, name: 'Jin', courage_level: 75, found: false, hasWeapon: true, weaponName: 'Ice Bow' },
        { id: 3, name: 'Alex', courage_level: 90, found: false, hasWeapon: true, weaponName: 'Lightning Staff' },
        { id: 4, name: 'Tom', courage_level: 60, found: false, hasWeapon: false, weaponName: null }
      ],
      weaponsData: [
        { id: 1, weapon_name: 'Fire Sword', owner_id: 1, found: false },
        { id: 2, weapon_name: 'Ice Bow', owner_id: 2, found: false },
        { id: 3, weapon_name: 'Lightning Staff', owner_id: 3, found: false }
      ]
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      sceneRef.gameState = gameState;
      
      // --- Create Fire Wizard Character ---
      const playerGraphics = this.add.graphics();
      
      // Fire wizard robe (red/orange theme for volcanic setting)
      playerGraphics.fillStyle(0xff4500, 1);
      playerGraphics.fillCircle(20, 30, 16);
      playerGraphics.fillRect(4, 18, 32, 24);
      
      // Fire wizard hood
      playerGraphics.fillStyle(0xdc143c, 1);
      playerGraphics.fillCircle(20, 15, 12);
      
      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(20, 20, 8);
      
      // Glowing fire eyes
      playerGraphics.fillStyle(0xff6347, 0.8);
      playerGraphics.fillCircle(17, 19, 3);
      playerGraphics.fillCircle(23, 19, 3);
      playerGraphics.fillStyle(0xffffff, 1);
      playerGraphics.fillCircle(17, 19, 1);
      playerGraphics.fillCircle(23, 19, 1);
      
      // Fire staff
      playerGraphics.lineStyle(4, 0x8b0000);
      playerGraphics.beginPath();
      playerGraphics.moveTo(28, 42);
      playerGraphics.lineTo(30, 22);
      playerGraphics.strokePath();
      
      // Fire orb on staff
      playerGraphics.fillStyle(0xff0000, 0.9);
      playerGraphics.fillCircle(30, 20, 6);
      playerGraphics.fillStyle(0xffa500, 0.7);
      playerGraphics.fillCircle(30, 20, 4);
      
      playerGraphics.generateTexture('player', 45, 50);
      playerGraphics.destroy();
      
      // --- Create Explorers ---
      gameState.explorersData.forEach(explorer => {
        const explorerGraphics = this.add.graphics();
        
        // Explorer body
        explorerGraphics.fillStyle(0x8b4513, 1);
        explorerGraphics.fillRect(8, 20, 16, 18);
        explorerGraphics.fillCircle(16, 15, 8);
        
        // Face
        explorerGraphics.fillStyle(0xfdbcb4, 1);
        explorerGraphics.fillCircle(16, 15, 6);
        
        // Eyes
        explorerGraphics.fillStyle(0x000000, 1);
        explorerGraphics.fillCircle(13, 14, 2);
        explorerGraphics.fillCircle(19, 14, 2);
        
        // Visual indicator if they have weapon
        if (explorer.hasWeapon) {
          // Green glow for armed explorers
          explorerGraphics.fillStyle(0x00ff00, 0.4);
          explorerGraphics.fillCircle(16, 20, 25);
          
          // Weapon silhouette
          explorerGraphics.fillStyle(0xc0c0c0, 1);
          if (explorer.weaponName === 'Fire Sword') {
            explorerGraphics.fillRect(25, 12, 2, 16);
            explorerGraphics.fillRect(23, 12, 6, 3);
          } else if (explorer.weaponName === 'Ice Bow') {
            explorerGraphics.lineStyle(2, 0xc0c0c0);
            explorerGraphics.beginPath();
            explorerGraphics.arc(26, 18, 6, 0, Math.PI);
            explorerGraphics.strokePath();
            explorerGraphics.fillRect(25, 18, 1, 8);
          } else if (explorer.weaponName === 'Lightning Staff') {
            explorerGraphics.fillRect(25, 16, 2, 12);
            explorerGraphics.fillCircle(26, 14, 3);
          }
        } else {
          // Red glow for unarmed explorer
          explorerGraphics.fillStyle(0xff6666, 0.4);
          explorerGraphics.fillCircle(16, 20, 25);
        }
        
        explorerGraphics.generateTexture(`explorer_${explorer.name.toLowerCase()}`, 40, 45);
        explorerGraphics.destroy();
      });
      
      // --- Create Weapon Crates ---
      const weaponTypes = ['fire_sword', 'ice_bow', 'lightning_staff'];
      const weaponColors = [0xff4500, 0x87ceeb, 0xffff00];
      
      weaponTypes.forEach((type, index) => {
        const weaponGraphics = this.add.graphics();
        const color = weaponColors[index];
        
        // Weapon crate
        weaponGraphics.fillStyle(0x8b4513, 1);
        weaponGraphics.fillRect(8, 12, 16, 16);
        
        // Crate details
        weaponGraphics.fillStyle(0x654321, 1);
        weaponGraphics.fillRect(8, 16, 16, 2);
        weaponGraphics.fillRect(14, 12, 4, 16);
        
        // Weapon inside crate
        weaponGraphics.fillStyle(color, 0.8);
        if (type === 'fire_sword') {
          weaponGraphics.fillRect(14, 14, 2, 10);
          weaponGraphics.fillRect(12, 14, 6, 2);
          // Fire effect
          weaponGraphics.fillStyle(0xff0000, 0.6);
          weaponGraphics.fillCircle(16, 16, 12);
        } else if (type === 'ice_bow') {
          weaponGraphics.lineStyle(2, color);
          weaponGraphics.beginPath();
          weaponGraphics.arc(16, 18, 4, 0, Math.PI);
          weaponGraphics.strokePath();
          weaponGraphics.fillRect(15, 18, 1, 6);
          // Ice effect
          weaponGraphics.fillStyle(0x00ffff, 0.6);
          weaponGraphics.fillCircle(16, 16, 12);
        } else if (type === 'lightning_staff') {
          weaponGraphics.fillRect(15, 16, 2, 8);
          weaponGraphics.fillCircle(16, 14, 2);
          // Lightning effect
          weaponGraphics.fillStyle(0xffff00, 0.6);
          weaponGraphics.fillCircle(16, 16, 12);
        }
        
        // Magical aura
        weaponGraphics.fillStyle(color, 0.3);
        weaponGraphics.fillCircle(16, 16, 20);
        
        weaponGraphics.generateTexture(type, 32, 32);
        weaponGraphics.destroy();
      });
      
      // --- Create Volcano Monsters ---
      const monsterTypes = ['lava_beast', 'fire_elemental'];
      const monsterColors = [0x8b0000, 0xff4500];
      
      monsterTypes.forEach((type, index) => {
        const monsterGraphics = this.add.graphics();
        const color = monsterColors[index];
        
        if (type === 'lava_beast') {
          // Lava Beast
          monsterGraphics.fillStyle(color, 1);
          monsterGraphics.fillEllipse(20, 25, 24, 20);
          monsterGraphics.fillCircle(30, 18, 10);
          
          // Lava glow
          monsterGraphics.fillStyle(0xff6347, 0.8);
          monsterGraphics.fillCircle(20, 25, 30);
          
          // Glowing eyes
          monsterGraphics.fillStyle(0xffff00, 1);
          monsterGraphics.fillCircle(27, 16, 3);
          monsterGraphics.fillCircle(33, 16, 3);
          
        } else if (type === 'fire_elemental') {
          // Fire Elemental
          monsterGraphics.fillStyle(color, 0.8);
          monsterGraphics.fillRect(8, 18, 16, 20);
          
          // Fire effects
          monsterGraphics.fillStyle(0xff0000, 0.9);
          monsterGraphics.fillCircle(16, 20, 25);
          monsterGraphics.fillStyle(0xffa500, 0.7);
          monsterGraphics.fillCircle(16, 20, 18);
          monsterGraphics.fillStyle(0xffff00, 0.5);
          monsterGraphics.fillCircle(16, 20, 12);
        }
        
        monsterGraphics.generateTexture(type, 40, 45);
        monsterGraphics.destroy();
      });
      
      // --- Create Evacuation Zone ---
      const evacuationGraphics = this.add.graphics();
      
      // Safe zone platform
      evacuationGraphics.fillStyle(0x00ff00, 0.6);
      evacuationGraphics.fillCircle(40, 40, 35);
      
      // Portal effect
      evacuationGraphics.fillStyle(0x87ceeb, 0.8);
      evacuationGraphics.fillCircle(40, 40, 25);
      evacuationGraphics.fillStyle(0x000080, 0.6);
      evacuationGraphics.fillCircle(40, 40, 15);
      
      // Portal energy rings
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = 40 + Math.cos(angle) * 20;
        const y = 40 + Math.sin(angle) * 20;
        evacuationGraphics.fillStyle(0x00ffff, 0.8);
        evacuationGraphics.fillCircle(x, y, 3);
      }
      
      evacuationGraphics.generateTexture('evacuation_zone', 80, 80);
      evacuationGraphics.destroy();

      // Create volcanic environment
      this.add.graphics().fillStyle(0x8b0000).fillRect(0, 0, 800, 500).generateTexture('volcanic_background', 800, 500);
      this.add.graphics().fillStyle(0x2f2f2f).fillRect(0, 0, 40, 40).generateTexture('volcanic_wall', 40, 40);
    }

    function create() {
      // Create volcanic background
      this.add.image(400, 250, 'volcanic_background');
      
      // Add volcanic atmosphere
      createVolcanicAtmosphere.call(this);
      
      walls = this.physics.add.staticGroup();
      explorers = this.physics.add.group();
      weapons = this.physics.add.group();
      volcanoMonsters = this.physics.add.group();
      
      player = this.physics.add.sprite(100, 450, 'player');
      player.setCollideWorldBounds(true).body.setSize(35, 40).setOffset(5, 5);
      
      // Create evacuation zone
      evacuationZone = this.physics.add.sprite(700, 100, 'evacuation_zone');
      evacuationZone.setImmovable(true);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      
      this.physics.add.collider(player, walls);
      this.physics.add.collider(volcanoMonsters, walls);
      this.physics.add.collider(volcanoMonsters, volcanoMonsters);
      
      this.physics.add.overlap(player, explorers, findExplorer, null, this);
      this.physics.add.overlap(player, weapons, findWeapon, null, this);
      this.physics.add.overlap(player, evacuationZone, reachEvacuation, null, this);
      this.physics.add.overlap(player, volcanoMonsters, hitByMonster, null, this);
      
      // Add methods to scene
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;
      
      createLevel.call(this);
      updateReactUI();
      
      // Start countdown timer
      startCountdownTimer.call(this);
    }

    function createLevel() {
      explorers.clear(true, true);
      weapons.clear(true, true);
      volcanoMonsters.clear(true, true);
      walls.clear(true, true);
      
      gameState.explorersFound = 0;
      gameState.weaponsFound = 0;
      gameState.armedHeroes = 0;
      gameState.queryComplete = false;
      gameState.evacuationComplete = false;
      gameState.timeRemaining = 120;
      gameState.isLevelComplete = false;
      
      // Reset data
      gameState.explorersData.forEach(explorer => explorer.found = false);
      gameState.weaponsData.forEach(weapon => weapon.found = false);
      
      // Create volcanic environment
      createVolcanicWalls.call(this);
      
      // Spawn explorers
      spawnExplorers.call(this);
      
      // Spawn weapon crates
      spawnWeapons.call(this);
      
      // Spawn volcano monsters
      spawnVolcanoMonsters.call(this);
      
      // Create UI display
      createGameDisplay.call(this);
      
      player.setPosition(100, 450).setVelocity(0, 0);
    }
    
    function createVolcanicAtmosphere() {
      // Create lava bubbles and fire particles
      for (let i = 0; i < 15; i++) {
        const particle = sceneRef.add.circle(
          Math.random() * 800,
          Math.random() * 500,
          3 + Math.random() * 4,
          0xff4500,
          0.7
        );
        
        sceneRef.tweens.add({
          targets: particle,
          y: particle.y - 100,
          alpha: 0,
          duration: 2000 + Math.random() * 1000,
          repeat: -1,
          delay: Math.random() * 2000
        });
      }
      
      // Create heat waves
      for (let i = 0; i < 4; i++) {
        const heatWave = sceneRef.add.rectangle(
          i * 200,
          500,
          60,
          500,
          0xff6347,
          0.1
        );
        
        sceneRef.tweens.add({
          targets: heatWave,
          alpha: 0.3,
          scaleX: 1.3,
          duration: 3000,
          yoyo: true,
          repeat: -1,
          delay: i * 800
        });
      }
    }
    
    function createVolcanicWalls() {
      // Simple volcanic cave layout
      const wallPositions = [
        // Outer walls
        [40, 40], [80, 40], [120, 40], [680, 40], [720, 40], [760, 40],
        [40, 460], [80, 460], [720, 460], [760, 460],
        [40, 80], [40, 120], [40, 160], [40, 200], [40, 240], [40, 280], [40, 320], [40, 360], [40, 400],
        [760, 80], [760, 120], [760, 160], [760, 200], [760, 240], [760, 280], [760, 320], [760, 360], [760, 400],
        
        // Simple interior formations
        [200, 120], [200, 200], [200, 280], [200, 360],
        [400, 80], [400, 160], [400, 240], [400, 320], [400, 400],
        [600, 120], [600, 200], [600, 280], [600, 360]
      ];
      
      wallPositions.forEach(pos => {
        const wall = walls.create(pos[0], pos[1], 'volcanic_wall');
        wall.body.setSize(35, 35);
        wall.setTint(0x8b0000);
      });
    }
    
    function spawnExplorers() {
      const explorerPositions = [
        { x: 150, y: 180, name: 'Maya' },
        { x: 320, y: 200, name: 'Jin' },
        { x: 480, y: 180, name: 'Alex' },
        { x: 220, y: 350, name: 'Tom' }
      ];
      
      explorerPositions.forEach(pos => {
        const explorerData = gameState.explorersData.find(e => e.name === pos.name);
        const explorer = explorers.create(pos.x, pos.y, `explorer_${explorerData.name.toLowerCase()}`);
        explorer.setCollideWorldBounds(true).body.setSize(30, 35).setOffset(5, 5);
        explorer.explorerData = explorerData;
        
        // Floating animation
        sceneRef.tweens.add({
          targets: explorer,
          y: explorer.y - 8,
          duration: 2000 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Name and info display
        const infoText = sceneRef.add.text(pos.x, pos.y - 30, `${explorerData.name}\nCourage: ${explorerData.courage_level}\nWeapon: ${explorerData.weaponName || 'None'}`, {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: explorerData.hasWeapon ? '#00ff00' : '#ff6666',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 },
          align: 'center'
        }).setOrigin(0.5);
        
        explorer.infoText = infoText;
        
        // Floating text animation
        sceneRef.tweens.add({
          targets: infoText,
          y: infoText.y - 5,
          duration: 2000 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
    
    function spawnWeapons() {
      const weaponPositions = [
        { x: 180, y: 120, type: 'fire_sword', owner_id: 1 },
        { x: 350, y: 140, type: 'ice_bow', owner_id: 2 },
        { x: 520, y: 120, type: 'lightning_staff', owner_id: 3 }
      ];
      
      weaponPositions.forEach(pos => {
        const weaponData = gameState.weaponsData.find(w => w.owner_id === pos.owner_id);
        const weapon = weapons.create(pos.x, pos.y, pos.type);
        weapon.setCollideWorldBounds(true).body.setSize(25, 25).setOffset(3, 3);
        weapon.weaponData = weaponData;
        
        // Floating animation
        sceneRef.tweens.add({
          targets: weapon,
          y: weapon.y - 10,
          duration: 1800 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Pulsing effect
        sceneRef.tweens.add({
          targets: weapon,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Weapon info
        const weaponText = sceneRef.add.text(pos.x, pos.y - 25, weaponData.weapon_name, {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#ffd700',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        
        weapon.weaponText = weaponText;
        
        // Floating text animation
        sceneRef.tweens.add({
          targets: weaponText,
          y: weaponText.y - 5,
          duration: 1800 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
    
    function spawnVolcanoMonsters() {
      const monsterPositions = [
        { x: 280, y: 160, type: 'lava_beast' },
        { x: 420, y: 200, type: 'fire_elemental' },
        { x: 300, y: 300, type: 'lava_beast' },
        { x: 500, y: 280, type: 'fire_elemental' }
      ];
      
      monsterPositions.forEach((pos, index) => {
        const monster = volcanoMonsters.create(pos.x, pos.y, pos.type);
        monster.setCollideWorldBounds(true).body.setSize(30, 35).setOffset(5, 5);
        monster.health = 60;
        monster.maxHealth = 60;
        monster.speed = 40;
        monster.attackDamage = 15;
        monster.aggroRange = 70;
        monster.startX = pos.x;
        monster.startY = pos.y;
        monster.patrolDirection = 1;
        
        // Monster animations
        if (pos.type === 'fire_elemental') {
          sceneRef.tweens.add({
            targets: monster,
            alpha: 0.8,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    }
    
    function createGameDisplay() {
      // Create info display
      const infoText = sceneRef.add.text(20, 20, '', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      sceneRef.infoText = infoText;
      
      // Countdown timer
      const timerText = sceneRef.add.text(400, 20, '', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#ff0000',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5);
      sceneRef.timerText = timerText;
      
      updateGameDisplay();
    }
    
    function updateGameDisplay() {
      if (sceneRef.infoText) {
        sceneRef.infoText.setText(`Explorers: ${gameState.explorersFound}/${gameState.totalExplorers}\nWeapons: ${gameState.weaponsFound}/${gameState.totalWeapons}\nArmed Heroes: ${gameState.armedHeroes}/${gameState.totalArmedHeroes}`);
      }
      
      if (sceneRef.timerText) {
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        sceneRef.timerText.setText(`⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // Timer color and effects based on urgency
        if (gameState.timeRemaining <= 20) {
          sceneRef.timerText.setBackgroundColor('#ff0000');
          sceneRef.timerText.setFontSize('20px');
          // Pulsing effect for last 20 seconds
          sceneRef.tweens.add({
            targets: sceneRef.timerText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 0
          });
        } else if (gameState.timeRemaining <= 60) {
          sceneRef.timerText.setBackgroundColor('#ffa500');
          sceneRef.timerText.setFontSize('18px');
        } else {
          sceneRef.timerText.setBackgroundColor('#008000');
          sceneRef.timerText.setFontSize('16px');
        }
      }
    }
    
    function startCountdownTimer() {
      sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
          gameState.timeRemaining--;
          
          // Time pressure increases as time runs out
          if (gameState.timeRemaining <= 30) {
            // Last 30 seconds - screen effects
            if (gameState.timeRemaining % 2 === 0) {
              sceneRef.cameras.main.flash(100, 255, 0, 0, true);
            }
          }
          
          if (gameState.timeRemaining <= 0) {
            // Time's up! Restart level
            timeExpired();
          }
          
          updateGameDisplay();
          updateReactUI();
        },
        callbackScope: sceneRef,
        loop: true
      });
    }
    
    function timeExpired() {
      // Stop all game activity
      gameState.isLevelComplete = true;
      
      // Close query modal if open
      setUiState(prev => ({ ...prev, showQueryInput: false }));
      setSqlQuery('');
      setQueryError('');
      
      // Screen effects
      sceneRef.cameras.main.flash(1000, 255, 0, 0);
      sceneRef.cameras.main.shake(500, 0.02);
      
      // Show time expired message
      const timeUpText = sceneRef.add.text(400, 250, '⏰ TIME EXPIRED! ⏰\n\nYou ran out of time!\nRestarting level...', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ff0000',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 15, y: 10 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2000);
      
      // Restart after 3 seconds
      sceneRef.time.delayedCall(3000, () => {
        timeUpText.destroy();
        restartLevel();
      });
    }
    
    function restartLevel() {
      // Reset all game state
      gameState.health = 100;
      gameState.timeRemaining = 120;
      gameState.explorersFound = 0;
      gameState.weaponsFound = 0;
      gameState.armedHeroes = 0;
      gameState.queryComplete = false;
      gameState.evacuationComplete = false;
      gameState.isLevelComplete = false;
      
      // Reset data
      gameState.explorersData.forEach(explorer => explorer.found = false);
      gameState.weaponsData.forEach(weapon => weapon.found = false);
      
      // Reset UI state
      setUiState(prev => ({
        ...prev,
        health: 100,
        showQueryInput: false,
        explorersFound: 0,
        weaponsFound: 0,
        armedHeroes: 0,
        timeRemaining: 120,
        evacuationComplete: false,
        isQueryComplete: false
      }));
      setSqlQuery('');
      setQueryError('');
      setQuerySuccess(false);
      
      // Recreate the level
      createLevel.call(sceneRef);
      updateReactUI();
    }

    function update() {
      if (gameState.isLevelComplete) return;
      
      player.setVelocity(0);
      const speed = 180;
      
      // Use the ref instead of state for game logic
      if (cursors.left.isDown || mobileControlsRef.current.left) {
        player.setVelocityX(-speed);
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
        player.setVelocityX(speed);
      }
      
      if (cursors.up.isDown || mobileControlsRef.current.up) {
        player.setVelocityY(-speed);
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        player.setVelocityY(speed);
      }

      if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControlsRef.current.attack) && gameState.canAttack) {
        attack.call(this);
      }
      
      if ((Phaser.Input.Keyboard.JustDown(interactKey) || mobileControlsRef.current.interact) && gameState.canInteract) {
        // Check if near evacuation zone
        const distanceToEvacuation = Phaser.Math.Distance.Between(player.x, player.y, evacuationZone.x, evacuationZone.y);
        if (distanceToEvacuation <= 80) {
          reachEvacuation();
        }
      }
      
      // Update volcano monsters
      updateVolcanoMonsters.call(this);
    }
    
    function updateVolcanoMonsters() {
      volcanoMonsters.children.entries.forEach(monster => {
        if (!monster.active) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(monster.x, monster.y, player.x, player.y);
        
        if (distanceToPlayer < monster.aggroRange) {
          // Chase player
          sceneRef.physics.moveTo(monster, player.x, player.y, monster.speed);
          monster.setTint(0xff4444);
        } else {
          // Simple patrol
          monster.clearTint();
          
          const distanceFromStart = Math.abs(monster.x - monster.startX);
          if (distanceFromStart > 40) {
            monster.patrolDirection *= -1;
          }
          
          monster.setVelocityX(monster.speed * 0.5 * monster.patrolDirection);
        }
      });
    }

    function attack() {
      gameState.canAttack = false;
      
      const attackRange = 100;
      
      // Fire magic attack effects
      const attackEffect = sceneRef.add.circle(player.x, player.y, attackRange, 0xff4500, 0.6);
      const innerEffect = sceneRef.add.circle(player.x, player.y, attackRange * 0.6, 0xffa500, 0.8);
      
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
      
      // Attack volcano monsters
      volcanoMonsters.children.entries.forEach(monster => {
        if (!monster.active) return;
        
        const distance = Phaser.Math.Distance.Between(player.x, player.y, monster.x, monster.y);
        if (distance <= attackRange) {
          monster.health -= 60;
          
          const angle = Phaser.Math.Angle.Between(player.x, player.y, monster.x, monster.y);
          monster.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
          
          monster.setTint(0xff6347);
          sceneRef.time.delayedCall(150, () => {
            if (monster.active) monster.clearTint();
          });
          
          if (monster.health <= 0) {
            const explosion = sceneRef.add.circle(monster.x, monster.y, 40, 0xff4500);
            sceneRef.tweens.add({
              targets: explosion,
              scaleX: 3,
              scaleY: 3,
              alpha: 0,
              duration: 500,
              onComplete: () => explosion.destroy()
            });
            
            monster.destroy();
          }
        }
      });
      
      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });
    }

    function findExplorer(player, explorer) {
      if (explorer.explorerData.found) return;
      
      explorer.explorerData.found = true;
      gameState.explorersFound++;
      
      // Visual effect
      const findEffect = sceneRef.add.circle(explorer.x, explorer.y, 50, 0x00ff00, 0.8);
      sceneRef.tweens.add({
        targets: findEffect,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 600,
        onComplete: () => findEffect.destroy()
      });
      
      showMessage(`${explorer.explorerData.name} found! Courage: ${explorer.explorerData.courage_level}`, 2000);
      
      explorer.destroy();
      if (explorer.infoText) explorer.infoText.destroy();
      
      updateGameDisplay();
      updateReactUI();
    }

    function findWeapon(player, weapon) {
      if (weapon.weaponData.found) return;
      
      weapon.weaponData.found = true;
      gameState.weaponsFound++;
      
      // Visual effect
      const findEffect = sceneRef.add.circle(weapon.x, weapon.y, 50, 0xffd700, 0.8);
      sceneRef.tweens.add({
        targets: findEffect,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 600,
        onComplete: () => findEffect.destroy()
      });
      
      showMessage(`${weapon.weaponData.weapon_name} found!`, 2000);
      
      weapon.destroy();
      if (weapon.weaponText) weapon.weaponText.destroy();
      
      updateGameDisplay();
      updateReactUI();
    }
    
    function hitByMonster(player, monster) {
      if (monster.lastPlayerHit && sceneRef.time.now - monster.lastPlayerHit < 1500) return;
      
      monster.lastPlayerHit = sceneRef.time.now;
      gameState.health -= monster.attackDamage;
      
      player.setTint(0xff4500);
      sceneRef.time.delayedCall(300, () => player.clearTint());
      
      const angle = Phaser.Math.Angle.Between(monster.x, monster.y, player.x, player.y);
      player.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
      
      if (gameState.health <= 0) {
        gameOver('You were defeated by the volcano monsters!');
      }
      updateReactUI();
    }
    
    function reachEvacuation() {
      if (gameState.explorersFound < gameState.totalExplorers || gameState.weaponsFound < gameState.totalWeapons) {
        showMessage('Find all explorers and weapons before evacuating!', 2500);
        return;
      }
      
      if (!gameState.queryComplete) {
        showQueryInput();
        return;
      }
      
      // Start evacuation sequence
      evacuateHeroes();
    }
    
    function showQueryInput() {
      setUiState(prev => ({ ...prev, showQueryInput: true }));
    }
    
    function completeQuery() {
      gameState.queryComplete = true;
      
      // Calculate armed heroes from JOIN result
      gameState.armedHeroes = gameState.weaponsData.length; // All weapons have owners
      
      showMessage('JOIN query executed! Armed heroes identified for evacuation!', 3000);
      
      // Make evacuation zone glow
      evacuationZone.setTint(0x00ff00);
      sceneRef.tweens.add({
        targets: evacuationZone,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      updateReactUI();
    }
    
    function evacuateHeroes() {
      gameState.evacuationComplete = true;
      
      // Evacuation sequence
      evacuationZone.setTint(0x87ceeb);
      evacuationZone.setScale(1.5);
      
      // Success effects
      for (let i = 0; i < 8; i++) {
        sceneRef.time.delayedCall(i * 200, () => {
          const effect = sceneRef.add.circle(
            evacuationZone.x + (Math.random() - 0.5) * 100,
            evacuationZone.y + (Math.random() - 0.5) * 100,
            20,
            0x00ff00,
            0.8
          );
          
          sceneRef.tweens.add({
            targets: effect,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 1000,
            onComplete: () => effect.destroy()
          });
        });
      }
      
      sceneRef.time.delayedCall(2000, () => {
        showLevelComplete();
      });
    }
    
    function gameOver(message) {
      const gameOverText = sceneRef.add.text(400, 250, message, {
        fontSize: '20px',
        fontFamily: 'Courier New',
        color: '#ff4444',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5);
      
      sceneRef.cameras.main.flash(500, 255, 0, 0);
      
      sceneRef.time.delayedCall(3000, () => {
        gameOverText.destroy();
        restartLevel();
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
      
      const completionText = sceneRef.add.text(400, 80, '⚔️ Heroes Successfully Armed & Evacuated! ⚔️', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText = sceneRef.add.text(400, 120, 'JOIN Query Executed Successfully:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText2 = sceneRef.add.text(400, 140, 'SELECT e.name, w.weapon_name FROM jungle_explorers e JOIN weapons w ON e.id = w.owner_id;', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#00ffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      // Show JOIN results
      const resultText = sceneRef.add.text(400, 180, 'Armed Heroes (Explorer-Weapon Pairs):', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffff00'
      }).setOrigin(0.5).setDepth(1001);
      
      const joinResults = [
        'Maya | Fire Sword',
        'Jin | Ice Bow',
        'Alex | Lightning Staff'
      ];
      
      const resultsList = sceneRef.add.text(400, 220, joinResults.join('\n'), {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#90ee90',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const unarmedText = sceneRef.add.text(400, 280, 'Unarmed Explorer (No JOIN match):\nTom | (No weapon)', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ff8888',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 340, `👥 Explorers Found: ${gameState.explorersFound}/${gameState.totalExplorers}\n⚔️ Weapons Found: ${gameState.weaponsFound}/${gameState.totalWeapons}\n🛡️ Armed Heroes: ${gameState.armedHeroes}/${gameState.totalArmedHeroes}\n⏰ Time Remaining: ${gameState.timeRemaining}s`, {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 420, 'The evacuation route is secure! Click to return to map', {
        fontSize: '22px',
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

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
        explorersFound: gameState.explorersFound,
        weaponsFound: gameState.weaponsFound,
        armedHeroes: gameState.armedHeroes,
        evacuationComplete: gameState.evacuationComplete,
        timeRemaining: gameState.timeRemaining
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
  }, [onComplete]); // REMOVED mobileControls from dependency array

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the game elements as reference */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-red-600 to-red-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🧙</span>
          </div>
          <span>Fire Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <span>Weapon Crates</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span>Armed Explorers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🌋</span>
          <span>Evacuation Zone</span>
        </div>
      </div>

      {/* Responsive game container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-red-500 shadow-lg mx-auto"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>Health: <span className="text-rose-400">{uiState.health}/100</span></div>
        <div>Time: <span className={`${uiState.timeRemaining <= 20 ? 'text-red-400 animate-pulse' : uiState.timeRemaining <= 60 ? 'text-yellow-400' : 'text-green-400'}`}>{Math.floor(uiState.timeRemaining / 60)}:{(uiState.timeRemaining % 60).toString().padStart(2, '0')}</span></div>
        <div>Explorers: <span className="text-blue-400">{uiState.explorersFound}/{uiState.totalExplorers}</span></div>
        <div>Armed Heroes: <span className="text-green-400">{uiState.armedHeroes}/{uiState.totalArmedHeroes}</span></div>
      </div>

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="pixel-font text-xl text-red-400 mb-4 text-center">⚔️ Arm the Heroes ⚔️</h3>
            
            {/* Show remaining time in query modal */}
            <div className="text-center mb-4">
              <span className={`pixel-font text-lg font-bold ${uiState.timeRemaining <= 20 ? 'text-red-400 animate-pulse' : uiState.timeRemaining <= 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                ⏰ {Math.floor(uiState.timeRemaining / 60)}:{(uiState.timeRemaining % 60).toString().padStart(2, '0')} remaining
              </span>
            </div>
            
            <p className="text-slate-300 mb-4 text-sm text-center">
              Write the JOIN query to match explorers with their weapons:
            </p>
            
            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-green-400 text-xs font-mono">
                JOIN jungle_explorers as e with weapons as w on this condition explorer.id = weapon.owner_id
              </p>
              <p className="text-yellow-400 text-xs font-mono mt-1">
                Result: Show explorer name and their weapon name
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
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                Execute Query
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">Advanced SQL Challenge - JOIN Tables:</div>
        <div className="font-mono text-lg">
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              Heroes Armed & Ready for Evacuation!
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded animate-pulse">
              Find all explorers and weapons • Write JOIN query to match them • 2 minutes total!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Connect explorers table with weapons table • Show who has what weapon
        </div>
      </div>

      {/* Use the reusable MobileControls component with custom Evacuate button */}
      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        
        {/* Desktop Controls */}
        <div className="hidden md:block">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>CONTROLS:</strong></div>
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Move</div>
            <div>SPACE: Attack</div>
            <div>E : Evacuate</div>
          </div>
        </div>

        {/* Mobile Controls - Custom for Level7 with Evacuate button */}
        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            {/* Use the MobileControls component but add extra evacuate functionality */}
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
            
            {/* Extra Evacuate Button for Level7 - positioned separately */}
            <button
              className="bg-green-600 hover:bg-green-500 active:bg-green-400 rounded-full text-white font-bold text-sm flex items-center justify-center select-none transition-colors"
              onPointerDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                handleInteract();
              }}
              style={{ touchAction: 'none' }}
            >
              EVAC
            </button>
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

export default Level7;
