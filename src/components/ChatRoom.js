import React, { useEffect, useState, useRef } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/chatroom.css';
import { useLoadingContext } from '../components/Loader';
import { IoSendSharp } from "react-icons/io5";
import { IoExit } from "react-icons/io5";

var stompClient = null;

const ChatPage = () => {
  const { isLoading, setLoading, disableAllInputs, enableAllInputs } = useLoadingContext();
  const location = useLocation();
  const user = location.state?.user;
  const [publicChats, setPublicChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({ "message": "", "connected": false });
  const [username, setUsername] = useState(user.fullName);
  const [roomCode, setRoomCode] = useState(user.roomCode);
  const navigate = useNavigate();
  const chatMessagesRef = useRef(null);
  const [label, setLabel] = useState('Room Label');
  const [userId, setUserId] = useState(user.userId);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      leaveChatroom();
    }
    if (roomCode) {
      connect();
    }

    // Set up beforeunload event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode]);

  const handleBeforeUnload = () => {
    axios
      .get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteUser?id=' + user.userId)
      .catch((err) => {
        console.error(err);
      });
    leaveChatroom();
  };

  const connect = () => {
    let Sock = new SockJS('https://vtalk-backend-9e7a122da743.herokuapp.com/ws');
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    // Getting previous chats of the room
    axios
      .get('https://vtalk-backend-9e7a122da743.herokuapp.com/chats?roomcode=' + roomCode)
      .then((res) => {
        setPublicChats(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
    stompClient.send(`/app/user/connectUser`, {}, JSON.stringify(user));
    stompClient.subscribe(`/user/vtalk/messages/${roomCode}`, onMessageReceived);
    axios
      .get('https://vtalk-backend-9e7a122da743.herokuapp.com/roomLabel' + '?roomcode=' + roomCode)
      .then((res) => {
        setLabel(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
    setRoomCode(user.roomCode);
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    setPublicChats((prevChats) => [...prevChats, payloadData]);

    // Scroll to the bottom of the chatMessagesRef on new message
    if (chatMessagesRef.current) {
      const lastMessage = chatMessagesRef.current.lastChild;
      lastMessage.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, "message": value });
  };

  const sendValue = (event) => {
    event.preventDefault();
    setUserData({ ...userData, "connected": true });
    setLoading(true);
    disableAllInputs();
    if (stompClient && userData.message) {
      var chatMessage = {
        fullName: username,
        roomCode: roomCode,
        senderId: user.userId,
        content: userData.message,
        timestamp: new Date(),
      };
      stompClient.send(`/app/chat`, {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, "message": "" });
    }
    setLoading(false);
    enableAllInputs();
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [publicChats]);

  const leaveChatroom = () => {
    setLoading(true);
    disableAllInputs();
    if (stompClient) {
      stompClient.send(`/app/user/disconnectUser`, {}, JSON.stringify(user));
      setUserData({ ...userData, "connected": false });
      axios
        .get('https://vtalk-backend-9e7a122da743.herokuapp.com/leaveRoom?roomcode=' + roomCode + '&userid=' + userId)
        .then((res) => {
          setLoading(false);
          enableAllInputs();
          navigate(`/rooms`, { state: { user: res.data } });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  const getDateStampText = (dateString) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    if (dateString === today) {
      return 'Today';
    } else if (dateString === yesterday) {
      return 'Yesterday';
    } else {
      return dateString;
    }
  };


  return (
    <div className='chat-window'>

      <div className="chat-box">
        {isLoading && <div className="loader">Leaving The Chat Room...</div>}
        <div className='chat-top'>
          <div className="room-label">{label}</div>
          <IoExit className='leave-button' onClick={leaveChatroom} />
        </div>
        <div className="chat-content" ref={chatMessagesRef}>
          {publicChats.map((chat, index, chats) => {
            // Get the date string in "YYYY-MM-DD" format
            const currentDate = new Date(chat.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

            // Check if the current message has a different date than the previous one
            const showDateStamp = index === 0 || currentDate !== new Date(chats[index - 1].timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

            return (
              <React.Fragment key={index}>
                {showDateStamp && (
                  <div className="message notification date-stamp">
                    <p>{getDateStampText(currentDate)}</p>
                  </div>
                )}

                <div className={`message ${chat.senderId === userId ? "self" : ""} ${chat.fullName ? "" : "notification"}`} key={index}>
                  {chat.fullName && chat.senderId !== userId && <div className="avatar">{chat.fullName[0].toUpperCase()}</div>}
                  <div className="message-data">
                    <div>
                      {chat.fullName ? (
                        <div className='content-message'>
                          <p className='message-fullname'>{chat.fullName}</p>
                          <p>{chat.content}</p>
                          <p className="message-time">
                            {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ) : (
                        <p className="notification">{chat.content}</p>
                      )}
                    </div>
                  </div>
                  {chat.fullName && chat.senderId === userId && <div className="avatar">{chat.fullName[0].toUpperCase()}</div>}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={sendValue} className='chat-form'>
          <div className="send-message">
            <input
              type="text"
              className="input-message"
              placeholder="Enter your message..."
              value={userData.message}
              onChange={handleMessage}
              onSubmit={sendValue}
              ref={inputRef}
            />
            <IoSendSharp className='send-button' onClick={sendValue} />
            {/* <button className='send-button' onClick={sendValue}>Send</button> */}
          </div>
        </form>
      </div>

    </div>

  );
};

export default ChatPage;
