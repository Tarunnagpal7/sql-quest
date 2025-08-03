import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { GiBoatFishing, GiTrophy } from "react-icons/gi";
import { FaPlay, FaPause, FaWater } from "react-icons/fa";
import MobileControls from '../MobileControls'; // Import the component

const Level8 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    query1: false, // Added query controls
    query2: false,
    query3: false
  });
  
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

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    query1: false,
    query2: false,
    query3: false
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

  const handleQuery1 = useCallback(() => {
    // Slow opponents query
    if (!uiState.slowQueryUsed && uiState.raceStarted && !uiState.raceFinished) {
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        const scene = gameInstance.current.scene.scenes[0];
        scene.gameState.racePaused = true;
        scene.forceStopAllRafts();
      }
      setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'slow' }));
    }
  }, [uiState.slowQueryUsed, uiState.raceStarted, uiState.raceFinished]);

  const handleQuery2 = useCallback(() => {
    // Speed boost query
    if (!uiState.fastQueryUsed && uiState.raceStarted && !uiState.raceFinished) {
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        const scene = gameInstance.current.scene.scenes[0];
        scene.gameState.racePaused = true;
        scene.forceStopAllRafts();
      }
      setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'fast' }));
    }
  }, [uiState.fastQueryUsed, uiState.raceStarted, uiState.raceFinished]);

  const handleQuery3 = useCallback(() => {
    // Average query
    if (!uiState.avgQueryComplete && uiState.raceFinished) {
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        const scene = gameInstance.current.scene.scenes[0];
        scene.gameState.racePaused = true;
        scene.forceStopAllRafts();
      }
      setUiState(prev => ({ ...prev, showQueryInput: true, queryType: 'avg' }));
    }
  }, [uiState.avgQueryComplete, uiState.raceFinished]);

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
        { name: 'River Runner', position: 1, speed: 70, color: 0xff0000, progress: 0, currentLap: 0 },
        { name: 'Rapids Master', position: 2, speed: 65, color: 0x00ff00, progress: 0, currentLap: 0 },
        { name: 'Current Rider', position: 3, speed: 68, color: 0xffff00, progress: 0, currentLap: 0 }
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
      
      // Register scene methods
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

    function passCheckpoint(player, checkpoint) {
      if (!gameState.raceStarted || gameState.racePaused) return;
      
      // Mark checkpoint as passed
      checkpoint.passed = true;
      
      // Visual feedback
      const passEffect = sceneRef.add.circle(checkpoint.x, checkpoint.y, 30, 0x00ff00, 0.8);
      sceneRef.tweens.add({
        targets: passEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => passEffect.destroy()
      });
      
      showMessage(`Checkpoint ${checkpoint.checkpointIndex} passed!`, 1500);
    }

    function crossFinishLine() {
      if (!gameState.raceStarted || gameState.racePaused) return;
      
      gameState.currentLap++;
      
      if (gameState.currentLap >= gameState.totalLaps) {
        // Race finished
        gameState.raceFinished = true;
        gameState.raceStarted = false;
        
        // Calculate final position
        updateRacePosition();
        
        const finishEffect = sceneRef.add.circle(player.x, player.y, 50, 0xffd700, 0.8);
        sceneRef.tweens.add({
          targets: finishEffect,
          scaleX: 3,
          scaleY: 3,
          alpha: 0,
          duration: 1000,
          onComplete: () => finishEffect.destroy()
        });
        
        showMessage(`Race finished! Position: ${gameState.racePosition}/${gameState.totalRacers}`, 3000);
        
        if (gameState.racePosition === 1) {
          showMessage('🏆 You won! Complete AVG query to finish level!', 4000);
        } else {
          showMessage('⏰ Auto-restart in 10 seconds...', 3000);
          gameState.autoResetTimer = sceneRef.time.delayedCall(10000, () => {
            createRace.call(sceneRef);
            updateReactUI();
          });
        }
      } else {
        // Next lap
        showMessage(`Lap ${gameState.currentLap}/${gameState.totalLaps} completed!`, 2000);
      }
      
      updateReactUI();
    }

    function updateOpponents() {
      opponents.children.entries.forEach((opponent, index) => {
        if (!opponent.active) return;
        
        const opponentData = gameState.opponents[index];
        if (!opponentData) return;
        
        if (gameState.raceStarted && !gameState.racePaused) {
          // Move opponent forward
          const baseSpeed = opponentData.speed * gameState.opponentSlowdown;
          opponent.setVelocityY(-baseSpeed);
          
          // Update progress
          opponentData.progress += baseSpeed * 0.016; // Approximate delta time
          
          // Check for lap completion
          if (opponent.y <= 50 && !opponent.lapCompleting) {
            opponent.lapCompleting = true;
            opponentData.currentLap++;
            
            if (opponentData.currentLap >= gameState.totalLaps) {
              // Opponent finished
              opponent.setVelocity(0);
              opponent.setTint(0x00ff00);
            } else {
              // Reset for next lap
              sceneRef.time.delayedCall(100, () => {
                opponent.y = 450;
                opponent.lapCompleting = false;
              });
            }
          }
        } else {
          opponent.setVelocity(0);
        }
      });
    }

    function createRacingUI() {
      // Create race info display
      const raceInfoText = sceneRef.add.text(20, 80, '', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      sceneRef.raceInfoText = raceInfoText;
      
      updateRacingUI();
    }

    function updateRacingUI() {
      if (sceneRef.raceInfoText) {
        sceneRef.raceInfoText.setText(
          `Position: ${gameState.racePosition}/${gameState.totalRacers}\n` +
          `Lap: ${gameState.currentLap}/${gameState.totalLaps}\n` +
          `Speed: ${Math.round(gameState.raftSpeed)} km/h`
        );
      }
    }

    function updateRacePosition() {
      // Simple position calculation based on progress and lap
      let playerScore = gameState.currentLap * 1000 + (450 - player.y);
      let position = 1;
      
      gameState.opponents.forEach(opponent => {
        let opponentScore = (opponent.currentLap || 0) * 1000 + (450 - (opponents.children.entries.find(o => o.active)?.y || 450));
        if (opponentScore > playerScore) {
          position++;
        }
      });
      
      gameState.racePosition = position;
    }

    function startRace() {
      gameState.raceStarted = true;
      gameState.racePaused = false;
      gameState.raceFinished = false;
      gameState.raceTime = 0;
      
      // Reset all positions
      player.setPosition(400, 450);
      
      // Create and position opponents
      opponents.clear(true, true);
      gameState.opponents.forEach((oppData, index) => {
        const opponent = opponents.create(350 + (index * 50), 450, `opponent_raft_${index}`);
        opponent.setCollideWorldBounds(true);
        opponent.body.setSize(35, 55);
        opponent.currentLap = 0;
        opponent.lapCompleting = false;
        oppData.currentLap = 0;
        oppData.progress = 0;
      });
      
      showMessage('🏁 Race Started! Navigate with arrow keys!', 3000);
      
      // Start race timer
      sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
          if (gameState.raceStarted && !gameState.racePaused) {
            gameState.raceTime++;
            updateReactUI();
          }
        },
        callbackScope: sceneRef,
        loop: true
      });
      
      updateReactUI();
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add.text(400, 100, text, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        backgroundColor: '#000000',
        align: 'center',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setDepth(1000);
      
      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    function showQueryInput(queryType) {
      gameState.racePaused = true;
      forceStopAllRafts();
      setUiState(prev => ({ 
        ...prev, 
        showQueryInput: true, 
        queryType: queryType,
        gameState: 'paused'
      }));
    }

    function completeQuery(queryType) {
      gameState.racePaused = false;
      
      if (queryType === 'slow') {
        gameState.slowQueryUsed = true;
        gameState.opponentSlowdown = 0.7; // Slow opponents by 30%
        showMessage('MIN query executed! Opponents slowed down!', 2000);
      } else if (queryType === 'fast') {
        gameState.fastQueryUsed = true;
        gameState.speedBoost = 1.5; // Boost player speed by 50%
        showMessage('MAX query executed! Speed boosted!', 2000);
      } else if (queryType === 'avg') {
        gameState.avgQueryComplete = true;
        showMessage('AVG query executed! Checking race completion...', 2000);
        
        // Check if player won
        if (gameState.racePosition === 1) {
          sceneRef.time.delayedCall(2000, () => {
            showLevelComplete();
          });
        } else {
          showMessage('Need 1st place to complete level! Restarting...', 3000);
          sceneRef.time.delayedCall(3000, () => {
            createRace.call(sceneRef);
            updateReactUI();
          });
        }
      }
      
      setUiState(prev => ({ 
        ...prev, 
        gameState: 'racing',
        slowQueryUsed: gameState.slowQueryUsed,
        fastQueryUsed: gameState.fastQueryUsed,
        avgQueryComplete: gameState.avgQueryComplete
      }));
      
      updateReactUI();
    }

    function forceStopAllRafts() {
      // Stop player
      player.setVelocity(0);
      
      // Stop all opponents
      opponents.children.entries.forEach(opponent => {
        if (opponent.active) {
          opponent.setVelocity(0);
        }
      });
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      updateReactUI();
      
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);
      
      const completionText = sceneRef.add.text(400, 100, '🏆 River Race Champion! 🏆', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      const queryText = sceneRef.add.text(400, 140, 'All SQL Aggregate Queries Completed:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#00ffff'
      }).setOrigin(0.5).setDepth(1001);
      
      const queriesList = sceneRef.add.text(400, 180, 
        'MIN(courage_level) - Slowed opponents\n' +
        'MAX(courage_level) - Boosted speed\n' +
        'AVG(courage_level) - Calculated average', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#90ee90',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const statsText = sceneRef.add.text(400, 250, 
        `🏁 Final Position: ${gameState.racePosition}/${gameState.totalRacers}\n` +
        `⏱️ Race Time: ${Math.floor(gameState.raceTime / 60)}:${(gameState.raceTime % 60).toString().padStart(2, '0')}\n` +
        `📊 Queries Used: ${[gameState.slowQueryUsed && 'MIN', gameState.fastQueryUsed && 'MAX', gameState.avgQueryComplete && 'AVG'].filter(Boolean).join(', ')}`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5).setDepth(1001);
      
      const instructionText = sceneRef.add.text(400, 350, 'You mastered SQL aggregates! Click to return to map', {
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
      
      // Use the ref instead of state for game logic
      if (cursors.up.isDown || mobileControlsRef.current.up) {
        player.setVelocityY(-baseSpeed);
        gameState.raftSpeed = baseSpeed;
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        player.setVelocityY(baseSpeed * 0.5);
        gameState.raftSpeed = baseSpeed * 0.5;
      } else {
        gameState.raftSpeed = 0;
      }
      
      if (cursors.left.isDown || mobileControlsRef.current.left) {
        player.setVelocityX(-baseSpeed * 0.7);
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
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

    function updateReactUI() {
      setUiState(prev => ({
        ...prev,
        health: Math.max(0, gameState.health),
        raceStarted: gameState.raceStarted,
        raceFinished: gameState.raceFinished,
        racePosition: gameState.racePosition,
        currentLap: gameState.currentLap,
        raftSpeed: Math.round(gameState.raftSpeed),
        gameState: gameState.racePaused ? 'paused' : gameState.raceStarted ? 'racing' : 'waiting',
        raceTime: gameState.raceTime,
        slowQueryUsed: gameState.slowQueryUsed,
        fastQueryUsed: gameState.fastQueryUsed,
        avgQueryComplete: gameState.avgQueryComplete
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
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <GiBoatFishing size={20} color="#8b4513" />
          <span>Your Raft</span>
        </div>
        <div className="flex items-center gap-2">
          <FaWater size={20} color="#0277bd" />
          <span>Speed: {uiState.raftSpeed} km/h</span>
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

      {/* SQL Query Input Modal */}
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

      {/* Use the reusable MobileControls component with custom Query buttons */}
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
            {/* Use the MobileControls component */}
            <MobileControls 
              mobileControlsRef={mobileControlsRef}
              setMobileControls={setMobileControls}
            />
            
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
