import React, { useState } from "react";
import UserIcon from "../components/UserIcon";
import { isEmail } from "../util";
import { useGroupsHook, useUsersHook } from "../hooks";
import Dropdown from "../components/Dropdown";
import Loader from "../components/loader";
import axios from "axios";
import { createUser } from "../api";

const fieldsArray = [
  {
    type: "text",
    label: "First Name",
    name: "first_name",
  },
  {
    type: "text",
    label: "Last Name",
    name: "last_name",
  },
  {
    type: "email",
    label: "Email",
    name: "email",
  },
  {
    type: "text",
    label: "SAMAccountname",
    name: "sAMAccountName",
  },
];
export default function CreateUsers() {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [allExistingUsers] = useUsersHook();
  const [groups, groupsLoading] = useGroupsHook();
  const [memberOf, setMemberOf] = useState([]);
  const [modal, setModal] = useState(false);

  const updateFields = (e) => {
    setFormErrors((prev) => ({ ...prev, [e.target.name]: null }));
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value.trim(),
    }));
  };

  const checkValidity = () => {
    const errors = {};
    for (let i = 0; i < fieldsArray.length; i++) {
      const thisFieldName = fieldsArray[i].name;
      if (!formData[thisFieldName])
        errors[thisFieldName] = `${fieldsArray[i].label} is a required field`;
      if (
        thisFieldName == "email" &&
        !!formData[thisFieldName] &&
        !isEmail(formData.email)
      )
        errors[thisFieldName] = "Invalid Email";
      if (
        thisFieldName == "email" &&
        !!formData.email &&
        isEmail(formData.email) &&
        !formData.email.split("@")[1].includes("example.com")
      )
        errors[thisFieldName] = "Must be a valid example email address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length == 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkValidity()) return;
    console.log("successfull submission");

    createUser({
      ...formData,
      memberOf}).then((res) => {
        alert("User created successfully!");
        window.location.reload();
      }).catch((err) => {
        alert(
          `Failed to create user. ${
            err.response ? err.response.data.message : err.message
          }`
        );
      });
  };

  const handleReset = () => {
    setFormData({});
    setFormErrors({});
    setMemberOf([]);
    console.log(formData);
  };

  const constructSAMAccountName = () => {
    const first_name = (formData["first_name"] || "").toLowerCase();
    const last_name = (formData["last_name"] || "").toLowerCase();
    if (first_name.length > 0 && last_name.length > 0)
      return `${first_name[0]}${last_name}`;
    else return "";
  };

  return (
    <div className="container flex-center flex-column">
      <div className="inline-flex">
        <UserIcon />
        <h1>Create a User</h1>
      </div>
      <div className="flex-center">
        <form
          className="create-user-form flex-center flex-column"
          onSubmit={handleSubmit}
        >
          {fieldsArray.map((item) => {
            const isSAMAccountName = item.name == "sAMAccountName";
            const defaultValue = isSAMAccountName
              ? constructSAMAccountName()
              : null;
            return (
              <div key={item.name} className="form-group relative">
                <label htmlFor={item.name}>{item.label}</label>
                <input
                  onChange={updateFields}
                  {...item}
                  value={formData[item.name]}
                  defaultValue={defaultValue}
                />
                <p className="red absolute small">{formErrors[item.name]}</p>
              </div>
            );
          })}
          <div
            className="flex-column"
            style={{
              // justifyContent: "space-between",
              // alignItems: "center",
              flexBasis: "100%",
              marginTop: "20px",
            }}
          >
            <div className="mg-10 flex-center" style={{ width: "auto" }}>
              <Dropdown
                loading={groupsLoading}
                onSelectItem={(grp) =>
                  setMemberOf((prev) =>
                    prev.filter((it) => it !== grp.name).concat(grp.name)
                  )
                }
                itemKey={"name"}
                items={groups.filter((grp) => !memberOf.includes(grp.name))}
                placeholder="🞥 Select Groups"
              />
            </div>
            <div
              className="flex-wrap flex-row"
              style={{ height: "100px", overflowY: "scroll" }}
            >
              {memberOf.map((memgrp) => (
                <div key={memgrp}>
                  <button
                    className="inline-flex pointer btnsmall"
                    style={{
                      padding: "5px 8px",
                      border: "1px solid #00a2ff",
                      borderRadius: "25px",
                      margin: "5px",
                      boxSizing: "border-box",
                    }}
                    onClick={() =>
                      setMemberOf((prev) => prev.filter((it) => it !== memgrp))
                    }
                  >
                    {memgrp}
                    <span style={{ marginLeft: "10px" }}>✕</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <br />
          <div style={{ padding: "20px", boxSizing: "border-box" }}>
            <div className="inline-flex">
              <button className="btn blue" type="submit" onClick={handleSubmit}>
                Submit
              </button>
              <button
                className="btn black"
                type="reset"
                onClick={() => handleReset()}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
