import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = window.location.origin;
    const socketInstance = io(socketUrl, { autoConnect: true });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[WebSocket Client] Connected to server.');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[WebSocket Client] Disconnected from server.');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
