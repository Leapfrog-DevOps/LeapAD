import React from "react";

export default function Modal({ children }) {
  return (
    <div
    // className=""
    //   style={{
    //     background: "rgba(255, 255, 255, 0.416)",
    //     height: "100vh",
    //     width: "100vw",
    //     overflow: "hidden",
    //     position: "fixed",
    //     zIndex: 10000000,
    //     top: 0,
    //     left: 0,
    //   }}
      className="flex-center modal-backdrop"
    >
      <div className="modal-content relative">{children}</div>
    </div>
  );
}
