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

  // Mobile control handlers
  const handleMobileControlStart = useCallback((direction) => {
    mobileControlsRef.current[direction] = true;
  }, []);

  const handleMobileControlEnd = useCallback((direction) => {
    mobileControlsRef.current[direction] = false;
  }, []);

  const handleInteract = useCallback(() => {
    mobileControlsRef.current.interact = true;
    setTimeout(() => {
      mobileControlsRef.current.interact = false;
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

    function preload() {
      sceneRef = this;
    }

    function create() {
      // Texture Generation
      const playerGraphics = this.add
        .graphics()
        .fillStyle(0x6d28d9, 1)
        .fillCircle(16, 25, 14)
        .fillRect(2, 15, 28, 20)
        .fillStyle(0x7c3aed, 1)
        .fillCircle(16, 12, 10)
        .lineStyle(2, 0xfbbf24)
        .strokeCircle(16, 12, 10)
        .fillStyle(0xfbbf24, 1)
        .fillCircle(16, 16, 6)
        .fillStyle(0x000000, 1)
        .fillCircle(13, 15, 1.5)
        .fillCircle(19, 15, 1.5)
        .lineStyle(4, 0x8b4513)
        .beginPath()
        .moveTo(26, 35)
        .lineTo(28, 8)
        .strokePath()
        .fillStyle(0x22d3ee, 0.8)
        .fillCircle(28, 6, 4)
        .generateTexture("player", 32, 40)
        .destroy();
      const statueGraphics = this.add
        .graphics()
        .fillStyle(0x6b7280, 1)
        .fillRect(5, 40, 20, 25)
        .fillStyle(0x9ca3af, 1)
        .fillCircle(15, 25, 8)
        .fillRect(7, 30, 16, 15)
        .fillStyle(0x22d3ee, 0.3)
        .fillCircle(15, 25, 12)
        .fillStyle(0x06b6d4, 1)
        .fillCircle(12, 24, 2)
        .fillCircle(18, 24, 2)
        .generateTexture("statue", 30, 65)
        .destroy();
      const stoneGraphics = this.add
        .graphics()
        .fillStyle(0x374151, 1)
        .fillCircle(12, 12, 10)
        .fillStyle(0x22d3ee, 0.6)
        .fillCircle(12, 12, 7)
        .fillStyle(0x06b6d4, 1)
        .fillCircle(12, 12, 3)
        .generateTexture("spirit_stone", 24, 24)
        .destroy();
      const skillColors = {
        Healer: 0x22c55e,
        Hunter: 0xf59e0b,
        Magician: 0x8b5cf6,
        Scout: 0x06b6d4,
      };
      Object.keys(skillColors).forEach((skill) => {
        this.add
          .graphics()
          .fillStyle(0x374151, 1)
          .fillEllipse(25, 45, 40, 20)
          .fillStyle(skillColors[skill], 0.8)
          .fillRect(10, 15, 30, 30)
          .fillEllipse(25, 15, 30, 15)
          .fillStyle(skillColors[skill], 0.3)
          .fillEllipse(25, 25, 50, 40)
          .fillStyle(0xffffff, 1)
          .fillCircle(25, 25, 8)
          .fillStyle(skillColors[skill], 1)
          .fillCircle(25, 25, 6)
          .generateTexture(`urn_${skill.toLowerCase()}`, 50, 50)
          .destroy();
      });
      const altarGraphics = this.add
        .graphics()
        .fillStyle(0x6b7280, 1)
        .fillRect(0, 60, 80, 20)
        .fillStyle(0x9ca3af, 1)
        .fillRect(5, 40, 70, 25)
        .lineStyle(2, 0x22d3ee)
        .strokeCircle(40, 52, 15)
        .strokeCircle(40, 52, 10)
        .fillStyle(0x06b6d4, 0.8)
        .fillCircle(40, 52, 8)
        .generateTexture("altar", 80, 80)
        .destroy();
      this.add
        .graphics()
        .fillStyle(0x1f2937)
        .fillRect(0, 0, 800, 500)
        .generateTexture("temple_bg", 800, 500);
      this.add
        .graphics()
        .fillStyle(0x22d3ee, 0.8)
        .fillCircle(2, 2, 2)
        .generateTexture("particle", 4, 4)
        .destroy();

      this.add.image(400, 250, "temple_bg");
      this.add.graphics().fillStyle(0x374151, 0.3).fillRect(0, 0, 800, 500);

      walls = this.physics.add.staticGroup();
      statues = this.physics.add.group();
      spiritStones = this.physics.add.group();
      urns = this.physics.add.staticGroup();

      walls.create(0, 250, null).setSize(20, 500).setVisible(false);
      walls.create(800, 250, null).setSize(20, 500).setVisible(false);
      walls.create(400, 0, null).setSize(800, 20).setVisible(false);
      walls.create(400, 500, null).setSize(800, 20).setVisible(false);

      player = this.physics.add
        .sprite(400, 400, "player")
        .setCollideWorldBounds(true)
        .body.setSize(20, 25)
        .setOffset(6, 10).gameObject;

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
          this.add.particles(pos.x, pos.y - 20, "particle", {
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            lifespan: 2000,
            frequency: 200,
            alpha: { start: 0.8, end: 0 },
          });
        }
      });

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
        this.add
          .text(urnData.x, urnData.y + 35, urnData.skill, {
            fontSize: "12px",
            fontFamily: "Arial",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      });

      altar = this.physics.add
        .sprite(400, 250, "altar")
        .setCollideWorldBounds(true);
      altar.body.setSize(60, 60).setOffset(10, 10);

      cursors = this.input.keyboard.createCursorKeys();
      interactKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );

      this.physics.add.collider(player, walls);
      this.physics.add.collider(statues, walls);
      this.physics.add.collider(spiritStones, walls);

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

      this.completeLevel = completeLevel;
      this.updateReactUI = updateReactUI;

      updateReactUI();
      showMessage(
        "🏛️ Welcome! Press E near statues to collect spirit stones.",
        4000
      );
    }

    function update() {
      if (gameState.isLevelComplete) return;

      const speed = 160;
      player.setVelocity(0);

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

      spiritStones.children.iterate((stone) => {
        if (stone.active && !stone.isFollowing) {
          stone.rotation += 0.02;
          stone.y += Math.sin(sceneRef.time.now * 0.003 + stone.x * 0.01) * 0.2;
        }
      });

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
        mode: Phaser.Scale.NONE,
        width: 800,
        height: 500,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      gameInstance.current?.destroy(true);
    };
  }, []); // <-- Dependency array is now empty for stability

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Game Header */}
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

      {/* Game Container */}
      <div className="w-full max-w-4xl">
        <div
          ref={gameContainerRef}
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg mx-auto"
          style={{ background: "linear-gradient(45deg, #1f2937, #374151)" }}
        />
      </div>

      {/* Game Stats and other UI elements... */}
      {/* Game Stats */}
      <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-slate-800/50 p-2 rounded border border-slate-600 text-center">
          <div className="text-purple-400 font-bold">Spirits</div>
          <div>
            {uiState.spiritsCollected}/{uiState.totalSpirits}
          </div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded border border-slate-600 text-center">
          <div className="text-cyan-400 font-bold">Grouped</div>
          <div>
            {uiState.spiritsGrouped}/{uiState.totalSpirits}
          </div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded border border-slate-600 text-center">
          <div className="text-yellow-400 font-bold">Phase</div>
          <div className="capitalize">{uiState.gamePhase}</div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded border border-slate-600 text-center">
          <div className="text-green-400 font-bold">Health</div>
          <div>{uiState.health}/100</div>
        </div>
      </div>

      {/* Urn Counts Display */}
      <div className="w-full max-w-3xl bg-slate-800/50 p-4 rounded-lg border border-slate-600">
        <div className="text-center text-slate-300 mb-3 font-bold">
          🏺 Spirit Grouping Progress
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(uiState.urnCounts).map(([skill, count]) => (
            <div key={skill} className="text-center">
              <div
                className={`p-2 rounded-lg border-2 ${
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
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-slate-500">spirits</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="block md:hidden w-full max-w-sm">
        <div className="text-xs text-center text-yellow-300 mb-2">
          📱 Move with D-pad • E to interact with statues & altar
        </div>
        <div className="flex justify-between items-center">
          {/* D-Pad */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-1 w-24 h-24">
              <div></div>
              <button
                onTouchStart={() => handleMobileControlStart("up")}
                onTouchEnd={() => handleMobileControlEnd("up")}
                onMouseDown={() => handleMobileControlStart("up")}
                onMouseUp={() => handleMobileControlEnd("up")}
                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-white text-xs font-bold flex items-center justify-center"
              >
                ↑
              </button>
              <div></div>
              <button
                onTouchStart={() => handleMobileControlStart("left")}
                onTouchEnd={() => handleMobileControlEnd("left")}
                onMouseDown={() => handleMobileControlStart("left")}
                onMouseUp={() => handleMobileControlEnd("left")}
                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-white text-xs font-bold flex items-center justify-center"
              >
                ←
              </button>
              <div className="bg-slate-800 rounded"></div>
              <button
                onTouchStart={() => handleMobileControlStart("right")}
                onTouchEnd={() => handleMobileControlEnd("right")}
                onMouseDown={() => handleMobileControlStart("right")}
                onMouseUp={() => handleMobileControlEnd("right")}
                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-white text-xs font-bold flex items-center justify-center"
              >
                →
              </button>
              <div></div>
              <button
                onTouchStart={() => handleMobileControlStart("down")}
                onTouchEnd={() => handleMobileControlEnd("down")}
                onMouseDown={() => handleMobileControlStart("down")}
                onMouseUp={() => handleMobileControlEnd("down")}
                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded text-white text-xs font-bold flex items-center justify-center"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
          <button
            onTouchStart={handleInteract}
            onMouseDown={handleInteract}
            className="w-16 h-16 bg-purple-600 hover:bg-purple-500 active:bg-purple-400 rounded-full text-white font-bold text-lg flex items-center justify-center"
          >
            E
          </button>
        </div>
      </div>

      {/* Hint Button and Modals... */}
      <button
        onClick={showHint}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
      >
        💡 Show Hint
      </button>

      {uiState.showDialogue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
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
                <ol className="text-left list-decimal pl-6 space-y-1 text-yellow-400/80">
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
                  <pre className="text-left bg-slate-900 p-3 rounded whitespace-pre-wrap">
                    {uiState.queryResult}
                  </pre>
                </div>
              )}
              <button
                onClick={executeQuery}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Execute Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Level4;
