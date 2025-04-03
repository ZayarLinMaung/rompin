import React, { useState, useEffect } from "react";
import axios from "axios";

const UserReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    console.log("Starting to fetch reservations...");
    console.log("Using token:", token ? "Token exists" : "No token found");

    try {
      const response = await axios.get(
        "http://localhost:5000/api/bookings/user",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Raw response:", response);
      console.log("Fetched reservations:", response.data);
      setReservations(response.data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch reservations on mount and when component becomes visible
  useEffect(() => {
    console.log("UserReservations component mounted");
    fetchReservations();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${reservationId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchReservations(); // Refresh the list after cancellation
      alert("Reservation cancelled successfully");
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      alert(err.response?.data?.message || "Error cancelling reservation");
    }
  };

  if (loading) {
    console.log("Showing loading state");
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading reservations...</p>
      </div>
    );
  }

  if (error) {
    console.log("Showing error state:", error);
    return (
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{error}</span>
        <button className="btn btn-primary mt-3" onClick={fetchReservations}>
          Try Again
        </button>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    console.log("No reservations found");
    return (
      <div className="no-reservations">
        <h3>No Reservations Found</h3>
        <p>You haven't made any reservations yet.</p>
      </div>
    );
  }

  console.log("Rendering reservations list:", reservations);

  return (
    <div className="reservations-section">
      <h3>My Reservations</h3>
      <div className="reservations-grid">
        {reservations.map((reservation) => (
          <div key={reservation._id} className="reservation-card">
            <div className="reservation-header">
              <h4>Unit {reservation.unitId?.unitNumber || "N/A"}</h4>
              <span
                className={`status-badge ${getStatusBadgeClass(
                  reservation.status
                )}`}
              >
                {reservation.status}
              </span>
            </div>

            <div className="reservation-details">
              <div className="detail-row">
                <div>
                  <strong>Agency</strong>
                  <p>{reservation.agencyName}</p>
                </div>
                <div>
                  <strong>Agent</strong>
                  <p>{reservation.agentName}</p>
                </div>
              </div>

              <div className="detail-row">
                <div>
                  <strong>Customer Name</strong>
                  <p>{reservation.name}</p>
                </div>
                <div>
                  <strong>Contact</strong>
                  <p>{reservation.contact}</p>
                </div>
              </div>

              <div className="detail-row">
                <div>
                  <strong>IC Number</strong>
                  <p>{reservation.ic}</p>
                </div>
                <div>
                  <strong>Address</strong>
                  <p>{reservation.address}</p>
                </div>
              </div>

              <div className="detail-row">
                <div>
                  <strong>Reserved On</strong>
                  <p>{formatDate(reservation.createdAt)}</p>
                </div>
                <div>
                  <strong>Last Updated</strong>
                  <p>{formatDate(reservation.updatedAt)}</p>
                </div>
              </div>

              {reservation.status === "pending" && (
                <div className="reservation-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancelReservation(reservation._id)}
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserReservations;
