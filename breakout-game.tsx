import React, { useState, useEffect, useRef } from 'react';

const BreakoutGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover, levelComplete
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  
  const gameRef = useRef({
    paddle: { x: 0, y: 0, width: 100, height: 12, speed: 8 },
    balls: [],
    blocks: [],
    powerUps: [],
    keys: {},
    animationId: null,
    baseSpeed: 4
  });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const BLOCK_ROWS = 5;
  const BLOCK_COLS = 10;
  const BLOCK_WIDTH = 70;
  const BLOCK_HEIGHT = 25;
  const BLOCK_PADDING = 10;
  const BLOCK_OFFSET_TOP = 60;
  const BLOCK_OFFSET_LEFT = 35;

  const POWER_UP_TYPES = [
    { type: 'extraBall', color: '#22c55e', label: '+' },
    { type: 'expandPaddle', color: '#3b82f6', label: '⟷' },
    { type: 'slowBall', color: '#a855f7', label: 'S' }
  ];

  const initGame = () => {
    const game = gameRef.current;
    game.paddle = {
      x: CANVAS_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT - 30,
      width: 100,
      height: 12,
      speed: 8
    };
    
    game.balls = [{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: game.baseSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: -game.baseSpeed,
      radius: 8,
      stuck: true
    }];
    
    game.powerUps = [];
    createBlocks();
  };

  const createBlocks = () => {
    const game = gameRef.current;
    game.blocks = [];
    const rows = BLOCK_ROWS + Math.floor(level / 3);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const hits = Math.min(1 + Math.floor(level / 2) + Math.floor(row / 2), 3);
        const colors = ['#ef4444', '#f97316', '#eab308'];
        game.blocks.push({
          x: col * (BLOCK_WIDTH + BLOCK_PADDING) + BLOCK_OFFSET_LEFT,
          y: row * (BLOCK_HEIGHT + BLOCK_PADDING) + BLOCK_OFFSET_TOP,
          width: BLOCK_WIDTH,
          height: BLOCK_HEIGHT,
          hits: hits,
          maxHits: hits,
          color: colors[hits - 1],
          hasPowerUp: Math.random() < 0.15
        });
      }
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setLives(3);
    gameRef.current.baseSpeed = 4;
    initGame();
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    gameRef.current.baseSpeed = 4 + (newLevel - 1) * 0.5;
    initGame();
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    const handleKeyDown = (e) => {
      game.keys[e.key] = true;
      if (e.key === ' ' && gameState === 'playing') {
        game.balls.forEach(ball => {
          if (ball.stuck) ball.stuck = false;
        });
      }
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
    };

    const handleKeyUp = (e) => {
      game.keys[e.key] = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      game.paddle.x = Math.max(0, Math.min(mouseX - game.paddle.width / 2, CANVAS_WIDTH - game.paddle.width));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const collisionDetection = () => {
      game.balls.forEach(ball => {
        for (let i = game.blocks.length - 1; i >= 0; i--) {
          const block = game.blocks[i];
          if (ball.x + ball.radius > block.x &&
              ball.x - ball.radius < block.x + block.width &&
              ball.y + ball.radius > block.y &&
              ball.y - ball.radius < block.y + block.height) {
            
            ball.dy = -ball.dy;
            block.hits--;
            
            if (block.hits <= 0) {
              if (block.hasPowerUp) {
                const powerUp = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
                game.powerUps.push({
                  x: block.x + block.width / 2,
                  y: block.y,
                  width: 30,
                  height: 30,
                  dy: 2,
                  ...powerUp
                });
              }
              game.blocks.splice(i, 1);
              setScore(s => s + 10 * level);
            } else {
              const colors = ['#ef4444', '#f97316', '#eab308'];
              block.color = colors[block.hits - 1];
              setScore(s => s + 5 * level);
            }
            break;
          }
        }
      });
    };

    const updatePowerUps = () => {
      for (let i = game.powerUps.length - 1; i >= 0; i--) {
        const powerUp = game.powerUps[i];
        powerUp.y += powerUp.dy;

        if (powerUp.y > CANVAS_HEIGHT) {
          game.powerUps.splice(i, 1);
          continue;
        }

        if (powerUp.x > game.paddle.x &&
            powerUp.x < game.paddle.x + game.paddle.width &&
            powerUp.y + powerUp.height > game.paddle.y &&
            powerUp.y < game.paddle.y + game.paddle.height) {
          
          applyPowerUp(powerUp.type);
          game.powerUps.splice(i, 1);
        }
      }
    };

    const applyPowerUp = (type) => {
      if (type === 'extraBall') {
        const baseBall = game.balls[0];
        game.balls.push({
          x: baseBall.x,
          y: baseBall.y,
          dx: game.baseSpeed * (Math.random() * 2 - 1),
          dy: -game.baseSpeed,
          radius: 8,
          stuck: false
        });
      } else if (type === 'expandPaddle') {
        game.paddle.width = Math.min(game.paddle.width + 30, 180);
        setTimeout(() => {
          game.paddle.width = Math.max(game.paddle.width - 30, 100);
        }, 10000);
      } else if (type === 'slowBall') {
        game.balls.forEach(ball => {
          ball.dx *= 0.7;
          ball.dy *= 0.7;
        });
        setTimeout(() => {
          game.balls.forEach(ball => {
            ball.dx *= 1.43;
            ball.dy *= 1.43;
          });
        }, 8000);
      }
    };

    const update = () => {
      if (gameState !== 'playing') return;

      // Move paddle
      if (game.keys['ArrowLeft'] || game.keys['a']) {
        game.paddle.x = Math.max(0, game.paddle.x - game.paddle.speed);
      }
      if (game.keys['ArrowRight'] || game.keys['d']) {
        game.paddle.x = Math.min(CANVAS_WIDTH - game.paddle.width, game.paddle.x + game.paddle.speed);
      }

      // Update balls
      for (let i = game.balls.length - 1; i >= 0; i--) {
        const ball = game.balls[i];
        
        if (ball.stuck) {
          ball.x = game.paddle.x + game.paddle.width / 2;
          ball.y = game.paddle.y - ball.radius;
        } else {
          ball.x += ball.dx;
          ball.y += ball.dy;

          // Wall collision
          if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
          }
          if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
          }

          // Paddle collision
          if (ball.y + ball.radius > game.paddle.y &&
              ball.y - ball.radius < game.paddle.y + game.paddle.height &&
              ball.x > game.paddle.x &&
              ball.x < game.paddle.x + game.paddle.width) {
            
            const hitPos = (ball.x - game.paddle.x) / game.paddle.width;
            ball.dx = (hitPos - 0.5) * game.baseSpeed * 2;
            ball.dy = -Math.abs(ball.dy);
          }

          // Ball out of bounds
          if (ball.y - ball.radius > CANVAS_HEIGHT) {
            game.balls.splice(i, 1);
            if (game.balls.length === 0) {
              setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameState('gameover');
                } else {
                  initGame();
                }
                return newLives;
              });
            }
          }
        }
      }

      collisionDetection();
      updatePowerUps();

      // Check level complete
      if (game.blocks.length === 0) {
        setGameState('levelComplete');
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw blocks
      game.blocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        
        if (block.hits > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(block.hits, block.x + block.width / 2, block.y + block.height / 2 + 6);
        }
      });

      // Draw paddle
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
      ctx.shadowBlur = 0;

      // Draw balls
      game.balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw power-ups
      game.powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x - powerUp.width / 2, powerUp.y, powerUp.width, powerUp.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.label, powerUp.x, powerUp.y + 21);
      });

      // Draw UI
      ctx.fillStyle = '#fff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Puntos: ${score}`, 20, 30);
      ctx.fillText(`Nivel: ${level}`, 200, 30);
      ctx.fillText(`Vidas: ${lives}`, 380, 30);

      if (gameState === 'playing' && game.balls.some(b => b.stuck)) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Presiona ESPACIO o haz clic para lanzar', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
      }
    };

    const gameLoop = () => {
      update();
      draw();
      game.animationId = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      gameLoop();
    } else {
      draw();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
      }
    };
  }, [gameState, score, level, lives]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 text-center">Destruye Bloques</h1>
        <p className="text-slate-400 text-center">Usa el mouse o las teclas ← → para mover</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-cyan-500 rounded-lg shadow-2xl"
      />

      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-cyan-400 mb-8">Destruye Bloques</h2>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-2xl font-bold rounded-lg transition-colors"
            >
              Jugar
            </button>
            <div className="mt-8 text-slate-300 text-left max-w-md mx-auto">
              <p className="mb-2">🎮 Controles: Mouse o ← →</p>
              <p className="mb-2">🚀 Power-ups: + (bola extra), ⟷ (paleta grande), S (velocidad lenta)</p>
              <p>🎯 Rompe todos los bloques para pasar de nivel</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-cyan-400 mb-8">Pausa</h2>
            <button
              onClick={() => setGameState('playing')}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold rounded-lg transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {gameState === 'levelComplete' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-green-400 mb-4">¡Nivel Completado!</h2>
            <p className="text-2xl text-white mb-8">Nivel {level} - Puntos: {score}</p>
            <button
              onClick={nextLevel}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg transition-colors"
            >
              Siguiente Nivel
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-red-400 mb-4">Game Over</h2>
            <p className="text-2xl text-white mb-2">Nivel alcanzado: {level}</p>
            <p className="text-3xl text-cyan-400 mb-8">Puntos finales: {score}</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold rounded-lg transition-colors"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakoutGame;