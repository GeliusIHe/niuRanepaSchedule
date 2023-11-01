// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import groupIdReducer from '../slices/groupIdSlice';
import groupReducer from '../slices/groupSlice';

const store = configureStore({
    reducer: {
        groupId: groupIdReducer,
        group: groupReducer,
    },
});

export default store;
