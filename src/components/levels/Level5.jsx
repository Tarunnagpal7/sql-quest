import React, { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { levels } from "../../assets/data/levels";
import { GiFishing, GiMonkey, GiSeaSerpent, GiSailboat } from "react-icons/gi";
import MobileControls from "../MobileControls"; // Import the component

const Level5 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    fish: false, // Added fish control
  });

  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    courageLevel: 30,
    maxCourage: 100,
    fishCollected: 0,
    totalFish: 12,
    sharksDefeated: 0,
    totalSharks: 5,
    showQueryInput: false,
    monkeyFreed: false,
    requiredCourage: 80,
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryError, setQueryError] = useState("");
  const [querySuccess, setQuerySuccess] = useState(false);

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    fish: false,
  });

  const resetAllMobileControls = () => {
    mobileControlsRef.current = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      fish: false,
    };
  };

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      // Reset all controls when touch ends anywhere
      resetAllMobileControls();
    };

    document.addEventListener("touchend", handleGlobalTouchEnd, {
      passive: true,
    });
    document.addEventListener("touchcancel", handleGlobalTouchEnd, {
      passive: true,
    });

    return () => {
      document.removeEventListener("touchend", handleGlobalTouchEnd);
      document.removeEventListener("touchcancel", handleGlobalTouchEnd);
    };
  }, []);

  // Expected correct queries
  const correctQueries = [
    "SELECT * FROM jungle_explorers ORDER BY courage_level DESC LIMIT 1;",
    "select * from jungle_explorers order by courage_level desc limit 1;",
    "SELECT * FROM jungle_explorers ORDER BY courage_level DESC LIMIT 1",
    "select * from jungle_explorers order by courage_level desc limit 1",
  ];

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

  const handleFish = useCallback(() => {
    // Update both ref and state
    mobileControlsRef.current.fish = true;
    setMobileControls((prev) => ({ ...prev, fish: true }));
    setTimeout(() => {
      mobileControlsRef.current.fish = false;
      setMobileControls((prev) => ({ ...prev, fish: false }));
    }, 50);
  }, []);

  const handleQuerySubmit = () => {
    const normalizedQuery = sqlQuery.trim().toLowerCase().replace(/\s+/g, " ");
    const isCorrect = correctQueries.some(
      (query) => normalizedQuery === query.toLowerCase().replace(/\s+/g, " ")
    );

    if (isCorrect) {
      setQuerySuccess(true);
      setQueryError("");
      setUiState((prev) => ({ ...prev, showQueryInput: false }));

      // Signal to game that query is complete
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeQuery();
      }
    } else {
      setQueryError(
        "Query failed! Find the explorer with the highest courage level."
      );
      setTimeout(() => setQueryError(""), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, raft, fish, sharks, monkey, islands, powerUps;
    let cursors, spaceKey, fishKey;

    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      canFish: true,
      attackCooldown: 500,
      fishCooldown: 1000,
      courageLevel: 30,
      maxCourage: 100,
      fishCollected: 0,
      totalFish: 12,
      sharksDefeated: 0,
      totalSharks: 5,
      queryComplete: false,
      monkeyFreed: false,
      requiredCourage: 80,
      isOnRaft: true,
      explorersData: [
        { id: 1, name: "Alex the Brave", courage_level: 95 },
        { id: 2, name: "Maya the Bold", courage_level: 78 },
        { id: 3, name: "Jin the Fearless", courage_level: 82 },
        { id: 4, name: "Elena the Daring", courage_level: 88 },
      ],
    };

    let sceneRef;

    function preload() {
      sceneRef = this;

      // --- Create Wizard Character on Raft ---
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

      // Fishing rod
      playerGraphics.lineStyle(3, 0x8b4513);
      playerGraphics.beginPath();
      playerGraphics.moveTo(28, 42);
      playerGraphics.lineTo(35, 10);
      playerGraphics.strokePath();

      // Fishing line
      playerGraphics.lineStyle(1, 0x000000);
      playerGraphics.beginPath();
      playerGraphics.moveTo(35, 10);
      playerGraphics.lineTo(40, 25);
      playerGraphics.strokePath();

      playerGraphics.generateTexture("player", 45, 50);
      playerGraphics.destroy();

      // --- Create Wooden Raft ---
      const raftGraphics = this.add.graphics();

      // Raft base
      raftGraphics.fillStyle(0x8b4513, 1);
      raftGraphics.fillRect(5, 10, 50, 30);

      // Log details
      raftGraphics.fillStyle(0x654321, 1);
      for (let i = 0; i < 5; i++) {
        raftGraphics.fillRect(7 + i * 9, 12, 7, 26);
      }

      // Rope bindings
      raftGraphics.fillStyle(0xdaa520, 1);
      raftGraphics.fillRect(5, 15, 50, 2);
      raftGraphics.fillRect(5, 25, 50, 2);
      raftGraphics.fillRect(5, 35, 50, 2);

      raftGraphics.generateTexture("raft", 60, 50);
      raftGraphics.destroy();

      // --- Create Different Fish Types ---
      const fishTypes = ["courage_fish", "golden_fish", "power_fish"];
      const fishColors = [0x00ff00, 0xffd700, 0xff4500];

      fishTypes.forEach((type, index) => {
        const fishGraphics = this.add.graphics();
        const color = fishColors[index];

        // Fish body
        fishGraphics.fillStyle(color, 1);
        fishGraphics.fillEllipse(15, 15, 20, 12);

        // Fish tail
        fishGraphics.fillTriangle(5, 15, 0, 10, 0, 20);

        // Fish eye
        fishGraphics.fillStyle(0x000000, 1);
        fishGraphics.fillCircle(20, 13, 2);
        fishGraphics.fillStyle(0xffffff, 1);
        fishGraphics.fillCircle(21, 12, 1);

        // Fish fins
        fishGraphics.fillStyle(color, 0.8);
        fishGraphics.fillTriangle(15, 18, 12, 22, 18, 22);
        fishGraphics.fillTriangle(15, 12, 12, 8, 18, 8);

        // Special effects for different fish
        if (type === "courage_fish") {
          // Green glow for courage
          fishGraphics.fillStyle(0x90ee90, 0.4);
          fishGraphics.fillCircle(15, 15, 20);
        } else if (type === "golden_fish") {
          // Golden sparkles
          fishGraphics.fillStyle(0xffff00, 1);
          fishGraphics.fillCircle(10, 10, 1);
          fishGraphics.fillCircle(20, 8, 1);
          fishGraphics.fillCircle(18, 18, 1);
        } else if (type === "power_fish") {
          // Red energy aura
          fishGraphics.fillStyle(0xff6666, 0.5);
          fishGraphics.fillCircle(15, 15, 18);
        }

        fishGraphics.generateTexture(type, 30, 30);
        fishGraphics.destroy();
      });

      // --- Create Dangerous Sharks ---
      const sharkTypes = ["tiger_shark", "bull_shark", "great_white"];
      const sharkColors = [0x2f4f4f, 0x708090, 0xdcdcdc];

      sharkTypes.forEach((type, index) => {
        const sharkGraphics = this.add.graphics();
        const color = sharkColors[index];

        // Shark body
        sharkGraphics.fillStyle(color, 1);
        sharkGraphics.fillEllipse(25, 20, 40, 16);

        // Shark head
        sharkGraphics.fillTriangle(45, 20, 55, 15, 55, 25);

        // Shark fins
        sharkGraphics.fillTriangle(25, 12, 20, 5, 30, 8); // Top fin
        sharkGraphics.fillTriangle(10, 25, 5, 30, 15, 28); // Side fin
        sharkGraphics.fillTriangle(5, 20, 0, 15, 0, 25); // Tail

        // Shark teeth - FIXED LINES
        sharkGraphics.fillStyle(0xffffff, 1);
        for (let i = 0; i < 5; i++) {
          const x = 48 + i * 2;
          sharkGraphics.fillTriangle(x, 18, x + 1, 16, x + 2, 18); // ✅ Fixed
          sharkGraphics.fillTriangle(x, 22, x + 1, 24, x + 2, 22); // ✅ Fixed
        }

        // Menacing eyes
        sharkGraphics.fillStyle(0xff0000, 1);
        sharkGraphics.fillCircle(40, 17, 3);
        sharkGraphics.fillCircle(40, 23, 3);

        // Danger aura
        sharkGraphics.fillStyle(0xff4444, 0.3);
        sharkGraphics.fillCircle(25, 20, 35);

        sharkGraphics.generateTexture(type, 60, 40);
        sharkGraphics.destroy();
      });

      // --- Create Sacred Monkey Trapped in Stone ---
      const monkeyGraphics = this.add.graphics();

      // Stone cage
      monkeyGraphics.fillStyle(0x696969, 1);
      monkeyGraphics.fillRect(10, 15, 40, 35);

      // Stone bars
      monkeyGraphics.fillStyle(0x2f4f4f, 1);
      for (let i = 0; i < 4; i++) {
        monkeyGraphics.fillRect(15 + i * 8, 15, 3, 35);
      }
      for (let i = 0; i < 3; i++) {
        monkeyGraphics.fillRect(10, 20 + i * 10, 40, 3);
      }

      // Monkey inside (visible through bars)
      monkeyGraphics.fillStyle(0x8b4513, 1);
      monkeyGraphics.fillCircle(30, 25, 8); // Head
      monkeyGraphics.fillRect(25, 30, 10, 12); // Body

      // Monkey face
      monkeyGraphics.fillStyle(0xfdbcb4, 1);
      monkeyGraphics.fillCircle(30, 25, 6);

      // Monkey eyes (sad)
      monkeyGraphics.fillStyle(0x000000, 1);
      monkeyGraphics.fillCircle(27, 23, 2);
      monkeyGraphics.fillCircle(33, 23, 2);

      // Tears
      monkeyGraphics.fillStyle(0x87ceeb, 1);
      monkeyGraphics.fillCircle(26, 27, 1);
      monkeyGraphics.fillCircle(34, 27, 1);

      // Magic seal on cage
      monkeyGraphics.fillStyle(0x8b5cf6, 0.8);
      monkeyGraphics.fillCircle(30, 10, 8);
      monkeyGraphics.fillStyle(0xffffff, 1);
      monkeyGraphics.fillCircle(30, 10, 3);

      monkeyGraphics.generateTexture("trapped_monkey", 60, 55);
      monkeyGraphics.destroy();

      // --- Create Free Monkey ---
      const freeMonkeyGraphics = this.add.graphics();

      // Monkey body
      freeMonkeyGraphics.fillStyle(0x8b4513, 1);
      freeMonkeyGraphics.fillCircle(20, 18, 10); // Head
      freeMonkeyGraphics.fillRect(15, 25, 10, 15); // Body

      // Monkey face
      freeMonkeyGraphics.fillStyle(0xfdbcb4, 1);
      freeMonkeyGraphics.fillCircle(20, 18, 8);

      // Happy eyes
      freeMonkeyGraphics.fillStyle(0x000000, 1);
      freeMonkeyGraphics.fillCircle(17, 16, 2);
      freeMonkeyGraphics.fillCircle(23, 16, 2);

      // Smile
      freeMonkeyGraphics.lineStyle(2, 0x000000);
      freeMonkeyGraphics.beginPath();
      freeMonkeyGraphics.arc(20, 20, 4, 0, Math.PI);
      freeMonkeyGraphics.strokePath();

      // Arms raised in joy
      freeMonkeyGraphics.fillStyle(0x8b4513, 1);
      freeMonkeyGraphics.fillRect(10, 22, 5, 8); // Left arm
      freeMonkeyGraphics.fillRect(25, 22, 5, 8); // Right arm

      // Celebration sparkles
      freeMonkeyGraphics.fillStyle(0xffd700, 1);
      freeMonkeyGraphics.fillCircle(12, 12, 2);
      freeMonkeyGraphics.fillCircle(28, 14, 2);
      freeMonkeyGraphics.fillCircle(15, 8, 1);
      freeMonkeyGraphics.fillCircle(25, 10, 1);

      freeMonkeyGraphics.generateTexture("free_monkey", 40, 45);
      freeMonkeyGraphics.destroy();

      // --- Create River Islands ---
      const islandGraphics = this.add.graphics();

      // Island base
      islandGraphics.fillStyle(0xc2b280, 1);
      islandGraphics.fillCircle(40, 30, 35);

      // Palm tree
      islandGraphics.fillStyle(0x8b4513, 1);
      islandGraphics.fillRect(38, 10, 4, 25);

      // Palm leaves
      islandGraphics.fillStyle(0x228b22, 1);
      islandGraphics.fillEllipse(35, 8, 15, 6);
      islandGraphics.fillEllipse(45, 8, 15, 6);
      islandGraphics.fillEllipse(40, 5, 6, 15);
      islandGraphics.fillEllipse(40, 12, 6, 15);

      // Beach sand
      islandGraphics.fillStyle(0xf4a460, 1);
      islandGraphics.fillCircle(40, 35, 25);

      islandGraphics.generateTexture("island", 80, 70);
      islandGraphics.destroy();

      // Create water texture
      this.add
        .graphics()
        .fillStyle(0x006994)
        .fillRect(0, 0, 800, 500)
        .generateTexture("water_background", 800, 500);

      // Create courage bar
      const courageBarGraphics = this.add.graphics();
      courageBarGraphics.fillStyle(0x333333, 1);
      courageBarGraphics.fillRect(0, 0, 200, 20);
      courageBarGraphics.fillStyle(0x00ff00, 1);
      courageBarGraphics.fillRect(2, 2, 196, 16);
      courageBarGraphics.generateTexture("courage_bar", 200, 20);
      courageBarGraphics.destroy();
    }

    function create() {
      // Create water background
      this.add.image(400, 250, "water_background");

      // Add water waves effect
      createWaterWaves.call(this);

      fish = this.physics.add.group();
      sharks = this.physics.add.group();
      islands = this.physics.add.staticGroup();
      powerUps = this.physics.add.group();

      // Create raft first
      raft = this.physics.add.sprite(100, 250, "raft");
      raft.setCollideWorldBounds(true);
      raft.body.setSize(50, 40);

      // Player starts on the raft
      player = this.physics.add.sprite(100, 250, "player");
      player.setCollideWorldBounds(true).body.setSize(35, 40).setOffset(5, 5);

      // Create trapped monkey on an island
      monkey = this.physics.add.sprite(650, 250, "trapped_monkey");
      monkey.setImmovable(true);

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      fishKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

      // Setup physics interactions
      this.physics.add.overlap(player, fish, catchFish, null, this);
      this.physics.add.overlap(player, sharks, fightShark, null, this);
      this.physics.add.overlap(player, monkey, rescueMonkey, null, this);

      // Add methods to scene
      this.completeQuery = completeQuery;
      this.showQueryInput = showQueryInput;

      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      fish.clear(true, true);
      sharks.clear(true, true);
      islands.clear(true, true);

      gameState.fishCollected = 0;
      gameState.sharksDefeated = 0;
      gameState.courageLevel = 30;
      gameState.queryComplete = false;
      gameState.monkeyFreed = false;

      // Create islands
      createIslands.call(this);

      // Spawn fish in the river
      spawnFish.call(this);

      // Spawn sharks patrolling the water
      spawnSharks.call(this);

      // Create courage display
      createCourageDisplay.call(this);

      player.setPosition(100, 250).setVelocity(0, 0);
    }

    function createWaterWaves() {
      // Create animated water effects
      for (let i = 0; i < 10; i++) {
        const wave = sceneRef.add.circle(
          Math.random() * 800,
          Math.random() * 500,
          5 + Math.random() * 10,
          0x87ceeb,
          0.3
        );

        sceneRef.tweens.add({
          targets: wave,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 2000 + Math.random() * 1000,
          repeat: -1,
          delay: Math.random() * 2000,
        });
      }
    }

    function createIslands() {
      // Small islands scattered in the river
      const islandPositions = [
        { x: 200, y: 150 },
        { x: 350, y: 350 },
        { x: 500, y: 180 },
        { x: 650, y: 300 }, // Monkey island
      ];

      islandPositions.forEach((pos, index) => {
        const island = islands.create(pos.x, pos.y, "island");
        island.setScale(0.8);

        if (index === islandPositions.length - 1) {
          // This is the monkey island - place monkey here
          monkey.setPosition(pos.x, pos.y - 20);
        }
      });
    }

    function spawnFish() {
      const fishPositions = [
        { x: 150, y: 200, type: "courage_fish" },
        { x: 250, y: 300, type: "golden_fish" },
        { x: 180, y: 350, type: "courage_fish" },
        { x: 320, y: 180, type: "power_fish" },
        { x: 280, y: 380, type: "courage_fish" },
        { x: 420, y: 220, type: "golden_fish" },
        { x: 380, y: 320, type: "courage_fish" },
        { x: 520, y: 160, type: "power_fish" },
        { x: 480, y: 350, type: "courage_fish" },
        { x: 580, y: 280, type: "golden_fish" },
        { x: 620, y: 200, type: "courage_fish" },
        { x: 550, y: 380, type: "power_fish" },
      ];

      fishPositions.forEach((pos) => {
        const fishSprite = fish.create(pos.x, pos.y, pos.type);
        fishSprite
          .setCollideWorldBounds(true)
          .body.setSize(25, 20)
          .setOffset(2, 5);
        fishSprite.fishType = pos.type;

        // Fish swimming animation
        sceneRef.tweens.add({
          targets: fishSprite,
          x: fishSprite.x + (Math.random() - 0.5) * 100,
          y: fishSprite.y + (Math.random() - 0.5) * 60,
          duration: 3000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        // Fish floating animation
        sceneRef.tweens.add({
          targets: fishSprite,
          rotation: (Math.random() - 0.5) * 0.5,
          duration: 2000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    function spawnSharks() {
      const sharkPositions = [
        { x: 300, y: 200, type: "tiger_shark" },
        { x: 450, y: 300, type: "bull_shark" },
        { x: 200, y: 350, type: "great_white" },
        { x: 550, y: 150, type: "tiger_shark" },
        { x: 400, y: 400, type: "bull_shark" },
      ];

      sharkPositions.forEach((pos, index) => {
        const shark = sharks.create(pos.x, pos.y, pos.type);
        shark.setCollideWorldBounds(true).body.setSize(50, 30).setOffset(5, 5);
        shark.health = 80;
        shark.maxHealth = 80;
        shark.speed = 60;
        shark.attackDamage = 20;
        shark.patrolDistance = 100;
        shark.startX = pos.x;
        shark.startY = pos.y;
        shark.direction = 1;
        shark.sharkType = pos.type;

        // Shark swimming animation
        sceneRef.tweens.add({
          targets: shark,
          scaleX: 1.1,
          scaleY: 0.95,
          duration: 1200 + index * 200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    function createCourageDisplay() {
      // Create courage meter at top of screen
      const courageText = sceneRef.add.text(20, 20, "Courage Level:", {
        fontSize: "16px",
        fontFamily: "Courier New",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      });

      const courageBar = sceneRef.add.graphics();
      courageBar.x = 20;
      courageBar.y = 50;
      sceneRef.courageBar = courageBar;

      // Create separate text object for courage numbers
      const courageValueText = sceneRef.add
        .text(120, 60, "", {
          fontSize: "12px",
          fontFamily: "Courier New",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      sceneRef.courageValueText = courageValueText;

      updateCourageBar();
    }

    function updateCourageBar() {
      if (!sceneRef.courageBar) return;

      sceneRef.courageBar.clear();

      // Background
      sceneRef.courageBar.fillStyle(0x333333, 1);
      sceneRef.courageBar.fillRect(0, 0, 200, 20);

      // Courage fill
      const couragePercent = gameState.courageLevel / gameState.maxCourage;
      const fillWidth = 196 * couragePercent;
      const color =
        couragePercent >= 0.8
          ? 0x00ff00
          : couragePercent >= 0.5
          ? 0xffff00
          : 0xff4444;

      sceneRef.courageBar.fillStyle(color, 1);
      sceneRef.courageBar.fillRect(2, 2, fillWidth, 16);

      // ✅ Update the separate text object instead
      if (sceneRef.courageValueText) {
        sceneRef.courageValueText.setText(
          `${gameState.courageLevel}/${gameState.maxCourage}`
        );
      }
    }

    function update() {
      if (gameState.isLevelComplete) return;

      const currentMobileControls = getMobileControls();
      const activeControls = Object.values(currentMobileControls).filter(
        Boolean
      ).length;
      if (activeControls > 2) {
        // Too many controls active, likely stuck - reset all
        Object.keys(mobileControlsRef.current).forEach((key) => {
          if (key !== "attack") mobileControlsRef.current[key] = false;
        });
      }

      // Player movement (raft moves with player)
      player.setVelocity(0);
      raft.setVelocity(0);

      const speed = 160;

      // Use the ref instead of state for game logic
      if (cursors.left.isDown || mobileControlsRef.current.left) {
        player.setVelocityX(-speed);
        raft.setVelocityX(-speed);
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
        player.setVelocityX(speed);
        raft.setVelocityX(speed);
      }

      if (cursors.up.isDown || mobileControlsRef.current.up) {
        player.setVelocityY(-speed);
        raft.setVelocityY(-speed);
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        player.setVelocityY(speed);
        raft.setVelocityY(speed);
      }

      if (
        (Phaser.Input.Keyboard.JustDown(spaceKey) ||
          mobileControlsRef.current.attack) &&
        gameState.canAttack
      ) {
        attack.call(this);
      }

      if (
        (Phaser.Input.Keyboard.JustDown(fishKey) ||
          mobileControlsRef.current.fish) &&
        gameState.canFish
      ) {
        tryFishing.call(this);
      }

      // Update sharks with patrol behavior
      updateSharks.call(this);

      // Keep player on raft
      const distanceToRaft = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        raft.x,
        raft.y
      );
      if (distanceToRaft > 30) {
        // Snap player back to raft
        const angle = Phaser.Math.Angle.Between(
          raft.x,
          raft.y,
          player.x,
          player.y
        );
        player.x = raft.x + Math.cos(angle) * 25;
        player.y = raft.y + Math.sin(angle) * 25;
      }
    }

    function updateSharks() {
      sharks.children.entries.forEach((shark) => {
        if (!shark.active) return;

        const distanceToPlayer = Phaser.Math.Distance.Between(
          shark.x,
          shark.y,
          player.x,
          player.y
        );

        if (distanceToPlayer < 120) {
          // Chase player
          sceneRef.physics.moveTo(shark, player.x, player.y, shark.speed * 1.2);
          shark.setTint(0xff6666);
        } else {
          // Patrol behavior
          shark.clearTint();
          const distanceFromStart = Phaser.Math.Distance.Between(
            shark.x,
            shark.startX,
            shark.y,
            shark.startY
          );

          if (distanceFromStart > shark.patrolDistance) {
            shark.direction *= -1;
          }

          const angle = Phaser.Math.Angle.Between(
            shark.x,
            shark.y,
            shark.startX + shark.direction * shark.patrolDistance,
            shark.startY
          );
          shark.setVelocity(
            Math.cos(angle) * shark.speed,
            Math.sin(angle) * shark.speed
          );
        }
      });
    }

    function tryFishing() {
      gameState.canFish = false;

      // Create fishing effect
      const fishingEffect = sceneRef.add.circle(
        player.x + 40,
        player.y + 20,
        30,
        0x87ceeb,
        0.5
      );
      sceneRef.tweens.add({
        targets: fishingEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 800,
        onComplete: () => fishingEffect.destroy(),
      });

      // Check for nearby fish
      let caughtFish = false;
      fish.children.entries.forEach((fishSprite) => {
        if (!fishSprite.active) return;

        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          fishSprite.x,
          fishSprite.y
        );
        if (distance <= 80) {
          catchFish(player, fishSprite);
          caughtFish = true;
        }
      });

      if (!caughtFish) {
        showMessage("No fish nearby! Get closer to fish and try again.", 1500);
      }

      sceneRef.time.delayedCall(gameState.fishCooldown, () => {
        gameState.canFish = true;
      });
    }

    function attack() {
      gameState.canAttack = false;

      const attackRange = 90;

      // Magic attack effects
      const attackEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange,
        0x8b5cf6,
        0.4
      );
      const innerEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange * 0.6,
        0xfbbf24,
        0.5
      );

      sceneRef.tweens.add({
        targets: attackEffect,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 300,
        onComplete: () => attackEffect.destroy(),
      });

      sceneRef.tweens.add({
        targets: innerEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 250,
        onComplete: () => innerEffect.destroy(),
      });

      sharks.children.entries.forEach((shark) => {
        if (!shark.active) return;

        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          shark.x,
          shark.y
        );
        if (distance <= attackRange) {
          shark.health -= 60;

          const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            shark.x,
            shark.y
          );
          shark.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

          shark.setTint(0x8b5cf6);
          sceneRef.time.delayedCall(150, () => {
            if (shark.active) shark.clearTint();
          });

          if (shark.health <= 0) {
            gameState.sharksDefeated++;

            const explosion = sceneRef.add.circle(
              shark.x,
              shark.y,
              40,
              0xff6b6b
            );
            sceneRef.tweens.add({
              targets: explosion,
              scaleX: 4,
              scaleY: 4,
              alpha: 0,
              duration: 500,
              onComplete: () => explosion.destroy(),
            });

            // Courage bonus for defeating shark
            gameState.courageLevel = Math.min(
              gameState.maxCourage,
              gameState.courageLevel + 5
            );
            showMessage("+5 Courage! Shark defeated!", 1500);

            shark.destroy();
          }
        }
      });

      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });

      updateCourageBar();
      updateReactUI();
    }

    function catchFish(player, fishSprite) {
      gameState.fishCollected++;

      // Different fish give different courage bonuses
      let courageBonus = 0;
      let message = "";

      switch (fishSprite.fishType) {
        case "courage_fish":
          courageBonus = 8;
          message = "+8 Courage! Brave fish caught!";
          break;
        case "golden_fish":
          courageBonus = 12;
          message = "+12 Courage! Golden fish caught!";
          break;
        case "power_fish":
          courageBonus = 15;
          message = "+15 Courage! Power fish caught!";
          break;
      }

      gameState.courageLevel = Math.min(
        gameState.maxCourage,
        gameState.courageLevel + courageBonus
      );

      // Visual collection effect
      const collectEffect = sceneRef.add.circle(
        fishSprite.x,
        fishSprite.y,
        40,
        0x00ff00,
        0.8
      );
      sceneRef.tweens.add({
        targets: collectEffect,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 600,
        onComplete: () => collectEffect.destroy(),
      });

      showMessage(message, 2000);

      fishSprite.destroy();
      updateCourageBar();
      updateReactUI();
    }

    function fightShark(player, shark) {
      if (shark.lastPlayerHit && sceneRef.time.now - shark.lastPlayerHit < 2000)
        return;

      shark.lastPlayerHit = sceneRef.time.now;

      // Courage affects damage taken
      const courageFactor = gameState.courageLevel / gameState.maxCourage;
      const damageReduction = courageFactor * 0.5; // Up to 50% damage reduction
      const actualDamage = Math.round(
        shark.attackDamage * (1 - damageReduction)
      );

      gameState.health -= actualDamage;

      player.setTint(0xff0000);
      sceneRef.time.delayedCall(300, () => player.clearTint());

      const angle = Phaser.Math.Angle.Between(
        shark.x,
        shark.y,
        player.x,
        player.y
      );
      player.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
      raft.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);

      showMessage(`Shark attack! -${actualDamage} health`, 1500);

      if (gameState.health <= 0) {
        gameOver("The sharks have defeated you!");
      }
      updateReactUI();
    }

    function rescueMonkey(player, monkey) {
      if (gameState.courageLevel < gameState.requiredCourage) {
        showMessage(
          `You need ${gameState.requiredCourage} courage to free the monkey! Current: ${gameState.courageLevel}`,
          3000
        );
        return;
      }

      if (!gameState.queryComplete) {
        showQueryInput();
        return;
      }

      // Free the monkey!
      gameState.monkeyFreed = true;
      monkey.setTexture("free_monkey");

      showLevelComplete();
    }

    function showQueryInput() {
      setUiState((prev) => ({ ...prev, showQueryInput: true }));
    }

    function completeQuery() {
      gameState.queryComplete = true;
      showMessage(
        "Query executed! You found the most courageous explorer!\nYou can now free the monkey!",
        3000
      );
      updateReactUI();
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add
        .text(400, 80, text, {
          fontSize: "16px",
          fontFamily: "Courier New",
          color: "#ffff00",
          backgroundColor: "#000000",
          align: "center",
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(1000);

      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      updateReactUI();

      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);

      const completionText = sceneRef.add
        .text(400, 100, "🐒 Sacred Monkey Freed! 🐒", {
          fontSize: "28px",
          fontFamily: "Courier New",
          color: "#00ff00",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText = sceneRef.add
        .text(400, 140, "Query Executed Successfully:", {
          fontSize: "16px",
          fontFamily: "Courier New",
          color: "#00ffff",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText2 = sceneRef.add
        .text(
          400,
          160,
          "SELECT * FROM jungle_explorers ORDER BY courage_level DESC LIMIT 1;",
          {
            fontSize: "13px",
            fontFamily: "Courier New",
            color: "#00ffff",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(1001);

      // Show the most courageous explorer
      const topExplorer = gameState.explorersData.sort(
        (a, b) => b.courage_level - a.courage_level
      )[0];
      const resultText = sceneRef.add
        .text(400, 200, `Most Courageous Explorer Found:`, {
          fontSize: "14px",
          fontFamily: "Courier New",
          color: "#ffff00",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const explorerResult = sceneRef.add
        .text(
          400,
          220,
          `${topExplorer.name} - Courage: ${topExplorer.courage_level}`,
          {
            fontSize: "16px",
            fontFamily: "Courier New",
            color: "#90ee90",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5)
        .setDepth(1001);

      const statsText = sceneRef.add
        .text(
          400,
          270,
          `🐟 Fish Caught: ${gameState.fishCollected}/${gameState.totalFish}\n🦈 Sharks Defeated: ${gameState.sharksDefeated}/${gameState.totalSharks}\n💪 Final Courage: ${gameState.courageLevel}/${gameState.maxCourage}`,
          {
            fontSize: "14px",
            fontFamily: "Courier New",
            color: "#ffff00",
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(1001);

      const instructionText = sceneRef.add
        .text(400, 350, "The Sacred Monkey is free! Click to return to map", {
          fontSize: "28px",
          fontFamily: "Courier New",
          color: "#00ff00",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      overlay.setInteractive();
      overlay.on("pointerdown", () => {
        onComplete();
      });

      sceneRef.tweens.add({
        targets: instructionText,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    function gameOver(message) {
      const gameOverText = sceneRef.add
        .text(400, 250, message, {
          fontSize: "22px",
          fontFamily: "Courier New",
          color: "#ff4444",
          backgroundColor: "#000000",
          align: "center",
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5);

      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;
      gameState.courageLevel = 30;

      // Reset UI state
      setUiState((prev) => ({
        ...prev,
        showQueryInput: false,
        courageLevel: 30,
      }));
      setSqlQuery("");
      setQueryError("");
      setQuerySuccess(false);

      sceneRef.time.delayedCall(3000, () => {
        gameOverText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function updateReactUI() {
      setUiState((prev) => ({
        ...prev,
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
        courageLevel: gameState.courageLevel,
        fishCollected: gameState.fishCollected,
        sharksDefeated: gameState.sharksDefeated,
        monkeyFreed: gameState.monkeyFreed,
      }));
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameContainerRef.current,
      physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
      scene: { preload, create, update },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      gameInstance.current?.destroy(true);
    };
  }, [onComplete]); // REMOVED mobileControls from dependency array

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the game elements as reference */}
      <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <GiSailboat size={12} color="white" />
          </div>
          <span>Your Raft</span>
        </div>
        <div className="flex items-center gap-2">
          <GiFishing size={20} color="#00ff00" />
          <span>Fish (Courage)</span>
        </div>
        <div className="flex items-center gap-2">
          <GiSeaSerpent size={20} color="#ff4444" />
          <span>Sharks</span>
        </div>
        <div className="flex items-center gap-2">
          <GiMonkey size={20} color="#8b4513" />
          <span>Trapped Monkey</span>
        </div>
      </div>

      {/* Responsive game container */}
      <div className="w-full max-w-4xl">
        <div
          ref={gameContainerRef}
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg mx-auto"
          style={{ maxWidth: "800px" }}
        />
      </div>

      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>
          Health: <span className="text-rose-400">{uiState.health}/100</span>
        </div>
        <div>
          Courage:{" "}
          <span className="text-green-400">
            {uiState.courageLevel}/{uiState.maxCourage}
          </span>
        </div>
        <div>
          Fish Caught:{" "}
          <span className="text-blue-400">
            {uiState.fishCollected}/{uiState.totalFish}
          </span>
        </div>
        <div>
          Sharks Defeated:{" "}
          <span className="text-red-400">
            {uiState.sharksDefeated}/{uiState.totalSharks}
          </span>
        </div>
      </div>

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
            <h3 className="pixel-font text-xl text-yellow-400 mb-4 text-center">
              🐒 Free the Sacred Monkey 🐒
            </h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              list all columns from jungle_explorers where order by
              courage_level has to be maximum and limit is 1.
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
              style={{ outline: "none" }}
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
      <div className="block md:hidden">
        <div className="flex flex-col items-center gap-4">
          {/* Use the MobileControls component but add extra fish functionality */}
          <MobileControls
            mobileControlsRef={mobileControlsRef}
            setMobileControls={setMobileControls}
          />

          {/* Extra Fish Button for Level5 - positioned separately */}
          <button
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 rounded-full  text-white font-bold text-sm flex items-center justify-center select-none transition-colors"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFish();
            }}
            style={{ touchAction: "none" }}
          >
            FISH
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">
          SQL Query Challenge:
        </div>
        <div className="font-mono text-lg">
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              Query Completed Successfully!
            </span>
          ) : uiState.courageLevel >= uiState.requiredCourage ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              You have enough courage! Write the SQL query to free the monkey
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              Need {uiState.requiredCourage} courage to free the monkey! Catch
              fish to gain courage
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Catch fish to gain courage • Defeat sharks • Reach 80 courage • Write
          SQL query • Free monkey!
        </div>
      </div>

      {/* Use the reusable MobileControls component with custom Fishing button */}
      <div className="w-full hidden md:block max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        {/* Desktop Controls */}
        <div className="hidden md:block">
          <div className="pixel-font text-slate-400 text-sm mb-2 text-center">
            <strong>CONTROLS:</strong>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Navigate Raft</div>
            <div>SPACE : Attack</div>
            <div>F : Fishing</div>
          </div>
        </div>

        {/* Mobile Controls - Custom for Level5 with Fish button */}
      </div>

      <style jsx>{`
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};

export default Level5;
