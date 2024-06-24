import React, { createContext, useContext, useState } from 'react';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);

  const connect = () => {
    const connect =()=>{
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        stompClient.subscribe('/topic/public', onRoomsRecieved);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage);
        userJoin();
    }

    const userJoin=()=>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN"
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }
  };

  const disconnect = () => {
    // Implement your WebSocket disconnection logic here
  };

  return (
    <WebSocketContext.Provider value={{ stompClient, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
