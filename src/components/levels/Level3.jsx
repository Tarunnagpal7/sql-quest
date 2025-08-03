import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { levels } from "../../assets/data/levels";
import { AiFillBug } from "react-icons/ai";
import { GiAncientRuins, GiTreasureMap, GiCrystalBall } from "react-icons/gi";

const Level3 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);

  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
    artifactsCollected: 0,
    totalArtifacts: 0,
    enemiesDefeated: 0,
    totalEnemies: 0,
    templeDoorsOpen: false,
    showQueryInput: false,
    allEnemiesKilled: false,
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryError, setQueryError] = useState("");
  const [querySuccess, setQuerySuccess] = useState(false);

  // Mobile controls ref
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
  });

  const resetAllMobileControls = () => {
    mobileControlsRef.current = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
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

  // Expected correct queries (multiple variations accepted)
  const correctQueries = [
    "SELECT * FROM artifacts WHERE found_by IS NOT NULL;",
    "select * from artifacts where found_by is not null;",
    "SELECT * FROM artifacts WHERE found_by IS NOT NULL",
    "select * from artifacts where found_by is not null",
    "SELECT * FROM artifacts WHERE found_by != NULL;",
    "select * from artifacts where found_by != null;",
  ];

  const handleQuerySubmit = () => {
    const normalizedQuery = sqlQuery.trim().toLowerCase().replace(/\s+/g, " ");
    const isCorrect = correctQueries.some(
      (query) => normalizedQuery === query.toLowerCase().replace(/\s+/g, " ")
    );

    if (isCorrect) {
      setQuerySuccess(true);
      setQueryError("");
      setUiState((prev) => ({
        ...prev,
        showQueryInput: false,
        templeDoorsOpen: true,
      }));

      // Signal to game that doors should open
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].openTempleDoors();
      }
    } else {
      setQueryError(
        "Query failed! Try finding all artifacts where found_by is not null."
      );
      setTimeout(() => setQueryError(""), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player,
      enemies,
      artifacts,
      courageOrbs,
      walls,
      templeGates,
      templeDoors;
    let cursors, spaceKey;

    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      attackCooldown: 400,
      artifactsCollected: 0,
      enemiesDefeated: 0,
      totalArtifacts: 5,
      totalEnemies: 5,
      templeDoorsOpen: false,
      allEnemiesKilled: false,
      artifactsSpawned: false,
      artifactsData: [],
    };

    let sceneRef;
    // Make mobile controls accessible to Phaser
    const getMobileControls = () => mobileControlsRef.current;

    function preload() {
      sceneRef = this;

      // --- Create Wizard Character (same as previous levels) ---
      const playerGraphics = this.add.graphics();

      // Wizard robe (main body)
      playerGraphics.fillStyle(0x1e3a8a, 1); // Dark blue robe
      playerGraphics.fillCircle(16, 25, 14); // Body
      playerGraphics.fillRect(2, 15, 28, 20); // Robe body

      // Wizard hood
      playerGraphics.fillStyle(0x1e40af, 1);
      playerGraphics.fillCircle(16, 12, 10); // Hood

      // Hood shadow/depth
      playerGraphics.fillStyle(0x0f172a, 1);
      playerGraphics.fillEllipse(16, 14, 18, 8);

      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(16, 16, 6);

      // Eyes with glow
      playerGraphics.fillStyle(0x60a5fa, 0.7);
      playerGraphics.fillCircle(13, 15, 2.5);
      playerGraphics.fillCircle(19, 15, 2.5);
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(13, 15, 1.5);
      playerGraphics.fillCircle(19, 15, 1.5);

      // Robe details
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillRect(2, 20, 28, 2);
      playerGraphics.fillRect(14, 15, 4, 25);

      // Magic staff
      playerGraphics.lineStyle(3, 0x92400e);
      playerGraphics.beginPath();
      playerGraphics.moveTo(24, 35);
      playerGraphics.lineTo(26, 18);
      playerGraphics.strokePath();
      playerGraphics.fillStyle(0x8b5cf6, 0.8);
      playerGraphics.fillCircle(26, 16, 4);

      // Robe bottom
      playerGraphics.fillStyle(0x1e3a8a, 1);
      playerGraphics.beginPath();
      playerGraphics.moveTo(5, 35);
      playerGraphics.lineTo(8, 38);
      playerGraphics.lineTo(12, 35);
      playerGraphics.lineTo(16, 38);
      playerGraphics.lineTo(20, 35);
      playerGraphics.lineTo(24, 38);
      playerGraphics.lineTo(27, 35);
      playerGraphics.lineTo(27, 25);
      playerGraphics.lineTo(5, 25);
      playerGraphics.closePath();
      playerGraphics.fillPath();

      playerGraphics.generateTexture("player", 32, 40);
      playerGraphics.destroy();

      // --- Create Temple Guardian Enemies ---
      const enemyTypes = [
        "skeleton_warrior",
        "stone_golem",
        "shadow_guardian",
        "ancient_mummy",
        "demon_guardian",
      ];
      const enemyColors = [0xf5f5dc, 0x696969, 0x2f1b69, 0xd2691e, 0x8b0000];

      enemyTypes.forEach((type, index) => {
        const enemyGraphics = this.add.graphics();
        const color = enemyColors[index];

        if (type === "skeleton_warrior") {
          // Skeleton warrior
          enemyGraphics.fillStyle(color, 1);
          enemyGraphics.fillRect(8, 20, 16, 18); // Body
          enemyGraphics.fillCircle(16, 12, 8); // Head

          // Armor details
          enemyGraphics.fillStyle(0x708090, 1);
          enemyGraphics.fillRect(10, 22, 12, 3); // Chest plate
          enemyGraphics.fillRect(6, 18, 4, 8); // Left arm armor
          enemyGraphics.fillRect(22, 18, 4, 8); // Right arm armor

          // Weapon
          enemyGraphics.fillStyle(0xc0c0c0, 1);
          enemyGraphics.fillRect(26, 12, 2, 16); // Sword
          enemyGraphics.fillRect(24, 12, 6, 3); // Sword guard
        } else if (type === "stone_golem") {
          // Stone golem
          enemyGraphics.fillStyle(color, 1);
          enemyGraphics.fillRect(6, 15, 20, 23); // Large body
          enemyGraphics.fillRect(10, 8, 12, 12); // Head

          // Stone texture
          enemyGraphics.fillStyle(0x2f4f4f, 1);
          enemyGraphics.fillRect(8, 18, 3, 3);
          enemyGraphics.fillRect(21, 18, 3, 3);
          enemyGraphics.fillRect(14, 25, 4, 4);

          // Glowing eyes
          enemyGraphics.fillStyle(0xff4500, 1);
          enemyGraphics.fillCircle(13, 12, 2);
          enemyGraphics.fillCircle(19, 12, 2);
        } else if (type === "shadow_guardian") {
          // Shadow guardian
          enemyGraphics.fillStyle(color, 0.8);
          enemyGraphics.fillEllipse(16, 25, 18, 20); // Shadowy body
          enemyGraphics.fillCircle(16, 12, 10); // Head

          // Ethereal effects
          enemyGraphics.fillStyle(0x9932cc, 0.6);
          enemyGraphics.fillCircle(16, 20, 25); // Aura

          // Glowing eyes
          enemyGraphics.fillStyle(0x8a2be2, 1);
          enemyGraphics.fillCircle(13, 12, 2);
          enemyGraphics.fillCircle(19, 12, 2);
        } else if (type === "ancient_mummy") {
          // Ancient mummy
          enemyGraphics.fillStyle(color, 1);
          enemyGraphics.fillRect(8, 18, 16, 20); // Body
          enemyGraphics.fillCircle(16, 12, 8); // Head

          // Bandage wrappings
          enemyGraphics.fillStyle(0xffffff, 0.8);
          enemyGraphics.fillRect(6, 16, 20, 2);
          enemyGraphics.fillRect(6, 22, 20, 2);
          enemyGraphics.fillRect(6, 28, 20, 2);
          enemyGraphics.fillRect(6, 34, 20, 2);

          // Ancient jewelry
          enemyGraphics.fillStyle(0xffd700, 1);
          enemyGraphics.fillRect(14, 20, 4, 2);
          enemyGraphics.fillCircle(16, 12, 1);
        } else if (type === "demon_guardian") {
          // Demon guardian
          enemyGraphics.fillStyle(color, 1);
          enemyGraphics.fillRect(8, 18, 16, 20); // Body
          enemyGraphics.fillCircle(16, 12, 10); // Head

          // Horns
          enemyGraphics.fillTriangle(12, 8, 14, 3, 16, 8);
          enemyGraphics.fillTriangle(16, 8, 18, 3, 20, 8);

          // Wings
          enemyGraphics.fillStyle(color, 0.7);
          enemyGraphics.fillEllipse(6, 20, 8, 12);
          enemyGraphics.fillEllipse(26, 20, 8, 12);

          // Glowing eyes
          enemyGraphics.fillStyle(0xff0000, 1);
          enemyGraphics.fillCircle(13, 12, 2);
          enemyGraphics.fillCircle(19, 12, 2);
        }

        enemyGraphics.generateTexture(type, 32, 40);
        enemyGraphics.destroy();
      });

      // --- Create Ancient Artifacts ---
      const artifactTypes = [
        "golden_idol",
        "crystal_orb",
        "ancient_scroll",
        "mystic_amulet",
        "sacred_chalice",
      ];
      const artifactColors = [0xffd700, 0x00bfff, 0xdaa520, 0x9370db, 0xcd853f];

      artifactTypes.forEach((type, index) => {
        const artifactGraphics = this.add.graphics();
        const color = artifactColors[index];

        if (type === "golden_idol") {
          // Golden idol
          artifactGraphics.fillStyle(color, 1);
          artifactGraphics.fillRect(10, 20, 12, 15); // Base
          artifactGraphics.fillCircle(16, 12, 8); // Head
          artifactGraphics.fillRect(8, 18, 4, 8); // Left arm
          artifactGraphics.fillRect(20, 18, 4, 8); // Right arm

          // Details
          artifactGraphics.fillStyle(0xffff00, 1);
          artifactGraphics.fillCircle(14, 10, 1);
          artifactGraphics.fillCircle(18, 10, 1);
        } else if (type === "crystal_orb") {
          // Crystal orb
          artifactGraphics.fillStyle(color, 0.8);
          artifactGraphics.fillCircle(16, 16, 12);

          // Inner glow
          artifactGraphics.fillStyle(0xffffff, 0.6);
          artifactGraphics.fillCircle(16, 16, 8);
          artifactGraphics.fillStyle(color, 0.4);
          artifactGraphics.fillCircle(16, 16, 4);
        } else if (type === "ancient_scroll") {
          // Ancient scroll
          artifactGraphics.fillStyle(color, 1);
          artifactGraphics.fillRect(8, 8, 16, 20);

          // Scroll details
          artifactGraphics.fillStyle(0x8b4513, 1);
          artifactGraphics.fillRect(6, 8, 2, 20);
          artifactGraphics.fillRect(24, 8, 2, 20);

          // Text lines
          artifactGraphics.fillStyle(0x2f4f4f, 1);
          for (let i = 0; i < 5; i++) {
            artifactGraphics.fillRect(10, 10 + i * 3, 12, 1);
          }
        } else if (type === "mystic_amulet") {
          // Mystic amulet
          artifactGraphics.fillStyle(color, 1);
          artifactGraphics.fillCircle(16, 18, 10);

          // Chain
          artifactGraphics.fillStyle(0xc0c0c0, 1);
          artifactGraphics.fillRect(15, 8, 2, 8);

          // Center gem
          artifactGraphics.fillStyle(0xff0000, 1);
          artifactGraphics.fillCircle(16, 18, 4);
        } else if (type === "sacred_chalice") {
          // Sacred chalice
          artifactGraphics.fillStyle(color, 1);
          artifactGraphics.fillRect(12, 15, 8, 8); // Cup
          artifactGraphics.fillRect(14, 23, 4, 6); // Stem
          artifactGraphics.fillRect(10, 29, 12, 2); // Base

          // Decorative gems
          artifactGraphics.fillStyle(0xff0000, 1);
          artifactGraphics.fillCircle(12, 19, 2);
          artifactGraphics.fillStyle(0x00ff00, 1);
          artifactGraphics.fillCircle(20, 19, 2);
        }

        // Add magical glow effect to all artifacts
        artifactGraphics.fillStyle(color, 0.3);
        artifactGraphics.fillCircle(16, 18, 20);

        artifactGraphics.generateTexture(type, 32, 36);
        artifactGraphics.destroy();
      });

      // --- Create Temple Doors ---
      const doorGraphics = this.add.graphics();

      // Closed door
      doorGraphics.fillStyle(0x8b4513, 1); // Brown stone
      doorGraphics.fillRect(0, 0, 60, 80);

      // Door decorations
      doorGraphics.fillStyle(0xffd700, 1);
      doorGraphics.fillRect(5, 10, 50, 4);
      doorGraphics.fillRect(5, 66, 50, 4);
      doorGraphics.fillRect(5, 10, 4, 60);
      doorGraphics.fillRect(51, 10, 4, 60);

      // Door handles
      doorGraphics.fillCircle(15, 40, 3);
      doorGraphics.fillCircle(45, 40, 3);

      // Ancient symbols
      doorGraphics.fillStyle(0xff4500, 1);
      doorGraphics.fillCircle(30, 25, 4);
      doorGraphics.fillTriangle(25, 45, 30, 35, 35, 45);
      doorGraphics.fillRect(25, 50, 10, 3);

      doorGraphics.generateTexture("temple_door_closed", 60, 80);
      doorGraphics.destroy();

      // Open door
      const openDoorGraphics = this.add.graphics();
      openDoorGraphics.fillStyle(0x000000, 0.8);
      openDoorGraphics.fillRect(0, 0, 60, 80);

      // Golden light streaming out
      openDoorGraphics.fillStyle(0xffd700, 0.6);
      openDoorGraphics.fillRect(10, 0, 40, 80);
      openDoorGraphics.fillStyle(0xffff00, 0.4);
      openDoorGraphics.fillRect(20, 0, 20, 80);

      openDoorGraphics.generateTexture("temple_door_open", 60, 80);
      openDoorGraphics.destroy();

      // Create other textures
      this.add
        .graphics()
        .fillStyle(0x8b4513)
        .fillRect(0, 0, 40, 40)
        .generateTexture("temple_wall", 40, 40);
      this.add
        .graphics()
        .fillStyle(0x654321)
        .fillRect(0, 0, 800, 500)
        .generateTexture("temple_background", 800, 500);

      // Healing orbs
      const orbGraphics = this.add.graphics();
      orbGraphics.fillStyle(0x00ff00, 0.8);
      orbGraphics.fillCircle(15, 15, 12);
      orbGraphics.fillStyle(0x90ee90, 0.6);
      orbGraphics.fillCircle(15, 15, 8);
      orbGraphics.fillStyle(0xffffff, 0.8);
      orbGraphics.fillCircle(15, 15, 4);
      orbGraphics.generateTexture("healing_orb", 30, 30);
      orbGraphics.destroy();
    }

    function create() {
      this.add.image(400, 250, "temple_background");

      walls = this.physics.add.staticGroup();
      enemies = this.physics.add.group();
      artifacts = this.physics.add.group();
      courageOrbs = this.physics.add.group();
      templeGates = this.physics.add.staticGroup();

      player = this.physics.add.sprite(100, 250, "player");
      player.setCollideWorldBounds(true).body.setSize(20, 25).setOffset(6, 10);

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      this.physics.add.collider(player, walls);
      this.physics.add.collider(enemies, walls);
      this.physics.add.collider(enemies, enemies);

      this.physics.add.overlap(player, artifacts, collectArtifact, null, this);
      this.physics.add.overlap(
        player,
        courageOrbs,
        collectHealingOrb,
        null,
        this
      );
      this.physics.add.overlap(player, templeGates, enterTemple, null, this);
      this.physics.add.overlap(player, enemies, hitByEnemy, null, this);

      // Add openTempleDoors method to scene
      this.openTempleDoors = openTempleDoors;

      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      enemies.clear(true, true);
      artifacts.clear(true, true);
      courageOrbs.clear(true, true);
      templeGates.clear(true, true);
      walls.clear(true, true);

      gameState.artifactsCollected = 0;
      gameState.enemiesDefeated = 0;
      gameState.templeDoorsOpen = false;
      gameState.allEnemiesKilled = false;
      gameState.artifactsSpawned = false;
      gameState.artifactsData = [
        { id: 1, name: "Golden Idol", found_by: null },
        { id: 2, name: "Crystal Orb", found_by: null },
        { id: 3, name: "Ancient Scroll", found_by: null },
        { id: 4, name: "Mystic Amulet", found_by: null },
        { id: 5, name: "Sacred Chalice", found_by: null },
      ];

      // Create temple structure
      createTempleWalls.call(this);

      // Create only enemies initially - artifacts spawn after all enemies are killed
      createEnemies.call(this);

      // Create healing orbs
      createHealingOrbs.call(this);

      // Create temple doors at the end
      createTempleDoors.call(this);

      player.setPosition(100, 250).setVelocity(0, 0);
      gameState.totalEnemies = enemies.children.entries.length;
    }

    function createTempleWalls() {
      // Create ancient temple layout
      const wallPositions = [
        // Outer temple walls
        [40, 40],
        [120, 40],
        [200, 40],
        [280, 40],
        [360, 40],
        [440, 40],
        [520, 40],
        [600, 40],
        [680, 40],
        [760, 40],
        [40, 460],
        [120, 460],
        [200, 460],
        [280, 460],
        [360, 460],
        [440, 460],
        [520, 460],
        [600, 460],
        [680, 460],
        [760, 460],
        [40, 120],
        [40, 200],
        [40, 280],
        [40, 360],
        [760, 120],
        [760, 200],
        [760, 280],
        [760, 360],

        // Inner temple chambers
        [200, 120],
        [200, 200],
        [200, 280],
        [200, 360],
        [400, 120],
        [400, 200],
        [400, 280],
        [400, 360],
        [600, 120],
        [600, 200],
        [600, 280],
        [600, 360],

        // Cross passages
        [280, 200],
        [320, 200],
        [480, 200],
        [520, 200],
        [280, 300],
        [320, 300],
        [480, 300],
        [520, 300],
      ];

      wallPositions.forEach((pos) =>
        walls.create(pos[0], pos[1], "temple_wall")
      );
    }

    function createEnemies() {
      const enemyPositions = [
        { x: 150, y: 160, type: "skeleton_warrior" },
        { x: 350, y: 160, type: "stone_golem" },
        { x: 550, y: 160, type: "shadow_guardian" },
        { x: 250, y: 340, type: "ancient_mummy" },
        { x: 550, y: 340, type: "demon_guardian" },
      ];

      enemyPositions.forEach((pos, index) => {
        const enemy = enemies.create(pos.x, pos.y, pos.type);
        enemy.setCollideWorldBounds(true).body.setSize(25, 30).setOffset(3, 5);
        enemy.health = 150;
        enemy.maxHealth = 150;
        enemy.speed = 60;
        enemy.patrolDistance = 80;
        enemy.startX = pos.x;
        enemy.startY = pos.y;
        enemy.direction = 1;
        enemy.guardianType = pos.type;
        enemy.artifactIndex = index; // Link to artifact data

        // Add wing flapping animation for demon guardian
        if (pos.type === "demon_guardian") {
          sceneRef.tweens.add({
            targets: enemy,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      });
    }

    function spawnArtifacts() {
      if (gameState.artifactsSpawned) return;

      gameState.artifactsSpawned = true;

      const artifactPositions = [
        { x: 150, y: 160, type: "golden_idol", id: 1, name: "Golden Idol" },
        { x: 350, y: 160, type: "crystal_orb", id: 2, name: "Crystal Orb" },
        {
          x: 550,
          y: 160,
          type: "ancient_scroll",
          id: 3,
          name: "Ancient Scroll",
        },
        { x: 250, y: 340, type: "mystic_amulet", id: 4, name: "Mystic Amulet" },
        {
          x: 550,
          y: 340,
          type: "sacred_chalice",
          id: 5,
          name: "Sacred Chalice",
        },
      ];

      artifactPositions.forEach((data) => {
        const artifact = artifacts.create(data.x, data.y, data.type);
        artifact
          .setCollideWorldBounds(true)
          .body.setSize(25, 30)
          .setOffset(3, 3);
        artifact.artifactData = data;
        artifact.setAlpha(0); // Start invisible

        // Spawn animation
        sceneRef.tweens.add({
          targets: artifact,
          alpha: 1,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1000,
          ease: "Back.easeOut",
        });

        // Magical floating animation
        sceneRef.tweens.add({
          targets: artifact,
          y: artifact.y - 8,
          duration: 2000 + data.id * 200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        // Glowing effect
        sceneRef.tweens.add({
          targets: artifact,
          alpha: 0.7,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });

      // Show message about artifacts appearing
      const messageText = sceneRef.add
        .text(
          400,
          100,
          "✨ Ancient Artifacts Have Appeared! ✨\nDefeat all guardians, then write the SQL query to open the temple!",
          {
            fontSize: "16px",
            fontFamily: "Courier New",
            color: "#ffd700",
            backgroundColor: "#000000",
            align: "center",
            padding: { x: 10, y: 5 },
          }
        )
        .setOrigin(0.5)
        .setDepth(1000);

      sceneRef.time.delayedCall(4000, () => messageText.destroy());
    }

    function createHealingOrbs() {
      const orbPositions = [
        { x: 160, y: 120 },
        { x: 360, y: 120 },
        { x: 560, y: 120 },
        { x: 160, y: 380 },
        { x: 360, y: 380 },
        { x: 560, y: 380 },
      ];

      orbPositions.forEach((pos) => {
        const orb = courageOrbs.create(pos.x, pos.y, "healing_orb");
        orb.body.setCircle(12);

        // Pulsing animation
        sceneRef.tweens.add({
          targets: orb,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0.6,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    function createTempleDoors() {
      templeDoors = sceneRef.add.image(700, 250, "temple_door_closed");
      templeDoors.setScale(1.2);

      // Add temple gates collision area
      const gateArea = templeGates.create(700, 250, null);
      gateArea.body.setSize(80, 100);
      gateArea.setVisible(false);
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

      player.setVelocity(0);
      const speed = 180;

      if (cursors.left.isDown || currentMobileControls.left) {
        player.setVelocityX(-speed);
      } else if (cursors.right.isDown || currentMobileControls.right) {
        player.setVelocityX(speed);
      }

      if (cursors.up.isDown || currentMobileControls.up) {
        player.setVelocityY(-speed);
      } else if (cursors.down.isDown || currentMobileControls.down) {
        player.setVelocityY(speed);
      }

      if (
        (Phaser.Input.Keyboard.JustDown(spaceKey) ||
          currentMobileControls.attack) &&
        gameState.canAttack
      ) {
        attack.call(this);
      }

      // Enemy AI - guardian behavior
      enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;

        const distanceToPlayer = Phaser.Math.Distance.Between(
          enemy.x,
          enemy.y,
          player.x,
          player.y
        );

        if (distanceToPlayer < 120) {
          // Chase player if nearby
          sceneRef.physics.moveTo(enemy, player.x, player.y, enemy.speed * 1.5);
          enemy.setTint(0xff6666);
        } else {
          // Patrol behavior
          enemy.clearTint();
          const distanceFromStart = Phaser.Math.Distance.Between(
            enemy.x,
            enemy.startX,
            enemy.y,
            enemy.startY
          );

          if (distanceFromStart > enemy.patrolDistance) {
            enemy.direction *= -1;
          }

          const angle = Phaser.Math.Angle.Between(
            enemy.x,
            enemy.y,
            enemy.startX + enemy.direction * enemy.patrolDistance,
            enemy.startY
          );
          enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
        }
      });

      // Check if all enemies are killed
      if (
        !gameState.allEnemiesKilled &&
        gameState.enemiesDefeated >= gameState.totalEnemies
      ) {
        gameState.allEnemiesKilled = true;
        spawnArtifacts();

        // Show query input after a delay
        sceneRef.time.delayedCall(2000, () => {
          setUiState((prev) => ({
            ...prev,
            showQueryInput: true,
            allEnemiesKilled: true,
          }));
        });
      }
    }

    function attack() {
      gameState.canAttack = false;

      const attackRange = 90;

      // Magical attack effects
      const attackEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange,
        0x8b5cf6,
        0.3
      );
      const innerEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange * 0.6,
        0xfbbf24,
        0.4
      );

      sceneRef.tweens.add({
        targets: attackEffect,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 250,
        onComplete: () => attackEffect.destroy(),
      });

      sceneRef.tweens.add({
        targets: innerEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => innerEffect.destroy(),
      });

      enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;

        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          enemy.x,
          enemy.y
        );
        if (distance <= attackRange) {
          enemy.health -= 75;

          const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            enemy.x,
            enemy.y
          );
          enemy.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

          enemy.setTint(0x8b5cf6);
          sceneRef.time.delayedCall(150, () => {
            if (enemy.active) enemy.clearTint();
          });

          if (enemy.health <= 0) {
            gameState.enemiesDefeated++;

            const explosion = sceneRef.add.circle(
              enemy.x,
              enemy.y,
              30,
              0xff6b6b
            );
            sceneRef.tweens.add({
              targets: explosion,
              scaleX: 4,
              scaleY: 4,
              alpha: 0,
              duration: 400,
              onComplete: () => explosion.destroy(),
            });

            enemy.destroy();
          }
        }
      });

      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });

      updateReactUI();
    }

    function collectArtifact(player, artifact) {
      if (!gameState.templeDoorsOpen) {
        // Show message that doors must be opened first
        const messageText = sceneRef.add
          .text(
            artifact.x,
            artifact.y - 50,
            "Open the temple doors first by writing the SQL query!",
            {
              fontSize: "12px",
              fontFamily: "Courier New",
              color: "#ff4444",
              backgroundColor: "#000000",
              align: "center",
            }
          )
          .setOrigin(0.5);

        sceneRef.time.delayedCall(3000, () => messageText.destroy());
        return;
      }

      gameState.artifactsCollected++;

      // Update artifact data to show it's been found
      if (artifact.artifactData) {
        artifact.artifactData.found_by = 1; // Player ID

        // Update the artifacts data in gameState
        const artifactIndex = gameState.artifactsData.findIndex(
          (a) => a.id === artifact.artifactData.id
        );
        if (artifactIndex !== -1) {
          gameState.artifactsData[artifactIndex].found_by = 1;
        }
      }

      // Visual collection effect
      const collectEffect = sceneRef.add.circle(
        artifact.x,
        artifact.y,
        40,
        0xffd700,
        0.7
      );
      sceneRef.tweens.add({
        targets: collectEffect,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 500,
        onComplete: () => collectEffect.destroy(),
      });

      artifact.destroy();

      // Check if all artifacts collected
      if (gameState.artifactsCollected >= gameState.totalArtifacts) {
        showLevelComplete();
      }

      updateReactUI();
    }

    function collectHealingOrb(player, orb) {
      orb.destroy();

      // Heal player
      gameState.health = Math.min(gameState.maxHealth, gameState.health + 30);

      // Visual effect
      const healEffect = sceneRef.add.circle(
        player.x,
        player.y,
        30,
        0x00ff00,
        0.7
      );
      sceneRef.tweens.add({
        targets: healEffect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => healEffect.destroy(),
      });

      updateReactUI();
    }

    function openTempleDoors() {
      gameState.templeDoorsOpen = true;

      // Change door texture to open
      templeDoors.setTexture("temple_door_open");

      // Door opening effect
      const doorEffect = sceneRef.add.circle(
        templeDoors.x,
        templeDoors.y,
        50,
        0xffd700,
        0.5
      );
      sceneRef.tweens.add({
        targets: doorEffect,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1000,
        onComplete: () => doorEffect.destroy(),
      });

      // Show message
      const messageText = sceneRef.add
        .text(
          templeDoors.x,
          templeDoors.y - 80,
          "🏛️ Temple Doors Opened! 🏛️\nNow collect all the artifacts!",
          {
            fontSize: "14px",
            fontFamily: "Courier New",
            color: "#ffd700",
            backgroundColor: "#000000",
            align: "center",
          }
        )
        .setOrigin(0.5);

      sceneRef.time.delayedCall(4000, () => messageText.destroy());

      updateReactUI();
    }

    function enterTemple(player, gate) {
      if (!gameState.templeDoorsOpen) {
        const messageText = sceneRef.add
          .text(
            gate.x,
            gate.y - 50,
            "The temple doors are sealed.\nDefeat all guardians and write the SQL query!",
            {
              fontSize: "12px",
              fontFamily: "Courier New",
              color: "#ff4444",
              backgroundColor: "#000000",
              align: "center",
            }
          )
          .setOrigin(0.5);

        sceneRef.time.delayedCall(3000, () => messageText.destroy());
        return;
      }
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      updateReactUI();

      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);

      const completionText = sceneRef.add
        .text(400, 120, "🏛️ All Artifacts Collected! 🏛️", {
          fontSize: "28px",
          fontFamily: "Courier New",
          color: "#ffd700",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText = sceneRef.add
        .text(400, 160, "Query Executed Successfully:", {
          fontSize: "16px",
          fontFamily: "Courier New",
          color: "#00ffff",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText2 = sceneRef.add
        .text(400, 180, "SELECT * FROM artifacts WHERE found_by IS NOT NULL;", {
          fontSize: "14px",
          fontFamily: "Courier New",
          color: "#00ffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      // Show results
      const resultsText = sceneRef.add
        .text(400, 220, "Query Results:", {
          fontSize: "14px",
          fontFamily: "Courier New",
          color: "#ffff00",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      let resultsList = "";
      gameState.artifactsData.forEach((artifact) => {
        if (artifact.found_by !== null) {
          resultsList += `${artifact.name} - Found by Explorer ${artifact.found_by}\n`;
        }
      });

      const artifactResults = sceneRef.add
        .text(400, 280, resultsList, {
          fontSize: "12px",
          fontFamily: "Courier New",
          color: "#90ee90",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const statsText = sceneRef.add
        .text(
          400,
          350,
          `🗡️ Guardians Defeated: ${gameState.enemiesDefeated}/${gameState.totalEnemies}\n✨ Artifacts Collected: ${gameState.artifactsCollected}/${gameState.totalArtifacts}`,
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
        .text(400, 420, "Click to return to map", {
          fontSize: "16px",
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

    function hitByEnemy(player, enemy) {
      if (enemy.lastAttack && sceneRef.time.now - enemy.lastAttack < 1500)
        return;

      enemy.lastAttack = sceneRef.time.now;

      // Different damage based on enemy type
      let damage = 20;
      if (enemy.guardianType === "stone_golem") damage = 30;
      else if (enemy.guardianType === "shadow_guardian") damage = 25;
      else if (enemy.guardianType === "ancient_mummy") damage = 15;
      else if (enemy.guardianType === "demon_guardian") damage = 35;

      gameState.health -= damage;

      player.setTint(0xff0000);
      sceneRef.time.delayedCall(300, () => player.clearTint());

      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        player.x,
        player.y
      );
      player.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);

      if (gameState.health <= 0) {
        restartLevel();
      }
      updateReactUI();
    }

    function restartLevel() {
      const restartText = sceneRef.add
        .text(
          400,
          250,
          "The temple guardians have defeated you... Try Again!",
          {
            fontSize: "20px",
            fontFamily: "Courier New",
            color: "#ff4444",
            backgroundColor: "#000000",
            align: "center",
          }
        )
        .setOrigin(0.5);

      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;

      // Reset React UI state
      setUiState((prev) => ({
        ...prev,
        showQueryInput: false,
        allEnemiesKilled: false,
        templeDoorsOpen: false,
      }));
      setSqlQuery("");
      setQueryError("");
      setQuerySuccess(false);

      sceneRef.time.delayedCall(2000, () => {
        restartText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function updateReactUI() {
      setUiState((prev) => ({
        ...prev,
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
        artifactsCollected: gameState.artifactsCollected,
        totalArtifacts: gameState.totalArtifacts,
        enemiesDefeated: gameState.enemiesDefeated,
        totalEnemies: gameState.totalEnemies,
        templeDoorsOpen: gameState.templeDoorsOpen,
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
  }, [onComplete]);

  // Mobile control handlers
  const handleMobileControlStart = (direction) => {
    mobileControlsRef.current[direction] = true;
  };

  const handleMobileControlEnd = (direction) => {
    mobileControlsRef.current[direction] = false;
    // Add a small delay to ensure state is properly reset
    setTimeout(() => {
      if (!mobileControlsRef.current[direction]) {
        mobileControlsRef.current[direction] = false;
      }
    }, 50);
  };

  const handleAttack = () => {
    mobileControlsRef.current.attack = true;
    setTimeout(() => {
      mobileControlsRef.current.attack = false;
    }, 100);
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
          <GiAncientRuins size={20} color="#666666" />
          <span>Temple Guardians</span>
        </div>
        <div className="flex items-center gap-2">
          <GiCrystalBall size={20} color="#ffd700" />
          <span>Ancient Artifacts</span>
        </div>
      </div>

      {/* Responsive game container */}
      <div className="w-full max-w-4xl">
        <div
          ref={gameContainerRef}
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg mx-auto"
          style={{ maxWidth: "800px" }}
        />
      </div>

      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>
          Health: <span className="text-rose-400">{uiState.health}/100</span>
        </div>
        <div>
          Guardians Defeated:{" "}
          <span className="text-red-400">
            {uiState.enemiesDefeated}/{uiState.totalEnemies}
          </span>
        </div>
        <div>
          Artifacts Collected:{" "}
          <span className="text-yellow-400">
            {uiState.artifactsCollected}/{uiState.totalArtifacts}
          </span>
        </div>
        <div>
          Temple Status:{" "}
          <span
            className={
              uiState.templeDoorsOpen ? "text-green-400" : "text-red-400"
            }
          >
            {uiState.templeDoorsOpen ? "OPEN" : "SEALED"}
          </span>
        </div>
      </div>

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
            <h3 className="pixel-font text-xl text-yellow-400 mb-4 text-center">
              🏛️ Open the Temple Doors 🏛️
            </h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              Write the SQL query to open the temple doors:
            </p>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={3}
              onKeyDown={(e) => {
                // Allow all keys including space
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

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">
          SQL Query Challenge:
        </div>
        <div className="font-mono text-lg">
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              Query Completed Successfully!
            </span>
          ) : uiState.allEnemiesKilled ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              Write your SQL query to open the temple doors
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              Defeat all enemies first!
            </span>
          )}
        </div>
        <div className="text-bold text-slate-500 mt-2">
          Find all artifacts where found_by is not null to complete the quest
        </div>
      </div>

      {/* Controls section */}
      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center">
          <strong>CONTROLS:</strong>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
            <div>↑↓←→ Move</div>
            <div>SPACE : Magic Attack</div>
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
                    handleMobileControlStart("up");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("up");
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart("up");
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd("up");
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("up"); // replace "right" with appropriate direction
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseLeave={() => handleMobileControlEnd("up")}
                  style={{ touchAction: "none" }}
                >
                  ↑
                </button>
                <div></div>

                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlStart("left");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("left");
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart("left");
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd("left");
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("left"); // replace "right" with appropriate direction
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseLeave={() => handleMobileControlEnd("left")}
                  style={{ touchAction: "none" }}
                >
                  ←
                </button>
                <div className="bg-slate-700 rounded"></div>
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlStart("right");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("right");
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart("right");
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd("right");
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("right"); // replace "right" with appropriate direction
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseLeave={() => handleMobileControlEnd("right")}
                  style={{ touchAction: "none" }}
                >
                  →
                </button>

                <div></div>
                <button
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlStart("down");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("down");
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMobileControlStart("down");
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    handleMobileControlEnd("down");
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMobileControlEnd("down"); // replace "right" with appropriate direction
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseLeave={() => handleMobileControlEnd("down")}
                  style={{ touchAction: "none" }}
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>

            <button
              className="bg-purple-600 hover:bg-purple-500 active:bg-purple-400 rounded-full w-24 h-24 text-white font-bold text-lg flex items-center justify-center select-none transition-colors"
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAttack();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleAttack();
              }}
              style={{ touchAction: "none" }}
            >
              MAGIC
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
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

export default Level3;
