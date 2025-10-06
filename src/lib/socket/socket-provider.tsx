"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@/contexts/UserContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
}

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastMessage: null,
});

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user, accessToken, isLoading } = useUser();
  const isAuthenticated = !!user && !isLoading && accessToken;

  useEffect(() => {
    if (isAuthenticated && user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        auth: {
          token: accessToken,
          userId: user.id,
        },
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log("Socket disconnected");
      });

      socketInstance.on("message", (data) => {
        setLastMessage(data);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const value: SocketContextType = {
    socket,
    isConnected,
    lastMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};