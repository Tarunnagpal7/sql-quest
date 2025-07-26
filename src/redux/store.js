// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import gameReducer, { gameMiddleware } from './gameSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(gameMiddleware),
});
