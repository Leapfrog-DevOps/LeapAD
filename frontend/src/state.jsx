import React, { createContext, useReducer, useContext, useMemo } from "react";

const CREATE_USER = "CREATE_USER";
const DELETE_USER = "DELETE_USER";
const GET_ALL_USERS = "GET_ALL_USERS";
const GET_ALL_GROUPS = "GET_ALL_GROUPS";
const GET_ONE_GROUP = "GET_ONE_GROUP";
const ADD_MEMBER_TO_GROUP = "ADD_MEMBER_TO_GROUP";
const REMOVE_MEMBER_FROM_GROUP = "REMOVE_MEMBER_FROM_GROUP";
const REFRESH = "REFRESH";
const SET_LOGS = "SET_LOGS";
const CLEAR_LOGS = "CLEAR_LOGS";

const hardRefresh = () => {
  return Date.now() - 100000;
};

export const constants = {
  CREATE_USER,
  DELETE_USER,
  GET_ALL_USERS,
  GET_ALL_GROUPS,
  GET_ONE_GROUP,
  ADD_MEMBER_TO_GROUP,
  REMOVE_MEMBER_FROM_GROUP,
  REFRESH,
  SET_LOGS,
  CLEAR_LOGS,
};
const initLog = () => `Init at ${new Date().toUTCString()}`;
// Initial state
const initialState = {
  groups: [],
  users: [],
  membership: {},
  groupDetails: {},
  refreshTime: { users: null, groups: null },
  logs: [initLog()],
};

// Reducer function
const globalReducer = (state, action) => {
  switch (action.type) {
    case CREATE_USER:
      return {
        ...state,
        users: state.users
          .filter(
            (item) => item.sAMAccountName !== action.payload.sAMAccountName
          )
          .concat(action.payload),
        refreshTime: { ...state.refreshTime, users: hardRefresh() },
      };
    case DELETE_USER:
      return {
        ...state,
        users: state.users.filter(
          (item) => item.sAMAccountName !== action.payload.sAMAccountName
        ),
        refreshTime: {
          ...state.refreshTime,
          users: hardRefresh(),
        },
      };
    case GET_ALL_USERS:
      return {
        ...state,
        users: action.payload,
      };
    case GET_ALL_GROUPS:
      return {
        ...state,
        groups: action.payload,
      };
    case GET_ONE_GROUP:
      return {
        ...state,
        membership: {
          ...state.membership,
          [action.payload.group.name]: action.payload.members,
        },
        groupDetails: {
          ...state.groupDetails,
          [action.payload.group.name]: action.payload.group,
        },
      };
    case ADD_MEMBER_TO_GROUP:
      const groupName = action.payload.group.name;
      const user = action.payload.user;
      const currentMembers = state.membership[groupName];
      return {
        ...state,
        membership: {
          ...state.membership,
          [groupName]: currentMembers
            .filter((it) => it.sAMAccountName !== user.sAMAccountName)
            .concat(user),
        },
      };
    case REMOVE_MEMBER_FROM_GROUP:
      const group_name = action.payload.group.name;
      const user_info = action.payload.user;
      const currentMembersArr = state.membership[group_name];
      return {
        ...state,
        membership: {
          ...state.membership,
          [group_name]: currentMembersArr.filter(
            (it) => it.sAMAccountName !== user_info.sAMAccountName
          ),
        },
      };
    case REFRESH:
      return {
        ...state,
        refreshTime: {
          ...state.refreshTime,
          [action.payload]: Date.now() + 60000,
        },
      };
    case SET_LOGS:
      return { ...state, logs: state.logs.concat(action.payload) };
    case CLEAR_LOGS:
      return { ...state, logs: [initLog()] };
    default:
      return state;
  }
};

// Create Context
const GlobalStateContext = createContext();

// Create a custom hook to use the GlobalStateContext
export const useStore = () => useContext(GlobalStateContext);

// Create a provider component
export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);
  console.log(state);
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// useSelector.js

export const useSelector = (selector) => {
  const { state } = useContext(GlobalStateContext);

  const selectedState = useMemo(() => selector(state), [state, selector]);

  return selectedState;
};

export const groupsSelector = (state) => state.groups;
export const usersSelector = (state) => state.users;
export const membershipSelector = (state) => state.membership;
export const groupDetailsSelector = (state) => state.groupDetails;
export const refreshTimeSelectorUsers = (state) => state.refreshTime.users;
export const refreshTimeSelectorGroups = (state) => state.refreshTime.groups;
export const logsSelector = (state) => state.logs;
