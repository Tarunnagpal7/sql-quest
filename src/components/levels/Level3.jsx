import React, { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { levels } from "../../assets/data/levels";
import { AiFillBug } from "react-icons/ai";
import { GiCastle, GiTreasureMap, GiBowArrow } from "react-icons/gi";
import MobileControls from "../MobileControls"; // Import the component

const Level3 = ({ onComplete }) => {
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
    castlesDestroyed: 0,
    totalCastles: 3,
    enemiesDefeated: 0,
    showQueryInput: false,
    queryKeywords: [],
    wrongShots: 0,
    maxWrongShots: 2, // 2 wrong shots allowed
    gamePhase: "shooting", // 'shooting', 'query', 'completed', 'failed'
    currentAim: { x: 400, y: 200 }, // Aiming crosshair position
  });

  // SQL Query input state
  const [sqlQuery, setSqlQuery] = useState(
    "SELECT * FROM artifacts WHERE found_by      category      ('weapons', 'raft');"
  );
  const [queryError, setQueryError] = useState("");
  const [querySuccess, setQuerySuccess] = useState(false);

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
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
    }, 50);
  }, []);

  // Expected correct queries (with the blanks filled correctly)
  const correctQueries = [
    "SELECT * FROM artifacts WHERE found_by IS NOT NULL AND category IN ('weapons', 'raft');",
    "select * from artifacts where found_by is not null and category in ('weapons', 'raft');",
    "SELECT * FROM artifacts WHERE found_by IS NOT NULL AND category IN ('weapons','raft');",
    "select * from artifacts where found_by is not null and category in ('weapons','raft');",
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
        isQueryComplete: true,
        gamePhase: "completed",
      }));

      // Complete the level
      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeLevel();
      }
    } else {
      setQueryError("Query failed! ");
      setTimeout(() => setQueryError(""), 3000);
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, enemies, castles, arrows, walls, aimCrosshair;
    let cursors, spaceKey;

    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canShoot: true,
      shootCooldown: 1000,
      castlesDestroyed: 0,
      enemiesDefeated: 0,
      wrongShots: 0,
      maxWrongShots: 2,
      gamePhase: "shooting",
      aimPosition: { x: 400, y: 200 },
      castleData: [
        {
          id: 1,
          x: 200,
          y: 150,
          hasCorrectArtifact: false,
          category: "tools",
          name: "Ancient Tools Castle",
          destroyed: false,
          enemy: null,
        },
        {
          id: 2,
          x: 400,
          y: 150,
          hasCorrectArtifact: true,
          category: "weapons & raft",
          name: "Weapons & Raft Castle",
          destroyed: false,
          enemy: null,
        },
        {
          id: 3,
          x: 600,
          y: 150,
          hasCorrectArtifact: false,
          category: "books",
          name: "Ancient Books Castle",
          destroyed: false,
          enemy: null,
        },
      ],
    };

    let sceneRef;
    // Make mobile controls accessible to Phaser
    const getMobileControls = () => mobileControlsRef.current;

    function preload() {
      sceneRef = this;

      // --- Create Archer Wizard Character ---
      const playerGraphics = this.add.graphics();

      // Wizard archer robe (green/brown for forest theme)
      playerGraphics.fillStyle(0x2d5016, 1); // Dark green robe
      playerGraphics.fillCircle(16, 25, 14); // Body
      playerGraphics.fillRect(2, 15, 28, 20); // Robe body

      // Wizard hood
      playerGraphics.fillStyle(0x365314, 1);
      playerGraphics.fillCircle(16, 12, 10); // Hood

      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(16, 16, 6);

      // Eyes
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(13, 15, 1.5);
      playerGraphics.fillCircle(19, 15, 1.5);

      // Magical bow
      playerGraphics.lineStyle(3, 0x8b4513);
      playerGraphics.beginPath();
      playerGraphics.moveTo(24, 12);
      playerGraphics.lineTo(26, 8);
      playerGraphics.lineTo(28, 12);
      playerGraphics.lineTo(26, 16);
      playerGraphics.lineTo(24, 12);
      playerGraphics.strokePath();

      // Bow string
      playerGraphics.lineStyle(1, 0x4a5568);
      playerGraphics.beginPath();
      playerGraphics.moveTo(26, 8);
      playerGraphics.lineTo(26, 16);
      playerGraphics.strokePath();

      // Quiver
      playerGraphics.fillStyle(0x8b4513, 1);
      playerGraphics.fillRect(4, 18, 3, 12);

      playerGraphics.generateTexture("player", 32, 40);
      playerGraphics.destroy();

      // --- Create Castle Graphics ---
      const castleGraphics = this.add.graphics();

      // Castle base
      castleGraphics.fillStyle(0x6b7280, 1);
      castleGraphics.fillRect(0, 40, 80, 60); // Main castle body

      // Castle towers
      castleGraphics.fillRect(-10, 20, 20, 40); // Left tower
      castleGraphics.fillRect(70, 20, 20, 40); // Right tower
      castleGraphics.fillRect(30, 15, 20, 45); // Center tower

      // Castle details
      castleGraphics.fillStyle(0x374151, 1);
      castleGraphics.fillRect(35, 70, 10, 20); // Gate

      // Battlements
      castleGraphics.fillStyle(0x6b7280, 1);
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
          castleGraphics.fillRect(i * 10, 35, 8, 8);
        }
      }

      // Flags
      castleGraphics.fillStyle(0xdc2626, 1);
      castleGraphics.fillTriangle(35, 15, 45, 15, 40, 5);

      castleGraphics.generateTexture("castle", 80, 100);
      castleGraphics.destroy();

      // --- Create Castle Enemy Guards ---
      const guardTypes = ["archer_guard", "sword_guard", "mage_guard"];
      const guardColors = [0x059669, 0x7c2d12, 0x6d28d9];

      guardTypes.forEach((type, index) => {
        const guardGraphics = this.add.graphics();
        const color = guardColors[index];

        // Guard body
        guardGraphics.fillStyle(color, 1);
        guardGraphics.fillRect(8, 20, 16, 18); // Body
        guardGraphics.fillCircle(16, 12, 8); // Head

        if (type === "archer_guard") {
          // Bow and arrow
          guardGraphics.lineStyle(2, 0x8b4513);
          guardGraphics.beginPath();
          guardGraphics.moveTo(24, 8);
          guardGraphics.lineTo(26, 12);
          guardGraphics.lineTo(24, 16);
          guardGraphics.strokePath();
        } else if (type === "sword_guard") {
          // Sword
          guardGraphics.fillStyle(0xc0c0c0, 1);
          guardGraphics.fillRect(26, 8, 2, 16);
          guardGraphics.fillRect(24, 8, 6, 3);
        } else if (type === "mage_guard") {
          // Magic staff
          guardGraphics.lineStyle(3, 0x8b4513);
          guardGraphics.beginPath();
          guardGraphics.moveTo(26, 24);
          guardGraphics.lineTo(28, 8);
          guardGraphics.strokePath();
          guardGraphics.fillStyle(0x8b5cf6, 1);
          guardGraphics.fillCircle(28, 6, 3);
        }

        // Guard armor
        guardGraphics.fillStyle(0x374151, 1);
        guardGraphics.fillRect(10, 22, 12, 3);

        guardGraphics.generateTexture(type, 32, 40);
        guardGraphics.destroy();
      });

      // --- Create Magical Arrow ---
      const arrowGraphics = this.add.graphics();
      arrowGraphics.fillStyle(0x8b4513, 1); // Brown shaft
      arrowGraphics.fillRect(0, 3, 20, 2);

      // Arrow head
      arrowGraphics.fillStyle(0xc0c0c0, 1);
      arrowGraphics.fillTriangle(20, 4, 24, 1, 24, 7);

      // Feathers
      arrowGraphics.fillStyle(0x22c55e, 1);
      arrowGraphics.fillTriangle(0, 4, -4, 2, -4, 6);

      // Magic glow
      arrowGraphics.fillStyle(0x8b5cf6, 0.6);
      arrowGraphics.fillCircle(12, 4, 8);

      arrowGraphics.generateTexture("arrow", 28, 8);
      arrowGraphics.destroy();

      // --- Create Aiming Crosshair ---
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
      crosshairGraphics.fillCircle(0, 0, 3);

      crosshairGraphics.generateTexture("crosshair", 30, 30);
      crosshairGraphics.destroy();

      // Create background
      this.add
        .graphics()
        .fillStyle(0x16a34a)
        .fillRect(0, 0, 800, 500)
        .generateTexture("forest_bg", 800, 500);

      // Create explosion effect
      const explosionGraphics = this.add.graphics();
      explosionGraphics.fillStyle(0xff6b35, 1);
      explosionGraphics.fillCircle(15, 15, 15);
      explosionGraphics.fillStyle(0xffd23f, 1);
      explosionGraphics.fillCircle(15, 15, 10);
      explosionGraphics.generateTexture("explosion", 30, 30);
      explosionGraphics.destroy();
    }

    function create() {
      this.add.image(400, 250, "forest_bg");

      walls = this.physics.add.staticGroup();
      enemies = this.physics.add.group();
      castles = this.physics.add.group();
      arrows = this.physics.add.group();

      // FIXED: Player wizard stays at center bottom - no movement
      player = this.physics.add.sprite(400, 420, "player");
      player.body.setImmovable(true); // Make player immovable
      player.setCollideWorldBounds(true).body.setSize(20, 25).setOffset(6, 10);

      // Create aiming crosshair
      aimCrosshair = this.add.sprite(
        gameState.aimPosition.x,
        gameState.aimPosition.y,
        "crosshair"
      );
      aimCrosshair.setDepth(100);

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      this.physics.add.collider(player, walls);
      this.physics.add.overlap(arrows, enemies, hitEnemy, null, this);
      this.physics.add.overlap(arrows, castles, hitCastle, null, this);

      // Add methods to scene
      this.completeLevel = completeLevel;
      this.restartLevel = restartLevel;

      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      enemies.clear(true, true);
      castles.clear(true, true);
      arrows.clear(true, true);

      gameState.castlesDestroyed = 0;
      gameState.enemiesDefeated = 0;
      gameState.wrongShots = 0;
      gameState.gamePhase = "shooting";
      gameState.isLevelComplete = false;
      gameState.aimPosition = { x: 400, y: 200 };

      // Reset castle data
      gameState.castleData.forEach((castle) => {
        castle.destroyed = false;
        castle.enemy = null;
      });

      // Create castles and their guards
      gameState.castleData.forEach((castleData, index) => {
        // Create castle
        const castle = castles.create(castleData.x, castleData.y, "castle");
        castle.setCollideWorldBounds(true);
        castle.body.setSize(60, 80);
        castle.castleData = castleData;

        // Create guard enemy for this castle
        const guardTypes = ["archer_guard", "sword_guard", "mage_guard"];
        const enemy = enemies.create(
          castleData.x,
          castleData.y + 50,
          guardTypes[index]
        );
        enemy.setCollideWorldBounds(true);
        enemy.body.setSize(25, 30).setOffset(3, 5);
        enemy.health = 100;
        enemy.castleId = castleData.id;
        enemy.patrolStart = castleData.x - 40;
        enemy.patrolEnd = castleData.x + 40;
        enemy.direction = 1;

        // Link enemy to castle data
        castleData.enemy = enemy;
      });

      // FIXED: Player always at center bottom
      player.setPosition(400, 420).setVelocity(0, 0);
      aimCrosshair.setPosition(
        gameState.aimPosition.x,
        gameState.aimPosition.y
      );

      // Show initial instructions
      showMessage(
        '🏹 Use the D-pad to move the red crosshair around!\n🎯 Attack button to shoot! Find the castle with "weapons" and "raft" artifacts!\n❌ Only 2 wrong guesses allowed!',
        5000
      );
    }

    function update() {
      if (gameState.isLevelComplete || gameState.gamePhase !== "shooting")
        return;

      // FIXED: Player wizard stays fixed - no movement
      player.setVelocity(0, 0);

      const aimSpeed = 200;

      // FIXED: Aim controls now use cursors and mobile controls
      if (cursors.up.isDown || mobileControlsRef.current.up) {
        gameState.aimPosition.y = Math.max(
          50,
          gameState.aimPosition.y - (aimSpeed * sceneRef.game.loop.delta) / 1000
        );
        aimCrosshair.setPosition(
          gameState.aimPosition.x,
          gameState.aimPosition.y
        );
        setUiState((prev) => ({
          ...prev,
          currentAim: { ...gameState.aimPosition },
        }));
      } else if (cursors.down.isDown || mobileControlsRef.current.down) {
        gameState.aimPosition.y = Math.min(
          350,
          gameState.aimPosition.y + (aimSpeed * sceneRef.game.loop.delta) / 1000
        );
        aimCrosshair.setPosition(
          gameState.aimPosition.x,
          gameState.aimPosition.y
        );
        setUiState((prev) => ({
          ...prev,
          currentAim: { ...gameState.aimPosition },
        }));
      }

      if (cursors.left.isDown || mobileControlsRef.current.left) {
        gameState.aimPosition.x = Math.max(
          50,
          gameState.aimPosition.x - (aimSpeed * sceneRef.game.loop.delta) / 1000
        );
        aimCrosshair.setPosition(
          gameState.aimPosition.x,
          gameState.aimPosition.y
        );
        setUiState((prev) => ({
          ...prev,
          currentAim: { ...gameState.aimPosition },
        }));
      } else if (cursors.right.isDown || mobileControlsRef.current.right) {
        gameState.aimPosition.x = Math.min(
          750,
          gameState.aimPosition.x + (aimSpeed * sceneRef.game.loop.delta) / 1000
        );
        aimCrosshair.setPosition(
          gameState.aimPosition.x,
          gameState.aimPosition.y
        );
        setUiState((prev) => ({
          ...prev,
          currentAim: { ...gameState.aimPosition },
        }));
      }

      // Shooting
      if (
        (Phaser.Input.Keyboard.JustDown(spaceKey) ||
          mobileControlsRef.current.attack) &&
        gameState.canShoot
      ) {
        shootArrow.call(this);
      }

      // Enemy patrol behavior
      enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;

        // Simple patrol movement
        enemy.x += enemy.direction * 30 * (sceneRef.game.loop.delta / 1000);

        if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
          enemy.direction *= -1;
        }
      });

      // Arrow movement
      arrows.children.entries.forEach((arrow) => {
        if (!arrow.active) return;

        // Remove arrows that go off screen
        if (arrow.x < -50 || arrow.x > 850 || arrow.y < -50 || arrow.y > 550) {
          arrow.destroy();
        }
      });
    }

    function shootArrow() {
      if (!gameState.canShoot) return;

      gameState.canShoot = false;

      // FIXED: Create arrow at fixed player position (center bottom)
      const arrow = arrows.create(player.x, player.y - 10, "arrow");
      arrow.body.setSize(24, 6);

      // Calculate trajectory to aim position
      const angle = Phaser.Math.Angle.Between(
        player.x,
        player.y,
        gameState.aimPosition.x,
        gameState.aimPosition.y
      );
      const speed = 500;

      arrow.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      arrow.setRotation(angle);

      // Visual shooting effect
      player.setTint(0x22c55e);
      sceneRef.time.delayedCall(100, () => player.clearTint());

      sceneRef.time.delayedCall(gameState.shootCooldown, () => {
        gameState.canShoot = true;
      });
    }

    function hitEnemy(arrow, enemy) {
      // Find which castle this enemy was guarding
      const castleData = gameState.castleData.find(
        (c) => c.id === enemy.castleId
      );

      if (castleData && !castleData.destroyed) {
        // Check if this castle has the correct artifacts
        if (castleData.hasCorrectArtifact) {
          // Correct castle! Show query input
          gameState.gamePhase = "query";
          setUiState((prev) => ({
            ...prev,
            showQueryInput: true,
            gamePhase: "query",
          }));

          showMessage(
            `🎯 Perfect aim! You found the ${castleData.name}!\nNow complete the SQL query by filling in the blanks!`,
            3000
          );
        } else {
          // Wrong castle!
          gameState.wrongShots++;

          if (gameState.wrongShots >= gameState.maxWrongShots) {
            gameState.gamePhase = "failed";
            showMessage(
              `❌ Wrong castle again! You destroyed ${castleData.name}.\nYou've used all your chances! Restarting level...`,
              3000
            );
            sceneRef.time.delayedCall(3000, () => {
              restartLevel();
            });
          } else {
            const remaining = gameState.maxWrongShots - gameState.wrongShots;
            showMessage(
              `❌ Wrong castle! This contained ${castleData.category}.\nYou have ${remaining} more chance(s) left!`,
              3000
            );
          }
        }

        // Destroy enemy and castle
        castleData.destroyed = true;
        gameState.enemiesDefeated++;
        gameState.castlesDestroyed++;

        // Explosion effect
        const explosion = sceneRef.add.sprite(enemy.x, enemy.y, "explosion");
        sceneRef.tweens.add({
          targets: explosion,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => explosion.destroy(),
        });

        // Remove enemy and its castle
        enemy.destroy();
        const castle = castles.children.entries.find(
          (c) => c.castleData.id === castleData.id
        );
        if (castle) {
          castle.setTint(0x666666); // Darken destroyed castle
        }
      }

      arrow.destroy();
      updateReactUI();
    }

    function hitCastle(arrow, castle) {
      // Arrows hitting castle directly (same logic as hitting enemy)
      const enemy = castle.castleData.enemy;
      if (enemy && enemy.active) {
        hitEnemy(arrow, enemy);
      } else {
        arrow.destroy();
      }
    }

    function completeLevel() {
      gameState.isLevelComplete = true;
      updateReactUI();

      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);

      const completionText = sceneRef.add
        .text(400, 120, "🏹🏰 Master Archer! Quest Complete! 🏰🏹", {
          fontSize: "28px",
          fontFamily: "Courier New",
          color: "#22c55e",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const statsText = sceneRef.add
        .text(
          400,
          350,
          `🏹 Precision: Perfect crosshair control\n🏰 Correct Castle: Found on ${
            gameState.wrongShots === 0
              ? "first try!"
              : gameState.wrongShots === 1
              ? "second try!"
              : "final try!"
          }\n❌ Wrong Shots: ${gameState.wrongShots}/${
            gameState.maxWrongShots
          }`,
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
        .text(400, 420, "Click to continue your quest", {
          fontSize: "24px",
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

    function restartLevel() {
      // Reset React UI state
      setUiState((prev) => ({
        ...prev,
        showQueryInput: false,
        gamePhase: "shooting",
        isQueryComplete: false,
        castlesDestroyed: 0,
        enemiesDefeated: 0,
        wrongShots: 0,
        currentAim: { x: 400, y: 200 },
      }));
      setSqlQuery(
        "SELECT * FROM artifacts WHERE found_by  category ('weapons', 'raft');"
      );
      setQueryError("");
      setQuerySuccess(false);

      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;

      const restartText = sceneRef.add
        .text(400, 250, "Restarting Archery Challenge...", {
          fontSize: "24px",
          fontFamily: "Courier New",
          color: "#ff4444",
          backgroundColor: "#000000",
          align: "center",
        })
        .setOrigin(0.5);

      sceneRef.time.delayedCall(2000, () => {
        restartText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add
        .text(400, 50, text, {
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

    function updateReactUI() {
      setUiState((prev) => ({
        ...prev,
        health: Math.max(0, gameState.health),
        castlesDestroyed: gameState.castlesDestroyed,
        enemiesDefeated: gameState.enemiesDefeated,
        wrongShots: gameState.wrongShots,
        gamePhase: gameState.gamePhase,
        currentAim: { ...gameState.aimPosition },
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

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the game elements */}
      <div className="flex items-center flex-wrap justify-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-green-600 to-green-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🏹</span>
          </div>
          <span>Fixed Archer Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <GiCastle size={20} color="#6b7280" />
          <span>Target Castles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500">🎯</span>
          <span>
            Aim: ({Math.round(uiState.currentAim.x)},{" "}
            {Math.round(uiState.currentAim.y)})
          </span>
        </div>
      </div>

      {/* Responsive game container */}
      <div className="w-full max-w-4xl">
        <div
          ref={gameContainerRef}
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-green-500 shadow-lg mx-auto"
          style={{ maxWidth: "800px" }}
        />
      </div>

      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>
          Health: <span className="text-rose-400">{uiState.health}/100</span>
        </div>
        <div>
          Castles Hit:{" "}
          <span className="text-yellow-400">{uiState.castlesDestroyed}/3</span>
        </div>
      </div>

      <div className="block md:hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-center text-yellow-300 mb-2">
            📱 D-pad moves the red crosshair • Attack shoots arrow
          </div>
          {/* Use the MobileControls component */}
          <MobileControls
            mobileControlsRef={mobileControlsRef}
            setMobileControls={setMobileControls}
          />
        </div>
      </div>
      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full mx-4">
            <h3 className="pixel-font text-xl text-green-400 mb-4 text-center">
              🏹 Perfect Shot! Complete the Query 🏹
            </h3>
            <p className="text-slate-300 mb-4 text-sm text-center">
              You found the correct castle! Fill in the blanks to complete the
              SQL query:
            </p>

            <div className="bg-black p-3 rounded border mb-4">
              <p className="text-cyan-400 text-xs font-mono mb-2">
                <strong>
                  Fill in the blanks where artifacts founded not null and
                  category is weapons or raft.{" "}
                </strong>
              </p>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none font-mono text-sm"
              rows={4}
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
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded font-bold transition-colors"
              >
                🏹 Execute Query
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">
          🏹 Crosshair Aiming Archery Challenge{" "}
        </div>
        <div className="font-mono text-lg">
          {uiState.gamePhase === "shooting" ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              🎯 Use controls to move the red crosshair, then shoot! Find the
              castle with "weapons" & "raft"
            </span>
          ) : uiState.gamePhase === "query" ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              📝 Excellent aim! Fill the incomplete query.
            </span>
          ) : uiState.gamePhase === "completed" ? (
            <span className="text-cyan-400 font-bold bg-cyan-900/50 px-2 py-1 rounded">
              ✅ Quest Complete! Master archer and SQL expert!
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              ❌ Mission failed! Try again, archer!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          🎯 Wizard stays fixed at center! Move the crosshair to aim, then
          shoot!
        </div>
      </div>

      {/* Use the reusable MobileControls component */}
      <div className="w-full max-w-3xl p-3 hidden md:block bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center">
          <strong> CONTROLS:</strong>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
            <div>🏹 Wizard: Fixed Center</div>
            <div>🎯 Crosshair: Arrow Keys</div>
            <div>🔥 Shoot: SPACE</div>
          </div>
        </div>
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

export default Level3;
