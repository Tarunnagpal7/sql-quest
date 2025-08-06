import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiTigerHead, GiMonkey, GiEagleHead, GiWolfHead, GiBearHead, GiFox } from "react-icons/gi";
import { FaSkull } from "react-icons/fa";
import MobileControls from '../MobileControls';

const Level6 = ({ onComplete }) => {
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
    gamePhase: 'playing', // 'playing', 'query', 'completed'
    showQueryInput: false,
    currentPosition: { x: 0, y: 5 },
    safeTiles: [],
    trapHits: 0,
    maxTrapHits: 3
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

  const handleQuerySubmit = () => {
  const query = sqlQuery.trim().toLowerCase();
  
  // Check for all required components
  const hasSelectAnimal = query.includes('select') && query.includes('animal');
  const hasCount = query.includes('count(*)');
  const hasFromTable = query.includes('from floor_tiles');
  const hasGroupBy = query.includes('group by animal');
  const hasHaving = query.includes('having count(*) > 1') || query.includes('having count(*)>1');
  
  console.log('Validation checks:', {
    hasSelectAnimal,
    hasCount,
    hasFromTable,
    hasGroupBy,
    hasHaving,
    originalQuery: sqlQuery
  });
  
  const isCorrect = hasSelectAnimal && hasCount && hasFromTable && hasGroupBy && hasHaving;

  if (isCorrect) {
    setQueryError('');
    // FIXED: Immediately hide modal and update phase
    setUiState(prev => ({ 
      ...prev, 
      showQueryInput: false,  // This will hide the modal immediately
      isQueryComplete: true, 
      gamePhase: 'completed'
    }));
    
    // Call the Phaser completion after a small delay to ensure UI updates
    setTimeout(() => {
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeQuery();
      }
    }, 100);
  } else {
    setQueryError('Missing components! Keyword Needed:  SELECT animal, COUNT(*) as frequency, FROM floor_tiles, GROUP BY , HAVING ');
    setTimeout(() => setQueryError(''), 4000);
  }
};


  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, tiles, exitDoor;
    let cursors, spaceKey;
    
    const GRID_SIZE = 6;
    const TILE_SIZE = 80;
    const START_X = (800 - (GRID_SIZE * TILE_SIZE)) / 2;
    const START_Y = (500 - (GRID_SIZE * TILE_SIZE)) / 2;
    
    // Strategic layout with EXACTLY 2 safe paths
    const TEMPLE_LAYOUT = [
      ['tiger', 'bear', 'panther', 'lynx', 'cobra', 'tiger'],    // Row 0 (EXIT at 5,0)
      ['viper', 'falcon', 'bear', 'shark', 'bear', 'tiger'],     // Row 1  
      ['bear', 'hawk', 'mamba', 'wolf', 'tiger', 'bear'],        // Row 2
      ['wolf', 'gecko', 'tiger', 'bear', 'vulture', 'owl'],      // Row 3
      ['rhino', 'wolf', 'bear', 'bison', 'tiger', 'fox'],        // Row 4
      ['tiger', 'wolf', 'orca', 'penguin', 'seal', 'bear']       // Row 5 (START at 0,5)
    ];
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      gamePhase: 'playing',
      isQueryComplete: false,
      currentPosition: { x: 0, y: 5 }, // Bottom left
      targetPosition: { x: 5, y: 0 }, // Top right
      safeTiles: [],
      trapHits: 0,
      maxTrapHits: 3,
      isLevelComplete: false,
      moveCooldown: false,
      templeLayout: TEMPLE_LAYOUT
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      // Create temple explorer sprite
      const explorerGraphics = this.add.graphics();
      
      // Explorer body
      explorerGraphics.fillStyle(0x8b4513, 1);
      explorerGraphics.fillCircle(25, 30, 15);
      explorerGraphics.fillRect(10, 22, 30, 25);
      
      // Explorer hat
      explorerGraphics.fillStyle(0x654321, 1);
      explorerGraphics.fillEllipse(25, 18, 22, 10);
      
      // Face
      explorerGraphics.fillStyle(0xfdbcb4, 1);
      explorerGraphics.fillCircle(25, 25, 10);
      
      // Eyes
      explorerGraphics.fillStyle(0x000000, 1);
      explorerGraphics.fillCircle(21, 24, 2);
      explorerGraphics.fillCircle(29, 24, 2);
      
      // Torch in hand
      explorerGraphics.lineStyle(4, 0x8b4513);
      explorerGraphics.beginPath();
      explorerGraphics.moveTo(38, 35);
      explorerGraphics.lineTo(40, 18);
      explorerGraphics.strokePath();
      explorerGraphics.fillStyle(0xff4500, 1);
      explorerGraphics.fillCircle(40, 15, 5);
      explorerGraphics.fillStyle(0xffd700, 0.8);
      explorerGraphics.fillCircle(40, 15, 3);
      
      explorerGraphics.generateTexture('temple_explorer', 50, 50);
      explorerGraphics.destroy();
      
      // Create ALL animal tiles (safe + trap animals)
      const allAnimals = [
        // SAFE ANIMALS (appear multiple times)
        'tiger', 'bear', 'wolf',
        // TRAP ANIMALS (appear only once each)
        'panther', 'lynx', 'cobra', 'viper', 'falcon', 'shark', 'raven', 
        'hawk', 'mamba', 'eagle', 'gecko', 'vulture', 'owl', 'rhino', 
        'bison', 'fox', 'orca', 'penguin', 'seal'
      ];
      
      const animalColors = {
        // Safe animals - bright colors
        tiger: 0xff8c00,
        bear: 0x654321,
        wolf: 0x696969,
        // Trap animals - warning colors  
        panther: 0x2f2f2f,
        lynx: 0x8b7355,
        cobra: 0x228b22,
        viper: 0x006400,
        falcon: 0x4169e1,
        shark: 0x1e90ff,
        raven: 0x000000,
        hawk: 0x8b4513,
        mamba: 0x32cd32,
        eagle: 0x4682b4,
        gecko: 0x90ee90,
        vulture: 0x2f4f4f,
        owl: 0x8b7d6b,
        rhino: 0x708090,
        bison: 0x8b4513,
        fox: 0xff4500,
        orca: 0x191970,
        penguin: 0x2f4f4f,
        seal: 0x696969
      };
      
      allAnimals.forEach(animal => {
        const tileGraphics = this.add.graphics();
        const color = animalColors[animal];
        const isSafe = ['tiger', 'bear', 'wolf'].includes(animal);
        
        // Stone tile base
        tileGraphics.fillStyle(0x2f4f4f, 1);
        tileGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        
        // Tile border - red for traps, green for safe
        tileGraphics.lineStyle(3,  0x4d0000, 1);
        tileGraphics.strokeRect(3, 3, TILE_SIZE-6, TILE_SIZE-6);
        
        // Animal symbol background
        tileGraphics.fillStyle(color, 0.3);
        tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2, 25);
        
        // Animal symbol
        tileGraphics.fillStyle(color, 1);
        if (animal === 'tiger') {
          tileGraphics.fillEllipse(TILE_SIZE/2, TILE_SIZE/2, 20, 15);
          tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2-10, 10);
          // Stripes
          tileGraphics.fillStyle(0x000000, 1);
          tileGraphics.fillRect(TILE_SIZE/2-8, TILE_SIZE/2-5, 3, 10);
          tileGraphics.fillRect(TILE_SIZE/2+5, TILE_SIZE/2-5, 3, 10);
        } else if (animal === 'bear') {
          // Bear body
          tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2+3, 15);
          // Bear head
          tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2-8, 10);
          // Ears
          tileGraphics.fillCircle(TILE_SIZE/2-8, TILE_SIZE/2-12, 4);
          tileGraphics.fillCircle(TILE_SIZE/2+8, TILE_SIZE/2-12, 4);
        } else if (animal === 'wolf') {
          // Wolf head
          tileGraphics.fillEllipse(TILE_SIZE/2, TILE_SIZE/2, 18, 12);
          // Ears
          tileGraphics.fillTriangle(TILE_SIZE/2-6, TILE_SIZE/2-6, TILE_SIZE/2-10, TILE_SIZE/2-15, TILE_SIZE/2-2, TILE_SIZE/2-10);
          tileGraphics.fillTriangle(TILE_SIZE/2+6, TILE_SIZE/2-6, TILE_SIZE/2+10, TILE_SIZE/2-15, TILE_SIZE/2+2, TILE_SIZE/2-10);
        } else {
          // Generic animal shape for trap animals
          tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2, 12);
          tileGraphics.fillStyle(0xff0000, 0.3);
          tileGraphics.fillCircle(TILE_SIZE/2, TILE_SIZE/2, 15); // Red warning glow
        }
        
        // Animal name text
        tileGraphics.fillStyle(0xff0000, 1);
        tileGraphics.fillRect(3, TILE_SIZE-16, TILE_SIZE-6, 13);
        
        tileGraphics.generateTexture(`tile_${animal}`, TILE_SIZE, TILE_SIZE);
        tileGraphics.destroy();
        
        // Create safe tile highlight
        const safeTileGraphics = this.add.graphics();
        safeTileGraphics.fillStyle(0x00ff00, 0.4);
        safeTileGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        safeTileGraphics.lineStyle(4, 0x00ff00, 1);
        safeTileGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        safeTileGraphics.generateTexture(`safe_highlight_${animal}`, TILE_SIZE, TILE_SIZE);
        safeTileGraphics.destroy();
        
        // Create trap tile highlight
        const trapTileGraphics = this.add.graphics();
        trapTileGraphics.fillStyle(0xff0000, 0.6);
        trapTileGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        trapTileGraphics.lineStyle(4, 0xff0000, 1);
        trapTileGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        trapTileGraphics.generateTexture(`trap_highlight_${animal}`, TILE_SIZE, TILE_SIZE);
        trapTileGraphics.destroy();
      });
      
      // Create exit door
      const doorGraphics = this.add.graphics();
      doorGraphics.fillStyle(0xdaa520, 1);
      doorGraphics.fillRect(5, 0, 70, 80);
      doorGraphics.fillStyle(0xb8860b, 1);
      doorGraphics.fillRect(10, 5, 60, 70);
      
      // Door decorations
      doorGraphics.fillStyle(0xffd700, 1);
      doorGraphics.fillCircle(60, 40, 4);
      doorGraphics.fillRect(20, 15, 25, 6);
      doorGraphics.fillRect(20, 59, 25, 6);
      
      // Mystical glow
      doorGraphics.fillStyle(0xffd700, 0.4);
      doorGraphics.fillCircle(40, 40, 50);
      
      doorGraphics.generateTexture('exit_door', 80, 80);
      doorGraphics.destroy();
      
      // Create temple background
      const templeGraphics = this.add.graphics();
      templeGraphics.fillGradientStyle(0x2f1b14, 0x2f1b14, 0x8b4513, 0x8b4513, 1);
      templeGraphics.fillRect(0, 0, 800, 500);
      
      // Add torch light effects
      templeGraphics.fillStyle(0xff4500, 0.2);
      for (let i = 0; i < 4; i++) {
        const x = 100 + (i * 200);
        templeGraphics.fillCircle(x, 100, 80);
      }
      
      templeGraphics.generateTexture('temple_bg', 800, 500);
      templeGraphics.destroy();
    }

    function create() {
      // Temple background
      this.add.image(400, 250, 'temple_bg');
      
      // Use regular group for tiles
      tiles = this.add.group();
      
      // Create the temple floor grid
      createTempleFloor.call(this);
      
      // Create player
      player = this.physics.add.sprite(
        START_X + (gameState.currentPosition.x * TILE_SIZE) + TILE_SIZE/2,
        START_Y + (gameState.currentPosition.y * TILE_SIZE) + TILE_SIZE/2,
        'temple_explorer'
      );
      player.setCollideWorldBounds(true);
      player.body.setSize(40, 40);
      
      // Create exit door
      exitDoor = this.physics.add.sprite(
        START_X + (gameState.targetPosition.x * TILE_SIZE) + TILE_SIZE/2,
        START_Y + (gameState.targetPosition.y * TILE_SIZE) + TILE_SIZE/2,
        'exit_door'
      );
      exitDoor.body.setImmovable(true);
      exitDoor.body.setSize(70, 70);
      
      // Controls
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // Physics interactions
      this.physics.add.overlap(player, exitDoor, reachExit, null, this);
      
      // Add methods
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;
      
      createLevel.call(this);
      updateReactUI();
    }

    function createTempleFloor() {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const animal = gameState.templeLayout[row][col];
          const x = START_X + (col * TILE_SIZE);
          const y = START_Y + (row * TILE_SIZE);
          
          // Create as regular image
          const tile = sceneRef.add.image(x + TILE_SIZE/2, y + TILE_SIZE/2, `tile_${animal}`);
          tile.gridX = col;
          tile.gridY = row;
          tile.animal = animal;
          
          // Add to tiles group
          tiles.add(tile);
          
          // Add animal name text
          const nameText = sceneRef.add.text(x + TILE_SIZE/2, y + TILE_SIZE - 8, animal, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color:  '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 2, y: 1 }
          }).setOrigin(0.5);
          
          tile.nameText = nameText;
        }
      }
    }

    function createLevel() {
      gameState.health = 100;
      gameState.gamePhase = 'playing';
      gameState.isQueryComplete = false;
      gameState.currentPosition = { x: 0, y: 5 };
      gameState.trapHits = 0;
      gameState.isLevelComplete = false;
      gameState.safeTiles = [];
      
      // Calculate safe tiles
      calculateSafeTiles();
      
      // Reset player position
      player.setPosition(
        START_X + (gameState.currentPosition.x * TILE_SIZE) + TILE_SIZE/2,
        START_Y + (gameState.currentPosition.y * TILE_SIZE) + TILE_SIZE/2
      );
      
      showMessage('🧩 Find one of the ONLY 2 safe paths! Step only on animals that appear MORE THAN ONCE!', 5000);
      
      updateReactUI();
    }

    function calculateSafeTiles() {
      const animalCount = {};
      
      // Count each animal
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const animal = gameState.templeLayout[row][col];
          animalCount[animal] = (animalCount[animal] || 0) + 1;
        }
      }
      
      // Find animals that appear more than once
      gameState.safeTiles = Object.keys(animalCount).filter(animal => animalCount[animal] > 1);
      
      console.log('SAFE ANIMALS (appear more than once):', gameState.safeTiles);
      console.log('TRAP ANIMALS (appear only once):', Object.keys(animalCount).filter(animal => animalCount[animal] === 1));
      console.log('Animal counts:', animalCount);
    }

    function update() {
      if (gameState.isLevelComplete || gameState.gamePhase !== 'playing') return;
      
      // Grid-based movement
      if (!gameState.moveCooldown) {
        let moved = false;
        let newX = gameState.currentPosition.x;
        let newY = gameState.currentPosition.y;
        
        if (cursors.left.isDown || mobileControlsRef.current.left) {
          newX = Math.max(0, gameState.currentPosition.x - 1);
          moved = true;
        } else if (cursors.right.isDown || mobileControlsRef.current.right) {
          newX = Math.min(GRID_SIZE - 1, gameState.currentPosition.x + 1);
          moved = true;
        } else if (cursors.up.isDown || mobileControlsRef.current.up) {
          newY = Math.max(0, gameState.currentPosition.y - 1);
          moved = true;
        } else if (cursors.down.isDown || mobileControlsRef.current.down) {
          newY = Math.min(GRID_SIZE - 1, gameState.currentPosition.y + 1);
          moved = true;
        }
        
        if (moved && (newX !== gameState.currentPosition.x || newY !== gameState.currentPosition.y)) {
          moveToTile(newX, newY);
          gameState.moveCooldown = true;
          sceneRef.time.delayedCall(400, () => {
            gameState.moveCooldown = false;
          });
        }
      }
    }

    function moveToTile(x, y) {
      const animal = gameState.templeLayout[y][x];
      const isSafe = gameState.safeTiles.includes(animal);
      
      // Move player visually
      const targetX = START_X + (x * TILE_SIZE) + TILE_SIZE/2;
      const targetY = START_Y + (y * TILE_SIZE) + TILE_SIZE/2;
      
      sceneRef.tweens.add({
        targets: player,
        x: targetX,
        y: targetY,
        duration: 300,
        ease: 'Power2.easeOut'
      });
      
      gameState.currentPosition = { x, y };
      
      if (isSafe) {
        // Safe tile
        highlightTile(x, y, 'safe', animal);
        showMessage(`✅ Safe! ${animal} appears multiple times`, 1500);
      } else {
        // Trap tile
        highlightTile(x, y, 'trap', animal);
        gameState.trapHits++;
        gameState.health -= 33;
        
        player.setTint(0xff0000);
        sceneRef.cameras.main.shake(300, 0.03);
        sceneRef.time.delayedCall(500, () => {
          if (player.active) player.clearTint();
        });
        
        showMessage(`💀 DEADLY TRAP! ${animal} appears only once! -33 health`, 2000);
        
        if (gameState.health <= 0 || gameState.trapHits >= gameState.maxTrapHits) {
          gameOver('Too many traps! Only 1 path is safe - find them!');
          return;
        }
      }
      
      updateReactUI();
    }

    function highlightTile(x, y, type, animal) {
      const tileX = START_X + (x * TILE_SIZE);
      const tileY = START_Y + (y * TILE_SIZE);
      
      const highlight = sceneRef.add.image(
        tileX + TILE_SIZE/2, 
        tileY + TILE_SIZE/2, 
        `${type}_highlight_${animal}`
      );
      highlight.setAlpha(0.8);
      
      // Fade out highlight
      sceneRef.tweens.add({
        targets: highlight,
        alpha: 0,
        duration: 2500,
        onComplete: () => highlight.destroy()
      });
    }

    function reachExit(player, exitDoor) {
      if (gameState.currentPosition.x === gameState.targetPosition.x && 
          gameState.currentPosition.y === gameState.targetPosition.y) {
        
        // Player reached exit - now show query
        gameState.gamePhase = 'query';
        showMessage('🎉 Incredible! You found one of the 1 safe paths! Now prove your SQL knowledge!', 3000);
        
        sceneRef.time.delayedCall(3000, () => {
          setUiState(prev => ({ ...prev, showQueryInput: true, gamePhase: 'query' }));
        });
        
        updateReactUI();
      }
    }

    function showQueryInput() {
      // Handled by React component
    }

    // FIXED: Show completion screen like other levels
    function completeQuery() {
      gameState.isQueryComplete = true;
      gameState.gamePhase = 'completed';
      uiState.showQueryInput = false;
      
      
      // Show the level completion screen immediately
      showLevelComplete();
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 80, '🏛️ Temple Master! 🏛️', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const difficultyText = sceneRef.add.text(400, 310, `🔥 Difficulty: EXTREME - Only 3 safe animals out of 21 total!`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ff6600',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 350, `🎯 Performance:\n💚 Final Health: ${gameState.health}/100\n💀 Traps Hit: ${gameState.trapHits}/${gameState.maxTrapHits}\n⭐ Path Success: ${gameState.trapHits === 0 ? 'PERFECT NAVIGATION!' : 'SURVIVED THE CHALLENGE!'}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffd700',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 430, 'Temple conquered! Click to continue your journey', {
        fontSize: '24px',
        fontFamily: 'Arial',
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
      
      updateReactUI();
    }

    function gameOver(message) {
      const gameOverText = sceneRef.add.text(400, 200, `💀 TEMPLE FAILURE 💀\n${message}\n\nHint: Only tiger, bear, wolf appear more than once!`, {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: '#ff4444',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 15, y: 8 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.cameras.main.flash(500, 255, 0, 0);
      
      sceneRef.time.delayedCall(4000, () => {
        gameOverText.destroy();
        createLevel.call(sceneRef);
      });
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 50, text, {
        fontSize: '16px',
        fontFamily: 'Arial',
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
    currentPosition: gameState.currentPosition,
    safeTiles: gameState.safeTiles,
    trapHits: gameState.trapHits,
    isQueryComplete: gameState.isLevelComplete,
    // FIXED: Only show modal if explicitly in query phase AND it's not already completed
    showQueryInput: gameState.gamePhase === 'query' && !gameState.isQueryComplete ? prev.showQueryInput : false
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
          <div className="w-5 h-5 bg-gradient-to-b from-orange-600 to-orange-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🏛️</span>
          </div>
          <span>Temple Explorer</span>
        </div>
       
        {/* Safe Animals Display */}
        {uiState.safeTiles.length > 0 && (
          <div className="w-full max-w-3xl p-3 bg-green-900/30 rounded-lg border border-green-600">
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2">✅ ONLY Safe Animals (appear more than once):</div>
        
              <div className="text-xs text-slate-300 mt-2">
                All other animals are DEADLY TRAPS (appear only once)!
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Game Container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-orange-600 shadow-lg mx-auto bg-gradient-to-b from-orange-800 to-orange-900"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      {/* Game Stats */}
      <div className="w-full max-w-3xl grid grid-cols-4 gap-4 text-sm">
        <div>Health: <span className="text-green-400">{uiState.health}/100</span></div>
        <div>Phase: <span className={
          uiState.gamePhase === 'playing' ? 'text-blue-400' : 
          uiState.gamePhase === 'query' ? 'text-yellow-400' : 'text-green-400'
        }>
          {uiState.gamePhase.toUpperCase()}
        </span></div>
        <div>Traps Hit: <span className="text-red-400">{uiState.trapHits}/3</span></div>
        <div>Position: <span className="text-cyan-400">({uiState.currentPosition.x}, {uiState.currentPosition.y})</span></div>
      </div>


      {/* SQL Query Modal */}
        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
          </div>
        </div>
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="text-xl text-orange-400 mb-4 text-center">🧩 Master of the Temple! 🧩</h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              "You need to found 1 safe paths to golden door! Now prove your SQL mastery to complete the challenge!"
            </p>
            
            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-cyan-400 text-xs font-mono mb-2"><strong>Schema:</strong></p>
              <p className="text-yellow-300 text-sm">floor_tiles: id, tile_x, tile_y, animal</p>
              <p className="text-slate-400 text-xs mt-1">Write a query to find animals that appear MORE THAN ONCE</p>
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT animal, COUNT(*) as frequency FROM floor_tiles..."
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
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                🏆 Complete Temple Master Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="text-slate-300 mb-2">🏛️ The Trap Tiles of Truth </div>
        <div className="text-lg">
          {uiState.gamePhase === 'playing' ? (
            <span className="text-blue-400 font-bold">
              You need to found 1 safe paths to golden door! Now prove your SQL mastery to complete the challenge! 
            </span>
          ) : uiState.gamePhase === 'query' ? (
            <span className="text-yellow-400 font-bold animate-pulse">
              🧩 Path mastered! Write SQL to find animals with COUNT(*) greater than 1!
            </span>
          ) : (
            <span className="text-green-400 font-bold">
              🏆 TEMPLE MASTER! You conquered the ultimate SQL challenge!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          💀 18 deadly traps vs 3 safe animals.
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl p-3 hidden md:block bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="text-slate-400 text-sm mb-2 text-center"><strong>Controls:</strong></div>
        
        <div className="hidden md:block">
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Move</div>
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

export default Level6;
