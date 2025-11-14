import { useState } from "react";
import { Link } from "react-router-dom";

import Loader from "../components/loader";
import UserIcon from "../components/UserIcon";
import SearchInput from "../components/SearchInput";
import ConfirmationModal from "../components/ConfirmationModal";

import { useSearchHook, useUsersHook } from "../hooks";
import { renderStatusComponent, formatDate, getStatus } from "../util";

export default function Users() {
  const [users, userFetching, userError, refresh] = useUsersHook();
  const [modal, setModal] = useState(false);
  const [removeUserLoading, setRemoveUserLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const toggleOverlay = () => {
    setIsVisible(!isVisible);
  };

  const removeUser = () => {
    setRemoveUserLoading(true);
    //
    console.log(selectedData);
    setModal(false);
  };
  const cancel = () => {
    setSelectedData(null);
    setModal(false);
  };

  const removeUserModalToggle = (member_dn, group_dn, name) => {
    setSelectedData({ user_dn: member_dn, group_dn: group_dn, username: name });
    setModal(true);
  };

  const renderUsers = (members) => (
    <>
      <table className="good-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>SamAccountName</th>
            <th>Email</th>
            <th>Status</th>
            <th>Password last set</th>
            <th>Last logged in</th>
          </tr>
        </thead>
        <tbody>
          {!userFetching &&
            members.map((member) => (
              <tr
                style={{ cursor: "pointer" }}
                key={member.sAMAccountName}
                onClick={() => {
                  setSelectedData(member);
                  setIsVisible(true);
                }}
              >
                <td>
                  <UserIcon dim scale={0.5} inactive={!getStatus(member)} />
                </td>
                <td>{member.cn}</td>
                <td>{member.sAMAccountName}</td>
                <td>{member.userPrincipalName}</td>
                <td>{renderStatusComponent(member)}</td>
                <td>{formatDate(member.pwdLastSet)}</td>
                <td>{formatDate(member.lastLogon)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );

  const updateUserStatus = (selectedMember, status) => {

  };



  const renderUserDetail = () => {

    const getMembership = (membrr) => {
      console.log('here prt, member of filter')
      const list = membrr.memberOf? membrr.memberOf === 'string' ? [membrr.memberOf] : membrr.memberOf:[];
      return (list || []).map((groupDn) => {
        const parts = groupDn.split(",");
        const cnPart = parts.find((part) => part.startsWith("CN="));
        return cnPart ? cnPart.substring(3) : groupDn;
      }
      );
    }

    const {
      cn,
      sAMAccountName,
      userPrincipalName,
      userAccountControl,
      pwdLastSet,
      lastLogon,
      whenCreated,
    } = selectedData;
    const memberStatus = getStatus(selectedData);
    return (
      <>
        <button className="close-button" onClick={toggleOverlay}>
          ✕
        </button>
        <div className="slide-overlay-content">
          <div className="flex-column flex-center">
            <div
              style={{
                borderRadius: "50%",
                padding: "20px",
                border: "1px solid #eee",
                background: "#eee ",
                width: "100px",
                height: "100px",
              }}
              className="flex-center"
            >
              <UserIcon withoutMargin scale={2}></UserIcon>
            </div>
            <h2>{cn}</h2>
            <div className="btn">{sAMAccountName}</div>
            <p className="grey">📧 {userPrincipalName}</p>
            <p className="grey">
              Account status {renderStatusComponent(selectedData)}
            </p>
            <p className="grey">
              {lastLogon ? `Last logged in at ${formatDate(lastLogon)}` : ""}
            </p>
            <div>
              <button
                className={`btn ${memberStatus ? "" : "grey"}`}
                onClick={() => updateUserStatus(selectedData, !memberStatus)}
              >
                {memberStatus ? "Deactivate" : "Activate"}
              </button>
            </div>
            <h3>
              Member of
            </h3>
            {getMembership(selectedData).map((group) => (
              <div key={group} className="grey">
                {group}
              </div>
            ))}

          </div>
        </div>
      </>
    );
  };

  const [filteredUsersToShow, searchValue, handleChange] = useSearchHook(
    users,
    "cn"
  );

  return (
    <div className="container">
      <div className="inline-headers">
        <div className="inline-flex flex-row ">
          <UserIcon />
          <h1>Users</h1>
        </div>
        <SearchInput value={searchValue} onChange={handleChange} />
        <div>
          <Link to="/users/create" className="btn">
            Create a User
          </Link>
        </div>
      </div>
      {userFetching && (
        <div className="centered-always">
          <Loader />
        </div>
      )}
      {userError && (
        <p
          className="centered-always"
          style={{
            textAlign: "left",
            color: "red",
            top: "55%",
            margin: 0,
            position: "absolute",
          }}
        >
          {userError}
        </p>
      )}
      <p className="grey">Click row to view details</p>
      <div className="table-container">{renderUsers(filteredUsersToShow)}</div>
      {modal && (
        <ConfirmationModal
          title={`Remove user ${!!selectedData && selectedData.username}?`}
          onConfirm={() => removeUser()}
          onCancel={() => cancel()}
          loading={removeUserLoading}
        />
      )}
      <div className={`slide-overlay ${isVisible ? "visible" : ""}`}>
        {!!selectedData && renderUserDetail()}
      </div>
    </div>
  );
}
