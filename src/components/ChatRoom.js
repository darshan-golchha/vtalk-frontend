import React, { useEffect, useState, useRef } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/chatroom.css';
import { useLoadingContext } from '../components/Loader';
import { IoSendSharp, IoExit, IoAttach, IoImage, IoMusicalNote, IoVideocam, IoClose, IoMic, IoMicOff } from "react-icons/io5";

var stompClient = null;

const ChatPage = () => {
  const { isLoading, setLoading, loaderMessage, setLoaderMessage, disableAllInputs, enableAllInputs } = useLoadingContext();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || JSON.parse(localStorage.getItem('user')));
  const [publicChats, setPublicChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({ "message": "", "connected": false });
  const [username, setUsername] = useState(user?.fullName);
  const [roomCode, setRoomCode] = useState(user?.roomCode || localStorage.getItem('roomCode'));
  const navigate = useNavigate();
  const chatMessagesRef = useRef(null);
  const [label, setLabel] = useState('Room Label');
  const [userId, setUserId] = useState(user?.userId);
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);



  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          setAudioChunks(prevChunks => [...prevChunks, event.data]);
        }
      };

      recorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        setFile(new File([audioBlob], 'recorded_audio.mp3', { type: 'audio/mpeg' }));
        setAudioChunks([]);
      };
    }
  };



  useEffect(() => {
    if (!user) {
      navigate(`/`);
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (roomCode) {
      localStorage.setItem('roomCode', roomCode);
      connect();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode]);

  useEffect(() => {
    const storedRoomCode = localStorage.getItem('roomCode');
    if (storedRoomCode) {
      setRoomCode(storedRoomCode);
    }
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileDeselect = () => {
    setFile(null);
  };

  const handleBeforeUnload = (event) => {
    event.preventDefault();
    axios.get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteUser?id=' + user.userId)
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

    if (chatMessagesRef.current) {
      const lastMessage = chatMessagesRef.current.lastChild;
      lastMessage.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      const resizeTextarea = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.6)}px`;
      };

      // Initially resize to fit content
      resizeTextarea();

      // Add event listener for input event
      textarea.addEventListener('input', resizeTextarea);

      // Clean up the event listener
      return () => {
        textarea.removeEventListener('input', resizeTextarea);
      };
    }
  }, []);

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, "message": value });
  };

  const sendValue = async (event) => {
    event.preventDefault();
    setUserData({ ...userData, "connected": true });
    disableAllInputs();

    let fileUrl = null;
    if (file) {
      try {
        // Step 1: Get presigned URL from backend
        const presignedUrlResponse = await axios.get('https://vtalk-backend-9e7a122da743.herokuapp.com/generatePresignedUrl', {
          params: { key: file.name || 'recorded_audio.mp3', room: roomCode }
        });
        const presignedUrl = presignedUrlResponse.data;

        // Step 2: Upload file to S3 using presigned URL with progress tracking
        await axios.put(presignedUrl, file, {
          headers: {
            'Content-Type': file.type
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        // Step 3: Get the file URL
        fileUrl = presignedUrl.split('?')[0];
      } catch (error) {
        console.error('File upload error:', error);
      }
    }

    if (stompClient && (userData.message || fileUrl)) {
      var chatMessage = {
        fullName: username,
        roomCode: roomCode,
        senderId: user.userId,
        content: userData.message,
        media: fileUrl,
        timestamp: new Date(),
      };
      stompClient.send(`/app/chat`, {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, "message": "" });
      setFile(null);
      setUploadProgress(0);
    }
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height after sending
    }
    enableAllInputs();
  };



  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [publicChats]);

  const leaveChatroom = () => {
    setLoading(true);
    setLoaderMessage('Leaving Chat Room...');
    disableAllInputs();
    if (stompClient) {
      stompClient.send(`/app/user/disconnectUser`, {}, JSON.stringify(user));
      setUserData({ ...userData, "connected": false });
      axios
        .get('https://vtalk-backend-9e7a122da743.herokuapp.com/leaveRoom?roomcode=' + roomCode + '&userid=' + userId)
        .then((res) => {
          setLoading(false);
          enableAllInputs();
          if (user) {
            navigate(`/rooms`, { state: { user: res.data } });
          } else {
            navigate(`/`);
          }
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          enableAllInputs();
          navigate(`/`);
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
        {isLoading && <div className="loader"></div>}
        <div className='chat-top'>
          <div className="room-label">{label}</div>
          <IoExit className='leave-button' onClick={leaveChatroom} />
        </div>
        <div className="chat-content" ref={chatMessagesRef}>
          {publicChats.map((chat, index, chats) => {
            const currentDate = new Date(chat.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
                        <div className="content-message">
                          <p className="message-fullname">{chat.fullName}</p>
                          {chat.media ? (
                            <div className="media-content">
                              {chat.media.toUpperCase().endsWith('.JPG') ||
                                chat.media.toUpperCase().endsWith('.JPEG') ||
                                chat.media.toUpperCase().endsWith('.PNG') ? (
                                <img
                                  src={chat.media}
                                  alt="uploaded media"
                                  className="uploaded-media"
                                  style={{ filter: 'blur(10px)' }}
                                  onLoad={(e) => { e.target.style.filter = 'none'; }}
                                />
                              ) : chat.media.toUpperCase().endsWith('.MP3') ||
                                chat.media.toUpperCase().endsWith('.WAV') ? (
                                <audio controls>
                                  <source
                                    src={chat.media}
                                    type={`audio/${chat.media.split('.').pop()}`}
                                  />
                                  Your browser does not support the audio element.
                                </audio>
                              ) : chat.media.toUpperCase().endsWith('.MP4') ||
                                chat.media.toUpperCase().endsWith('.WEBM') ? (
                                <video controls style={{ filter: 'blur(10px)' }}
                                  onLoadedData={(e) => { e.target.style.filter = 'none'; }}>
                                  <source
                                    src={chat.media}
                                    type={`video/${chat.media.split('.').pop()}`}
                                  />
                                  Your browser does not support the video element.
                                </video>
                              ) : (
                                <a href={chat.media} target="_blank" rel="noreferrer">
                                  {chat.media.split('/').pop()}
                                </a>
                              )}
                            </div>
                          ) : (
                            <></>
                          )}
                          <p>{chat.content}</p>
                          <p className="message-time">
                            {new Date(chat.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
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
          <div className='file-uploads'>
            {file && (
              <div className='file-icon'>
                {file.type.startsWith('image/') && <IoImage />}
                {file.type.startsWith('audio/') && <IoMusicalNote />}
                {file.type.startsWith('video/') && <IoVideocam />}
                <span>{file.name}</span>
                <div className='file-deselect' onClick={handleFileDeselect}><IoClose /></div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className='upload-progress'>
                    <div className='progress-bar' style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="send-message">
            <input
              type="file"
              id="file-upload"
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload">
              <IoAttach className='file-upload-button' />
            </label>
            <textarea
              className="input-message"
              placeholder="Enter your message..."
              value={userData.message}
              onChange={handleMessage}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  sendValue(e);
                }
              }}
              ref={inputRef}
            />
            {!userData.message && !file && (
              <div onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}>
                {isRecording ? <IoMicOff className='record-button' /> : <IoMic className='record-button' />}
              </div>
            )}
            {userData.message || file ? (
              <button type="submit" className='send-button'>
                <IoSendSharp />
              </button>
            ) : (
              <></>
            )}
          </div>
        </form>


      </div>
    </div>
  );
};

export default ChatPage;
