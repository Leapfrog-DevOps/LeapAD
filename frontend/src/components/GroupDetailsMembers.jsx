import React from "react";
import { useSearchHook } from "../hooks";
import SearchInput from "./SearchInput";
import { formatDate, renderStatusComponent } from "../util";
import UserIcon from "./UserIcon";

const GroupDetailsMembers = ({ group, members, onRemoveUser, loading }) => {
  const [filteredMembers, searchValue, handleChange] = useSearchHook(
    members,
    "cn"
  );
  return (
    <>
      <p style={{ color: "grey", fontSize: "1.1em" }}>{group.description}</p>
      <p style={{ color: "grey", fontSize: "0.8em" }}>
        Created at {formatDate(group.whenCreated)}
        <br />
        Last Updated at {formatDate(group.whenChanged)}
      </p>

      <div className="inline-headers">
        <div className="inline-flex flex-row">
          <UserIcon scale={0.6}/>
          <h3>Members</h3>
          </div>
        <SearchInput value={searchValue} onChange={handleChange} />
      </div>
      <div className="overflow" style={{ height: "40vh" }}>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filteredMembers &&
              filteredMembers.map((member) => (
                <tr key={member.sAMAccountName}>
                  <td>
                    <UserIcon dim scale={0.5} />
                  </td>
                  <td>{member.cn}</td>
                  <td>{member.sAMAccountName}</td>
                  <td>{member.userPrincipalName}</td>
                  <td>{renderStatusComponent(member)}</td>
                  <td>{formatDate(member.pwdLastSet)}</td>
                  <td>{formatDate(member.lastLogon)}</td>
                  <td>
                    <button
                      className="btnsmall red"
                      onClick={() => onRemoveUser({ group, member })}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GroupDetailsMembers;
