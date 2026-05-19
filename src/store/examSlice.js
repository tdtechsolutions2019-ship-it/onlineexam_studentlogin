import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quelen: 0,
  anslen: 0,
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setExamResult: (state, action) => {
      state.quelen = action.payload.quelen;
      state.anslen = action.payload.anslen;
    },
    resetExamResult: (state) => {
      state.quelen = 0;
      state.anslen = 0;
    },
    setExamduration: (state, action) => {
      state.duration = action.payload.duration;
    },
    restExamduration: (state) => {
      state.duration = 0;
    },
    setUserId: (state, action) => {
      state.user = action.payload.user;
      localStorage.setItem("userdata", JSON.stringify(action.payload.user));
    },
  },
});

export const { setExamResult, resetExamResult, setExamduration, setUserId } =
  examSlice.actions;
export default examSlice.reducer;
