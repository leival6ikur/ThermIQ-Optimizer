import { useEffect, useState, useCallback, useRef } from 'react';
import type { WebSocketMessage, TemperatureReading, HeatPumpStatus } from '../types/index.js';

const WS_URL = 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 25000;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_DELAY = 1000; // Wait 1 second before first connection
const ERROR_TIMEOUT = 12000; // Show error after 12 seconds of failed connection

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [latestTemperature, setLatestTemperature] = useState<TemperatureReading | null>(null);
  const [latestStatus, setLatestStatus] = useState<HeatPumpStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const errorTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const initialConnectionRef = useRef<boolean>(true);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      return;
    }

    // Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Max reconnection attempts reached
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionError('Max reconnection attempts reached');
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);

    // Set timeout to show error if initial connection takes too long
    if (initialConnectionRef.current) {
      errorTimeoutRef.current = setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          setConnectionError('WebSocket connection timeout');
          setIsConnecting(false);
        }
      }, ERROR_TIMEOUT);
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        isConnectingRef.current = false;
        reconnectAttempts.current = 0; // Reset on successful connection
        initialConnectionRef.current = false;

        // Clear error timeout
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          // Ignore ping/pong keepalive messages
          if (event.data === 'pong' || event.data === 'ping') {
            return;
          }

          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'temperature' && message.data) {
            setLatestTemperature(message.data);
          } else if (message.type === 'status' && message.data) {
            setLatestStatus(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Only set error immediately if not initial connection
        if (!initialConnectionRef.current) {
          setConnectionError('Connection error');
          setIsConnecting(false);
        }
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        isConnectingRef.current = false;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnection with backoff
        reconnectAttempts.current += 1;
        const delay = Math.min(RECONNECT_DELAY * reconnectAttempts.current, 10000);

        if (reconnectAttempts.current <= MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionError('Failed to connect');
      isConnectingRef.current = false;
      reconnectAttempts.current += 1;

      // Retry connection
      if (reconnectAttempts.current <= MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    }
  }, []);

  useEffect(() => {
    // Wait a bit before initial connection to ensure backend is ready
    const initialTimeout = setTimeout(() => {
      connect();
    }, INITIAL_DELAY);

    return () => {
      clearTimeout(initialTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      isConnectingRef.current = false;
    };
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    latestTemperature,
    latestStatus,
    connectionError,
  };
};
