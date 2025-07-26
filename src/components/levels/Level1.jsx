import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { levels } from '../../assets/data/levels';
import { CgGhostCharacter } from "react-icons/cg";
import { AiFillBug } from "react-icons/ai";

const Level1 = ({ onComplete }) => {
  const gameContainerRef = useRef(null);
  const gameInstance = useRef(null);
  
  const [uiState, setUiState] = useState({
    health: 100,
    isQueryComplete: false,
  });

  // Mobile controls state
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false
  });

  // Function to convert React icon to image data
  const iconToImageData = (IconComponent, color = '#ffffff', size = 32) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    // Create a temporary div to render the icon
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = `<div style="color: ${color}; font-size: ${size}px; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;"></div>`;
    
    // Render icon as SVG and convert to canvas
    const iconElement = React.createElement(IconComponent, { 
      size: size, 
      color: color 
    });
    
    // For simplicity, we'll create the textures programmatically
    // This is a workaround since direct React icon rendering in Phaser is complex
    return canvas;
  };

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
      word: "FROM" 
    };

    const allKeywords = ["SELECT", "WHERE", "UPDATE", "DELETE", "ORDER BY", "GROUP BY"];
    
    let sceneRef;
    let keywordPositions = [];

    function preload() {
      sceneRef = this;
      
      // --- MODIFIED: Create Ghost Character for Player ---
      const playerGraphics = this.add.graphics();
      // Ghost body (main circle)
      playerGraphics.fillStyle(0x87ceeb, 1); // Sky blue color
      playerGraphics.fillCircle(16, 20, 12);
      // Ghost bottom wavy part
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
      // Ghost eyes
      playerGraphics.fillStyle(0x000000, 1);
      playerGraphics.fillCircle(12, 18, 2);
      playerGraphics.fillCircle(20, 18, 2);
      // Ghost mouth
      playerGraphics.fillEllipse(16, 24, 4, 2);
      playerGraphics.generateTexture('player', 32, 40);
      playerGraphics.destroy();
      
      // --- MODIFIED: Create Bug Enemies with Different Colors ---
      const enemyColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff]; // Red, Green, Blue, Yellow, Magenta
      
      enemyColors.forEach((color, index) => {
        const enemyGraphics = this.add.graphics();
        // Bug body
        enemyGraphics.fillStyle(color, 1);
        enemyGraphics.fillEllipse(16, 20, 16, 10);
        // Bug head
        enemyGraphics.fillCircle(16, 12, 6);
        // Bug legs
        enemyGraphics.lineStyle(2, color);
        enemyGraphics.beginPath();
        // Left legs
        enemyGraphics.moveTo(8, 18);
        enemyGraphics.lineTo(4, 22);
        enemyGraphics.moveTo(8, 22);
        enemyGraphics.lineTo(4, 26);
        // Right legs
        enemyGraphics.moveTo(24, 18);
        enemyGraphics.lineTo(28, 22);
        enemyGraphics.moveTo(24, 22);
        enemyGraphics.lineTo(28, 26);
        enemyGraphics.strokePath();
        // Bug antennae
        enemyGraphics.beginPath();
        enemyGraphics.moveTo(14, 8);
        enemyGraphics.lineTo(12, 4);
        enemyGraphics.moveTo(18, 8);
        enemyGraphics.lineTo(20, 4);
        enemyGraphics.strokePath();
        // Bug eyes
        enemyGraphics.fillStyle(0x000000, 1);
        enemyGraphics.fillCircle(13, 12, 1.5);
        enemyGraphics.fillCircle(19, 12, 1.5);
        
        enemyGraphics.generateTexture(`enemy${index}`, 32, 32);
        enemyGraphics.destroy();
      });
      
      this.add.graphics().fillStyle(0x444444).fillRect(0, 0, 40, 40).generateTexture('wall', 40, 40);
      this.add.graphics().fillStyle(0x0a192f).fillRect(0, 0, 800, 500).generateTexture('background', 800, 500);
    }

    function create() {
      this.add.image(400, 250, 'background');
      
      walls = this.physics.add.staticGroup();
      enemies = this.physics.add.group();
      correctCollectible = this.physics.add.group();
      wrongCollectibles = this.physics.add.group();
      
      player = this.physics.add.sprite(400, 250, 'player');
      player.setCollideWorldBounds(true).body.setSize(20, 25).setOffset(6, 10);
      
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      this.physics.add.collider(player, walls);
      this.physics.add.collider(enemies, walls);
      this.physics.add.collider(enemies, enemies);
      
      this.physics.add.overlap(player, correctCollectible, collectCorrectItem, null, this);
      this.physics.add.overlap(player, wrongCollectibles, collectWrongItem, null, this);
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
      
      sceneRef.children.list.forEach(child => {
          if (child.isKeyword) child.destroy();
      });

      // Symmetric wall layout
      const wallPositions = [
        // Outer border walls
        [80, 80], [160, 80], [240, 80], [320, 80], [480, 80], [560, 80], [640, 80], [720, 80],
        [80, 420], [160, 420], [240, 420], [320, 420], [480, 420], [560, 420], [640, 420], [720, 420],
        [80, 160], [80, 240], [80, 260], [80, 340],
        [720, 160], [720, 240], [720, 260], [720, 340],
        
        // Symmetric inner walls
        [200, 160], [600, 160], // Top inner walls
        [200, 340], [600, 340], // Bottom inner walls
        [320, 200], [480, 200], // Middle upper
        [320, 300], [480, 300], // Middle lower
        [160, 250], [640, 250], // Side walls
        [400, 160], [400, 340]  // Center pillars
      ];
      wallPositions.forEach(pos => walls.create(pos[0], pos[1], 'wall'));
      
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
        } while (attempts < 50 && (
            Phaser.Math.Distance.Between(x, y, player.x, player.y) < 120 ||
            checkWallCollision(x, y) ||
            checkEnemyCollision(x, y)
        ));
        
        // Use different enemy textures with different colors
        const enemyTextureIndex = enemyIndex % 5; // Cycle through 5 different colored bugs
        const enemy = enemies.create(x, y, `enemy${enemyTextureIndex}`);
        enemy.setCollideWorldBounds(true).body.setSize(24, 20).setOffset(4, 8);
        enemy.health = 75;
        enemy.speed = 50 + (enemyIndex * 10); // Different speeds for variety
        enemy.enemyType = enemyTextureIndex; // Store enemy type for visual effects
        
        // Add floating animation
        sceneRef.tweens.add({
            targets: enemy,
            y: enemy.y - 5,
            duration: 1000 + (enemyIndex * 200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    function createKeyword(isCorrect) {
        let x, y;
        
        const predefinedPositions = [
            [250, 180], [550, 180], [180, 320], [620, 320], [150, 250], [650, 250]
        ];
        
        const availablePositions = predefinedPositions.filter(pos => {
            const [posX, posY] = pos;
            
            if (Phaser.Math.Distance.Between(posX, posY, player.x, player.y) < 180) {
                return false;
            }
            
            if (checkWallCollision(posX, posY)) {
                return false;
            }
            
            for (let keywordPos of keywordPositions) {
                if (Phaser.Math.Distance.Between(posX, posY, keywordPos.x, keywordPos.y) < 200) {
                    return false;
                }
            }
            
            for (let enemy of enemies.children.entries) {
                if (Phaser.Math.Distance.Between(posX, posY, enemy.x, enemy.y) < 120) {
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
            } while (attempts < 300 && (
                Phaser.Math.Distance.Between(x, y, player.x, player.y) < 180 ||
                checkWallCollision(x, y) ||
                checkKeywordCollision(x, y) ||
                checkEnemyCollision(x, y)
            ));
        } else {
            const selectedPosition = availablePositions[0];
            x = selectedPosition[0];
            y = selectedPosition[1];
        }

        const keywordText = isCorrect ? query.word : allKeywords[Phaser.Math.Between(0, allKeywords.length - 1)];
        
        const graphics = sceneRef.add.graphics();
        graphics.fillStyle(0x8a2be2, 0.8);
        graphics.lineStyle(2, 0x9932cc);
        graphics.fillCircle(0, 0, 35);
        graphics.strokeCircle(0, 0, 35);
        graphics.x = x;
        graphics.y = y;
        graphics.isKeyword = true;

        const text = sceneRef.add.text(x, y, keywordText, { 
            fontSize: '12px', 
            fontFamily: 'Courier New', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        text.isKeyword = true;

        const collectible = sceneRef.physics.add.sprite(x, y, null).setVisible(false);
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
            repeat: -1 
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
            if (Phaser.Math.Distance.Between(x, y, correct.x, correct.y) < minDistance) {
                return true;
            }
        }
        
        for (let wrong of wrongCollectibles.children.entries) {
            if (Phaser.Math.Distance.Between(x, y, wrong.x, wrong.y) < minDistance) {
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
        return walls.children.entries.some(wall => 
            Phaser.Math.Distance.Between(x, y, wall.x, wall.y) < 80
        );
    }

    function update() {
        if (gameState.isLevelComplete) return;
        
        player.setVelocity(0);
        const speed = 200;
        
        if (cursors.left.isDown || mobileControls.left) {
            player.setVelocityX(-speed);
        } else if (cursors.right.isDown || mobileControls.right) {
            player.setVelocityX(speed);
        }
        
        if (cursors.up.isDown || mobileControls.up) {
            player.setVelocityY(-speed);
        } else if (cursors.down.isDown || mobileControls.down) {
            player.setVelocityY(speed);
        }

        if ((Phaser.Input.Keyboard.JustDown(spaceKey) || mobileControls.attack) && gameState.canAttack) {
            attack.call(this);
        }

        enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            this.physics.moveTo(enemy, player.x, player.y, enemy.speed);
        });
    }

    function attack() {
        gameState.canAttack = false;
        
        const attackRange = 80;
        const attackEffect = sceneRef.add.circle(player.x, player.y, attackRange, 0x87ceeb, 0.4); // Match ghost color
        
        sceneRef.tweens.add({
            targets: attackEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => attackEffect.destroy()
        });
        
        enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
            if (distance <= attackRange) {
                enemy.health -= 50;
                
                const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
                enemy.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
                
                enemy.setTint(0xffffff);
                sceneRef.time.delayedCall(100, () => {
                    if (enemy.active) enemy.clearTint();
                });
                
                if (enemy.health <= 0) {
                    // Different explosion colors based on enemy type
                    const explosionColors = [0xff6b6b, 0x6bff6b, 0x6b6bff, 0xffff6b, 0xff6bff];
                    const explosionColor = explosionColors[enemy.enemyType] || 0xffff00;
                    
                    const explosion = sceneRef.add.circle(enemy.x, enemy.y, 20, explosionColor);
                    sceneRef.tweens.add({
                        targets: explosion,
                        scaleX: 3,
                        scaleY: 3,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => explosion.destroy()
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
        
        const completionText = sceneRef.add.text(400, 200, '🎉 Level Complete! 🎉', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001);
        
        const instructionText = sceneRef.add.text(400, 320, 'Click to return to map', {
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
        const restartText = sceneRef.add.text(400, 250, 'Too many mistakes... Try Again!', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ff4444',
            backgroundColor: '#000000'
        }).setOrigin(0.5);
        
        sceneRef.cameras.main.flash(500, 255, 0, 0);
        gameState.health = 100;
        
        sceneRef.time.delayedCall(1500, () => {
            restartText.destroy();
            createLevel.call(sceneRef);
            updateReactUI();
        });
    }

    function hitByEnemy(player, enemy) {
        if (enemy.lastAttack && sceneRef.time.now - enemy.lastAttack < 1000) return;
        
        enemy.lastAttack = sceneRef.time.now;
        gameState.health -= 15;
        
        player.setTint(0xff0000);
        sceneRef.time.delayedCall(200, () => player.clearTint());
        
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
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

  // Mobile control handlers (unchanged)
  const handleMobileControlStart = (direction) => {
    setMobileControls(prev => {
      if (prev[direction]) return prev;
      return { ...prev, [direction]: true };
    });
  };

  const handleMobileControlEnd = (direction) => {
    setMobileControls(prev => {
      if (!prev[direction]) return prev;
      return { ...prev, [direction]: false };
    });
  };

  const handleAttack = () => {
    setMobileControls(prev => ({ ...prev, attack: true }));
    setTimeout(() => {
      setMobileControls(prev => ({ ...prev, attack: false }));
    }, 50);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Display the icons as reference in the UI */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <CgGhostCharacter size={20} color="#87ceeb" />
          <span>Your Character</span>
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
          style={{ maxWidth: '800px' }}
        />
      </div>
      
      <div className="w-full max-w-3xl flex justify-between items-center pixel-font text-lg">
          <div>Health: <span className="text-rose-400">{uiState.health}/100</span></div>
      </div>

      <div className="w-full max-w-3xl p-4 bg-black/50 rounded-lg border border-slate-700 text-center">
          <div className="pixel-font text-slate-300 mb-2">Complete the SQL Query:</div>
          <div className="font-mono text-xl">
              <span>SELECT * </span>
              {uiState.isQueryComplete ? (
                  <span className="text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">
                      FROM
                  </span>
              ) : (
                  <span className="text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded animate-pulse">
                      __?__
                  </span>
              )}
              <span> map </span>
          </div>
      </div>

      <div className="w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600">
          <div className="pixel-font text-slate-400 text-sm mb-2 text-center"><strong>CONTROLS:</strong></div>
          
          {/* Desktop Controls */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
                <div>↑↓←→ Move</div>
                <div>SPACE Attack</div>
            </div>
          </div>

          {/* Mobile/Tablet Controls */}
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
                      handleMobileControlStart('up'); 
                    }}
                    onTouchEnd={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlEnd('up'); 
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMobileControlStart('up');
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      handleMobileControlEnd('up');
                    }}
                    onMouseLeave={() => handleMobileControlEnd('up')}
                    style={{ touchAction: 'none' }}
                  >
                    ↑
                  </button>
                  <div></div>
                  
                  <button
                    className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                    onTouchStart={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlStart('left'); 
                    }}
                    onTouchEnd={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlEnd('left'); 
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMobileControlStart('left');
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      handleMobileControlEnd('left');
                    }}
                    onMouseLeave={() => handleMobileControlEnd('left')}
                    style={{ touchAction: 'none' }}
                  >
                    ←
                  </button>
                  <div className="bg-slate-700 rounded"></div>
                  <button
                    className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                    onTouchStart={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlStart('right'); 
                    }}
                    onTouchEnd={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlEnd('right'); 
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMobileControlStart('right');
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      handleMobileControlEnd('right');
                    }}
                    onMouseLeave={() => handleMobileControlEnd('right')}
                    style={{ touchAction: 'none' }}
                  >
                    →
                  </button>
                  
                  <div></div>
                  <button
                    className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                    onTouchStart={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlStart('down'); 
                    }}
                    onTouchEnd={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleMobileControlEnd('down'); 
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMobileControlStart('down');
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      handleMobileControlEnd('down');
                    }}
                    onMouseLeave={() => handleMobileControlEnd('down')}
                    style={{ touchAction: 'none' }}
                  >
                    ↓
                  </button>
                  <div></div>
                </div>
              </div>

              <button
                className="bg-red-600 hover:bg-red-500 active:bg-red-400 rounded-full w-24 h-24 text-white font-bold text-lg flex items-center justify-center select-none transition-colors"
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  handleAttack(); 
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAttack();
                }}
                style={{ touchAction: 'none' }}
              >
                ATTACK
              </button>
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

export default Level1;
