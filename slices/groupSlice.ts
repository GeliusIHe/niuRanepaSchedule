// src/slices/groupSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const groupSlice = createSlice({
    name: 'group',
    initialState: null as string | null,
    reducers: {
        setGroupName: (state, action) => action.payload,
    },
});

// Экспортирование действий, которые можно будет использовать в компонентах
export const { setGroupName } = groupSlice.actions;

// Экспортирование редьюсера, который будет использоваться в создании хранилища
export default groupSlice.reducer;
