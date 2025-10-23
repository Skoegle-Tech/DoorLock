import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "http://localhost:3000";

export default function MapCard() {
  const location = useLocation();
  const employee = location.state;

  const [mappedCard, setMappedCard] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [emergencyPass, setEmergencyPass] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Activity Logs State ---
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [totalLogPages, setTotalLogPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const LOGS_LIMIT = 5;

  const btnStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
  };

  // --- Employee-dependent effects ---
  useEffect(() => {
    if (employee?.employeeNumber) {
      checkMapping(employee.employeeNumber);
      fetchActivityLogs(logPage); // load first page
    }
  }, [employee]);

  useEffect(() => {
    if (!employee?.employeeNumber) return;
    fetchRealtimeStatus(); // initial load
    const interval = setInterval(() => fetchRealtimeStatus(), 5000);
    return () => clearInterval(interval);
  }, [employee]);

  useEffect(() => {
    if (employee?.employeeNumber) fetchActivityLogs(logPage);
  }, [logPage]);

  // --- API Functions ---
  async function checkMapping(employeeNumber) {
    try {
      const res = await fetch(
        `${BASE_URL}/user/mapped-users?UserId=${employeeNumber}`
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setMappedCard(data[0]);
        fetchCardStatus(data[0].RfidNumber);
      } else if (data && data.UserId) {
        setMappedCard(data);
        fetchCardStatus(data.RfidNumber);
      } else {
        setMappedCard(null);
        fetchAvailableCards();
      }
    } catch (err) {
      console.error("Error fetching mapping:", err);
    }
  }

  async function fetchAvailableCards() {
    try {
      const res = await fetch(`${BASE_URL}/card/cards`);
      const data = await res.json();
      const unmapped = data.filter((card) => !card.RFIDMapping);
      setAvailableCards(unmapped);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  }

  async function fetchCardStatus(RfidNumber) {
    try {
      const res = await fetch(`${BASE_URL}/card/status?RfidNumber=${RfidNumber}`);
      const data = await res.json();
      setIsActive(data.isActive);
    } catch (err) {
      console.error("Error fetching card status:", err);
    }
  }

  async function fetchRealtimeStatus() {
    if (!employee) return;
    try {
      const res = await fetch(
        `${BASE_URL}/activity/realtime-status?UserId=${employee.employeeNumber}`
      );
      const data = await res.json();
      setRealtimeStatus(data);
    } catch (err) {
      console.error("Error fetching realtime status:", err);
    }
  }

  async function fetchActivityLogs(page = 1) {
    if (!employee) return;
    setLogsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/activity/activity-log?UserId=${employee.employeeNumber}&page=${page}&limit=${LOGS_LIMIT}`
      );
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalLogPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  // --- Handlers ---
  async function handleMap() {
    if (!selectedCard) return alert("Please select a card");
    setLoading(true);

    try {
      const body = {
        RfidNumber: selectedCard,
        UserId: employee.employeeNumber,
        UserName: employee.name,
      };
      const res = await fetch(`${BASE_URL}/user/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Mapping failed");
      alert("✅ Card mapped successfully!");
      checkMapping(employee.employeeNumber);
    } catch (err) {
      console.error("Error mapping card:", err);
      alert("Failed to map card");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnmap() {
    if (!mappedCard) return;
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/user/unmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RfidNumber: mappedCard.RfidNumber }),
      });
      if (!res.ok) throw new Error("Unmapping failed");
      alert("✅ Card unmapped successfully!");
      setMappedCard(null);
      setIsActive(true);
      fetchAvailableCards();
    } catch (err) {
      console.error("Error unmapping card:", err);
      alert("Failed to unmap card");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActivation() {
    if (!mappedCard) return;
    setLoading(true);

    try {
      const apiUrl = isActive
        ? `${BASE_URL}/card/deactivate`
        : `${BASE_URL}/card/activate`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RfidNumber: mappedCard.RfidNumber }),
      });

      if (!res.ok) throw new Error("Failed to toggle activation");

      alert(isActive ? "⚠️ Card deactivated!" : "✅ Card activated!");
      setIsActive(!isActive);
    } catch (err) {
      console.error("Error toggling card activation:", err);
      alert("Failed to toggle card activation");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergencyPass() {
    if (!employee) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/user/emergency-status?UserId=${employee.employeeNumber}`
      );
      const data = await res.json();
      setEmergencyPass(data);
      alert("✅ Emergency pass generated!");
    } catch (err) {
      console.error("Error generating emergency pass:", err);
      alert("Failed to generate emergency pass");
    } finally {
      setLoading(false);
    }
  }

  if (!employee) return <div>No employee selected.</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Map Card to User</h2>
      <div style={{ marginBottom: "10px" }}>
        <strong>Name:</strong> {employee.name} <br />
        <strong>Designation:</strong> {employee.designation} <br />
        <strong>Department:</strong> {employee.department} <br />
        <strong>Employee Number:</strong> {employee.employeeNumber} <br />
        <strong>Email:</strong> {employee.email} <br />
      </div>

      {mappedCard ? (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "6px",
            background: "#f9f9f9",
          }}
        >
          <h3>✅ Already Mapped</h3>
          <p>
            <strong>RfidNumber:</strong> {mappedCard.RfidNumber} <br />
            <strong>UserName:</strong> {mappedCard.UserName} <br />
            <strong>UserId:</strong> {mappedCard.UserId} <br />
            <strong>UserType:</strong> {mappedCard.UserType || "N/A"} <br />
            <strong>Status:</strong> {isActive ? "Active" : "Inactive"}
          </p>

          <button
            onClick={handleUnmap}
            disabled={loading}
            style={{ ...btnStyle, background: "#dc3545", color: "#fff" }}
          >
            Unmap Card
          </button>

          <button
            onClick={handleToggleActivation}
            disabled={loading}
            style={{
              ...btnStyle,
              background: isActive ? "#ffc107" : "#28a745",
              color: "#000",
            }}
          >
            {isActive ? "Deactivate Card" : "Activate Card"}
          </button>

          <button
            onClick={handleEmergencyPass}
            disabled={loading}
            style={{ ...btnStyle, background: "#17a2b8", color: "#fff" }}
          >
            Generate Emergency Pass
          </button>

          {emergencyPass && (
            <p style={{ marginTop: "10px", color: "#17a2b8" }}>
              <strong>Emergency Pass:</strong>{" "}
              {emergencyPass.passId ||
                emergencyPass.code ||
                JSON.stringify(emergencyPass)}
            </p>
          )}

          <hr style={{ margin: "10px 0" }} />
          <h3>📡 Realtime Status</h3>
          <button
            onClick={fetchRealtimeStatus}
            style={{ ...btnStyle, background: "#007bff", color: "#fff" }}
          >
            Reload Status
          </button>

          {realtimeStatus ? (
            <pre
              style={{
                background: "#e9ecef",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {JSON.stringify(
                {
                  UserName: realtimeStatus.UserName,
                  type: realtimeStatus.type,
                  CardCheckInTime: realtimeStatus.CardCheckInTime,
                  CardCheckOutTime: realtimeStatus.CardCheckOutTime,
                },
                null,
                2
              )}
            </pre>
          ) : (
            <p>No realtime data loaded.</p>
          )}

          {/* --- Activity Logs Section --- */}
          <hr style={{ margin: "10px 0" }} />
          <h3>📝 Activity Logs</h3>
          {logsLoading ? (
            <p>Loading logs...</p>
          ) : logs.length === 0 ? (
            <p>No activity logs found.</p>
          ) : (
            <div>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    borderBottom: "1px solid #ccc",
                    padding: "6px 0",
                  }}
                >
                  <strong>{log.type.toUpperCase()}</strong> -{" "}
                  {log.CardCheckInTime || log.CardCheckOutTime || "N/A"}
                </div>
              ))}
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => setLogPage((p) => Math.max(p - 1, 1))}
                  disabled={logPage === 1}
                  style={{ ...btnStyle, background: "#007bff", color: "#fff" }}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setLogPage((p) => Math.min(p + 1, totalLogPages))
                  }
                  disabled={logPage === totalLogPages}
                  style={{ ...btnStyle, background: "#007bff", color: "#fff" }}
                >
                  Next
                </button>
                <span style={{ marginLeft: "10px" }}>
                  Page {logPage} of {totalLogPages}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>🆕 Map New Card</h3>
          <select
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
          >
            <option value="">Select Card</option>
            {availableCards.map((card) => (
              <option key={card.id} value={card.RfidNumber}>
                {card.RfidNumber}
              </option>
            ))}
          </select>
          <br />
          <button
            onClick={handleMap}
            disabled={loading}
            style={{
              ...btnStyle,
              marginTop: "10px",
              background: "#007bff",
              color: "#fff",
            }}
          >
            Map User
          </button>
        </div>
      )}
    </div>
  );
}
