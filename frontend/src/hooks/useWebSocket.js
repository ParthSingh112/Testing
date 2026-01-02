import { useState, useEffect, useCallback } from 'react';

const useWebSocket = (testExecutionId) => {
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!testExecutionId) return;

    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const socket = new WebSocket(`${wsUrl}/api/ws/test-execution/${testExecutionId}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'log') {
        setLogs((prev) => [...prev, message.content]);
      } else if (message.type === 'update') {
        console.log('Execution updated:', message.data);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [testExecutionId]);

  const sendLog = useCallback(
    (content) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'log', content }));
      }
    },
    [ws]
  );

  return { logs, sendLog };
};

export default useWebSocket;