import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiBoatFishing, GiTrophy } from "react-icons/gi";
import { FaPlay, FaPause, FaWater } from "react-icons/fa";

const Level8 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  
  const [uiState, setUiState] = useState({
    health: 100,
    raceStarted: false,
    raceFinished: false,
    racePosition: 4,
    totalRacers: 4,
    currentLap: 0,
    totalLaps: 3,
    raftSpeed: 0,
    maxSpeed: 100,
    showQueryInput: false,
    queryType: null,
    gameState: 'waiting',
    raceTime: 0,
    slowQueryUsed: false,
    fastQueryUsed: false,
    avgQueryComplete: false
  });

  const [sqlQuery, setSqlQuery] = useState('');
  const [queryError, setQueryError] = useState('');
  const [querySuccess, setQuerySuccess] = useState(false);

  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    action: false
  });

  const queryTypes = {
    slow: {
      correct: [
        "SELECT MIN(courage_level) FROM jungle_explorers;",
        "select min(courage_level) from jungle_explorers;",
        "SELECT MIN(courage_level) FROM jungle_explorers",
        "select min(courage_level) from jungle_explorers"
      ],
      description: "Find the LOWEST courage level to slow down opponents",
      effect: "Slows down all opponent rafts by 30%"
    },
    fast: {
      correct: [
        "SELECT MAX(courage_level) FROM jungle_explorers;",
        "select max(courage_level) from jungle_explorers;",
        "SELECT MAX(courage_level) FROM jungle_explorers",
        "select max(courage_level) from jungle_explorers"
      ],
      description: "Find the HIGHEST courage level to boost your raft speed",
      effect: "Increases your raft speed by 50%"
    },
    avg: {
      correct: [
        "SELECT AVG(courage_level) FROM jungle_explorers;",
        "select avg(courage_level) from jungle_explorers;",
        "SELECT AVG(courage_level) FROM jungle_explorers",
        "select avg(courage_level) from jungle_explorers"
      ],
      description: "Calculate AVERAGE courage level to complete the race",
      effect: "Required to finish the race and complete the level"
    }
  };

  const handleQuerySubmit = () => {
    if (!uiState.queryType) return;
    
    const normalizedQuery = sqlQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = queryTypes[uiState.queryType].correct.some(query => 
      normalizedQuery === query.toLowerCase().replace(/\s+/g, ' ')
    );

    if (isCorrect) {
      setQuerySuccess(true);
      setQueryError('');
      setUiState(prev => ({ ...prev, showQueryInput: false }));
      
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeQuery(uiState.queryType);
      }
    } else {
      setQueryError(`Query failed! ${queryTypes[uiState.queryType].description}`);
      setTimeout(() => setQueryError(''), 3000);
    }
  };

  const startRace = () => {
    setUiState(prev => ({ ...prev, raceStarted: true, gameState: 'racing' }));
    if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
      gameInstance.current.scene.scenes[0].startRace();
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, opponents, river, checkpoints, finishLine, startLine;
    let cursors, spaceKey, oneKey, twoKey, threeKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      raceStarted: false,
      raceFinished: false,
      racePaused: false,
      racePosition: 4,
      totalRacers: 4,
      currentLap: 0,
      totalLaps: 3,
      raftSpeed: 0,
      baseSpeed: 60,
      maxSpeed: 100,
      raceTime: 0,
      playerProgress: 0,
      slowQueryUsed: false,
      fastQueryUsed: false,
      avgQueryComplete: false,
      speedBoost: 1,
      opponentSlowdown: 1,
      autoResetTimer: null,
      explorerData: [
        { id: 1, name: 'Maya', courage_level: 95 },
        { id: 2, name: 'Elena', courage_level: 68 },
        { id: 3, name: 'Jin', courage_level: 82 },
        { id: 4, name: 'Tom', courage_level: 45 },
        { id: 5, name: 'Alex', courage_level: 88 },
        { id: 6, name: 'Sara', courage_level: 72 },
        { id: 7, name: 'Carlos', courage_level: 91 },
        { id: 8, name: 'Lisa', courage_level: 73 }
      ],
      opponents: [
        { name: 'River Runner', position: 1, speed: 70, color: 0xff0000, progress: 0 },
        { name: 'Rapids Master', position: 2, speed: 65, color: 0x00ff00, progress: 0 },
        { name: 'Current Rider', position: 3, speed: 68, color: 0xffff00, progress: 0 }
      ],
      riverLength: 1500,
      lapLength: 500
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      sceneRef.gameState = gameState;
      
      // Create Jungle Raft (Player)
      const raftGraphics = this.add.graphics();
      raftGraphics.fillStyle(0x8b4513, 1);
      raftGraphics.fillRect(5, 10, 30, 50);
      raftGraphics.fillStyle(0xa0522d, 1);
      raftGraphics.fillRect(5, 15, 30, 3);
      raftGraphics.fillRect(5, 25, 30, 3);
      raftGraphics.fillRect(5, 35, 30, 3);
      raftGraphics.fillRect(5, 45, 30, 3);
      raftGraphics.fillStyle(0x654321, 1);
      raftGraphics.fillRect(10, 10, 2, 50);
      raftGraphics.fillRect(28, 10, 2, 50);
      raftGraphics.fillStyle(0x5d4037, 1);
      raftGraphics.fillRect(35, 25, 2, 15);
      raftGraphics.fillCircle(36, 20, 4);
      raftGraphics.fillStyle(0xfdbcb4, 1);
      raftGraphics.fillCircle(20, 35, 6);
      raftGraphics.fillStyle(0x2e7d32, 1);
      raftGraphics.fillRect(16, 40, 8, 12);
      raftGraphics.generateTexture('player_raft', 45, 65);
      raftGraphics.destroy();
      
      // Create Opponent Rafts
      const opponentColors = [0xff0000, 0x00ff00, 0xffff00];
      opponentColors.forEach((color, index) => {
        const opponentGraphics = this.add.graphics();
        opponentGraphics.fillStyle(0x8b4513, 1);
        opponentGraphics.fillRect(5, 10, 30, 50);
        if (index === 0) {
          opponentGraphics.fillStyle(color, 0.3);
          opponentGraphics.fillRect(5, 10, 30, 50);
        } else if (index === 1) {
          opponentGraphics.fillStyle(0xa0522d, 1);
          opponentGraphics.fillRect(5, 20, 30, 3);
          opponentGraphics.fillRect(5, 40, 30, 3);
        } else {
          opponentGraphics.fillStyle(0x654321, 1);
          opponentGraphics.fillRect(5, 15, 30, 40);
        }
        opponentGraphics.fillStyle(color, 0.8);
        opponentGraphics.fillCircle(20, 35, 6);
        opponentGraphics.fillRect(16, 40, 8, 12);
        opponentGraphics.generateTexture(`opponent_raft_${index}`, 45, 65);
        opponentGraphics.destroy();
      });
      
      // Create Jungle River
      const riverGraphics = this.add.graphics();
      riverGraphics.fillStyle(0x0277bd, 1);
      riverGraphics.fillRect(0, 0, 800, 500);
      riverGraphics.fillStyle(0x2e7d32, 1);
      riverGraphics.fillRect(0, 0, 100, 500);
      riverGraphics.fillRect(700, 0, 100, 500);
      for (let i = 0; i < 20; i++) {
        const x = i < 10 ? Math.random() * 80 : 720 + Math.random() * 80;
        const y = Math.random() * 500;
        riverGraphics.fillStyle(0x1b5e20, 1);
        riverGraphics.fillCircle(x, y, 8 + Math.random() * 5);
      }
      riverGraphics.fillStyle(0x03a9f4, 0.3);
      for (let i = 0; i < 30; i++) {
        const x = 100 + Math.random() * 600;
        const y = Math.random() * 500;
        riverGraphics.fillCircle(x, y, 3 + Math.random() * 4);
      }
      riverGraphics.generateTexture('jungle_river', 800, 500);
      riverGraphics.destroy();
      
      // Create Checkpoints
      const checkpointGraphics = this.add.graphics();
      checkpointGraphics.fillStyle(0xff5722, 1);
      checkpointGraphics.fillRect(0, 0, 800, 5);
      checkpointGraphics.fillStyle(0xffffff, 1);
      for (let i = 0; i < 20; i++) {
        checkpointGraphics.fillRect(i * 40, 0, 20, 5);
      }
      checkpointGraphics.generateTexture('checkpoint_line', 800, 10);
      checkpointGraphics.destroy();
      
      // Create Finish Line
      const finishGraphics = this.add.graphics();
      for (let x = 0; x < 800; x += 40) {
        for (let y = 0; y < 10; y += 5) {
          const color = ((x + y) / 5) % 2 === 0 ? 0xffffff : 0x000000;
          finishGraphics.fillStyle(color, 1);
          finishGraphics.fillRect(x, y, 40, 5);
        }
      }
      finishGraphics.generateTexture('finish_line', 800, 15);
      finishGraphics.destroy();
      
      // Create Water Effects
      const waveGraphics = this.add.graphics();
      waveGraphics.fillStyle(0x81d4fa, 0.6);
      for (let i = 0; i < 8; i++) {
        const y = i * 15;
        waveGraphics.fillEllipse(400, y, 600, 8);
      }
      waveGraphics.generateTexture('water_waves', 800, 120);
      waveGraphics.destroy();
    }

    function create() {
      this.add.image(400, 250, 'jungle_river');
      createRiverFlow.call(this);
      
      checkpoints = this.physics.add.staticGroup();
      opponents = this.physics.add.group();
      
      player = this.physics.add.sprite(400, 450, 'player_raft');
      player.setCollideWorldBounds(true).body.setSize(35, 55).setOffset(5, 5);
      
      startLine = this.physics.add.sprite(400, 480, 'finish_line');
      startLine.setImmovable(true).body.setSize(800, 10);
      
      finishLine = this.physics.add.sprite(400, 50, 'finish_line');
      finishLine.setImmovable(true).body.setSize(800, 10);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      
      this.physics.add.overlap(player, checkpoints, passCheckpoint, null, this);
      this.physics.add.overlap(player, finishLine, crossFinishLine, null, this);
      
      this.startRace = startRace;
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;
      this.forceStopAllRafts = forceStopAllRafts;
      
      createRace.call(this);
      updateReactUI();
    }

    function createRace() {
      checkpoints.clear(true, true);
      opponents.clear(true, true);
      
      // Clear any existing auto-reset timer
      if (gameState.autoResetTimer) {
        sceneRef.time.removeEvent(gameState.autoResetTimer);
        gameState.autoResetTimer = null;
      }
      
      gameState.raceStarted = false;
      gameState.raceFinished = false;
      gameState.racePaused = false;
      gameState.racePosition = 4;
      gameState.currentLap = 0;
      gameState.raftSpeed = 0;
      gameState.raceTime = 0;
      gameState.playerProgress = 0;
      gameState.slowQueryUsed = false;
      gameState.fastQueryUsed = false;
      gameState.avgQueryComplete = false;
      gameState.speedBoost = 1;
      gameState.opponentSlowdown = 1;
      
      gameState.opponents.forEach(opp => {
        opp.progress = 0;
        opp.currentLap = 0;
      });
      
      createCheckpoints.call(this);
      createRacingUI.call(this);
      
      showMessage('🏁 Jungle River Race! Click START RACE button to begin!', 4000);
      
      player.setPosition(400, 450).setVelocity(0, 0);
    }
    
    function createRiverFlow() {
      for (let i = 0; i < 15; i++) {
        const wave = sceneRef.add.image(
          Math.random() * 800,
          Math.random() * 500,
          'water_waves'
        );
        wave.setAlpha(0.3);
        wave.setScale(0.5);
        
        sceneRef.tweens.add({
          targets: wave,
          y: wave.y + 600,
          duration: 8000 + Math.random() * 4000,
          repeat: -1,
          delay: Math.random() * 2000
        });
      }
      
      for (let i = 0; i < 20; i++) {
        const leaf = sceneRef.add.circle(
          Math.random() * 800,
          Math.random() * 500,
          2 + Math.random() * 3,
          0x4caf50,
          0.6
        );
        
        sceneRef.tweens.add({
          targets: leaf,
          y: leaf.y + 100,
          x: leaf.x + (Math.random() - 0.5) * 50,
          alpha: 0,
          duration: 5000 + Math.random() * 3000,
          repeat: -1,
          delay: Math.random() * 3000
        });
      }
    }
    
    function createCheckpoints() {
      for (let i = 1; i < 4; i++) {
        const y = 450 - (i * 130);
        const checkpoint = checkpoints.create(400, y, 'checkpoint_line');
        checkpoint.checkpointIndex = i;
        checkpoint.body.setSize(800, 5);
        checkpoint.setAlpha(0.8);
      }
    }
    
    function spawnOpponents() {
      if (!gameState.raceStarted) return;
      
      const startPositions = [
        { x: 300, y: 440 },
        { x: 500, y: 445 },
        { x: 350, y: 435 }
      ];
      
      startPositions.forEach((pos, index) => {
        const opponentData = gameState.opponents[index];
        const opponent = opponents.create(pos.x, pos.y, `opponent_raft_${index}`);
        opponent.setCollideWorldBounds(true).body.setSize(35, 55).setOffset(5, 5);
        opponent.opponentData = opponentData;
        opponent.baseSpeed = opponentData.speed;
        opponent.currentSpeed = opponentData.speed * gameState.opponentSlowdown;
        opponent.progress = 0;
        opponent.currentLap = 0;
        opponent.aiState = 'racing';
      });
    }
    
    function createRacingUI() {
      const controlsInfo = sceneRef.add.text(20, 20, '', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      sceneRef.controlsInfo = controlsInfo;
      
      const timerText = sceneRef.add.text(400, 30, '', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#1976d2',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5);
      sceneRef.timerText = timerText;
      
      const positionDisplay = sceneRef.add.text(700, 30, '', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5);
      sceneRef.positionDisplay = positionDisplay;
      
      updateRacingUI();
    }
    
    function updateRacingUI() {
      if (sceneRef.controlsInfo) {
        let controls = 'Controls:\n';
        controls += '↑↓←→ Navigate | ';
        if (!gameState.slowQueryUsed) controls += '1 Slow Others | ';
        if (!gameState.fastQueryUsed) controls += '2 Speed Boost | ';
        if (gameState.raceFinished && !gameState.avgQueryComplete) controls += '3 Average Query (Required!)';
        
        sceneRef.controlsInfo.setText(controls);
      }
      
      if (sceneRef.timerText) {
        const minutes = Math.floor(gameState.raceTime / 60);
        const seconds = gameState.raceTime % 60;
        const status = gameState.raceStarted ? (gameState.racePaused ? 'PAUSED' : 'RACING') : 'WAITING';
        sceneRef.timerText.setText(`${status} | Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
      
      if (sceneRef.positionDisplay) {
        const positionText = ['1st', '2nd', '3rd', '4th'][gameState.racePosition - 1];
        sceneRef.positionDisplay.setText(`${positionText} | Lap: ${gameState.currentLap}/3`);
      }
    }
    
    function startRace() {
      if (gameState.raceStarted) return;
      
      gameState.raceStarted = true;
      gameState.racePaused = false;
      
      spawnOpponents();
      
      sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
          if (gameState.raceStarted && !gameState.racePaused && !gameState.raceFinished) {
            gameState.raceTime++;
            updateRacingUI();
            updateReactUI();
          }
        },
        callbackScope: sceneRef,
        loop: true
      });
      
      showMessage('🏁 RACE STARTED! Navigate with arrow keys, use number keys for SQL queries!', 3000);
      updateReactUI();
    }

    function forceStopAllRafts() {
      // Force stop player
      if (player && player.active) {
        player.setVelocity(0, 0);
        player.body.setVelocity(0, 0);
      }
      
      // Force stop all opponents
      if (opponents && opponents.children) {
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.setVelocity(0, 0);
            opponent.body.setVelocity(0, 0);
          }
        });
      }
    }

    function update() {
      if (gameState.isLevelComplete || gameState.raceFinished) return;
      
      // Check BOTH React state and Phaser game state for immediate stopping
      const isPaused = gameState.racePaused || !gameState.raceStarted;
      
      if (isPaused) {
        // IMMEDIATELY stop player raft
        player.setVelocity(0, 0);
        
        // IMMEDIATELY stop all opponent rafts
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.setVelocity(0, 0);
          }
        });
        
        updateRacingUI();
        return; // Don't process any movement
      }
      
      // Player raft movement (only when race is active)
      player.setVelocity(0);
      const baseSpeed = gameState.baseSpeed * gameState.speedBoost;
      
      if (cursors.up.isDown || mobileControls.up) {
        player.setVelocityY(-baseSpeed);
        gameState.raftSpeed = baseSpeed;
      } else if (cursors.down.isDown || mobileControls.down) {
        player.setVelocityY(baseSpeed * 0.5);
        gameState.raftSpeed = baseSpeed * 0.5;
      } else {
        gameState.raftSpeed = 0;
      }
      
      if (cursors.left.isDown || mobileControls.left) {
        player.setVelocityX(-baseSpeed * 0.7);
      } else if (cursors.right.isDown || mobileControls.right) {
        player.setVelocityX(baseSpeed * 0.7);
      }
      
      // Query hotkeys - only during active race, not finished
      if (!gameState.raceFinished) {
        if (Phaser.Input.Keyboard.JustDown(oneKey) && !gameState.slowQueryUsed) {
          showQueryInput('slow');
        }
        if (Phaser.Input.Keyboard.JustDown(twoKey) && !gameState.fastQueryUsed) {
          showQueryInput('fast');
        }
      }
      
      // AVG query only when race is finished
      if (Phaser.Input.Keyboard.JustDown(threeKey) && gameState.raceFinished && !gameState.avgQueryComplete) {
        showQueryInput('avg');
      }
      
      updateOpponents.call(this);
      
      gameState.playerProgress = (450 - player.y) / 400;
      if (gameState.playerProgress < 0) gameState.playerProgress = 0;
      
      updateRacePosition();
      updateRacingUI();
    }
    
    function updateOpponents() {
      // Don't update opponents when race is paused or finished
      if (gameState.racePaused || !gameState.raceStarted || gameState.raceFinished) {
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.setVelocity(0, 0);
          }
        });
        return;
      }
      
      // Normal opponent movement (only when race is active)
      opponents.children.entries.forEach(opponent => {
        if (!opponent.active) return;
        
        const speed = opponent.currentSpeed;
        opponent.setVelocityY(-speed);
        
        if (Math.random() < 0.02) {
          const steerDirection = (Math.random() - 0.5) * speed * 0.3;
          opponent.setVelocityX(steerDirection);
        }
        
        opponent.progress = (450 - opponent.y) / 400;
        if (opponent.progress < 0) opponent.progress = 0;
        
        if (opponent.y <= 60 && opponent.currentLap < 3) {
          opponent.currentLap++;
          opponent.setPosition(400 + (Math.random() - 0.5) * 100, 440);
          opponent.progress = 0;
        }
      });
    }
    
    function updateRacePosition() {
      const playerTotal = gameState.currentLap + gameState.playerProgress;
      let position = 1;
      
      opponents.children.entries.forEach(opponent => {
        if (opponent.active) {
          const opponentTotal = opponent.currentLap + opponent.progress;
          if (opponentTotal > playerTotal) {
            position++;
          }
        }
      });
      
      gameState.racePosition = position;
    }

    function passCheckpoint(player, checkpoint) {
      const checkpointEffect = sceneRef.add.circle(player.x, player.y, 50, 0x00ff00, 0.8);
      sceneRef.tweens.add({
        targets: checkpointEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => checkpointEffect.destroy()
      });
      
      showMessage(`Checkpoint ${checkpoint.checkpointIndex} passed!`, 1500);
    }
    
    function crossFinishLine(player, finishLine) {
      if (gameState.currentLap >= gameState.totalLaps) {
        // Race finished
        gameState.raceFinished = true;
        
        // Stop all opponent movement immediately
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.setVelocity(0, 0);
          }
        });
        
        showMessage('🏁 RACE FINISHED! Use AVG query to complete the level!', 4000);
        
        // Auto-reset if user doesn't complete AVG query within 15 seconds
        gameState.autoResetTimer = sceneRef.time.delayedCall(15000, () => {
          if (!gameState.avgQueryComplete) {
            showMessage('Time expired! Auto-restarting race...', 2000);
            sceneRef.time.delayedCall(2000, () => {
              createRace.call(sceneRef);
              updateReactUI();
            });
          }
        });
        
        updateReactUI();
      } else {
        gameState.currentLap++;
        showMessage(`Lap ${gameState.currentLap} completed!`, 2000);
        player.setPosition(400, 440);
      }
    }
    
    function showQueryInput(type) {
      // IMMEDIATELY pause and stop all movement
      gameState.racePaused = true;
      
      // Stop player immediately
      if (player && player.active) {
        player.setVelocity(0, 0);
      }
      
      // Stop all opponents immediately
      if (opponents && opponents.children) {
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.setVelocity(0, 0);
          }
        });
      }
      
      setUiState(prev => ({ 
        ...prev, 
        showQueryInput: true, 
        queryType: type,
        gameState: 'paused'
      }));
    }
    
    function completeQuery(type) {
      gameState.racePaused = false; // Resume race
      
      if (type === 'slow') {
        gameState.slowQueryUsed = true;
        gameState.opponentSlowdown = 0.7;
        
        opponents.children.entries.forEach(opponent => {
          if (opponent.active) {
            opponent.currentSpeed = opponent.baseSpeed * gameState.opponentSlowdown;
          }
        });
        
        showMessage('🐌 MIN() Query Complete! Opponents slowed down by 30%!', 3000);
        
      } else if (type === 'fast') {
        gameState.fastQueryUsed = true;
        gameState.speedBoost = 1.5;
        
        showMessage('🚀 MAX() Query Complete! Your raft speed boosted by 50%!', 3000);
        
      } else if (type === 'avg') {
        gameState.avgQueryComplete = true;
        
        // Clear auto-reset timer
        if (gameState.autoResetTimer) {
          sceneRef.time.removeEvent(gameState.autoResetTimer);
          gameState.autoResetTimer = null;
        }
        
        showMessage('📊 AVG() Query Complete! Average courage: 78.5', 3000);
        
        // Check if level can be completed
        sceneRef.time.delayedCall(1000, () => {
          if (gameState.racePosition === 1 && gameState.avgQueryComplete) {
            showLevelComplete();
          } else {
            showRaceFailedMessage();
          }
        });
      }
      
      updateReactUI();
    }
    
    function showRaceFailedMessage() {
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const failMessage = sceneRef.add.text(400, 200, `🏁 RACE COMPLETED BUT LEVEL FAILED! 🏁\n\nYou finished in ${gameState.racePosition}${['st','nd','rd','th'][gameState.racePosition-1]} place.\nTo complete this level you need 1st place!\n\nAuto-restarting in 5 seconds...`, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ff6666',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 15, y: 10 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      // Auto-restart after 5 seconds
      sceneRef.time.delayedCall(5000, () => {
        overlay.destroy();
        failMessage.destroy();
        createRace.call(sceneRef);
        updateReactUI();
      });
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 150, text, {
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
      // Only call this if player got 1st place AND completed AVG query
      if (gameState.racePosition !== 1 || !gameState.avgQueryComplete) {
        return;
      }
      
      gameState.isLevelComplete = true;
      updateReactUI();
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 80, '🏆🥇 CHAMPION! LEVEL COMPLETE! 🥇🏆', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const achievementText = sceneRef.add.text(400, 130, 'Perfect Performance!\n🥇 1st Place + 📊 AVG Query Complete', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#00ff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText = sceneRef.add.text(400, 180, 'SQL Queries Used:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(1001);
      
      let queriesUsed = '';
      if (gameState.slowQueryUsed) queriesUsed += '🐌 MIN(courage_level) → Slowed opponents\n';
      if (gameState.fastQueryUsed) queriesUsed += '🚀 MAX(courage_level) → Speed boost\n';
      if (gameState.avgQueryComplete) queriesUsed += '📊 AVG(courage_level) → Race completion (78.5)';
      
      const queryResults = sceneRef.add.text(400, 220, queriesUsed, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#90ee90',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const raceStatsText = sceneRef.add.text(400, 280, `🏁 Final Position: ${gameState.racePosition}/${gameState.totalRacers}\n⏱️ Race Time: ${Math.floor(gameState.raceTime / 60)}:${(gameState.raceTime % 60).toString().padStart(2, '0')}\n🏊 Strategy Used: ${gameState.slowQueryUsed && gameState.fastQueryUsed ? 'FULL POWER' : gameState.slowQueryUsed || gameState.fastQueryUsed ? 'PARTIAL' : 'BASIC'}\n📊 Level Status: COMPLETE`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const explanationText = sceneRef.add.text(400, 350, 'You learned: MIN() finds lowest value, MAX() finds highest value, AVG() calculates average!\nStrategic SQL usage gave you competitive advantages in the jungle river race!', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 420, 'You mastered the Jungle River Race! Click to return to map', {
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

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: Math.max(0, gameState.health),
        raceStarted: gameState.raceStarted,
        raceFinished: gameState.raceFinished,
        racePosition: gameState.racePosition,
        currentLap: gameState.currentLap,
        raftSpeed: Math.round(gameState.raftSpeed),
        raceTime: gameState.raceTime,
        slowQueryUsed: gameState.slowQueryUsed,
        fastQueryUsed: gameState.fastQueryUsed,
        avgQueryComplete: gameState.avgQueryComplete,
        gameState: gameState.racePaused ? 'paused' : gameState.raceStarted ? 'racing' : 'waiting'
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

  const handleMobileControlStart = (direction) => {
    setMobileControls(prev => ({ ...prev, [direction]: true }));
  };

  const handleMobileControlEnd = (direction) => {
    setMobileControls(prev => ({ ...prev, [direction]: false }));
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <GiBoatFishing size={20} color="#8b4513" />
          <span>Your Raft</span>
        </div>
        <div className="flex items-center gap-2">
          <FaWater size={20} color="#0277bd" />
          <span>River Speed: {uiState.raftSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <GiTrophy size={20} color="#ffd700" />
          <span>Position: {uiState.racePosition}/4</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🏁</span>
          <span>Lap: {uiState.currentLap}/3</span>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg mx-auto"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      <div className="w-full max-w-3xl flex justify-center gap-4 mb-4">
        {!uiState.raceStarted && (
          <button
            onClick={startRace}
            className="bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
          >
            <FaPlay /> START RACE
          </button>
        )}
        
        {uiState.raceStarted && !uiState.raceFinished && (
          <div className="flex gap-2">
            {!uiState.slowQueryUsed && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    const scene = gameInstance.current.scene.scenes[0];
                    scene.gameState.racePaused = true;
                    scene.forceStopAllRafts();
                  }
                  setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'slow' }));
                }}
                className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded font-bold text-sm transition-colors"
              >
                1️⃣ SLOW OTHERS (MIN)
              </button>
            )}
            
            {!uiState.fastQueryUsed && (
              <button
                onClick={() => {
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    const scene = gameInstance.current.scene.scenes[0];
                    scene.gameState.racePaused = true;
                    scene.forceStopAllRafts();
                  }
                  setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'fast' }));
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded font-bold text-sm transition-colors"
              >
                2️⃣ SPEED BOOST (MAX)
              </button>
            )}
          </div>
        )}
        
        {uiState.raceFinished && !uiState.avgQueryComplete && (
          <button
            onClick={() => {
              if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                const scene = gameInstance.current.scene.scenes[0];
                scene.gameState.racePaused = true;
                scene.forceStopAllRafts();
              }
              setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'avg' }));
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded font-bold text-sm transition-colors animate-pulse"
          >
            3️⃣ FINISH RACE (AVG) - REQUIRED!
          </button>
        )}
      </div>
      
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>Race Time: <span className="text-blue-400">{Math.floor(uiState.raceTime / 60)}:{(uiState.raceTime % 60).toString().padStart(2, '0')}</span></div>
        <div>Game State: <span className={`${uiState.gameState === 'racing' ? 'text-green-400' : uiState.gameState === 'paused' ? 'text-yellow-400' : 'text-slate-400'}`}>{uiState.gameState.toUpperCase()}</span></div>
        <div>Queries Used: <span className="text-purple-400">{[uiState.slowQueryUsed && 'MIN', uiState.fastQueryUsed && 'MAX', uiState.avgQueryComplete && 'AVG'].filter(Boolean).join(', ') || 'None'}</span></div>
        <div>Status: <span className="text-orange-400">{uiState.raceFinished ? 'FINISHED' : 'RACING'}</span></div>
      </div>

      {uiState.showQueryInput && uiState.queryType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="pixel-font text-xl text-blue-400 mb-4 text-center">
              🏊 {uiState.queryType === 'slow' ? '🐌 SLOW OPPONENTS' : uiState.queryType === 'fast' ? '🚀 SPEED BOOST' : '📊 FINISH RACE'} 🏊
            </h3>
            
            <div className="text-center mb-4">
              <span className="text-red-400 font-bold animate-pulse">⏸️ RACE PAUSED - ALL RAFTS STOPPED ⏸️</span>
            </div>
            
            <p className="text-slate-300 mb-4 text-sm text-center">
              {queryTypes[uiState.queryType].description}
            </p>
            
            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-green-400 text-xs font-mono">
                {queryTypes[uiState.queryType].effect}
              </p>
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={3}
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
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                ⚡ Execute & Resume Race
              </button>
              <button
                onClick={() => {
                  setUiState(prev => ({ ...prev, showQueryInput: false }));
                  setSqlQuery('');
                  setQueryError('');
                  if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
                    gameInstance.current.scene.scenes[0].gameState.racePaused = false;
                  }
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">🏊 Jungle River Raft Race - Strategic SQL Racing:</div>
        <div className="font-mono text-lg">
          {!uiState.raceStarted ? (
            <span className="text-blue-400 font-bold bg-blue-900/50 px-2 py-1 rounded">
              🏁 Click START RACE to begin your jungle river adventure!
            </span>
          ) : uiState.gameState === 'paused' ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              ⏸️ Race paused - All rafts stopped for SQL query!
            </span>
          ) : uiState.raceFinished && !uiState.avgQueryComplete ? (
            <span className="text-purple-400 font-bold bg-purple-900/50 px-2 py-1 rounded animate-pulse">
              🏁 Race finished! Complete AVG query to finish level!
            </span>
          ) : uiState.avgQueryComplete && uiState.raceFinished ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              🏆 Checking results... Need 1st place to complete level!
            </span>
          ) : (
            <span className="text-orange-400 font-bold bg-orange-900/50 px-2 py-1 rounded">
              🏊 Racing! Use SQL queries strategically to gain advantages!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          ⚠️ To complete level: Get 1st place AND complete AVG query ⚠️
        </div>
      </div>

      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>JUNGLE RAFT CONTROLS:</strong></div>
        
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Navigate Raft</div>
            <div>1️⃣2️⃣ During Race</div>
            <div>3️⃣ After Race Finish</div>
          </div>
        </div>

        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 gap-1 w-36 h-36">
              <div></div>
              <button
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlStart('up'); 
                }}
                onTouchEnd={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlEnd('up'); 
                }}
                style={{ touchAction: 'none' }}
              >
                ↑
              </button>
              <div></div>
              
              <button
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlStart('left'); 
                }}
                onTouchEnd={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlEnd('left'); 
                }}
                style={{ touchAction: 'none' }}
              >
                ←
              </button>
              <div className="bg-slate-700 rounded"></div>
              <button
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlStart('right'); 
                }}
                onTouchEnd={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlEnd('right'); 
                }}
                style={{ touchAction: 'none' }}
              >
                →
              </button>
              
              <div></div>
              <button
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlStart('down'); 
                }}
                onTouchEnd={(e) => { 
                  e.preventDefault(); 
                  handleMobileControlEnd('down'); 
                }}
                style={{ touchAction: 'none' }}
              >
                ↓
              </button>
              <div></div>
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

export default Level8;
