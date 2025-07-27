import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

const Level2 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  const shootFunctionRef = useRef(null);
  
  const [uiState, setUiState] = useState({
    health: 100,
    xp: 0,
    collectedParts: [],
    isQueryComplete: false,
    currentQuery: "SELECT name FROM students ___ age ___ 30;"
  });

  const [mobileControls, setMobileControls] = useState({
    left: false,
    right: false,
    jump: false
  });

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let player, floatingKeywords, ground;
    let cursors, wasdKeys, spaceKey;
    
    const gameState = {
      health: 100,
      maxHealth: 100,
      xp: 0,
      mistakes: 0,
      isLevelComplete: false,
      collectedParts: [],
      expectedParts: ["WHERE", ">"],
      wrongKeywords: ["=", "FROM", "avg", "students", "<", "ORDER", "GROUP"],
      keywordSpawnDelay: 3000,
      riverSpeed: 40,
      canJump: true,
      spawnEvent: null,
      platforms: [],
      projectiles: [],
      canShoot: true,
      shootCooldown: 500,
      fishTextures: ['fish1', 'fish2', 'fish3'],
    };
    
    let sceneRef;

    function preload() {
      sceneRef = this;
      
      this.load.image('fish1', '/fish1.png');
      this.load.image('fish2', '/fish2.png');
      this.load.image('fish3', '/fish3.png');
      
      const playerGraphics = this.add.graphics();
      playerGraphics.fillStyle(0x87ceeb, 1);
      playerGraphics.fillCircle(16, 20, 12);
      playerGraphics.beginPath();
      playerGraphics.moveTo(4, 28);
      playerGraphics.lineTo(8, 32);
      playerGraphics.lineTo(12, 28);
      playerGraphics.lineTo(16, 32);
      playerGraphics.lineTo(20, 28);
      playerGraphics.lineTo(24, 32);
      playerGraphics.lineTo(28, 28);
      playerGraphics.lineTo(28, 20);
      playerGraphics.arc(16, 20, 12, 0, Math.PI, true);
      playerGraphics.closePath();
      playerGraphics.fillPath();
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(12, 18, 2);
      playerGraphics.fillCircle(20, 18, 2);
      playerGraphics.fillEllipse(16, 24, 4, 2);
      playerGraphics.generateTexture('player', 32, 40);
      playerGraphics.destroy();
      
      const waterGraphics = this.add.graphics();
      for (let i = 0; i < 250; i++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x4a90e2),
            Phaser.Display.Color.ValueToColor(0x3170b5),
            250, i
        );
        waterGraphics.fillStyle(color.color, 1);
        waterGraphics.fillRect(0, i, 800, 1);
      }
      waterGraphics.lineStyle(2, 0xffffff, 0.15);
      for (let i = 0; i < 10; i++) {
        const y = 20 + Math.random() * 80;
        const startX = -100 + Math.random() * 200;
        const amplitude = 5 + Math.random() * 5;
        const period = 200 + Math.random() * 100;
        waterGraphics.beginPath();
        waterGraphics.moveTo(startX, y);
        for (let x = startX; x < 800; x += 10) {
          waterGraphics.lineTo(x, y + Math.sin(x / period) * amplitude);
        }
        waterGraphics.strokePath();
      }
      waterGraphics.generateTexture('water', 800, 250);
      waterGraphics.destroy();
      
      const groundGraphics = this.add.graphics();
      groundGraphics.fillStyle(0x8b7355, 1);
      groundGraphics.fillRect(0, 0, 800, 250);
      groundGraphics.fillStyle(0x6b4f3a, 0.5);
      for (let i = 0; i < 15; i++) {
        groundGraphics.fillRect(0, Math.random() * 250, 800, Math.random() * 20 + 5);
      }
      groundGraphics.fillStyle(0x5d4037, 0.7);
      for (let i = 0; i < 600; i++) {
        groundGraphics.fillCircle(Math.random() * 800, Math.random() * 250, Math.random() * 2 + 1);
      }
      groundGraphics.generateTexture('ground', 800, 250);
      groundGraphics.destroy();
      
      const projGraphics = this.add.graphics();
      projGraphics.fillStyle(0xffff00, 1);
      projGraphics.fillCircle(4, 4, 4);
      projGraphics.generateTexture('projectile', 8, 8);
      projGraphics.destroy();
    }

    function create() {
      this.add.image(400, 125, 'water');
      this.add.image(400, 375, 'ground');
      floatingKeywords = this.physics.add.group();
      player = this.physics.add.sprite(400, 350, 'player');
      player.setCollideWorldBounds(true);
      player.setBounce(0.2);
      player.setGravityY(600);
      player.body.setSize(20, 25).setOffset(6, 10);
      const groundCollider = this.physics.add.staticGroup();
      groundCollider.create(400, 470, null).setSize(800, 60).setVisible(false);
      this.physics.add.collider(player, groundCollider);
      cursors = this.input.keyboard.createCursorKeys();
      wasdKeys = this.input.keyboard.addKeys('W,S,A,D');
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard.on('keydown-X', () => { shootProjectile(); });
      shootFunctionRef.current = shootProjectile;
      startKeywordSpawning.call(this);
      updateReactUI();
    }

    function startKeywordSpawning() {
      spawnKeyword.call(this);
      gameState.spawnEvent = this.time.addEvent({
        delay: gameState.keywordSpawnDelay,
        callback: spawnKeyword,
        callbackScope: this,
        loop: true
      });
    }

    function spawnKeyword() {
      if (gameState.isLevelComplete) return;
      
      const needsCorrectKeyword = gameState.collectedParts.length < gameState.expectedParts.length;
      const shouldSpawnCorrect = needsCorrectKeyword && Math.random() < 0.5;
      
      let keywordText;
      let isCorrect = false;
      
      if (shouldSpawnCorrect) {
        keywordText = gameState.expectedParts[gameState.collectedParts.length];
        isCorrect = true;
      } else {
        keywordText = gameState.wrongKeywords[Phaser.Math.Between(0, gameState.wrongKeywords.length - 1)];
      }
      
      const fishType = gameState.fishTextures[Phaser.Math.Between(0, gameState.fishTextures.length - 1)];
      const startY = Phaser.Math.Between(120, 200);
      const fish = sceneRef.add.sprite(850, startY, fishType);
      
      // Make fish smaller
      fish.setScale(0.3);
      
      fish.keywordText = keywordText;
      fish.isCorrect = isCorrect;
      fish.textObject = null;
      fish.speed = gameState.riverSpeed + (Math.random() * 20 - 10);
      
      // Make keyword box positioned a little above the fish
      const text = sceneRef.add.text(fish.x, fish.y - 25, keywordText, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: isCorrect ? '#1a6a1a' : '#a31c1c',
        padding: { x: 10, y: 5 },
        stroke: isCorrect ? '#66ff66' : '#ff6666',
        strokeThickness: 2,
        shadow: { color: '#000000', fill: true, offsetX: 1, offsetY: 1, blur: 3 }
      }).setOrigin(0.5);
      
      fish.textObject = text;
      
      sceneRef.tweens.add({
        targets: [fish, text],
        y: `+=${(Math.random() * 10 + 5)}`,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
      
      if (!gameState.platforms) {
        gameState.platforms = [];
      }
      gameState.platforms.push(fish);
    }

    function shootProjectile() {
      if (!gameState.canShoot || gameState.isLevelComplete) return;
      
      const projectile = sceneRef.add.sprite(player.x, player.y - 10, 'projectile');
      projectile.speed = 300;
      projectile.active = true;
      
      gameState.projectiles.push(projectile);
      
      gameState.canShoot = false;
      sceneRef.time.delayedCall(gameState.shootCooldown, () => {
        gameState.canShoot = true;
      });
      
      player.setTint(0xffff00);
      sceneRef.time.delayedCall(100, () => player.clearTint());
    }

    function update() {
      if (gameState.isLevelComplete) return;
      
      const speed = 180;
      player.setVelocityX(0);
      
      if (cursors.left.isDown || wasdKeys.A.isDown || mobileControls.left) {
        player.setVelocityX(-speed);
      } else if (cursors.right.isDown || wasdKeys.D.isDown || mobileControls.right) {
        player.setVelocityX(speed);
      }
      
      if ((cursors.up.isDown || wasdKeys.W.isDown || Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControls.jump) 
          && player.body.touching.down && gameState.canJump) {
        player.setVelocityY(-450);
        gameState.canJump = false;
        sceneRef.time.delayedCall(500, () => { gameState.canJump = true; });
      }
      
      for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        if (projectile.active) {
          projectile.y -= projectile.speed * sceneRef.game.loop.delta / 1000;
          let hitPlatform = false;
          for (let j = gameState.platforms.length - 1; j >= 0; j--) {
            const platform = gameState.platforms[j];
            if (platform.active && Phaser.Geom.Rectangle.Overlaps(projectile.getBounds(), platform.getBounds())) {
              const keywordText = platform.keywordText;
              const isCorrect = platform.isCorrect;
              if (isCorrect && gameState.collectedParts.length < gameState.expectedParts.length) {
                const expectedKeyword = gameState.expectedParts[gameState.collectedParts.length];
                if (keywordText === expectedKeyword) {
                  gameState.collectedParts.push(keywordText);
                  gameState.xp += 10;
                  sceneRef.cameras.main.flash(150, 0, 255, 0);
                  if (platform.textObject && platform.textObject.active) {
                    platform.textObject.destroy();
                  }
                  platform.destroy();
                  gameState.platforms.splice(j, 1);
                  checkLevelCompletion();
                } else { handleMistake(); }
              } else { handleMistake(); }
              hitPlatform = true;
              break;
            }
          }
          if (hitPlatform || projectile.y < -10) {
            projectile.destroy();
            gameState.projectiles.splice(i, 1);
          }
        } else {
          gameState.projectiles.splice(i, 1);
        }
      }
      
      if (gameState.platforms) {
        for (let i = gameState.platforms.length - 1; i >= 0; i--) {
          const platform = gameState.platforms[i]; // This is the fish sprite
          if (platform.active) {
            platform.x -= platform.speed * sceneRef.game.loop.delta / 1000;
            if (platform.textObject && platform.textObject.active) {
              platform.textObject.x = platform.x;
              // Keep text position updated correctly - positioned above the fish
              platform.textObject.y = platform.y - 25;
            }
            if (platform.x < -100) {
              if (platform.textObject && platform.textObject.active) {
                platform.textObject.destroy();
              }
              platform.destroy();
              gameState.platforms.splice(i, 1);
            }
          } else {
            gameState.platforms.splice(i, 1);
          }
        }
      }
    }

    function handleMistake() {
      gameState.mistakes++;
      gameState.health -= 20;
      sceneRef.cameras.main.flash(200, 255, 0, 0);
      updateReactUI();
      if (gameState.health <= 0) { restartLevel(); }
    }

    function checkLevelCompletion() {
      if (gameState.collectedParts.length === gameState.expectedParts.length) {
        gameState.isLevelComplete = true;
        gameState.xp += 20;
        showLevelComplete();
      }
      updateReactUI();
    }

    function showLevelComplete() {
      if (gameState.spawnEvent) { gameState.spawnEvent.remove(); }
      const overlay = sceneRef.add.rectangle(400, 250, 800, 500, 0x000000, 0.8).setDepth(1000);
      const completionText = sceneRef.add.text(400, 180, '🌊 River Conquered! 🌊', { fontSize: '28px', fontFamily: 'Courier New', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001);
      const xpText = sceneRef.add.text(400, 230, `+${gameState.xp} XP`, { fontSize: '20px', fontFamily: 'Courier New', color: '#ffff00' }).setOrigin(0.5).setDepth(1001);
      const instructionText = sceneRef.add.text(400, 320, 'Click to continue', { fontSize: '16px', fontFamily: 'Courier New', color: '#ffffff' }).setOrigin(0.5).setDepth(1001);
      overlay.setInteractive();
      overlay.on('pointerdown', () => { onComplete({ xp: gameState.xp, level: 2 }); });
      sceneRef.tweens.add({ targets: instructionText, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
    }

    function restartLevel() {
      const restartText = sceneRef.add.text(400, 250, 'Try Again!', { fontSize: '24px', fontFamily: 'Courier New', color: '#ff4444', backgroundColor: '#000000' }).setOrigin(0.5);
      
      gameState.health = 100;
      gameState.mistakes = 0;
      gameState.collectedParts = [];
      gameState.xp = 0;
      gameState.isLevelComplete = false;
      
      if (gameState.spawnEvent) { gameState.spawnEvent.remove(); }
      
      gameState.platforms.forEach(platform => {
        if (platform.textObject) platform.textObject.destroy();
        platform.destroy();
      });
      gameState.platforms = [];
      
      gameState.projectiles.forEach(projectile => projectile.destroy());
      gameState.projectiles = [];
      
      sceneRef.time.delayedCall(1500, () => {
        restartText.destroy();
        startKeywordSpawning.call(sceneRef);
        updateReactUI();
      });
    }

    function updateReactUI() {
      let queryDisplay = "SELECT name FROM students ";
      queryDisplay += (gameState.collectedParts[0] || "___") + " ";
      queryDisplay += "age ";
      queryDisplay += (gameState.collectedParts[1] || "___") + " ";
      queryDisplay += "30;";
      
      setUiState({
        health: Math.max(0, gameState.health),
        xp: gameState.xp,
        collectedParts: [...gameState.collectedParts],
        isQueryComplete: gameState.collectedParts.length === gameState.expectedParts.length,
        currentQuery: queryDisplay
      });
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 600 }, debug: false } },
      scene: { preload, create, update },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    gameInstance.current = new Phaser.Game(config);

    return () => { if (gameInstance.current) { gameInstance.current.destroy(true); } };
  }, [onComplete, mobileControls]);

  const handleMobileControlStart = (direction) => setMobileControls(prev => ({ ...prev, [direction]: true }));
  const handleMobileControlEnd = (direction) => setMobileControls(prev => ({ ...prev, [direction]: false }));
  const handleJump = () => {
    setMobileControls(prev => ({ ...prev, jump: true }));
    setTimeout(() => setMobileControls(prev => ({ ...prev, jump: false })), 100);
  };
  const handleShoot = () => { if (shootFunctionRef.current) shootFunctionRef.current(); };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-cyan-400 mb-1">🌊 River of Conditions</h2>
        <p className="text-sm text-slate-400">Shoot the correct SQL keywords floating on the fish!</p>
      </div>

      <div className="w-full max-w-4xl">
        <div 
          ref={gameContainerRef} 
          className="w-full aspect-[8/5] rounded-lg overflow-hidden border-2 border-cyan-500 shadow-xl mx-auto bg-gradient-to-b from-sky-400 to-blue-600"
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      <div className="w-full max-w-3xl flex justify-between items-center pixel-font text-lg">
          <div>Health: <span className="text-rose-400">{uiState.health}/100</span></div>
      </div>

      <div className="w-full max-w-3xl p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg border border-cyan-500/50 text-center backdrop-blur-sm">
        <div className="pixel-font text-cyan-300 mb-3 text-lg">🎯 Complete the SQL Query:</div>
        <div className="font-mono text-xl bg-black/40 rounded-lg p-4 border border-slate-600">
          <span className="text-blue-300">SELECT</span> <span className="text-green-300">name</span> <span className="text-blue-300">FROM</span> <span className="text-green-300">students</span>{' '}
          {uiState.collectedParts.length >= 1 ? (
            <span className="text-green-400 font-bold bg-green-900/70 px-3 py-1 rounded-md mx-1 border border-green-500 shadow-lg animate-pulse">
              {uiState.collectedParts[0]}
            </span>
          ) : (
            <span className="text-cyan-400 font-bold bg-cyan-900/50 px-3 py-1 rounded-md animate-pulse mx-1 border border-cyan-400 border-dashed">
              ___
            </span>
          )}
          <span className="text-green-300">age</span>{' '}
          {uiState.collectedParts.length >= 2 ? (
            <span className="text-green-400 font-bold bg-green-900/70 px-3 py-1 rounded-md mx-1 border border-green-500 shadow-lg animate-pulse">
              {uiState.collectedParts[1]}
            </span>
          ) : (
            <span className="text-cyan-400 font-bold bg-cyan-900/50 px-3 py-1 rounded-md animate-pulse mx-1 border border-cyan-400 border-dashed">
              ___
            </span>
          )}
          <span className="text-yellow-300">30</span><span className="text-slate-300">;</span>
        </div>
        
        {uiState.isQueryComplete && (
          <div className="mt-4 text-green-400 text-lg bg-green-900/30 rounded-lg p-3 border border-green-500">
            ✅ Perfect! This query finds students older than 30.
            <div className="text-sm text-green-300 mt-1">The WHERE clause filters records based on conditions!</div>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg border border-slate-500 backdrop-blur-sm">
        <div className="pixel-font text-slate-300 text-lg mb-3 text-center">
          <span className="text-cyan-400">🎮</span> <strong>CONTROLS</strong> <span className="text-cyan-400">🎮</span>
        </div>
        
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 text-center">
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <div className="text-cyan-400 font-bold mb-1">Movement</div>
              <div>← → Move • ↑ SPACE Jump</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <div className="text-yellow-400 font-bold mb-1">Combat</div>
              <div>X Shoot • WASD Alternative</div>
            </div>
          </div>
        </div>

        <div className="block md:hidden">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-3">
              <button className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 active:from-slate-400 active:to-slate-500 rounded-xl w-16 h-16 text-white font-bold text-2xl flex items-center justify-center select-none transition-all duration-150 border-2 border-slate-500 shadow-lg" onTouchStart={(e) => { e.preventDefault(); handleMobileControlStart('left'); }} onTouchEnd={(e) => { e.preventDefault(); handleMobileControlEnd('left'); }} onMouseDown={() => handleMobileControlStart('left')} onMouseUp={() => handleMobileControlEnd('left')} onMouseLeave={() => handleMobileControlEnd('left')} style={{ touchAction: 'none' }}>
                ←
              </button>
              <button className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 active:from-slate-400 active:to-slate-500 rounded-xl w-16 h-16 text-white font-bold text-2xl flex items-center justify-center select-none transition-all duration-150 border-2 border-slate-500 shadow-lg" onTouchStart={(e) => { e.preventDefault(); handleMobileControlStart('right'); }} onTouchEnd={(e) => { e.preventDefault(); handleMobileControlEnd('right'); }} onMouseDown={() => handleMobileControlStart('right')} onMouseUp={() => handleMobileControlEnd('right')} onMouseLeave={() => handleMobileControlEnd('right')} style={{ touchAction: 'none' }}>
                →
              </button>
            </div>
            <div className="flex gap-3">
              <button className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-400 active:to-blue-500 rounded-xl w-20 h-16 text-white font-bold text-sm flex items-center justify-center select-none transition-all duration-150 border-2 border-blue-500 shadow-lg" onTouchStart={(e) => { e.preventDefault(); handleJump(); }} onMouseDown={handleJump} style={{ touchAction: 'none' }}>
                JUMP
              </button>
              <button className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-400 active:to-red-500 rounded-xl w-20 h-16 text-white font-bold text-sm flex items-center justify-center select-none transition-all duration-150 border-2 border-red-500 shadow-lg" onTouchStart={(e) => { e.preventDefault(); handleShoot(); }} onMouseDown={handleShoot} style={{ touchAction: 'none' }}>
                🔫 SHOOT
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pixel-font { font-family: 'Courier New', monospace; text-shadow: 2px 2px 0px rgba(0,0,0,0.8); }
        button { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default Level2;