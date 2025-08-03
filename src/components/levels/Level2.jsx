import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { levels } from "../../assets/data/levels";
import { AiFillBug } from "react-icons/ai";
import { GiDragonHead, GiTreasureMap } from "react-icons/gi";
import MobileControls from "../MobileControls"; // Import the component

const Level2 = ({ onComplete }) => {
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
    explorersCaptured: 0,
    totalExplorers: 0,
    dragonsDefeated: 0,
    courageThreshold: 80,
  });

  // Mobile controls state (for UI updates only)
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
  });

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, dragons, explorers, courageOrbs, walls, treasureChests;
    let cursors, spaceKey;

    const gameState = {
      health: 100,
      maxHealth: 100,
      isLevelComplete: false,
      canAttack: true,
      attackCooldown: 400,
      explorersCaptured: 0,
      dragonsDefeated: 0,
      totalExplorers: 0,
      courageThreshold: 80,
      explorersData: [],
    };

    let sceneRef;

    function preload() {
      sceneRef = this;

      // --- Create Wizard Character (same as Level 1) ---
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

      // --- Create Dragon Enemies ---
      const dragonColors = [0xff2d2d, 0x2dff2d, 0x2d2dff, 0xffff2d];
      dragonColors.forEach((color, index) => {
        const dragonGraphics = this.add.graphics();

        // Dragon body
        dragonGraphics.fillStyle(color, 1);
        dragonGraphics.fillEllipse(20, 25, 24, 16);

        // Dragon head
        dragonGraphics.fillCircle(32, 20, 10);

        // Dragon wings
        dragonGraphics.fillStyle(color, 0.7);
        dragonGraphics.fillEllipse(12, 18, 16, 12);
        dragonGraphics.fillEllipse(28, 18, 16, 12);

        // Dragon eyes
        dragonGraphics.fillStyle(0xff0000, 1);
        dragonGraphics.fillCircle(29, 18, 2);
        dragonGraphics.fillCircle(35, 18, 2);

        // Dragon spikes
        dragonGraphics.fillStyle(0x444444, 1);
        for (let i = 0; i < 3; i++) {
          const x = 15 + i * 8;
          dragonGraphics.fillTriangle(x, 15, x + 3, 10, x + 6, 15);
        }

        dragonGraphics.generateTexture(`dragon${index}`, 45, 35);
        dragonGraphics.destroy();
      });

      // --- Create Explorer Characters ---
      const explorerTypes = ["brave", "coward", "normal"];
      const explorerColors = [0x00ff00, 0xff6666, 0xffaa00]; // Green for brave, red for coward, orange for normal

      explorerTypes.forEach((type, index) => {
        const explorerGraphics = this.add.graphics();
        const color = explorerColors[index];

        // Explorer body
        explorerGraphics.fillStyle(0x8b4513, 1); // Brown clothing
        explorerGraphics.fillRect(8, 20, 16, 15);

        // Explorer head
        explorerGraphics.fillStyle(0xfdbcb4, 1); // Skin tone
        explorerGraphics.fillCircle(16, 15, 8);

        // Explorer hair
        explorerGraphics.fillStyle(0x4a4a4a, 1);
        explorerGraphics.fillCircle(16, 10, 9);

        // Explorer eyes
        explorerGraphics.fillStyle(0x000000, 1);
        explorerGraphics.fillCircle(13, 14, 1);
        explorerGraphics.fillCircle(19, 14, 1);

        // Courage indicator (glowing aura)
        explorerGraphics.fillStyle(color, 0.4);
        explorerGraphics.fillCircle(16, 20, 20);

        // Explorer equipment
        explorerGraphics.fillStyle(0x666666, 1);
        explorerGraphics.fillRect(6, 18, 3, 8); // Backpack
        explorerGraphics.fillRect(22, 22, 8, 2); // Tool

        explorerGraphics.generateTexture(`explorer_${type}`, 32, 35);
        explorerGraphics.destroy();
      });

      // --- Create Courage Orbs ---
      const orbGraphics = this.add.graphics();
      orbGraphics.fillStyle(0xffd700, 0.8); // Golden orb
      orbGraphics.fillCircle(15, 15, 12);
      orbGraphics.fillStyle(0xffff00, 0.6);
      orbGraphics.fillCircle(15, 15, 8);
      orbGraphics.fillStyle(0xffffff, 0.8);
      orbGraphics.fillCircle(15, 15, 4);
      orbGraphics.generateTexture("courage_orb", 30, 30);
      orbGraphics.destroy();

      // --- Create Treasure Chest ---
      const chestGraphics = this.add.graphics();
      chestGraphics.fillStyle(0x8b4513, 1); // Brown chest
      chestGraphics.fillRect(5, 15, 20, 15);
      chestGraphics.fillStyle(0xffd700, 1); // Gold details
      chestGraphics.fillRect(7, 17, 16, 2);
      chestGraphics.fillRect(13, 20, 4, 8);
      chestGraphics.fillCircle(15, 24, 2);
      chestGraphics.generateTexture("treasure_chest", 30, 30);
      chestGraphics.destroy();

      // Walls and background
      this.add
        .graphics()
        .fillStyle(0x444444)
        .fillRect(0, 0, 40, 40)
        .generateTexture("wall", 40, 40);
      this.add
        .graphics()
        .fillStyle(0x2a1810)
        .fillRect(0, 0, 800, 500)
        .generateTexture("background", 800, 500);
    }

    function create() {
      this.add.image(400, 250, "background");

      walls = this.physics.add.staticGroup();
      dragons = this.physics.add.group();
      explorers = this.physics.add.group();
      courageOrbs = this.physics.add.group();
      treasureChests = this.physics.add.staticGroup();

      player = this.physics.add.sprite(100, 250, "player");
      player.setCollideWorldBounds(true).body.setSize(20, 25).setOffset(6, 10);

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      this.physics.add.collider(player, walls);
      this.physics.add.collider(dragons, walls);
      this.physics.add.collider(explorers, walls);
      this.physics.add.collider(dragons, dragons);

      this.physics.add.overlap(player, explorers, rescueExplorer, null, this);
      this.physics.add.overlap(
        player,
        courageOrbs,
        collectCourageOrb,
        null,
        this
      );
      this.physics.add.overlap(
        player,
        treasureChests,
        openTreasureChest,
        null,
        this
      );
      this.physics.add.overlap(player, dragons, hitByDragon, null, this);

      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      dragons.clear(true, true);
      explorers.clear(true, true);
      courageOrbs.clear(true, true);
      treasureChests.clear(true, true);
      walls.clear(true, true);

      gameState.explorersCaptured = 0;
      gameState.dragonsDefeated = 0;
      gameState.explorersData = [];

      // Create maze-like walls
      const wallPositions = [
        // Outer walls
        [80, 80],
        [160, 80],
        [240, 80],
        [320, 80],
        [480, 80],
        [560, 80],
        [640, 80],
        [720, 80],
        [80, 420],
        [160, 420],
        [240, 420],
        [320, 420],
        [480, 420],
        [560, 420],
        [640, 420],
        [720, 420],
        [80, 160],
        [80, 240],
        [80, 340],
        [720, 160],
        [720, 240],
        [720, 340],

        // Interior maze
        [200, 160],
        [200, 240],
        [200, 320],
        [400, 120],
        [400, 200],
        [400, 280],
        [400, 360],
        [600, 160],
        [600, 240],
        [600, 320],
        [320, 200],
        [480, 200],
        [160, 300],
        [560, 300],
      ];
      wallPositions.forEach((pos) => walls.create(pos[0], pos[1], "wall"));

      // Create explorers with different courage levels
      createExplorers.call(this);

      // Create dragons guarding different areas
      createDragons.call(this);

      // Create courage orbs (power-ups)
      createCourageOrbs.call(this);

      // Create treasure chest at the end
      treasureChests.create(700, 250, "treasure_chest");

      player.setPosition(100, 250).setVelocity(0, 0);
      gameState.totalExplorers = explorers.children.entries.length;
    }

    function createExplorers() {
      const explorerPositions = [
        { x: 250, y: 200, courage: 90, type: "brave" },
        { x: 150, y: 350, courage: 85, type: "brave" },
        { x: 450, y: 150, courage: 95, type: "brave" },
        { x: 650, y: 200, courage: 88, type: "brave" },
        { x: 550, y: 350, courage: 92, type: "brave" },
        // Decoy explorers with low courage
        { x: 180, y: 180, courage: 45, type: "coward" },
        { x: 350, y: 250, courage: 60, type: "normal" },
        { x: 520, y: 180, courage: 30, type: "coward" },
        { x: 380, y: 350, courage: 55, type: "normal" },
      ];

      explorerPositions.forEach((pos) => {
        const explorer = explorers.create(pos.x, pos.y, `explorer_${pos.type}`);
        explorer
          .setCollideWorldBounds(true)
          .body.setSize(25, 30)
          .setOffset(3, 2);
        explorer.courage = pos.courage;
        explorer.explorerType = pos.type;
        explorer.rescued = false;

        // Add floating animation
        sceneRef.tweens.add({
          targets: explorer,
          y: explorer.y - 5,
          duration: 2000 + pos.courage * 10,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        // Add courage level text above explorer
        const courageText = sceneRef.add
          .text(pos.x, pos.y - 20, pos.courage.toString(), {
            fontSize: "12px",
            fontFamily: "Courier New",
            color:
              pos.courage > gameState.courageThreshold ? "#00ff00" : "#ff6666",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        explorer.courageText = courageText;
        gameState.explorersData.push(pos);
      });
    }

    function createDragons() {
      const dragonPositions = [
        { x: 300, y: 180 },
        { x: 500, y: 280 },
        { x: 350, y: 350 },
        { x: 600, y: 180 },
      ];

      dragonPositions.forEach((pos, index) => {
        const dragon = dragons.create(pos.x, pos.y, `dragon${index % 4}`);
        dragon.setCollideWorldBounds(true).body.setSize(35, 25).setOffset(5, 5);
        dragon.health = 100;
        dragon.speed = 40;
        dragon.patrolDistance = 80;
        dragon.startX = pos.x;
        dragon.startY = pos.y;
        dragon.direction = 1;

        // Add wing flapping animation
        sceneRef.tweens.add({
          targets: dragon,
          scaleX: 1.1,
          scaleY: 0.9,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    function createCourageOrbs() {
      const orbPositions = [
        { x: 140, y: 280 },
        { x: 460, y: 320 },
        { x: 280, y: 300 },
        { x: 580, y: 250 },
      ];

      orbPositions.forEach((pos) => {
        const orb = courageOrbs.create(pos.x, pos.y, "courage_orb");
        orb.body.setCircle(12);

        // Glowing animation
        sceneRef.tweens.add({
          targets: orb,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0.7,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
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

      if (
        (Phaser.Input.Keyboard.JustDown(spaceKey) ||
          mobileControlsRef.current.attack) &&
        gameState.canAttack
      ) {
        attack.call(this);
      }

      // Dragon AI - patrol behavior
      dragons.children.entries.forEach((dragon) => {
        if (!dragon.active) return;

        // Simple patrol AI
        const distanceFromStart = Phaser.Math.Distance.Between(
          dragon.x,
          dragon.startX,
          dragon.y,
          dragon.startY
        );

        if (distanceFromStart > dragon.patrolDistance) {
          dragon.direction *= -1;
        }

        const angle = Phaser.Math.Angle.Between(
          dragon.x,
          dragon.y,
          dragon.startX + dragon.direction * dragon.patrolDistance,
          dragon.startY
        );
        dragon.setVelocity(
          Math.cos(angle) * dragon.speed,
          Math.sin(angle) * dragon.speed
        );

        // If player is nearby, chase instead
        const distanceToPlayer = Phaser.Math.Distance.Between(
          dragon.x,
          dragon.y,
          player.x,
          player.y
        );
        if (distanceToPlayer < 120) {
          sceneRef.physics.moveTo(
            dragon,
            player.x,
            player.y,
            dragon.speed * 1.5
          );
        }
      });
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

      dragons.children.entries.forEach((dragon) => {
        if (!dragon.active) return;

        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          dragon.x,
          dragon.y
        );
        if (distance <= attackRange) {
          dragon.health -= 50;

          const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            dragon.x,
            dragon.y
          );
          dragon.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

          dragon.setTint(0x8b5cf6);
          sceneRef.time.delayedCall(150, () => {
            if (dragon.active) dragon.clearTint();
          });

          if (dragon.health <= 0) {
            gameState.dragonsDefeated++;

            const explosion = sceneRef.add.circle(
              dragon.x,
              dragon.y,
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

            dragon.destroy();
          }
        }
      });

      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });
    }

    function rescueExplorer(player, explorer) {
      if (explorer.rescued) return;

      explorer.rescued = true;

      if (explorer.courage > gameState.courageThreshold) {
        // Correct explorer (brave)
        gameState.explorersCaptured++;

        explorer.setTint(0x00ff00);
        explorer.courageText.setColor("#00ff00");

        // Success effect
        const successEffect = sceneRef.add.circle(
          explorer.x,
          explorer.y,
          40,
          0x00ff00,
          0.5
        );
        sceneRef.tweens.add({
          targets: successEffect,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => successEffect.destroy(),
        });

        sceneRef.time.delayedCall(1000, () => {
          explorer.destroy();
          explorer.courageText.destroy();
        });
      } else {
        // Wrong explorer (not brave enough)
        gameState.health -= 20;

        explorer.setTint(0xff0000);
        player.setTint(0xff0000);
        sceneRef.time.delayedCall(200, () => {
          if (player.active) player.clearTint();
        });

        // Mistake effect
        const mistakeEffect = sceneRef.add.circle(
          explorer.x,
          explorer.y,
          40,
          0xff0000,
          0.5
        );
        sceneRef.tweens.add({
          targets: mistakeEffect,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => mistakeEffect.destroy(),
        });
      }

      // Check win condition
      const braveExplorersCount = gameState.explorersData.filter(
        (e) => e.courage > gameState.courageThreshold
      ).length;
      if (gameState.explorersCaptured >= braveExplorersCount) {
        showLevelComplete();
      }

      updateReactUI();
    }

    function collectCourageOrb(player, orb) {
      orb.destroy();

      // Heal player
      gameState.health = Math.min(gameState.maxHealth, gameState.health + 25);

      // Visual effect
      const healEffect = sceneRef.add.circle(
        player.x,
        player.y,
        30,
        0xffd700,
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

    function openTreasureChest(player, chest) {
      if (
        gameState.explorersCaptured <
        gameState.explorersData.filter(
          (e) => e.courage > gameState.courageThreshold
        ).length
      ) {
        // Show message that they need to rescue all brave explorers first
        const messageText = sceneRef.add
          .text(chest.x, chest.y - 50, "Find all brave explorers first!", {
            fontSize: "14px",
            fontFamily: "Courier New",
            color: "#ffff00",
            backgroundColor: "#000000",
          })
          .setOrigin(0.5);

        sceneRef.time.delayedCall(2000, () => messageText.destroy());
        return;
      }

      showLevelComplete();
    }

    function showLevelComplete() {
      gameState.isLevelComplete = true;
      updateReactUI();

      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);

      const completionText = sceneRef.add
        .text(400, 180, "🐉 Dragons Defeated! 🐉", {
          fontSize: "28px",
          fontFamily: "Courier New",
          color: "#00ff00",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText = sceneRef.add
        .text(400, 220, "SELECT * FROM jungle_explorers", {
          fontSize: "16px",
          fontFamily: "Courier New",
          color: "#00ffff",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const queryText2 = sceneRef.add
        .text(400, 240, "WHERE courage_level > 80;", {
          fontSize: "16px",
          fontFamily: "Courier New",
          color: "#00ffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const statsText = sceneRef.add
        .text(
          400,
          280,
          `Brave Explorers Rescued: ${gameState.explorersCaptured}`,
          {
            fontSize: "14px",
            fontFamily: "Courier New",
            color: "#ffff00",
          }
        )
        .setOrigin(0.5)
        .setDepth(1001);

      const instructionText = sceneRef.add
        .text(400, 320, "Click to return to map", {
          fontSize: "32px",
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

    function hitByDragon(player, dragon) {
      if (dragon.lastAttack && sceneRef.time.now - dragon.lastAttack < 1500)
        return;

      dragon.lastAttack = sceneRef.time.now;
      gameState.health -= 25;

      player.setTint(0xff0000);
      sceneRef.time.delayedCall(300, () => player.clearTint());

      const angle = Phaser.Math.Angle.Between(
        dragon.x,
        dragon.y,
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
        .text(400, 250, "The dragons have won... Try Again!", {
          fontSize: "24px",
          fontFamily: "Courier New",
          color: "#ff4444",
          backgroundColor: "#000000",
        })
        .setOrigin(0.5);

      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;

      sceneRef.time.delayedCall(2000, () => {
        restartText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function updateReactUI() {
      setUiState({
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
        explorersCaptured: gameState.explorersCaptured,
        totalExplorers: gameState.explorersData.filter(
          (e) => e.courage > gameState.courageThreshold
        ).length,
        dragonsDefeated: gameState.dragonsDefeated,
        courageThreshold: gameState.courageThreshold,
      });
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
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-yellow-300">🧙</span>
          </div>
          <span>Your Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <GiDragonHead size={20} color="#ff4444" />
          <span>Dragons</span>
        </div>
        <div className="flex items-center gap-2">
          <GiTreasureMap size={20} color="#00ff00" />
          <span>Brave Explorers (80+ courage)</span>
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
          Dragons Defeated:{" "}
          <span className="text-red-400">{uiState.dragonsDefeated}</span>
        </div>
        <div>
          Brave Explorers:{" "}
          <span className="text-green-400">
            {uiState.explorersCaptured}/{uiState.totalExplorers}
          </span>
        </div>
        <div>
          Courage Needed:{" "}
          <span className="text-yellow-400">
            &gt; {uiState.courageThreshold}
          </span>
        </div>
      </div>

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">
          SQL Query Challenge:
        </div>
        <div className="font-mono text-lg">
          <span>SELECT * FROM jungle_explorers </span>
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
              WHERE courage_level &gt; 80;
            </span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded animate-pulse">
              WHERE courage_level ___?___
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Rescue only the brave explorers (courage &gt; 80) and avoid the
          cowards!
        </div>
      </div>

      {/* Use the reusable MobileControls component */}
      <MobileControls
        mobileControlsRef={mobileControlsRef}
        setMobileControls={setMobileControls}
      />

      <style jsx>{`
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};

export default Level2;
