import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { AiFillBug } from "react-icons/ai";
import MobileControls from "../MobileControls"; // Import the component

const Level1 = ({ onComplete }) => {
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

    let player, enemies, correctCollectible, wrongCollectibles, walls;
    let cursors, spaceKey;

    const gameState = {
      health: 100,
      maxHealth: 100,
      mistakes: 0,
      isLevelComplete: false,
      canAttack: true,
      attackCooldown: 300,
    };

    const query = {
      text: "SELECT * <missing>FROM</missing> levels",
      word: "FROM",
    };

    const allKeywords = [
      "SELECT",
      "WHERE",
      "UPDATE",
      "DELETE",
      "ORDER BY",
      "GROUP BY",
    ];

    let sceneRef;
    let keywordPositions = [];

    function preload() {
      sceneRef = this;

      // --- Create Wizard Character for Player ---
      const playerGraphics = this.add.graphics();

      // Wizard robe (main body)
      playerGraphics.fillStyle(0x1e3a8a, 1);
      playerGraphics.fillCircle(16, 25, 14);
      playerGraphics.fillRect(2, 15, 28, 20);

      // Wizard hood
      playerGraphics.fillStyle(0x1e40af, 1);
      playerGraphics.fillCircle(16, 12, 10);

      // Hood shadow/depth
      playerGraphics.fillStyle(0x0f172a, 1);
      playerGraphics.fillEllipse(16, 14, 18, 8);

      // Face (visible under hood)
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillCircle(16, 16, 6);

      // Eyes
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(13, 15, 1.5);
      playerGraphics.fillCircle(19, 15, 1.5);

      // Eye glow (magical effect)
      playerGraphics.fillStyle(0x60a5fa, 0.7);
      playerGraphics.fillCircle(13, 15, 2.5);
      playerGraphics.fillCircle(19, 15, 2.5);

      // Robe trim/details
      playerGraphics.fillStyle(0xfbbf24, 1);
      playerGraphics.fillRect(2, 20, 28, 2);
      playerGraphics.fillRect(14, 15, 4, 25);

      // Magical scroll (held in left hand)
      playerGraphics.fillStyle(0xf7fafc, 1);
      playerGraphics.fillRect(8, 22, 6, 8);
      playerGraphics.lineStyle(1, 0x8b5cf6);
      playerGraphics.beginPath();
      playerGraphics.moveTo(9, 24);
      playerGraphics.lineTo(13, 24);
      playerGraphics.moveTo(9, 26);
      playerGraphics.lineTo(13, 26);
      playerGraphics.moveTo(9, 28);
      playerGraphics.lineTo(13, 28);
      playerGraphics.strokePath();

      // Magic staff (held in right hand)
      playerGraphics.lineStyle(3, 0x92400e);
      playerGraphics.beginPath();
      playerGraphics.moveTo(24, 35);
      playerGraphics.lineTo(26, 18);
      playerGraphics.strokePath();

      // Staff crystal/orb at top
      playerGraphics.fillStyle(0x8b5cf6, 0.8);
      playerGraphics.fillCircle(26, 16, 4);
      playerGraphics.fillStyle(0xfbbf24, 0.6);
      playerGraphics.fillCircle(26, 16, 6);

      // Staff decorative elements
      playerGraphics.lineStyle(2, 0xfbbf24);
      playerGraphics.beginPath();
      playerGraphics.moveTo(24, 20);
      playerGraphics.lineTo(28, 20);
      playerGraphics.moveTo(24, 24);
      playerGraphics.lineTo(28, 24);
      playerGraphics.strokePath();

      // Robe bottom (flowing)
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

      // Magical aura particles around character
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = 16 + Math.cos(angle) * 18;
        const y = 25 + Math.sin(angle) * 15;
        playerGraphics.fillStyle(0x8b5cf6, 0.4 + Math.random() * 0.3);
        playerGraphics.fillCircle(x, y, 1 + Math.random() * 2);
      }

      playerGraphics.generateTexture("player", 32, 40);
      playerGraphics.destroy();

      // Create Bug Enemies with Different Colors
      const enemyColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff];

      enemyColors.forEach((color, index) => {
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(color, 1);
        enemyGraphics.fillEllipse(16, 20, 16, 10);
        enemyGraphics.fillCircle(16, 12, 6);
        enemyGraphics.lineStyle(2, color);
        enemyGraphics.beginPath();
        enemyGraphics.moveTo(8, 18);
        enemyGraphics.lineTo(4, 22);
        enemyGraphics.moveTo(8, 22);
        enemyGraphics.lineTo(4, 26);
        enemyGraphics.moveTo(24, 18);
        enemyGraphics.lineTo(28, 22);
        enemyGraphics.moveTo(24, 22);
        enemyGraphics.lineTo(28, 26);
        enemyGraphics.strokePath();
        enemyGraphics.beginPath();
        enemyGraphics.moveTo(14, 8);
        enemyGraphics.lineTo(12, 4);
        enemyGraphics.moveTo(18, 8);
        enemyGraphics.lineTo(20, 4);
        enemyGraphics.strokePath();
        enemyGraphics.fillStyle(0x000000, 1);
        enemyGraphics.fillCircle(13, 12, 1.5);
        enemyGraphics.fillCircle(19, 12, 1.5);

        enemyGraphics.generateTexture(`enemy${index}`, 32, 32);
        enemyGraphics.destroy();
      });

      this.add
        .graphics()
        .fillStyle(0x444444)
        .fillRect(0, 0, 40, 40)
        .generateTexture("wall", 40, 40);
      this.add
        .graphics()
        .fillStyle(0x0a192f)
        .fillRect(0, 0, 800, 500)
        .generateTexture("background", 800, 500);
    }

    function create() {
      this.add.image(400, 250, "background");

      walls = this.physics.add.staticGroup();
      enemies = this.physics.add.group();
      correctCollectible = this.physics.add.group();
      wrongCollectibles = this.physics.add.group();

      player = this.physics.add.sprite(400, 250, "player");
      player.setCollideWorldBounds(true).body.setSize(20, 25).setOffset(6, 10);

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      this.physics.add.collider(player, walls);
      this.physics.add.collider(enemies, walls);
      this.physics.add.collider(enemies, enemies);

      this.physics.add.overlap(
        player,
        correctCollectible,
        collectCorrectItem,
        null,
        this
      );
      this.physics.add.overlap(
        player,
        wrongCollectibles,
        collectWrongItem,
        null,
        this
      );
      this.physics.add.overlap(player, enemies, hitByEnemy, null, this);

      createLevel.call(this);
      updateReactUI();
    }

    function createLevel() {
      enemies.clear(true, true);
      correctCollectible.clear(true, true);
      wrongCollectibles.clear(true, true);
      walls.clear(true, true);
      gameState.mistakes = 0;
      keywordPositions = [];

      sceneRef.children.list.forEach((child) => {
        if (child.isKeyword) child.destroy();
      });

      // Symmetric wall layout
      const wallPositions = [
        // Outer border walls
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
        [80, 260],
        [80, 340],
        [720, 160],
        [720, 240],
        [720, 260],
        [720, 340],

        // Symmetric inner walls
        [200, 160],
        [600, 160], // Top inner walls
        [200, 340],
        [600, 340], // Bottom inner walls
        [320, 200],
        [480, 200], // Middle upper
        [320, 300],
        [480, 300], // Middle lower
        [160, 250],
        [640, 250], // Side walls
        [400, 160],
        [400, 340], // Center pillars
      ];
      wallPositions.forEach((pos) => walls.create(pos[0], pos[1], "wall"));

      // --- MODIFIED: Create multiple enemies with different colors ---
      for (let i = 0; i < 3; i++) createEnemy.call(this, i);

      createCorrectKeyword.call(this);
      createWrongKeyword.call(this);

      player.setPosition(400, 250).setVelocity(0, 0);
    }

    function createEnemy(enemyIndex = 0) {
      let x, y;
      let attempts = 0;
      do {
        x = Phaser.Math.Between(150, 650);
        y = Phaser.Math.Between(150, 350);
        attempts++;
      } while (
        attempts < 50 &&
        (Phaser.Math.Distance.Between(x, y, player.x, player.y) < 120 ||
          checkWallCollision(x, y) ||
          checkEnemyCollision(x, y))
      );

      // Use different enemy textures with different colors
      const enemyTextureIndex = enemyIndex % 5; // Cycle through 5 different colored bugs
      const enemy = enemies.create(x, y, `enemy${enemyTextureIndex}`);
      enemy.setCollideWorldBounds(true).body.setSize(24, 20).setOffset(4, 8);
      enemy.health = 75;
      enemy.speed = 50 + enemyIndex * 10; // Different speeds for variety
      enemy.enemyType = enemyTextureIndex; // Store enemy type for visual effects

      // Add floating animation
      sceneRef.tweens.add({
        targets: enemy,
        y: enemy.y - 5,
        duration: 1000 + enemyIndex * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    function createKeyword(isCorrect) {
      let x, y;

      const predefinedPositions = [
        [250, 180],
        [550, 180],
        [180, 320],
        [620, 320],
        [150, 250],
        [650, 250],
      ];

      const availablePositions = predefinedPositions.filter((pos) => {
        const [posX, posY] = pos;

        if (
          Phaser.Math.Distance.Between(posX, posY, player.x, player.y) < 180
        ) {
          return false;
        }

        if (checkWallCollision(posX, posY)) {
          return false;
        }

        for (let keywordPos of keywordPositions) {
          if (
            Phaser.Math.Distance.Between(
              posX,
              posY,
              keywordPos.x,
              keywordPos.y
            ) < 200
          ) {
            return false;
          }
        }

        for (let enemy of enemies.children.entries) {
          if (
            Phaser.Math.Distance.Between(posX, posY, enemy.x, enemy.y) < 120
          ) {
            return false;
          }
        }

        return true;
      });

      if (availablePositions.length === 0) {
        let attempts = 0;
        do {
          x = Phaser.Math.Between(180, 620);
          y = Phaser.Math.Between(150, 350);
          attempts++;
        } while (
          attempts < 300 &&
          (Phaser.Math.Distance.Between(x, y, player.x, player.y) < 180 ||
            checkWallCollision(x, y) ||
            checkKeywordCollision(x, y) ||
            checkEnemyCollision(x, y))
        );
      } else {
        const selectedPosition = availablePositions[0];
        x = selectedPosition[0];
        y = selectedPosition[1];
      }

      const keywordText = isCorrect
        ? query.word
        : allKeywords[Phaser.Math.Between(0, allKeywords.length - 1)];

      const graphics = sceneRef.add.graphics();
      graphics.fillStyle(0x8a2be2, 0.8);
      graphics.lineStyle(2, 0x9932cc);
      graphics.fillCircle(0, 0, 35);
      graphics.strokeCircle(0, 0, 35);
      graphics.x = x;
      graphics.y = y;
      graphics.isKeyword = true;

      const text = sceneRef.add
        .text(x, y, keywordText, {
          fontSize: "12px",
          fontFamily: "Courier New",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      text.isKeyword = true;

      const collectible = sceneRef.physics.add
        .sprite(x, y, null)
        .setVisible(false);
      collectible.body.setCircle(35);
      collectible.graphics = graphics;
      collectible.keywordText = text;

      (isCorrect ? correctCollectible : wrongCollectibles).add(collectible);

      keywordPositions.push({ x, y });

      sceneRef.tweens.add({
        targets: [graphics, text],
        y: y - 8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
      });
    }

    function checkKeywordCollision(x, y) {
      const minDistance = 200;

      for (let pos of keywordPositions) {
        if (Phaser.Math.Distance.Between(x, y, pos.x, pos.y) < minDistance) {
          return true;
        }
      }

      if (correctCollectible.children.entries.length > 0) {
        const correct = correctCollectible.children.entries[0];
        if (
          Phaser.Math.Distance.Between(x, y, correct.x, correct.y) < minDistance
        ) {
          return true;
        }
      }

      for (let wrong of wrongCollectibles.children.entries) {
        if (
          Phaser.Math.Distance.Between(x, y, wrong.x, wrong.y) < minDistance
        ) {
          return true;
        }
      }

      return false;
    }

    function checkEnemyCollision(x, y) {
      for (let enemy of enemies.children.entries) {
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < 120) {
          return true;
        }
      }
      return false;
    }

    const createCorrectKeyword = () => createKeyword(true);
    const createWrongKeyword = () => createKeyword(false);

    function checkWallCollision(x, y) {
      return walls.children.entries.some(
        (wall) => Phaser.Math.Distance.Between(x, y, wall.x, wall.y) < 80
      );
    }

     function update() {
      if (gameState.isLevelComplete) return;

      player.setVelocity(0);
      const speed = 200;

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
        (Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControlsRef.current.attack) &&
        gameState.canAttack
      ) {
        attack.call(this);
      }

      enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;
        this.physics.moveTo(enemy, player.x, player.y, enemy.speed);
      });
    }

    function attack() {
      gameState.canAttack = false;

      const attackRange = 90; // Slightly larger range for magical attack

      // Magical attack effect with wizard theme
      const attackEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange,
        0x8b5cf6,
        0.3
      ); // Purple magic
      const innerEffect = sceneRef.add.circle(
        player.x,
        player.y,
        attackRange * 0.6,
        0xfbbf24,
        0.4
      ); // Golden core

      // Add magical sparkles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = attackRange * 0.8;
        const sparkleX = player.x + Math.cos(angle) * distance;
        const sparkleY = player.y + Math.sin(angle) * distance;

        const sparkle = sceneRef.add.circle(
          sparkleX,
          sparkleY,
          3,
          0xfbbf24,
          0.8
        );
        sceneRef.tweens.add({
          targets: sparkle,
          scaleX: 0,
          scaleY: 0,
          duration: 300,
          onComplete: () => sparkle.destroy(),
        });
      }

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

      // Add screen flash for magical effect
      sceneRef.cameras.main.flash(
        100,
        139,
        92,
        246,
        false,
        (camera, progress) => {
          if (progress === 1) {
            // Flash complete
          }
        }
      );

      enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;

        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          enemy.x,
          enemy.y
        );
        if (distance <= attackRange) {
          enemy.health -= 60; // Slightly more damage for magical attack

          const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            enemy.x,
            enemy.y
          );
          enemy.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350); // Stronger knockback

          // Magical damage effect
          enemy.setTint(0x8b5cf6); // Purple tint for magic damage
          sceneRef.time.delayedCall(150, () => {
            if (enemy.active) enemy.clearTint();
          });

          if (enemy.health <= 0) {
            // Enhanced explosion with magical effects
            const explosionColors = [
              0xff6b6b, 0x6bff6b, 0x6b6bff, 0xffff6b, 0xff6bff,
            ];
            const explosionColor = explosionColors[enemy.enemyType] || 0xffff00;

            const explosion = sceneRef.add.circle(
              enemy.x,
              enemy.y,
              25,
              explosionColor
            );
            const magicExplosion = sceneRef.add.circle(
              enemy.x,
              enemy.y,
              15,
              0x8b5cf6,
              0.7
            );

            sceneRef.tweens.add({
              targets: explosion,
              scaleX: 4,
              scaleY: 4,
              alpha: 0,
              duration: 400,
              onComplete: () => explosion.destroy(),
            });

            sceneRef.tweens.add({
              targets: magicExplosion,
              scaleX: 3,  
              scaleY: 3,
              alpha: 0,
              duration: 300,
              onComplete: () => magicExplosion.destroy(),
            });

            enemy.destroy();
          }
        }
      });

      sceneRef.time.delayedCall(gameState.attackCooldown, () => {
        gameState.canAttack = true;
      });
    }

    function collectCorrectItem(player, collectible) {
      collectible.graphics.destroy();
      collectible.keywordText.destroy();
      collectible.destroy();

      gameState.isLevelComplete = true;
      updateReactUI();

      showLevelComplete();
    }

    function showLevelComplete() {
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8);
      overlay.setDepth(1000);

      const completionText = sceneRef.add
        .text(400, 200, "🎉 Level Complete! 🎉", {
          fontSize: "32px",
          fontFamily: "Courier New",
          color: "#00ff00",
          fontStyle: "bold",
        })
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

    function collectWrongItem(player, collectible) {
      collectible.graphics.destroy();
      collectible.keywordText.destroy();
      collectible.destroy();

      gameState.mistakes++;
      gameState.health -= 25;

      player.setTint(0xff0000);
      sceneRef.time.delayedCall(200, () => player.clearTint());

      if (gameState.mistakes > 1 || gameState.health <= 0) {
        restartLevel();
      }
      updateReactUI();
    }

    function restartLevel() {
      const restartText = sceneRef.add
        .text(400, 250, "Too many mistakes... Try Again!", {
          fontSize: "24px",
          fontFamily: "Courier New",
          color: "#ff4444",
          backgroundColor: "#000000",
        })
        .setOrigin(0.5);

      sceneRef.cameras.main.flash(500, 255, 0, 0);
      gameState.health = 100;

      sceneRef.time.delayedCall(1500, () => {
        restartText.destroy();
        createLevel.call(sceneRef);
        updateReactUI();
      });
    }

    function hitByEnemy(player, enemy) {
      if (enemy.lastAttack && sceneRef.time.now - enemy.lastAttack < 1000)
        return;

      enemy.lastAttack = sceneRef.time.now;
      gameState.health -= 15;

      player.setTint(0xff0000);
      sceneRef.time.delayedCall(200, () => player.clearTint());

      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        player.x,
        player.y
      );
      player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);

      if (gameState.health <= 0) {
        restartLevel();
      }
      updateReactUI();
    }

     function updateReactUI() {
      setUiState({
        health: Math.max(0, gameState.health),
        isQueryComplete: gameState.isLevelComplete,
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
  }, [onComplete]);


  return (
        <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the icons as reference in the UI */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-xs text-yellow-300">🧙</span>
          </div>
          <span>Your Wizard</span>
        </div>
        <div className="flex items-center gap-2">
          <AiFillBug size={20} color="#ff4444" />
          <span>Bug Enemies</span>
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

      <div className="w-full max-w-3xl flex justify-between items-center pixel-font text-lg">
        <div>
          Health: <span className="text-rose-400">{uiState.health}/100</span>
        </div>
      </div>

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
        <div className="pixel-font text-slate-300 mb-2">Complete the SQL Query:</div>
        <div className="font-mono text-xl">
          <span>SELECT * </span>
          {uiState.isQueryComplete ? (
            <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">FROM</span>
          ) : (
            <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded animate-pulse">__?__</span>
          )}
          <span> map </span>
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

export default Level1;