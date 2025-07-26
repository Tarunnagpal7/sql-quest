// src/redux/gameSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Initial/default state
const initialState = {
  lives: 3,
  currentLevel: 0,
  progress: [],
  skipCount: 0,
  videoWatched: false,
};

const loadFromLocalStorage = () => {
  const saved = localStorage.getItem('sql-quest-game');
  return saved ? JSON.parse(saved) : initialState;
};

const saveToLocalStorage = (state) => {
  localStorage.setItem('sql-quest-game', JSON.stringify(state));
};

// Create the slice
const gameSlice = createSlice({
  name: 'game',
  initialState: loadFromLocalStorage(),
  reducers: {
    updateState: (state, action) => {
      return { ...state, ...action.payload };
    },
    resetGame: () => {
      return { ...initialState };
    },
  },
});

// Middleware to persist state on every update
export const gameMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState().game;
  saveToLocalStorage(state);
  return result;
};

export const { updateState, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
