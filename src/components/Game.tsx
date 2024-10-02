import React, { useEffect, useRef, useState, useCallback } from 'react';

const MODES = {
  FALL: 'fall',
  BOUNCE: 'bounce',
  GAMEOVER: 'gameover'
};

const INITIAL_BOX_WIDTH = 200;
const INITIAL_BOX_Y = 600;
const BOX_HEIGHT = 50;
const INITIAL_Y_SPEED = 5;
const INITIAL_X_SPEED = 2;

interface Box {
  x: number;
  y: number;
  width: number;
  color: string;
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [debris, setDebris] = useState({ x: 0, y: 0, width: 0 });
  const [current, setCurrent] = useState(1);
  const [mode, setMode] = useState(MODES.BOUNCE);
  const [xSpeed, setXSpeed] = useState(INITIAL_X_SPEED);
  const [ySpeed, setYSpeed] = useState(INITIAL_Y_SPEED);
  const [scrollCounter, setScrollCounter] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [score, setScore] = useState(0);

  // Creación de un callback para evitar la recreación de funciones en cada render
  const createStepColor = useCallback((step: number): string => {
    if (step === 0) return 'white';
    const red = Math.floor(Math.random() * 255);
    const green = Math.floor(Math.random() * 255);
    const blue = Math.floor(Math.random() * 255);
    return `rgb(${red}, ${green}, ${blue})`;
  }, []);

  const initializeGameState = useCallback(() => {
    const initialBoxes = [{
      x: (320 / 2) - (INITIAL_BOX_WIDTH / 2),
      y: 200,
      width: INITIAL_BOX_WIDTH,
      color: 'white'
    }];
    setBoxes(initialBoxes);
    setDebris({ x: 0, y: 0, width: 0 });
    setCurrent(1);
    setMode(MODES.BOUNCE);
    setXSpeed(INITIAL_X_SPEED);
    setYSpeed(INITIAL_Y_SPEED);
    setScrollCounter(0);
    setCameraY(0);
    setScore(0);
    createNewBox(initialBoxes, 1);
  }, [createStepColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    initializeGameState(); // Solo inicializa una vez

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === ' ' && mode === MODES.BOUNCE) {
        setMode(MODES.FALL);
      }
    };

    document.addEventListener('keydown', handleKeydown);

    const animation = requestAnimationFrame(draw);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      cancelAnimationFrame(animation);
    };
  }, [mode, initializeGameState]); // Añadir dependencias relevantes para el ciclo de vida

  const createNewBox = (boxes: Box[], current: number) => {
    const newBoxes = [...boxes];
    newBoxes[current] = {
      x: 0,
      y: (current + 10) * BOX_HEIGHT,
      width: newBoxes[current - 1].width,
      color: createStepColor(current)
    };
    setBoxes(newBoxes);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context || mode === MODES.GAMEOVER) return;

    drawBackground(context);
    drawBoxes(context);
    drawDebris(context);

    if (mode === MODES.BOUNCE) {
      moveAndDetectCollision();
    } else if (mode === MODES.FALL) {
      updateFallMode();
    }

    setDebris((prev) => ({ ...prev, y: prev.y - ySpeed }));
    updateCamera();
    window.requestAnimationFrame(draw);
  };

  const drawBackground = (context: CanvasRenderingContext2D) => {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, 320, 500);
  };

  const drawBoxes = (context: CanvasRenderingContext2D) => {
    boxes.forEach((box) => {
      const { x, y, width, color } = box;
      const newY = INITIAL_BOX_Y - y + cameraY;
      context.fillStyle = color;
      context.fillRect(x, newY, width, BOX_HEIGHT);
    });
  };

  const drawDebris = (context: CanvasRenderingContext2D) => {
    const { x, y, width } = debris;
    const newY = INITIAL_BOX_Y - y + cameraY;
    context.fillStyle = 'red';
    context.fillRect(x, newY, width, BOX_HEIGHT);
  };

  const updateFallMode = () => {
    const newBoxes = [...boxes];
    const currentBox = newBoxes[current];
    currentBox.y -= ySpeed;
    const previousBox = newBoxes[current - 1].y + BOX_HEIGHT;
    if (currentBox.y === previousBox) {
      handleBoxLanding(newBoxes);
    }
    setBoxes(newBoxes);
  };

  const handleBoxLanding = (newBoxes: Box[]) => {
    const currentBox = newBoxes[current];
    const previousBox = newBoxes[current - 1];
    const difference = currentBox.x - previousBox.x;

    if (Math.abs(difference) >= currentBox.width) {
      gameOver();
      return;
    }

    adjustCurrentBox(difference, newBoxes);
    createNewDebris(difference, newBoxes);

    setXSpeed(xSpeed + (xSpeed > 0 ? 1 : -1));
    setCurrent(current + 1);
    setScrollCounter(BOX_HEIGHT);
    setMode(MODES.BOUNCE);
    setScore(current);
    createNewBox(newBoxes, current + 1);
  };

  const adjustCurrentBox = (difference: number, newBoxes: Box[]) => {
    const currentBox = newBoxes[current];
    const previousBox = newBoxes[current - 1];
    if (currentBox.x > previousBox.x) {
      currentBox.width -= difference;
    } else {
      currentBox.width += difference;
      currentBox.x = previousBox.x;
    }
    setBoxes(newBoxes);
  };

  const createNewDebris = (difference: number, newBoxes: Box[]) => {
    const currentBox = newBoxes[current];
    const previousBox = newBoxes[current - 1];
    const debrisX = currentBox.x > previousBox.x ? currentBox.x + currentBox.width : currentBox.x;
    setDebris({ x: debrisX, y: currentBox.y, width: difference });
  };

  const moveAndDetectCollision = () => {
    const newBoxes = [...boxes];
    const currentBox = newBoxes[current];
    currentBox.x += xSpeed;
    const hasHitRightSide = currentBox.x + currentBox.width > 320;
    const hasHitLeftSide = currentBox.x < 0;
    if (hasHitRightSide || hasHitLeftSide) {
      setXSpeed(-xSpeed);
    }
    setBoxes(newBoxes);
  };

  const updateCamera = () => {
    if (scrollCounter > 0) {
      setCameraY(cameraY + 1);
      setScrollCounter(scrollCounter - 1);
    }
  };

  const gameOver = () => {
    setMode(MODES.GAMEOVER);
  };

  return (
    <div>
      <span style={{ color: 'white', fontSize: '12px' }}>
        Puntuación: <span>{score}</span>
      </span>
      <canvas ref={canvasRef} width="320" height="500" />
    </div>
  );
}
