import { Link, useParams } from "react-router-dom";
import { useGroupDetailHook, useUpdateGroupHook, useUsersHook } from "../hooks";
import Loader from "../components/loader";
import { useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";
import AddUsersToGroupModal from "../components/AddUsersToGroupModal";
import GroupDetailsMembers from "../components/GroupDetailsMembers";
import { unassignUserFromGroup } from "../api";
import UserIcon from "../components/UserIcon";

export default function GroupDetail() {
  const { group } = useParams(); // Access route parameters
  const [fetchedGroupDetails, detailLoading, detailError, refreshDetail] =
    useGroupDetailHook(group);
  const [modal, setModal] = useState(false);
  const [removeUserLoading, setRemoveUserLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [users, userLoading, error, refreshUsers] = useUsersHook();
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);

  const { groupDetails, membership } = fetchedGroupDetails;
  const isGroupDetailsPresent = !!groupDetails[group] && !!membership[group];
  const details = groupDetails[group];
  const membersInGroup = membership[group];

  const [addToGroup, removeFromGroup] = useUpdateGroupHook();

  const filterUsers = (usersInGroup = []) => {
    const usersAlreadyInGroupIds = usersInGroup.map(
      (item) => item.sAMAccountName
    );

    const usersNotInGroup = users.filter(
      (item) => !usersAlreadyInGroupIds.includes(item.sAMAccountName)
    );
    return usersNotInGroup;
  };

  const confirmUserRemovalFromModal = () => {
    setRemoveUserLoading(true);
    const user_dn = selectedData.member.distinguishedName;
    const group_dn = selectedData.group.distinguishedName;
    console.log({ user_dn, group_dn });
    unassignUserFromGroup({ user_dn, group_dn })
      .then(() => {
        removeFromGroup({
          user: selectedData.member,
          group: selectedData.group,
        });
        setSelectedData(null);
      })
      .catch((err) => alert("Error in removing user from group"))
      .finally(() => {
        setModal(false);
        setRemoveUserLoading(false);
      });
  };

  const cancel = () => {
    setSelectedData(null);
    setModal(false);
  };

  const handleRemoveUser = (selected) => {
    setSelectedData(selected);
    setModal(true);
  };

  const handleAddUserToGroup = (user, group) => {
    addToGroup({ user, group });
  };

  return (
    <div className="container relative">
      <div
        className="flex-center"
        style={{
          position: "absolute",
          top: "15px",
          left: "25px",
          fontSize: "0.9em",
          color: "grey",
        }}
      >
        <Link to="/groups">{`Groups / `}</Link>
        {group}
      </div>
      <div className="inline-headers">
        <div className="inline-flex flex-row ">
          <UserIcon group />
          <h1 className="colorblack">{group}</h1>
        </div>
        <div className="flex-center">
          {!!details && (
            <button
              className="btn"
              onClick={() => setAddUserModalVisible(true)}
            >
              Assign Users{" "}
            </button>
          )}
        </div>
      </div>
      {detailLoading && (
        <div className="centered-always">
          <Loader />
        </div>
      )}
      {detailError && (
        <p className="centered-always red" style={{top:'60%',left:'45%'}}>
          {detailError}
        </p>
      )}
      {!!isGroupDetailsPresent && !!details && (
        <GroupDetailsMembers
          group={details}
          loading={detailLoading}
          members={membersInGroup}
          onRemoveUser={handleRemoveUser}
        />
      )}
      {modal && (
        <ConfirmationModal
          title={`Remove user ${
            !!selectedData && selectedData.member.cn
          } from group ${group}?`}
          onConfirm={() => confirmUserRemovalFromModal()}
          onCancel={() => cancel()}
          loading={removeUserLoading}
        />
      )}
      {addUserModalVisible && !!isGroupDetailsPresent && (
        <AddUsersToGroupModal
          onClose={() => {
            setAddUserModalVisible(false);
          }}
          onSuccess={handleAddUserToGroup}
          group={details}
          usersNotInGroup={filterUsers(membersInGroup)}
        />
      )}
    </div>
  );
}
