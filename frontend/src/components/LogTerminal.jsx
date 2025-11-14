// Terminal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLogsHook } from "../hooks";

const Terminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, clearLog] = useLogsHook();
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      {!isOpen && (
        <div
          className="toggle-button"
          onClick={() => setIsOpen(true)}
          style={{ position: "fixed", right: "20px", bottom: "20px" }}
        >
          $_
        </div>
      )}
      <div className={`terminal-container ${isOpen ? "open" : ""}`}>
        <div className="terminal-header">
          <code style={{ color: "grey" }}>/bin/bash</code>
          <div
            className="flex-center"
            style={{
              background: "transparent",
              color: "grey",
              fontSize: "15px",
              fontWeight: "bolder",
              padding: "0 10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => setIsOpen(false)}
          >
            ✕
          </div>
        </div>
        <div className="terminal-body" ref={terminalRef}>
          <code>
            {logs.map((log, index) => (
              <div key={index} className="terminal-log">
                {"$    "}
                {log}
              </div>
            ))}
            {"$    "}<span className="flicker">_</span>
          </code>
        </div>
      </div>
    </>
  );
};

export default Terminal;
