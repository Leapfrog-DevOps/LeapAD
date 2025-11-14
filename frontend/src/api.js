import axiosInstance from "./axiosUtil";
const BASEURL = "http://localhost:5000";

export function createGroup({ name, description }) {
  return axiosInstance.post(`${BASEURL}/groups`, { name, description });
}

export function fetchAllGroups() {
  return axiosInstance.get(`${BASEURL}/groups`);
}

export function fetchOneGroup(name) {
  return axiosInstance.get(`${BASEURL}/groups/one`, {
    params: { name },
  });
}

export function fetchAllUsers() {
  return axiosInstance.get(`${BASEURL}/users`);
}

export function assignUserToGroup({ user_dn, group_dn }) {
  return axiosInstance.post(`${BASEURL}/groups/members`, { user_dn, group_dn });
}

export function unassignUserFromGroup({ user_dn, group_dn }) {
  return axiosInstance.delete(`${BASEURL}/groups/members`, {
    params: { user_dn, group_dn },
  });
}

export function createUser(userData) {
  return axiosInstance.post(`${BASEURL}/users`, userData);
}
