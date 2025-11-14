import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
  Navigate,
} from "react-router-dom";

import "./App.css";
import Groups from "./pages/groups";
import GroupDetail from "./pages/groupsdetails";
import Users from "./pages/users";

import { GlobalStateProvider } from "./state";
import CreateUsers from "./pages/CreateUsers";
import Terminal from "./components/LogTerminal";

function App() {
  return (
    <GlobalStateProvider>
      <Terminal />
      <div
        style={{
          width: "80vw",
          margin: "auto",
          marginTop: "25px",
          height: "85vh",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Router>
          <div className="tabs">
            <NavLink
              to="/groups"
              className={({ isActive }) =>
                isActive ? "active-tab tab" : "tab"
              }
            >
              Groups
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "active-tab tab" : "tab"
              }
            >
              Users
            </NavLink>
          </div>
          <Routes>
            <Route path="/" element={<Navigate to="/groups" replace />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:group" element={<GroupDetail />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/create" element={<CreateUsers />} />
          </Routes>
        </Router>
      </div>
    </GlobalStateProvider>
  );
}

export default App;
