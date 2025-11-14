import React from "react";

export default function SearchInput({ onChange, value }) {
  return (
    <input
      type="text"
      value={value}
      placeholder="Search"
      onChange={onChange}
      style={{ width: "300px" }}
    />
  );
}
