import { useState } from "react";
import { createGroup } from "../api";
import Loader from "./loader";
import UserIcon from "./UserIcon";

const Modal = ({ handleClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreate = (e) => {
    e.preventDefault();
    if (!name && !description) return;

    setLoading(true);
    createGroup({ name, description })
      .then((data) => {
        setLoading(false);
        alert("Created the group", name);
        handleClose();
      })
      .catch((e) => {
        console.log(e);
        setLoading(false);
      });
  };

  return (
    <div className="modal-backdrop" style={{ width: "auto" }}>
      <div className="modal-content">
        <div className="inline-flex flex-row">
          <UserIcon group scale={0.5}/>
          <h2>Create a Group</h2>
        </div>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {loading && (
          <div className="centered-always">
            <Loader />
          </div>
        )}
        <button className="btn" disabled={loading} onClick={onCreate}>
          Create
        </button>
        <button
          className="btn black"
          disabled={loading}
          onClick={() => handleClose()}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
