import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLoadingContext } from '../components/Loader';
import '../css/roomselection.css';
import { IoSearchSharp } from 'react-icons/io5';
import { IoRefreshSharp } from 'react-icons/io5';
import { IoAddSharp } from 'react-icons/io5';


const RoomSelection = (props) => {
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomDescription, setRoomDescription] = useState('');
  const navigate = useNavigate();
  const { isLoading, setLoading, loaderMessage, setLoaderMessage, disableAllInputs, enableAllInputs } = useLoadingContext();
  const [isCreating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
    handleRoomRecieved();

    // Set up beforeunload event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // If user refreshes the page, delete the user from the server and navigate to the login page

  const handleBeforeUnload = () => {
    axios
      .get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteUser' + '?id=' + user.userId)
      .catch((err) => {
        console.error(err);
      });
      navigate('/');
  };

  const handleRoomRecieved = () => {
    if (!search) {
      axios
        .get('https://vtalk-backend-9e7a122da743.herokuapp.com/rooms')
        .then((res) => {
          setRooms(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      handleSearchRoom();
    }
  };

  const handleCreateRoom = (event) => {
    event.preventDefault();
    if (roomDescription && category) {
      setCreating(true);
      setTimeout(() => setCreating(false), 2000);
      setLoaderMessage('Creating Room...');
      setLoading(true);
      disableAllInputs();
      axios
        .get('https://vtalk-backend-9e7a122da743.herokuapp.com/createRoom?label=' + roomDescription + '&category=' + category)
        .then((res) => {
          handleRoomSelected(res.data.roomCode);
        })
        .catch((err) => {
          console.error(err);
        });
      setLoading(false);
      enableAllInputs();
    }
  };

  const handleSearchRoom = (event) => {
    event.preventDefault();
    if (search) {
      setCreating(true);
      setTimeout(() => setCreating(false), 2000);
      setLoaderMessage('Searching Room...');
      setLoading(true);
      disableAllInputs();
      axios
        .get('https://vtalk-backend-9e7a122da743.herokuapp.com/searchRooms?label=' + search)
        .then((res) => {
          setRooms(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
      setLoading(false);
      enableAllInputs();
    }
  };

  const handleRoomSelected = (roomCode) => {
    setLoaderMessage('Entering Room...');
    setLoading(true);
    disableAllInputs();
    axios
      .get('https://vtalk-backend-9e7a122da743.herokuapp.com/joinRoom?roomcode=' + roomCode + '&userid=' + user.userId)
      .then((res) => {
        setLoading(false);
        enableAllInputs();
        navigate(`/chat/${roomCode}/${user.fullName}`, { state: { user: res.data } });
      })
      .catch((err) => {
        alert('Room no longer exists');
        setLoading(false);
        enableAllInputs();
      });
  };
  const categories = ['Education', 'Equality/Human Rights', 'Community/Social Issues',
    'Romantic Relationships', 'Family/Friends', 'Recreation/Hobbies', 'Work', 'Identity/Appearance',
    'Food', 'Environmental Issues', 'Technology', 'History', 'Politics/Government', 'Sports', 'Health',
    'Transportation', 'Arts/Entertainment/Media', 'Values', 'Religion/Spirituality', 'Science', 'Other'];

  return (
    <div className="room-selection">
      {isLoading && <div className="loader"></div>}
      <h1 style={{ textAlign: 'center' }}>Welcome, {user && user.fullName}!</h1>
      <div className="create-search-box">
        <div className="search-section">
          <h3>Search for Existing Rooms</h3>
          <form onSubmit={handleSearchRoom} className="select-room-input">
            <input
              type="text"
              placeholder="Enter Room Label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <IoSearchSharp className="search-button" onClick={handleSearchRoom} />
          </form>
        </div>

        <div className="create-section">
          <h3>Create a Chat Room</h3>
          <form onSubmit={handleCreateRoom} className="create-room-input">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '50px',
            }}>
              <select
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ccc',
                  borderRadius: '50px',
                  borderTopRightRadius: '0',
                  borderBottomRightRadius: '0',
                  backgroundColor: '#f9f9f9',
                  color: '#333',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none', // For hiding the default dropdown arrow in some browsers
                  width: '130px'
                }}
              >
                <option value="">Category..</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <input
            className='room-description-input'
              type="text"
              placeholder="Label..."
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
            />
            <IoAddSharp className="create-button" onClick={handleCreateRoom} />
          </form>
        </div>
      </div>

      <div className="room-list">
        <div className="room-head">
          <h3>Available Rooms</h3>
          <IoRefreshSharp className="refresh-button" onClick={handleRoomRecieved} />
        </div>
        <div className="room-cards">
          {rooms.map((room) => (
            <div key={room.roomCode} onClick={() => handleRoomSelected(room.roomCode)}>
              <div className="room-card">
                <h4>{room.label}</h4>
                <h6>{room.category}</h6>
                <p className="status">Online: {room.users.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

};

export default RoomSelection;
