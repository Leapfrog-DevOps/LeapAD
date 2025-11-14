import React, { useState } from "react";
import Modal from "./Modal";
import { useSearchHook } from "../hooks";
import Loader from "./loader";
export default function Dropdown({
  items,
  itemKey,
  placeholder = "Select Items",
  onSelectItem,
  loading=false
}) {
  const [open, setOpen] = useState(false);

  const [filterItems, filterValue, handleChange, resetFilterValue] =
    useSearchHook(items, itemKey);
  return (
    <div className="ad-dropdown relative">
      <button
        className="btn small"
        onClick={(e) => {
          e.preventDefault();
          resetFilterValue();
          setOpen(true);
        }}
      >
        {placeholder}
      </button>
      {loading && <Loader />}
      {open && (
        <Modal>
          <div
            className="close-button"
            onClick={() => {
              setOpen(false);
            }}
          >
            ✕
          </div>
          <div className="ad-dropdown-body">
            <input
              placeholder="Search"
              onChange={handleChange}
              value={filterValue}
            ></input>
            <br />
            <div className="table-container small">
              <table className="good-table">
                <thead>
                  <tr>
                    <th>{itemKey.toUpperCase()}</th>
                    <th>Add</th>
                  </tr>
                </thead>
                <tbody>
                  {filterItems.map((itm) => (
                    <tr key={itm[itemKey]}>
                      <td>{itm[itemKey]}</td>
                      <td>
                        <button
                          className="btnsmall"
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectItem(itm);
                          }}
                        >
                          🞥
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
