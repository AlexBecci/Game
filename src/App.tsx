import { useEffect, useState } from 'react';

function App() {
  const [score, setScore] = useState<number | null>(null);

  // Obtener el score guardado de localStorage al cargar la app
  useEffect(() => {
    /* const savedScore = localStorage.getItem('gameScore');
    if (savedScore) {
      setScore(Number(savedScore));
    }
 */
    // Restablecer el puntaje a 0 al cargar la página
    localStorage.setItem('gameScore', '0');
    setScore(0); // Asegurarte de que el estado se actualice a 0 también.
    // Escuchar mensajes del iframe
    const handleScoreUpdate = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_SCORE') {
        setScore(event.data.score);

        // Guardar el score en localStorage
        localStorage.setItem('gameScore', event.data.score);
      }
    };

    window.addEventListener('message', handleScoreUpdate);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('message', handleScoreUpdate);
    };
  }, []);

  return (
    <div className='flex flex-col justify-center items-center min-h-[100dvh]'>
      {/* Mostrar el puntaje */}
      <h1>Puntuación: {score !== null ? score : 'No hay puntaje guardado'}</h1>
      <div className='w-full flex justify-center items-center flex-1'>
        <iframe
          src="/src/game.html"
          width="1200px"
          height="760px"
          title="Game"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}

export default App;
