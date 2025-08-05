import React, { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import {
  GiTempleGate,
  GiCrystalBall,
  GiSpellBook,
  GiMagicSwirl,
} from "react-icons/gi";

const Level4 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const mobileControlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
  });

  // FIX 1: Use a ref to store the onComplete callback.
  // This prevents the useEffect from re-running if the parent component re-renders.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [uiState, setUiState] = useState({
    health: 100,
    spiritsCollected: 0,
    totalSpirits: 12,
    spiritsGrouped: 0,
    showDialogue: false,
    dialogueText: "",
    showQueryResult: false,
    queryResult: "",
    gamePhase: "exploring", // 'exploring', 'grouping', 'query', 'completed'
    currentSpirit: null,
    urnCounts: {
      Healer: 0,
      Hunter: 0,
      Magician: 0,
      Scout: 0,
    },
    showHint: false,
    showQueryInput: false,
    userQuery: "",
  });

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
  });

  // Jungle explorers data (simulating database table)
  const jungle_explorers = [
    { id: 1, name: "Zara", skill: "Healer" },
    { id: 2, name: "Gorn", skill: "Hunter" },
    { id: 3, name: "Lyra", skill: "Magician" },
    { id: 4, name: "Kael", skill: "Scout" },
    { id: 5, name: "Maya", skill: "Healer" },
    { id: 6, name: "Rex", skill: "Hunter" },
    { id: 7, name: "Vera", skill: "Magician" },
    { id: 8, name: "Jin", skill: "Scout" },
    { id: 9, name: "Luna", skill: "Healer" },
    { id: 10, name: "Thor", skill: "Hunter" },
    { id: 11, name: "Nova", skill: "Magician" },
    { id: 12, name: "Echo", skill: "Healer" },
  ];

  // Expected GROUP BY result: Healer (4), Magician (3), Hunter (3), Scout (2)
  const expectedResult = { Healer: 4, Magician: 3, Hunter: 3, Scout: 2 };

  // Memoized mobile control handlers (matching Level3 pattern)
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

  const handleInteract = useCallback(() => {
    mobileControlsRef.current.interact = true;
    setMobileControls((prev) => ({ ...prev, interact: true }));
    setTimeout(() => {
      mobileControlsRef.current.interact = false;
      setMobileControls((prev) => ({ ...prev, interact: false }));
    }, 100);
  }, []);

  const closeDialogue = () => {
    setUiState((prev) => ({ ...prev, showDialogue: false, dialogueText: "" }));
  };

  const showHint = () => {
    setUiState((prev) => ({ ...prev, showHint: true }));
  };

  const closeHint = () => {
    setUiState((prev) => ({ ...prev, showHint: false }));
  };

  const checkQuery = (query) => {
    // Normalize the query by removing extra spaces and converting to lowercase
    const normalizedQuery = query
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[;\n\r]/g, " ")
      .trim();

    // Define the expected patterns (multiple valid variations)
    const validPatterns = [
      // Basic pattern
      /select\s+skill\s*,\s*count\s*\(\s*\*\s*\)\s+from\s+jungle_explorers\s+group\s+by\s+skill/,
      // Allow COUNT(1) or COUNT()
      /select\s+skill\s*,\s*count\s*\(\s*1?\s*\)\s+from\s+jungle_explorers\s+group\s+by\s+skill/,
      // Allow 'as count' or other aliases
      /select\s+skill\s*,\s*count\s*\(\s*\*\s*\)\s+as\s+\w+\s+from\s+jungle_explorers\s+group\s+by\s+skill/,
      // Allow different order (GROUP BY first)
      /select\s+skill\s*,\s*count\s*\(\s*\*\s*\)\s+from\s+jungle_explorers\s+group\s+by\s+skill/,
      // Allow COUNT(id) or COUNT(name)
      /select\s+skill\s*,\s*count\s*\(\s*(id|name)\s*\)\s+from\s+jungle_explorers\s+group\s+by\s+skill/,
    ];

    // Check if the query matches any of the valid patterns
    const isValid = validPatterns.some((pattern) =>
      pattern.test(normalizedQuery)
    );

    // If not valid, check what's missing to provide better feedback
    if (!isValid) {
      const hasSelect = /select/.test(normalizedQuery);
      const hasSkill = /skill/.test(normalizedQuery);
      const hasCount = /count\s*\(/.test(normalizedQuery);
      const hasFrom = /from\s+jungle_explorers/.test(normalizedQuery);
      const hasGroupBy = /group\s+by/.test(normalizedQuery);

      const missing = [];
      if (!hasSelect) missing.push("SELECT keyword");
      if (!hasSkill) missing.push("skill column");
      if (!hasCount) missing.push("COUNT function");
      if (!hasFrom) missing.push("FROM jungle_explorers");
      if (!hasGroupBy) missing.push("GROUP BY clause");

      if (missing.length > 0) {
        setUiState((prev) => ({
          ...prev,
          showQueryResult: true,
          queryResult: `Your query is missing: ${missing.join(
            ", "
          )}\n\nTry structuring your query like this:\nSELECT skill, COUNT(*)\nFROM jungle_explorers\nGROUP BY skill`,
        }));
      }
    }

    return isValid;
  };

  const executeQuery = () => {
    const groupCounts = {};
    jungle_explorers.forEach((explorer) => {
      groupCounts[explorer.skill] = (groupCounts[explorer.skill] || 0) + 1;
    });

    const result = Object.entries(groupCounts)
      .map(([skill, count]) => `${skill}: ${count} explorers`)
      .join("\n");

    const queryResult = `Query Result:\n${result}`;

    if (checkQuery(uiState.userQuery)) {
      setUiState((prev) => ({
        ...prev,
        showQueryResult: true,
        queryResult: queryResult,
        gamePhase: "completed",
        showQueryInput: false,
      }));

      if (gameInstance.current && gameInstance.current.scene.scenes[0]) {
        gameInstance.current.scene.scenes[0].completeLevel();
      }
    } else {
      setUiState((prev) => ({
        ...prev,
        showQueryResult: true,
        queryResult:
          "Incorrect query! Try again.\nHint: Use SELECT skill, COUNT(*) FROM jungle_explorers GROUP BY skill",
      }));
    }
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, statues, spiritStones, urns, altar, walls;
    let cursors, interactKey;
    let heldSpirit = null; // To track the spirit being carried

    const gameState = {
      health: 100,
      isLevelComplete: false,
      spiritsCollected: 0,
      spiritsGrouped: 0,
      gamePhase: "exploring",
      urnCounts: { Healer: 0, Hunter: 0, Magician: 0, Scout: 0 },
      interactCooldown: false,
    };

    let sceneRef;

    // Make mobile controls accessible to Phaser (matching Level3 pattern)
    const getMobileControls = () => mobileControlsRef.current;

    function preload() {
      sceneRef = this;

      // Texture Generation (keeping existing graphics but ensuring they're optimized)
      const playerGraphics = this.add.graphics();

      // Temple Explorer Character
      playerGraphics.fillStyle(0x6d28d9, 1); // Purple robe
      playerGraphics.fillCircle(16, 25, 14); // Body
      playerGraphics.fillRect(2, 15, 28, 20); // Robe body

      playerGraphics.fillStyle(0x7c3aed, 1); // Hood
      playerGraphics.fillCircle(16, 12, 10); // Hood
      playerGraphics.lineStyle(2, 0xfbbf24);
      playerGraphics.strokeCircle(16, 12, 10); // Hood outline

      // Face
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(16, 16, 6);

      // Eyes
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(13, 15, 1.5);
      playerGraphics.fillCircle(19, 15, 1.5);

      // Magic staff
      playerGraphics.lineStyle(4, 0x8b4513);
      playerGraphics.beginPath();
      playerGraphics.moveTo(26, 35);
      playerGraphics.lineTo(28, 8);
      playerGraphics.strokePath();

      // Magic orb
      playerGraphics.fillStyle(0x22d3ee, 0.8);
      playerGraphics.fillCircle(28, 6, 4);

      playerGraphics.generateTexture("player", 32, 40);
      playerGraphics.destroy();

      // Ancient Statue
      const statueGraphics = this.add.graphics();
      statueGraphics.fillStyle(0x6b7280, 1); // Stone base
      statueGraphics.fillRect(5, 40, 20, 25);

      statueGraphics.fillStyle(0x9ca3af, 1); // Statue body
      statueGraphics.fillCircle(15, 25, 8); // Head
      statueGraphics.fillRect(7, 30, 16, 15); // Body

      // Mystical aura
      statueGraphics.fillStyle(0x22d3ee, 0.3);
      statueGraphics.fillCircle(15, 25, 12);

      // Glowing eyes
      statueGraphics.fillStyle(0x06b6d4, 1);
      statueGraphics.fillCircle(12, 24, 2);
      statueGraphics.fillCircle(18, 24, 2);

      statueGraphics.generateTexture("statue", 30, 65);
      statueGraphics.destroy();

      // Spirit Stone
      const stoneGraphics = this.add.graphics();
      stoneGraphics.fillStyle(0x374151, 1); // Dark stone
      stoneGraphics.fillCircle(12, 12, 10);

      stoneGraphics.fillStyle(0x22d3ee, 0.6); // Spirit glow
      stoneGraphics.fillCircle(12, 12, 7);

      stoneGraphics.fillStyle(0x06b6d4, 1); // Core
      stoneGraphics.fillCircle(12, 12, 3);

      stoneGraphics.generateTexture("spirit_stone", 24, 24);
      stoneGraphics.destroy();

      // Skill Urns
      const skillColors = {
        Healer: 0x22c55e,
        Hunter: 0xf59e0b,
        Magician: 0x8b5cf6,
        Scout: 0x06b6d4,
      };

      Object.keys(skillColors).forEach((skill) => {
        const urnGraphics = this.add.graphics();
        const color = skillColors[skill];

        // Urn base
        urnGraphics.fillStyle(0x374151, 1);
        urnGraphics.fillEllipse(25, 45, 40, 20);

        // Urn body
        urnGraphics.fillStyle(color, 0.8);
        urnGraphics.fillRect(10, 15, 30, 30);
        urnGraphics.fillEllipse(25, 15, 30, 15);

        // Magical aura
        urnGraphics.fillStyle(color, 0.3);
        urnGraphics.fillEllipse(25, 25, 50, 40);

        // Skill symbol
        urnGraphics.fillStyle(0xffffff, 1);
        urnGraphics.fillCircle(25, 25, 8);
        urnGraphics.fillStyle(color, 1);
        urnGraphics.fillCircle(25, 25, 6);

        urnGraphics.generateTexture(`urn_${skill.toLowerCase()}`, 50, 50);
        urnGraphics.destroy();
      });

      // Altar
      const altarGraphics = this.add.graphics();
      altarGraphics.fillStyle(0x6b7280, 1); // Stone base
      altarGraphics.fillRect(0, 60, 80, 20);
      altarGraphics.fillStyle(0x9ca3af, 1); // Altar top
      altarGraphics.fillRect(5, 40, 70, 25);

      // Mystical circles
      altarGraphics.lineStyle(2, 0x22d3ee);
      altarGraphics.strokeCircle(40, 52, 15);
      altarGraphics.strokeCircle(40, 52, 10);

      // Central orb
      altarGraphics.fillStyle(0x06b6d4, 0.8);
      altarGraphics.fillCircle(40, 52, 8);

      altarGraphics.generateTexture("altar", 80, 80);
      altarGraphics.destroy();

      // Background
      this.add
        .graphics()
        .fillStyle(0x1f2937)
        .fillRect(0, 0, 800, 500)
        .generateTexture("temple_bg", 800, 500);

      // Particle effect
      this.add
        .graphics()
        .fillStyle(0x22d3ee, 0.8)
        .fillCircle(2, 2, 2)
        .generateTexture("particle", 4, 4)
        .destroy();
    }

    function create() {
      // Background
      this.add.image(400, 250, "temple_bg");
      this.add.graphics().fillStyle(0x374151, 0.3).fillRect(0, 0, 800, 500);

      // Physics groups
      walls = this.physics.add.staticGroup();
      statues = this.physics.add.group();
      spiritStones = this.physics.add.group();
      urns = this.physics.add.staticGroup();

      // World boundaries
      walls.create(0, 250, null).setSize(20, 500).setVisible(false);
      walls.create(800, 250, null).setSize(20, 500).setVisible(false);
      walls.create(400, 0, null).setSize(800, 20).setVisible(false);
      walls.create(400, 500, null).setSize(800, 20).setVisible(false);

      // Player
      player = this.physics.add
        .sprite(400, 400, "player")
        .setCollideWorldBounds(true);
      player.body.setSize(20, 25).setOffset(6, 10);

      // Create statues
      const statuePositions = [
        { x: 150, y: 150 },
        { x: 650, y: 150 },
        { x: 100, y: 300 },
        { x: 700, y: 300 },
        { x: 200, y: 100 },
        { x: 600, y: 100 },
        { x: 150, y: 350 },
        { x: 650, y: 350 },
        { x: 100, y: 200 },
        { x: 700, y: 200 },
        { x: 250, y: 150 },
        { x: 550, y: 150 },
      ];

      statuePositions.forEach((pos, index) => {
        if (index < jungle_explorers.length) {
          const statue = statues.create(pos.x, pos.y, "statue");
          statue.body.setSize(25, 55).setOffset(2.5, 5);
          statue.explorerData = jungle_explorers[index];

          // Particle effects for statues
          this.add.particles(pos.x, pos.y - 20, "particle", {
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            lifespan: 2000,
            frequency: 200,
            alpha: { start: 0.8, end: 0 },
          });
        }
      });

      // Create urns
      const urnPositions = [
        { skill: "Healer", x: 120, y: 80 },
        { skill: "Hunter", x: 680, y: 80 },
        { skill: "Magician", x: 120, y: 420 },
        { skill: "Scout", x: 680, y: 420 },
      ];

      urnPositions.forEach((urnData) => {
        const urn = urns.create(
          urnData.x,
          urnData.y,
          `urn_${urnData.skill.toLowerCase()}`
        );
        urn.body.setSize(40, 40).setOffset(5, 5);
        urn.skillType = urnData.skill;

        // Urn labels
        this.add
          .text(urnData.x, urnData.y + 35, urnData.skill, {
            fontSize: "12px",
            fontFamily: "Arial",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      });

      // Central altar
      altar = this.physics.add
        .sprite(400, 250, "altar")
        .setCollideWorldBounds(true);
      altar.body.setSize(60, 60).setOffset(10, 10);

      // Input
      cursors = this.input.keyboard.createCursorKeys();
      interactKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

      // Collisions
      this.physics.add.collider(player, walls);
      this.physics.add.collider(statues, walls);
      this.physics.add.collider(spiritStones, walls);

      // Overlaps
      this.physics.add.overlap(player, statues, interactWithStatue, null, this);
      this.physics.add.overlap(
        player,
        spiritStones,
        pickupSpirit,
        () => !heldSpirit,
        this
      );
      this.physics.add.overlap(spiritStones, urns, placeInUrn, null, this);
      this.physics.add.overlap(player, altar, interactWithAltar, null, this);

      // Scene methods
      this.completeLevel = completeLevel;
      this.updateReactUI = updateReactUI;

      updateReactUI();
      showMessage(
        "🏛️ Welcome to the Temple! Press E near statues to collect spirit stones.",
        4000
      );
    }

    function update() {
      if (gameState.isLevelComplete) return;

      const speed = 160;
      player.setVelocity(0);

      // Movement controls (matching Level3 pattern)
      if (cursors.left.isDown || mobileControlsRef.current.left)
        player.setVelocityX(-speed);
      else if (cursors.right.isDown || mobileControlsRef.current.right)
        player.setVelocityX(speed);

      if (cursors.up.isDown || mobileControlsRef.current.up)
        player.setVelocityY(-speed);
      else if (cursors.down.isDown || mobileControlsRef.current.down)
        player.setVelocityY(speed);

      // FIX 2: Make the held spirit continuously follow the player.
      if (heldSpirit) {
        heldSpirit.setPosition(player.x, player.y - 30);
      }

      // Spirit stone animations
      spiritStones.children.iterate((stone) => {
        if (stone.active && !stone.isFollowing) {
          stone.rotation += 0.02;
          stone.y += Math.sin(sceneRef.time.now * 0.003 + stone.x * 0.01) * 0.2;
        }
      });

      // Altar color cycling
      if (altar.active)
        altar.setTint(
          Phaser.Display.Color.HSVToRGB(sceneRef.time.now * 0.001, 0.8, 1).color
        );
    }

    function interactWithStatue(player, statue) {
      if (
        !gameState.interactCooldown &&
        (Phaser.Input.Keyboard.JustDown(interactKey) ||
          mobileControlsRef.current.interact)
      ) {
        gameState.interactCooldown = true;
        sceneRef.time.delayedCall(
          500,
          () => (gameState.interactCooldown = false)
        );

        const explorer = statue.explorerData;
        setUiState((prev) => ({
          ...prev,
          showDialogue: true,
          dialogueText: `I am ${explorer.name}, a ${explorer.skill}.`,
          currentSpirit: explorer,
        }));

        const stone = spiritStones.create(
          statue.x,
          statue.y - 30,
          "spirit_stone"
        );
        stone.body.setSize(20, 20).setOffset(2, 2);
        stone.explorerData = explorer;

        sceneRef.tweens.add({
          targets: stone,
          y: stone.y - 10,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
        statue.destroy();
        gameState.spiritsCollected++;
        updateReactUI();
        showMessage(
          `✨ Collected spirit of ${explorer.name} (${explorer.skill})`,
          2000
        );
      }
    }

    function pickupSpirit(player, stone) {
      if (heldSpirit) return; // Already holding one
      heldSpirit = stone;
      stone.isFollowing = true; // Set flag for the update loop
      // Stop the floating tween
      sceneRef.tweens.killTweensOf(stone);
    }

    function placeInUrn(stone, urn) {
      if (heldSpirit !== stone) return; // Only place the spirit we are holding

      if (stone.explorerData && urn.skillType === stone.explorerData.skill) {
        gameState.urnCounts[urn.skillType]++;
        gameState.spiritsGrouped++;
        stone.destroy();
        heldSpirit = null; // No longer holding a spirit
        sceneRef.tweens.add({
          targets: urn,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
        });
        updateReactUI();
        showMessage(
          `✅ ${stone.explorerData.skill} spirit placed correctly!`,
          1500
        );

        if (gameState.spiritsGrouped === jungle_explorers.length) {
          gameState.gamePhase = "query";
          showMessage("🏛️ All spirits grouped! Approach the altar!", 3000);
        }
      } else {
        showMessage(
          `❌ ${stone.explorerData.name} doesn't belong in the ${urn.skillType} urn!`,
          2000
        );
      }
    }

    function interactWithAltar(player, altar) {
      if (
        gameState.gamePhase === "query" &&
        !gameState.interactCooldown &&
        (Phaser.Input.Keyboard.JustDown(interactKey) ||
          mobileControlsRef.current.interact)
      ) {
        gameState.interactCooldown = true;
        sceneRef.time.delayedCall(
          1000,
          () => (gameState.interactCooldown = false)
        );

        const isCorrect = Object.keys(expectedResult).every(
          (skill) => gameState.urnCounts[skill] === expectedResult[skill]
        );

        if (isCorrect) {
          showMessage("🎉 Perfect grouping! Now write your query!", 2000);
          setUiState((prev) => ({ ...prev, showQueryInput: true }));
        } else {
          showMessage(
            "❌ The spirits are misaligned. Check your grouping!",
            3000
          );
          altar.setTint(0xff0000);
          sceneRef.time.delayedCall(1000, () => altar.clearTint());
        }
      }
    }

    function completeLevel() {
      gameState.isLevelComplete = true;
      updateReactUI();

      const overlay = sceneRef.add
        .rectangle(400, 250, 800, 500, 0x000000, 0.8)
        .setDepth(1000)
        .setInteractive();

      sceneRef.add
        .text(400, 120, "🏛️ Temple Master! Quest Complete! 🏛️", {
          fontSize: "28px",
          fontFamily: "Arial",
          color: "#22c55e",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      sceneRef.add
        .text(
          400,
          200,
          `🔮 Spirits Collected: ${gameState.spiritsCollected}/${jungle_explorers.length}\n📊 GROUP BY Skills Mastered!\n⚡ Query Execution: Perfect!`,
          {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#fbbf24",
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(1001);

      const instructionText = sceneRef.add
        .text(400, 420, "Click to continue your quest", {
          fontSize: "24px",
          fontFamily: "Arial",
          color: "#00ff00",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      overlay.on("pointerdown", () => {
        onCompleteRef.current();
      });

      sceneRef.tweens.add({
        targets: instructionText,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    function updateReactUI() {
      setUiState((prev) => ({
        ...prev,
        health: gameState.health,
        spiritsCollected: gameState.spiritsCollected,
        spiritsGrouped: gameState.spiritsGrouped,
        gamePhase: gameState.gamePhase,
        urnCounts: { ...gameState.urnCounts },
      }));
    }

    function showMessage(text, duration) {
      const messageText = sceneRef.add
        .text(400, 50, text, {
          fontSize: "14px",
          fontFamily: "Arial",
          color: "#ffffff",
          backgroundColor: "#000000",
          align: "center",
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(1000);
      sceneRef.time.delayedCall(duration, () => messageText.destroy());
    }

    // Fixed Phaser config (matching Level3's responsive approach)
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameContainerRef.current,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
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
  }, [onComplete]); // Fixed dependency array to match Level3

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Game Header - Fixed to match Level3 structure */}
      <div className="flex items-center flex-wrap justify-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <GiTempleGate size={20} color="#6d28d9" />
          <span>Temple Explorer</span>
        </div>
        <div className="flex items-center gap-2">
          <GiCrystalBall size={20} color="#22d3ee" />
          <span>Spirit Collector</span>
        </div>
        <div className="flex items-center gap-2">
          <GiMagicSwirl size={20} color="#f59e0b" />
          <span>GROUP BY Master</span>
        </div>
      </div>

      {/* Responsive game container - Fixed to match Level3 */}
      <div className="w-full max-w-4xl">
        <div
          ref={gameContainerRef}
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg mx-auto"
          style={{ maxWidth: "800px" }}
        />
      </div>

      {/* Game Stats - Fixed layout to match Level3 */}
      <div className="w-full max-w-3xl grid grid-cols-2 gap-4 pixel-font text-sm">
        <div>
          Health: <span className="text-rose-400">{uiState.health}/100</span>
        </div>
        <div>
          Spirits:{" "}
          <span className="text-yellow-400">
            {uiState.spiritsCollected}/{uiState.totalSpirits}
          </span>
        </div>
      </div>

      {/* Mobile Controls - Matching Level3 structure */}
      <div className="block md:hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-center text-yellow-300 mb-2">
            📱 D-pad moves • E interacts with statues & altar
          </div>
          <div className="">
            {/* D-Pad */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-1 w-36 h-36">
                <div></div>
                <button
                  onTouchStart={() => handleMobileControlStart("up")}
                  onTouchEnd={() => handleMobileControlEnd("up")}
                  onMouseDown={() => handleMobileControlStart("up")}
                  onMouseUp={() => handleMobileControlEnd("up")}
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                >
                  ↑
                </button>
                <div></div>
                <button
                  onTouchStart={() => handleMobileControlStart("left")}
                  onTouchEnd={() => handleMobileControlEnd("left")}
                  onMouseDown={() => handleMobileControlStart("left")}
                  onMouseUp={() => handleMobileControlEnd("left")}
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                >
                  ←
                </button>

                <button
                  onTouchStart={handleInteract}
                  onMouseDown={handleInteract}
                  className="bg-blue-600 hover:bg-red-500 active:bg-red-400 rounded-full text-white font-bold text-lg flex items-center justify-center select-none transition-colors"
                >
                  E
                </button>
                <button
                  onTouchStart={() => handleMobileControlStart("right")}
                  onTouchEnd={() => handleMobileControlEnd("right")}
                  onMouseDown={() => handleMobileControlStart("right")}
                  onMouseUp={() => handleMobileControlEnd("right")}
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                >
                  →
                </button>
                <div></div>
                <button
                  onTouchStart={() => handleMobileControlStart("down")}
                  onTouchEnd={() => handleMobileControlEnd("down")}
                  onMouseDown={() => handleMobileControlStart("down")}
                  onMouseUp={() => handleMobileControlEnd("down")}
                  className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urn Counts Display */}
      <div className="w-full max-w-3xl bg-black/50 rounded-lg border border-slate-700 p-4">
        <div className="pixel-font text-slate-300 mb-3 text-center font-bold">
          🏺 Spirit Grouping Progress
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(uiState.urnCounts).map(([skill, count]) => (
            <div key={skill} className="text-center">
              <div
                className={`p-3 rounded-lg border-2 ${
                  skill === "Healer"
                    ? "border-green-500 bg-green-900/30"
                    : skill === "Hunter"
                    ? "border-yellow-500 bg-yellow-900/30"
                    : skill === "Magician"
                    ? "border-purple-500 bg-purple-900/30"
                    : "border-cyan-500 bg-cyan-900/30"
                }`}
              >
                <div className="text-xs text-slate-400">{skill}</div>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs text-slate-500">spirits</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Status Display - Fixed to match Level3 */}
      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">
          🏛️ Temple Explorer Challenge
        </div>
        <div className="font-mono text-lg">
          {uiState.gamePhase === "exploring" ? (
            <span className="text-purple-400 font-bold bg-purple-900/50 px-2 py-1 rounded">
              🔮 Collect spirit stones from ancient statues
            </span>
          ) : uiState.gamePhase === "grouping" ? (
            <span className="text-cyan-400 font-bold bg-cyan-900/50 px-2 py-1 rounded">
              📊 Group spirits by skill in matching urns
            </span>
          ) : uiState.gamePhase === "query" ? (
            <span className="text-yellow-400 font-bold bg-yellow-900/50 px-2 py-1 rounded animate-pulse">
              📝 All spirits grouped! Approach the altar to write your query
            </span>
          ) : uiState.gamePhase === "completed" ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              ✅ Quest Complete! Temple master and SQL expert!
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
              ❌ Something went wrong! Try again!
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Walk near glowing statues and press E to collect spirits
        </div>
      </div>

      {/* Desktop Controls Info - Fixed to match Level3 */}
      <div className="w-full max-w-3xl p-3 hidden md:block bg-slate-800/50 rounded-lg border border-slate-600">
        <div className="pixel-font text-slate-400 text-sm mb-2 text-center">
          <strong>CONTROLS:</strong>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 text-center">
          <div>🏃 Move: Arrow Keys</div>
          <div>🔮 Interact: E Key</div>
          <div>📊 Group: Drag to Urns</div>
        </div>
      </div>

      {/* Hint Button */}
      <button
        onClick={showHint}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
      >
        💡 Show Hint
      </button>

      {/* Hint Modal */}
      {uiState.showHint && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full">
            <div className="text-center">
              <div className="text-2xl mb-4">💡</div>
              <div className="text-lg text-blue-400 mb-4 font-bold">
                Temple Explorer Hints
              </div>
              <div className="text-slate-300 mb-6 text-sm text-left space-y-2">
                <p>
                  <strong>🏛️ Temple Exploration:</strong>
                </p>
                <p>
                  • Walk near glowing statues and press E to collect spirit
                  stones
                </p>
                <p>• Pick up spirit stones by walking over them</p>
                <p>• Drag spirits to matching urns (same skill type)</p>

                <p className="pt-2">
                  <strong>📊 GROUP BY Concept:</strong>
                </p>
                <p>
                  • Each explorer has a skill (Healer, Hunter, Magician, Scout)
                </p>
                <p>• Group spirits by their skill in the correct urns</p>
                <p>• This represents SQL's GROUP BY functionality</p>

                <p className="pt-2">
                  <strong>⚡ Final Query:</strong>
                </p>
                <p>• After grouping all spirits, approach the altar</p>
                <p>• Write a SQL query to count explorers by skill</p>
                <p>
                  • Use: SELECT skill, COUNT(*) FROM jungle_explorers GROUP BY
                  skill
                </p>
              </div>
              <button
                onClick={closeHint}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spirit Dialogue Modal */}
      {uiState.showDialogue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full">
            <div className="text-center">
              <div className="text-2xl mb-4">👻</div>
              <div className="text-lg text-cyan-400 mb-4 font-bold">
                Spirit Communication
              </div>
              <div className="text-slate-300 mb-6 text-lg">
                "{uiState.dialogueText}"
              </div>
              <button
                onClick={closeDialogue}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Collect Spirit Stone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Query Input Modal */}
      {uiState.showQueryInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="text-2xl mb-4">📝</div>
              <div className="text-lg text-cyan-400 mb-4 font-bold">
                Write Your SQL Query
              </div>
              <div className="text-slate-300 mb-4 text-sm">
                <p className="mb-2">
                  Write a SQL query to find how many explorers have each skill.
                </p>
                <p className="text-yellow-400 mb-2">💡 Hint: You need to:</p>
                <ol className="text-left list-decimal pl-6 space-y-1 text-yellow-400/80 text-sm">
                  <li>SELECT the skill column and COUNT the explorers</li>
                  <li>FROM the jungle_explorers table</li>
                  <li>GROUP BY skill to count each skill type</li>
                </ol>
              </div>
              <textarea
                value={uiState.userQuery}
                onChange={(e) =>
                  setUiState((prev) => ({ ...prev, userQuery: e.target.value }))
                }
                onKeyDown={(e) => {
                  // Prevent the game from handling these keyboard events
                  e.stopPropagation();
                }}
                className="w-full h-32 p-3 bg-slate-900 text-white rounded-lg mb-4 font-mono text-sm"
                placeholder={`Example query structure:
SELECT column_name, COUNT(*)
FROM table_name
GROUP BY column_name;`}
                spellCheck="false"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
              />
              {uiState.showQueryResult && (
                <div className="mb-4 text-sm">
                  <pre className="text-left bg-slate-900 p-3 rounded whitespace-pre-wrap overflow-x-auto">
                    {uiState.queryResult}
                  </pre>
                </div>
              )}
              <button
                onClick={executeQuery}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors w-full"
              >
                Execute Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles - Fixed to match Level3 */}
      <style jsx>{`
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};

export default Level4;
