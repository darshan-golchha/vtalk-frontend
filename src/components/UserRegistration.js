import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/registration.css';
import { useLoadingContext } from '../components/Loader';
import { IoRefreshSharp } from 'react-icons/io5';

const UserRegistration = () => {
  const [username, setUsername] = useState('');
  const { isLoading, setLoading, loaderMessage, setLoaderMessage, disableAllInputs, enableAllInputs } = useLoadingContext();

  const navigate = useNavigate();

  const handleRegister = (event) => {
    event.preventDefault();
    setLoaderMessage('Loading...');
    setLoading(true);
    disableAllInputs();
    axios
      .post('https://vtalk-backend-9e7a122da743.herokuapp.com/addUser', { fullName: username })
      .then((res) => {
        // Redirect to the room selection page
        setLoading(false);
        enableAllInputs();
        localStorage.setItem('user', JSON.stringify(res.data));
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
    .get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteAllChats')
    .catch((err) => {console.log(err)});
  }

  const deleteRooms = () => {
    axios
    .get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteAllRooms')
    .catch((err) => {console.log(err)});
  }

  const deleteUsers = () => {
    axios
    .get('https://vtalk-backend-9e7a122da743.herokuapp.com/deleteAllUsers')
    .catch((err) => {console.log(err)});
  }

  return (
    <div className="user-registration">
      {isLoading && <div className="loader"></div>}
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
