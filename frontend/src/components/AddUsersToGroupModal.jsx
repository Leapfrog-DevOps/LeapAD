import { useState } from "react";
import Loader from "./loader";
import { useSearchHook } from "../hooks";
import SearchInput from "./SearchInput";
import { assignUserToGroup } from "../api";
import { getStatus, renderStatusComponent } from "../util";

export default function AddUsersToGroupModal({
  usersNotInGroup,
  group,
  onClose,
  onSuccess,
}) {
  const [userAddedIds, setUserAddedIds] = useState([]);
  const [adding, setAdding] = useState(false);

  const handleAddToGroup = (user) => {
    setAdding(true);
    const user_dn = user.distinguishedName;
    const group_dn = group.distinguishedName;
    assignUserToGroup({ user_dn, group_dn })
      .then(() => {
        setUserAddedIds((prev) => [...prev, user.sAMAccountName]);
        onSuccess(user, group);
      })
      .finally(() => setAdding(false));
  };

  const filtered = usersNotInGroup.filter(
    (it) => !userAddedIds.includes(it.sAMAccountName)
  );
  const [data, value, onChange] = useSearchHook(filtered, "cn");

  return (
    <div className="modal-backdrop">
      <div className="modal-content big relative">
        <div className="inline-headers">
          <h5>Add Users To Group</h5>
          <SearchInput value={value} onChange={onChange} />
          <button
            className="btnsmall grey small"
            onClick={() => !adding && onClose()}
          >
            <b>Close</b>
          </button>
        </div>
        <div className="table-container small">
          <table className="good-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SamAccountName</th>
                <th>Status</th>
                <th>Add</th>
              </tr>
            </thead>
            <tbody>
              {data.map((member) => (
                <tr key={member.sAMAccountName}>
                  <td>{member.cn}</td>
                  <td>{member.sAMAccountName}</td>
                  <td>{renderStatusComponent(member)}</td>
                  <td>
                    <button
                      className="btn"
                      disabled={adding || !getStatus(member)}
                      onClick={() => !adding && handleAddToGroup(member)}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {adding && (
            <div className="modal-backdrop">
              <div className="centered-always">
                <Loader />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
