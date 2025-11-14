import { useEffect, useRef, useState } from "react";
import { fetchAllGroups, fetchOneGroup, fetchAllUsers } from "./api";
import {
  constants,
  useStore,
  useSelector,
  groupsSelector,
  usersSelector,
  membershipSelector,
  groupDetailsSelector,
  refreshTimeSelectorGroups,
  refreshTimeSelectorUsers,
  logsSelector,
} from "./state";
import { LOGS } from "./util";

const DEFAULT_REFRESH_WINDOW_IN_MINUTES = 2;
const diffTimeInMinutes = (time) => {
  if (!time) return 99999;
  const now = Date.now();
  return (now - time) / 60000;
};

export const useGroupsHook = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { dispatch } = useStore();
  const groups = useSelector(groupsSelector);

  const fetchGroups = () => {
    if (!loading) setLoading(true);
    if (error) setError(null);
    fetchAllGroups()
      .then((res) => {
        dispatch({ type: constants.GET_ALL_GROUPS, payload: res.data });
        dispatch({ type: constants.REFRESH, payload: "groups" });
      })
      .catch(() => setError("Failed to retrieve all groups"))
      .finally(() => setLoading(false));
  };

  const refreshTime = useSelector(refreshTimeSelectorGroups);

  useEffect(() => {
    if (diffTimeInMinutes(refreshTime) > DEFAULT_REFRESH_WINDOW_IN_MINUTES)
      fetchGroups();
  }, [refreshTime]);

  useEffect(() => {
    if (refreshTime != null && diffTimeInMinutes(refreshTime) > 5)
      fetchGroups();
  }, []);

  return [groups, loading, error, fetchGroups];
};

export const useGroupDetailHook = (name) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { dispatch } = useStore();

  const membership = useSelector(membershipSelector);
  const groupDetails = useSelector(groupDetailsSelector);

  const groups = { membership, groupDetails };

  const fetchGroupDetails = (groupName) => {
    if (!loading) setLoading(true);
    if (error) setError(null);
    fetchOneGroup(groupName)
      .then((res) => {
        dispatch({ type: constants.GET_ONE_GROUP, payload: res.data });
      })
      .catch(() => setError("Failed to retrieve group details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroupDetails(name);
  }, [name]);

  return [groups, loading, error, fetchGroupDetails];
};

export const useUsersHook = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { dispatch } = useStore();

  const users = useSelector(usersSelector);
  const fetchUsers = () => {
    if (!loading) setLoading(true);
    if (error) setError(null);
    fetchAllUsers()
      .then((res) => {
        dispatch({ type: constants.GET_ALL_USERS, payload: res.data });
        dispatch({ type: constants.REFRESH, payload: "users" });
      })
      .catch(() => setError("Failed to retrieve all users"))
      .finally(() => setLoading(false));
  };

  const refreshTime = useSelector(refreshTimeSelectorUsers);

  useEffect(() => {
    if (diffTimeInMinutes(refreshTime) > DEFAULT_REFRESH_WINDOW_IN_MINUTES)
      fetchUsers();
  }, [refreshTime]);

  useEffect(() => {
    if (refreshTime != null && diffTimeInMinutes(refreshTime) > 5) fetchUsers();
  }, []);

  return [users, loading, error, fetchUsers];
};

export const useScrollHook = (scrollMagnitude = 300) => {
  const ref = useRef();
  const handleScroll = (direction) => {
    const scrollDirection = direction === "left" ? -1 : 1;
    if (ref)
      ref.current.scrollLeft =
        ref.current.scrollLeft + scrollDirection * scrollMagnitude;
  };
  return [ref, handleScroll];
};

export const useSearchHook = (listItems, key) => {
  const [value, setValue] = useState("");
  const handleChange = (e) => setValue(e.target.value.toLowerCase());
  const newItems = listItems.filter((it) =>
    it[key].toLowerCase().includes(value)
  );
  const reset = () => setValue("");
  return [newItems, value, handleChange, reset];
};

export const useUpdateGroupHook = () => {
  const { dispatch } = useStore();
  const addUserToGroup = ({ group, user }) =>
    dispatch({ type: constants.ADD_MEMBER_TO_GROUP, payload: { group, user } });

  const removeUserFromGroup = ({ group, user }) =>
    dispatch({
      type: constants.REMOVE_MEMBER_FROM_GROUP,
      payload: { group, user },
    });

  return [addUserToGroup, removeUserFromGroup];
};

export const useLogsHook = () => {
  const { dispatch } = useStore();
  const logs = useSelector(logsSelector);

  const handleLogsClear = () => {
    dispatch({ type: constants.CLEAR_LOGS });
  };

  const handleLogsGenerate = (event) => {
    const { detail } = event;
    dispatch({
      type: constants.SET_LOGS,
      payload: <span className={detail.color}>{event.detail.text}</span>,
    });
  };

  useEffect(() => {
    document.addEventListener(LOGS, handleLogsGenerate);

    return () => {
      document.removeEventListener(LOGS, handleLogsGenerate);
    };
  }, []);

  return [logs, handleLogsClear];
};


