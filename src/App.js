import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  width: 400px;
  margin: 50px auto;
`;

const GridCell = styled.div`
  aspect-ratio: 1;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${props => props.isActive ? '#f0f0f0' : 'white'};
`;

const Circle = styled.div`
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background-color: #ff4444;
`;

const StatusText = styled.p`
  text-align: center;
  color: ${props => props.connected ? '#4CAF50' : '#f44336'};
`;

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [connected, setConnected] = useState(false);
  const SERVER_URL = 'https://websocket-server-6g7i.onrender.com';

  useEffect(() => {
    const connectToStream = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/listening`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        setConnected(true);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            try {
              if (part.includes('Content-Type:')) continue;
              if (part.startsWith('--boundary-')) continue;
              
              const trimmedPart = part.trim();
              if (!trimmedPart) continue;

              const data = JSON.parse(trimmedPart);
              if (data.type === 'position') {
                setPosition(data.position);
              }
            } catch (e) {
              // Ignora partes que não são JSON válido
            }
          }
        }
      } catch (error) {
        console.error('Erro na conexão:', error);
        setConnected(false);
        setTimeout(connectToStream, 3000);
      }
    };

    connectToStream();

    return () => {
      setConnected(false);
    };
  }, []);

  const handleCellClick = async (x, y) => {
    try {
      const response = await fetch(`${SERVER_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position: { x, y }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar posição:', error);
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const isCurrentPosition = position.x === x && position.y === y;
        grid.push(
          <GridCell
            key={`${x}-${y}`}
            onClick={() => handleCellClick(x, y)}
            isActive={isCurrentPosition}
          >
            {isCurrentPosition && <Circle />}
          </GridCell>
        );
      }
    }
    return grid;
  };

  return (
    <div>
      <h1>Grid Interativo</h1>
      <StatusText connected={connected}>
        Status: {connected ? 'Conectado' : 'Desconectado'}
      </StatusText>
      <GridContainer>
        {renderGrid()}
      </GridContainer>
    </div>
  );
}

export default App;
