import { useEffect, useState } from 'react';
import './App.css'
import { Route, Routes } from 'react-router-dom';
import TestApi from './components/TestApi';
import TestMongo from './components/TestMongo';
import RequireAuth from './middleware/RequireAuth';
import Profile from './components/Profile';
import Login from './components/Login';
import Logout from './components/Logout';
import { Items } from './components/Items';
import { ItemDetail } from './components/ItemDetail';

function App() {

  return(
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/logout' element={
        <RequireAuth>
          <Logout/>
        </RequireAuth>
      }/>
      //TODO: Add your route here
    </Routes>
  );
}

export default App
