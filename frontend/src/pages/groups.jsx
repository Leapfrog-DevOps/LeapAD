import { useState } from "react";
import { useGroupsHook, useSearchHook } from "../hooks";
import Loader from "../components/loader";
import Modal from "../components/AddGroupModal";
import { Link } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import UserIcon from "../components/UserIcon";

export default function Groups() {
  const GroupComponentEach = ({ name, description, ...rest }) => (
    <li className="list-item">
      <UserIcon group scale={0.7} dim/>
      <div className="list-item-content">
        <h3 className="list-item-title">{name}</h3>
        <p className="list-item-description">
          {description || "No description provided"}
        </p>
      </div>
      <Link to={`/groups/${name}`} className="list-item-button">
        View Details
      </Link>
    </li>
  );

  const [allGroups, groupLoading, groupFetchErr, refresh] = useGroupsHook();
  const [modal, setModal] = useState(false);
  const [filteredGroups, searchValue, handleChange] = useSearchHook(
    allGroups,
    "name"
  );
  return (
    <div className="container relative">
      <div className="inline-headers">
        <div className="inline-flex flex-row ">
          <UserIcon group dim/>
          <h1 className="colorblack">Groups</h1>
        </div>
        <SearchInput value={searchValue} onChange={handleChange} />
        <div>
          {modal && <Modal handleClose={() => setModal(false)} />}
          <button className="btn" onClick={() => setModal(true)}>
            Create a Group
          </button>
        </div>
      </div>
      <div
        style={{
          height: "70vh",
          overflowY: "scroll",
          padding: "50px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {groupLoading && (
            <div className="centered-always">
              <Loader />
            </div>
          )}
          <ul className="list">
            {filteredGroups.map((item) => (
              <GroupComponentEach key={item.name} {...item} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
