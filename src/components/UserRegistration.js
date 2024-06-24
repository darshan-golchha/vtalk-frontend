import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/registration.css';
import { useLoadingContext } from '../components/Loader';
import { IoRefreshSharp } from 'react-icons/io5';

const UserRegistration = () => {
  const [username, setUsername] = useState('');
  const { isLoading, setLoading, disableAllInputs, enableAllInputs } = useLoadingContext();

  const navigate = useNavigate();

  const handleRegister = (event) => {
    event.preventDefault();
    setLoading(true);
    disableAllInputs();
    axios
      .post('http://localhost:8080/addUser', { fullName: username })
      .then((res) => {
        // Redirect to the room selection page
        setLoading(false);
        enableAllInputs();
        navigate('/rooms', { state: { user: res.data } });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const deleteChats = () => {
    axios
    .get('http://localhost:8080/deleteAllChats')
    .catch((err) => {console.log(err)});
  }

  const deleteRooms = () => {
    axios
    .get('http://localhost:8080/deleteAllRooms')
    .catch((err) => {console.log(err)});
  }

  const deleteUsers = () => {
    axios
    .get('http://localhost:8080/deleteAllUsers')
    .catch((err) => {console.log(err)});
  }

  return (
    <div className="user-registration">
      <div className='clears'>
        <button onClick={deleteChats}>Chats</button>
        <button onClick={deleteRooms}>Rooms</button>
        <button onClick={deleteUsers}>Users</button>
      </div>
      {isLoading && <div className="loader">Loading...</div>}
      <form className='signup' onSubmit={handleRegister}>
        <h2>Welcome to Conversia !</h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={handleUsernameChange}
          disabled={isLoading}
        />
        <img src="https://img.icons8.com/exit" onClick={handleRegister} />
        {/* <button onClick={handleRegister}>Register</button> */}
      </form>
    </div>
  );
};

export default UserRegistration;
