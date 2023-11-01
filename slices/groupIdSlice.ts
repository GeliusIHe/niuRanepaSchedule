// src/slices/groupIdSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const groupIdSlice = createSlice({
    name: 'groupId',
    initialState: null as string | null,
    reducers: {
        setGroupId: (state, action) => action.payload,
    },
});

// Экспортирование действий, которые можно будет использовать в компонентах
export const { setGroupId } = groupIdSlice.actions;

// Экспортирование редьюсера, который будет использоваться в создании хранилища
export default groupIdSlice.reducer;
