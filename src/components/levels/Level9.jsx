import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiJungle, GiKey, GiTreasureMap } from "react-icons/gi";
import { FaPlay, FaLock, FaUnlock } from "react-icons/fa";
import MobileControls from '../MobileControls'; // Import the component

const Level9 = ({ onComplete }) => {
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
    gameStarted: false,
    currentStage: 1, // 1 = Open Door, 2 = Get Treasure
    doorOpened: false,
    treasureFound: false,
    goldAmount: 0,
    showQueryInput: false,
    gameComplete: false
  });

  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');

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

  // Stage-specific queries with harder second query
  const stageQueries = {
    1: {
      correct: [
        "UPDATE royal_treasure SET door = 'opened' WHERE treasure_type = 'GOLD';",
        "update royal_treasure set door = 'opened' where treasure_type = 'GOLD';",
        "UPDATE royal_treasure SET door = 'opened' WHERE treasure_type = 'gold';",
        "update royal_treasure set door = 'opened' where treasure_type = 'gold'"
      ],
      description: "Open the jungle temple door by updating 'opened' in the royal treasure where I found gold.",
      keywords: "UPDATE, royal_treasure, SET, door, WHERE, treasure_type",
      result: "Door Opened"
    },
    2: {
      correct: [
        "SELECT SUM(gold_amount) FROM royal_treasure WHERE door = 'opened' AND treasure_type = 'GOLD' AND treasure_name LIKE '%Ancient%';",
        "select sum(gold_amount) from royal_treasure where door = 'opened' and treasure_type = 'GOLD' and treasure_name like '%Ancient%';",
        "SELECT SUM(gold_amount) FROM royal_treasure WHERE door = 'opened' AND treasure_type = 'gold' AND treasure_name LIKE '%ancient%';",
        "select sum(gold_amount) from royal_treasure where door = 'opened' and treasure_type = 'gold' and treasure_name like '%ancient%';",
        "SELECT SUM(gold_amount) FROM royal_treasure WHERE door = 'opened' AND treasure_type = 'GOLD' AND treasure_name LIKE '%ANCIENT%';",
        "select sum(gold_amount) from royal_treasure where door = 'opened' and treasure_type = 'GOLD' and treasure_name like '%ANCIENT%';"
      ],
      description: "Find the total gold where the door is opened, the treasure type is GOLD, and the treasure name contains 'Ancient'",
      keywords: "SELECT, SUM, gold_amount, FROM, royal_treasure, WHERE, door, AND, treasure_type, AND, treasure_name, LIKE, %Ancient%",
      result: "75000"
    }
  };

  const handleQuerySubmit = () => {
  // More flexible normalization - remove extra spaces and normalize
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
      .replace(/\s+'/g, "'");          // Remove spaces before closing quotes
  };

  const normalizedUserQuery = normalizeQuery(sqlQuery);
  const currentQueries = stageQueries[uiState.currentStage];
  
  // Normalize all correct queries for comparison
  const normalizedCorrectQueries = currentQueries.correct.map(query => normalizeQuery(query));
  
  const isCorrect = normalizedCorrectQueries.some(correctQuery => 
    normalizedUserQuery === correctQuery
  );

  if (isCorrect) {
    setQueryError('');
    setUiState(prev => ({ ...prev, showQueryInput: false }));
    
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].completeStage(uiState.currentStage);
    }
  } else {
    setQueryError(`Query failed! ${currentQueries.description}`);
    setTimeout(() => setQueryError(''), 3000);
  }
};


  const startGame = () => {
    setUiState(prev => ({ ...prev, gameStarted: true }));
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].startQuest();
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, temple, door, treasureChest;
    let cursors, spaceKey;
    
    const gameState = {
      gameStarted: false,
      currentStage: 1,
      doorOpened: false,
      treasureFound: false,
      goldAmount: 0,
      gameComplete: false
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      sceneRef.gameState = gameState;
      
      // Create Jungle Background
      const jungleGraphics = this.add.graphics();
      
      // Jungle floor (green)
      jungleGraphics.fillStyle(0x2e7d32, 1);
      jungleGraphics.fillRect(0, 0, 800, 500);
      
      // Add jungle trees
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        const size = 8 + Math.random() * 12;
        jungleGraphics.fillStyle(0x1b5e20, 1);
        jungleGraphics.fillCircle(x, y, size);
      }
      
      // Add jungle vines and plants
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        const size = 3 + Math.random() * 5;
        jungleGraphics.fillStyle(0x4caf50, 0.8);
        jungleGraphics.fillCircle(x, y, size);
      }
      
      // Jungle path
      jungleGraphics.fillStyle(0x8d6e63, 1);
      jungleGraphics.fillRect(350, 0, 100, 500);
      
      jungleGraphics.generateTexture('jungle_bg', 800, 500);
      jungleGraphics.destroy();
      
      // Create Explorer (Adventurer)
      const explorerGraphics = this.add.graphics();
      explorerGraphics.fillStyle(0xd2691e, 1);
      explorerGraphics.fillCircle(20, 20, 15);
      explorerGraphics.fillRect(10, 15, 20, 25);
      
      // Explorer outfit
      explorerGraphics.fillStyle(0x8b4513, 1);
      explorerGraphics.fillRect(12, 17, 16, 20);
      
      // Explorer hat
      explorerGraphics.fillStyle(0x654321, 1);
      explorerGraphics.fillCircle(20, 15, 12);
      
      explorerGraphics.generateTexture('explorer', 40, 45);
      explorerGraphics.destroy();
      
      // Create Ancient Temple
      const templeGraphics = this.add.graphics();
      templeGraphics.fillStyle(0x5d4037, 1);
      templeGraphics.fillRect(0, 0, 200, 150);
      
      // Temple stones
      templeGraphics.fillStyle(0x3e2723, 1);
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 200;
        const y = Math.random() * 150;
        templeGraphics.fillRect(x, y, 15, 10);
      }
      
      // Temple entrance
      templeGraphics.fillStyle(0x000000, 1);
      templeGraphics.fillRect(80, 50, 40, 100);
      
      templeGraphics.generateTexture('jungle_temple', 200, 150);
      templeGraphics.destroy();
      
      // Create Temple Door (Closed)
      const doorGraphics = this.add.graphics();
      doorGraphics.fillStyle(0x795548, 1);
      doorGraphics.fillRect(0, 0, 40, 80);
      
      // Door decorations
      doorGraphics.fillStyle(0xffd700, 1);
      doorGraphics.fillCircle(20, 30, 8);
      doorGraphics.fillRect(15, 50, 10, 15);
      
      doorGraphics.generateTexture('temple_door', 40, 80);
      doorGraphics.destroy();
      
      // Create Treasure Chest
      const chestGraphics = this.add.graphics();
      chestGraphics.fillStyle(0x8d6e63, 1);
      chestGraphics.fillRect(0, 0, 60, 40);
      
      // Chest details
      chestGraphics.fillStyle(0xffd700, 1);
      chestGraphics.fillRect(5, 5, 50, 30);
      chestGraphics.fillCircle(30, 20, 8);
      
      chestGraphics.generateTexture('treasure_chest', 60, 40);
      chestGraphics.destroy();
      
      // Create Gold Coins
      const coinGraphics = this.add.graphics();
      coinGraphics.fillStyle(0xffd700, 1);
      coinGraphics.fillCircle(10, 10, 8);
      coinGraphics.fillStyle(0xffff00, 1);
      coinGraphics.fillCircle(10, 10, 6);
      
      coinGraphics.generateTexture('gold_coin', 20, 20);
      coinGraphics.destroy();
    }

    function create() {
      // Create jungle environment
      this.add.image(400, 250, 'jungle_bg');
      
      // Create ancient temple
      temple = this.add.image(400, 200, 'jungle_temple');
      
      // Create temple labels
      this.add.text(400, 100, 'ANCIENT JUNGLE TEMPLE', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
        align: 'center'
      }).setOrigin(0.5);
      
      // Create player explorer
      player = this.physics.add.sprite(400, 400, 'explorer');
      player.setCollideWorldBounds(true);
      player.body.setSize(30, 35);
      
      // Create temple door (closed initially)
      door = this.physics.add.sprite(400, 225, 'temple_door');
      door.setImmovable(true);
      door.body.setSize(35, 75);
      
      // Create treasure chest (hidden initially)
      treasureChest = this.physics.add.sprite(400, 180, 'treasure_chest');
      treasureChest.setVisible(false);
      treasureChest.body.setSize(50, 35);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // Add physics overlaps
      this.physics.add.overlap(player, door, approachDoor, null, this);
      this.physics.add.overlap(player, treasureChest, approachTreasure, null, this);
      
      // Add methods to scene
      this.startQuest = startQuest;
      this.completeStage = completeStage;
      
      createJungleQuest.call(this);
      updateReactUI();
    }

    function createJungleQuest() {
      gameState.gameStarted = false;
      gameState.currentStage = 1;
      gameState.doorOpened = false;
      gameState.treasureFound = false;
      gameState.goldAmount = 0;
      gameState.gameComplete = false;
      
      showMessage('🌿 Welcome to the Ancient Jungle Temple! Click START QUEST to begin your treasure hunt!', 4000);
      
      player.setPosition(400, 400);
      door.setTint(0x795548); // Closed door color
      treasureChest.setVisible(false);
    }
    
    function startQuest() {
      if (gameState.gameStarted) return;
      
      gameState.gameStarted = true;
      
      showMessage('🚪 Stage 1: Open the Temple Door! Use UPDATE query to unlock the ancient entrance.', 3000);
      
      // Show stage 1 query input
      sceneRef.time.delayedCall(1000, () => {
        showStageQuery(1);
      });
      
      updateReactUI();
    }

    function update() {
      if (!gameState.gameStarted || gameState.gameComplete) return;
      
      // Player movement
      player.setVelocity(0);
      const speed = 150;
      
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
      
      // Stage-specific interactions
      if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControlsRef.current.interact)) {
        if (gameState.currentStage === 1 && !gameState.doorOpened) {
          showStageQuery(1);
        } else if (gameState.currentStage === 2 && gameState.doorOpened && !gameState.treasureFound) {
          showStageQuery(2);
        }
      }
    }
    
    function showStageQuery(stage) {
      setUiState(prev => ({ 
        ...prev, 
        showQueryInput: true, 
        currentStage: stage 
      }));
    }
    
    function completeStage(stage) {
      if (stage === 1) {
        // Stage 1: Door opened with UPDATE query
        gameState.doorOpened = true;
        gameState.currentStage = 2;
        
        // Change door appearance to opened
        door.setTint(0x00ff00);
        
        // Show treasure chest
        treasureChest.setVisible(true);
        
        // Add opening effect
        const doorEffect = sceneRef.add.circle(400, 225, 50, 0x00ff00, 0.6);
        sceneRef.tweens.add({
          targets: doorEffect,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 1500,
          onComplete: () => doorEffect.destroy()
        });
        
        showMessage('🚪 Temple Door Opened! The treasure chest is revealed! Approach it to claim your reward!', 3000);
        
      } else if (stage === 2) {
        // Stage 2: Treasure found with complex SELECT query
        gameState.treasureFound = true;
        gameState.goldAmount = 75000; // Updated to match the harder query result
        gameState.gameComplete = true;
        
        // Treasure chest opens
        treasureChest.setTint(0xffd700);
        
        // Gold coin explosion effect
        createGoldExplosion();
        
        showMessage('💰 75,000 GOLD COINS! You mastered the ancient treasure chamber!', 4000);
        
        sceneRef.time.delayedCall(3000, () => {
          showGameComplete();
        });
      }
      
      updateReactUI();
    }
    
    function approachDoor(player, door) {
      if (!gameState.doorOpened) {
        showMessage('🚪 Press SPACE or INTERACT to use UPDATE query and open the temple door!', 1500);
      }
    }
    
    function approachTreasure(player, chest) {
      if (gameState.doorOpened && !gameState.treasureFound) {
        showMessage('💰 Press SPACE or INTERACT to use advanced SELECT query and calculate treasure!', 1500);
      }
    }
    
    function createGoldExplosion() {
      // Create exploding gold coins (more coins for higher treasure amount)
      for (let i = 0; i < 50; i++) {
        const coin = sceneRef.physics.add.sprite(400, 180, 'gold_coin');
        
        const angle = (i / 50) * Math.PI * 2;
        const speed = 100 + Math.random() * 100;
        
        coin.setVelocityX(Math.cos(angle) * speed);
        coin.setVelocityY(Math.sin(angle) * speed);
        coin.setBounce(0.8);
        coin.setCollideWorldBounds(true);
        
        // Destroy coin after 4 seconds
        sceneRef.time.delayedCall(4000, () => {
          if (coin.active) coin.destroy();
        });
      }
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
      
      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    function showGameComplete() {
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 100, '🏆🌿 JUNGLE TEMPLE COMPLETE! 🌿🏆', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const goldText = sceneRef.add.text(400, 150, '💰 ANCIENT TREASURE MASTERY: 75,000 GOLD! 💰', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#00ff00'
      }).setOrigin(0.5).setDepth(1001);
      
      const sqlText = sceneRef.add.text(400, 200, 'Advanced SQL Mastery Demonstrated:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#90ee90'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryList = sceneRef.add.text(400, 240, '🚪 UPDATE royal_treasure SET door = \'opened\' WHERE treasure_type = \'GOLD\';\n💰 SELECT SUM(gold_amount) FROM royal_treasure WHERE door = \'opened\' AND treasure_type = \'GOLD\' AND treasure_name LIKE \'%Ancient%\';', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#87ceeb',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const gameCompleteText = sceneRef.add.text(400, 320, '🎮 CONGRATULATIONS! ALL 9 LEVELS COMPLETED! 🎮', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ff6600',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const achievementText = sceneRef.add.text(400, 360, '🏆 ACHIEVEMENTS UNLOCKED:\n✅ UPDATE Mastery\n✅ Advanced SELECT with SUM & LIKE\n✅ SQL Adventure Complete', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 440, 'You are now a SQL Master! Click to return to map', {
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
        gameStarted: gameState.gameStarted,
        currentStage: gameState.currentStage,
        doorOpened: gameState.doorOpened,
        treasureFound: gameState.treasureFound,
        goldAmount: gameState.goldAmount,
        gameComplete: gameState.gameComplete
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
      {/* Jungle Quest HUD */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <GiJungle size={20} color="#2e7d32" />
          <span>Jungle Temple</span>
        </div>
        <div className="flex items-center gap-2">
          <FaLock size={18} color={uiState.doorOpened ? "#00ff00" : "#ff6666"} />
          <span>Door: {uiState.doorOpened ? 'OPENED' : 'LOCKED'}</span>
        </div>
        <div className="flex items-center gap-2">
          <GiTreasureMap size={18} color="#00ff00" />
          <span>Stage: {uiState.currentStage}/2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span>Gold: {uiState.goldAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Game container */}
      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-green-500 shadow-lg mx-auto"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      {/* Quest controls */}
      <div className="w-full max-w-3xl flex justify-center gap-4 mb-4">
        {!uiState.gameStarted && (
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
          >
            <FaPlay /> START QUEST
          </button>
        )}
        
        {uiState.gameStarted && !uiState.gameComplete && (
          <div className="flex gap-2">
            <button
              onClick={() => setUiState(prev => ({ ...prev, showQueryInput: true }))}
              className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded font-bold text-sm transition-colors"
            >
              📜 SOLVE SQL PUZZLE
            </button>
          </div>
        )}
      </div>
      
      {/* Quest stats */}
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>Current Stage: <span className="text-green-400">Stage {uiState.currentStage}</span></div>
        <div>Progress: <span className="text-amber-400">{uiState.treasureFound ? 'COMPLETE' : uiState.doorOpened ? 'DOOR OPENED' : 'LOCKED'}</span></div>
        <div>Temple Door: <span className="text-yellow-400">{uiState.doorOpened ? '🚪 OPENED' : '🔒 LOCKED'}</span></div>
        <div>Ancient Treasure: <span className="text-purple-400">{uiState.treasureFound ? '💰 CLAIMED' : '🗝️ HIDDEN'}</span></div>
      </div>

        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            {/* Use the MobileControls component but add extra interact functionality */}
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
          </div>
        </div>
      {/* SQL Query Modal - Keywords Only */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-2xl w-full mx-4">
            <h3 className="pixel-font text-xl text-green-400 mb-4 text-center">
              🌿 STAGE {uiState.currentStage}: {uiState.currentStage === 1 ? '🚪 OPEN TEMPLE DOOR' : '💰 CALCULATE ANCIENT TREASURE'} 🌿
            </h3>
            
            <p className="text-slate-300 mb-4 text-sm text-center">
              {stageQueries[uiState.currentStage].description}
            </p>
            
            {/* Keywords section */}
            <div className="bg-black p-4 rounded border mb-4">
              <p className="text-pink-400 text-xs font-mono">
                <strong>Required Keywords:</strong> {stageQueries[uiState.currentStage].keywords}
              </p>
            </div>
            
            {/* Database schema with sample data for stage 2 */}
            <div className="bg-slate-700 p-3 rounded border mb-4">
              <p className="text-blue-400 text-xs font-mono mb-2"><strong>Database Schema:</strong></p>
              <div className="text-xs font-mono text-slate-300">
                <span className="text-green-400">royal_treasure:</span> id, <span className="text-cyan-300">treasure_name</span>, <span className="text-yellow-300">gold_amount</span>, <span className="text-orange-300">door</span>, <span className="text-purple-300">treasure_type</span>
              </div>
              {uiState.currentStage === 2 && (
                <div className="text-xs font-mono text-slate-400 mt-2">
                  <div className="text-pink-400">Sample Data (Ancient treasures):</div>
                  <div>• Ancient Crown: 25,000 gold</div>
                  <div>• Ancient Sword: 30,000 gold</div>
                  <div>• Ancient Amulet: 20,000 gold</div>
                </div>
              )}
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder={uiState.currentStage === 1 ? "UPDATE royal_treasure ..." : "SELECT SUM(gold_amount) FROM royal_treasure WHERE ..."}
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={4}
              onKeyDown={(e) => e.stopPropagation()}
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
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                {uiState.currentStage === 1 ? '🚪 UPDATE DOOR' : '💰 CALCULATE TREASURE'}
              </button>
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showQueryInput: false }));
                  setSqlQuery('');
                  setQueryError('');
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">🌿 The Ancient Jungle Temple Quest - Final Adventure:</div>
        <div className="font-mono text-lg">
          {!uiState.gameStarted ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              🌿 Click START QUEST to explore the jungle temple!
            </span>
          ) : uiState.currentStage === 1 && !uiState.doorOpened ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              🚪 Stage 1: Use UPDATE query to open the temple door!
            </span>
          ) : uiState.currentStage === 2 && !uiState.treasureFound ? (
            <span className="text-purple-400 font-bold bg-purple-900/50 px-2 py-1 rounded animate-pulse">
              💰 Stage 2: Use advanced SELECT with SUM & LIKE to calculate Ancient treasure!
            </span>
          ) : uiState.gameComplete ? (
            <span className="text-amber-400 font-bold bg-amber-900/50 px-2 py-1 rounded">
              🏆 QUEST COMPLETE! You mastered advanced SQL queries!
            </span>
          ) : (
            <span className="text-blue-400 font-bold bg-blue-900/50 px-2 py-1 rounded">
              🌿 Epic jungle adventure in progress!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Master UPDATE and advanced SELECT queries with SUM & LIKE to unlock the jungle temple's greatest treasure!
        </div>
      </div>

      {/* Use the reusable MobileControls component with custom Interact button */}
      <div className="w-full max-w-3xl hidden md:block p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        
        {/* Desktop Controls */}
        <div className="hidden md:block">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>JUNGLE TEMPLE CONTROLS:</strong></div>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Explore Temple</div>
            <div>SPACE : Interact</div>
          </div>
        </div>

        {/* Mobile Controls - Custom for Level9 with Interact button */}
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
      `}</style>
    </div>
  );
};

export default Level9;
