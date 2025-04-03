import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminReservations.css";

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReservation, setExpandedReservation] = useState(null);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      console.log("Fetching reservations...");
      const response = await axios.get("http://localhost:5000/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Raw response:", response);
      console.log("Fetched reservations:", response.data);

      // Log file paths for debugging
      response.data.forEach((reservation) => {
        if (reservation.icSoftcopy) {
          console.log("IC Softcopy path:", reservation.icSoftcopy);
        }
        if (reservation.proofOfPayment) {
          console.log("Payment proof path:", reservation.proofOfPayment);
        }
      });

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      setReservations(response.data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatusUpdate = async (reservationId, newStatus) => {
    const token = localStorage.getItem("token");
    setError(null);

    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${reservationId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchReservations();

      // Show appropriate message based on status
      const message =
        newStatus === "approved"
          ? "Reservation approved and automatically set to booked!"
          : "Reservation status updated successfully!";
      alert(message);
    } catch (err) {
      console.error("Error updating status:", err);
      setError(
        err.response?.data?.message || "Error updating reservation status"
      );
      alert(err.response?.data?.message || "Error updating reservation status");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpandReservation = (reservationId) => {
    setExpandedReservation(
      expandedReservation === reservationId ? null : reservationId
    );
  };

  const getImageUrl = (filePath) => {
    if (!filePath) return null;

    // If the path already starts with 'uploads/', just append it to the base URL
    if (filePath.startsWith('uploads/')) {
      return `http://localhost:5000/${filePath}`;
    }
    
    // Handle full file paths (for backward compatibility)
    if (filePath.includes('\\') || filePath.includes('/')) {
      // Extract just the filename
      const parts = filePath.split(/[\\\/]/);
      const filename = parts[parts.length - 1];
      return `http://localhost:5000/uploads/${filename}`;
    }
    
    // Default case - just return the path appended to uploads 
    return `http://localhost:5000/uploads/${filePath}`;
  };

  const handleViewDocument = (documentPath, documentType) => {
    if (!documentPath) {
      console.log(`No ${documentType} document available`);
      return;
    }

    const url = getImageUrl(documentPath);
    if (!url) {
      console.log(`Failed to load ${documentType} document: `, {
        original: documentPath,
        attempted: url,
      });
      return;
    }

    // Open document in new tab
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading reservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{error}</span>
      </div>
    );
  }

  return (
    <div className="admin-reservations">
      <h3>All Reservations</h3>
      <div className="reservations-list">
        {reservations.length === 0 ? (
          <p className="no-reservations">No reservations found.</p>
        ) : (
          <div className="reservation-cards">
            {reservations.map((reservation) => (
              <div key={reservation._id} className="reservation-card">
                <div
                  className="reservation-header"
                  onClick={() => toggleExpandReservation(reservation._id)}
                >
                  <div className="header-left">
                    <h4>Unit {reservation.unitId?.unitNumber || "N/A"}</h4>
                    <span
                      className={`status-badge ${(
                        reservation.status || "pending"
                      ).toLowerCase()}`}
                    >
                      {reservation.status || "Pending"}
                    </span>
                  </div>
                  <div className="header-right">
                    <span className="reservation-date">
                      {formatDate(reservation.createdAt)}
                    </span>
                    <button className="expand-button">
                      {expandedReservation === reservation._id ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {expandedReservation === reservation._id && (
                  <div className="reservation-details">
                    <div className="details-section">
                      <h5>Unit Details</h5>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Unit Number:</label>
                          <span>{reservation.unitId?.unitNumber || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>Unit Type:</label>
                          <span>{reservation.unitId?.type || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>Built-up Area:</label>
                          <span>
                            {reservation.unitId?.builtUpArea || "N/A"} sqft
                          </span>
                        </div>
                        <div className="detail-item">
                          <label>SPA Price:</label>
                          <span>
                            RM{" "}
                            {reservation.unitId?.spaPrice?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h5>Agency Information</h5>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Agency Name:</label>
                          <span>{reservation.agencyName || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>Agent Name:</label>
                          <span>{reservation.agentName || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h5>Customer Information</h5>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Name:</label>
                          <span>{reservation.name || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>IC Number:</label>
                          <span>{reservation.ic || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>Contact:</label>
                          <span>{reservation.contact || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <label>Address:</label>
                          <span>{reservation.address || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h5>Documents & Payment</h5>
                      <div className="document-grid">
                        <div className="document-item">
                          <label>IC Softcopy:</label>
                          <div className="document-preview">
                            {reservation.icSoftcopy ? (
                              <>
                                <div className="document-thumbnail">
                                  <img
                                    src={getImageUrl(reservation.icSoftcopy)}
                                    alt="IC Document"
                                    onError={(e) => {
                                      console.error(
                                        "Failed to load IC document:",
                                        {
                                          original: reservation.icSoftcopy,
                                          attempted: e.target.src,
                                        }
                                      );
                                      e.target.onerror = null;
                                      e.target.src =
                                        "https://via.placeholder.com/100x100?text=Error+Loading+Document";
                                    }}
                                  />
                                </div>
                                <div className="document-actions">
                                  <a
                                    href={getImageUrl(reservation.icSoftcopy)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-document-btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleViewDocument(
                                        reservation.icSoftcopy,
                                        "IC Softcopy"
                                      );
                                    }}
                                  >
                                    View Full Document
                                  </a>
                                </div>
                              </>
                            ) : (
                              <span className="no-document">
                                No IC document uploaded
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="document-item">
                          <label>Proof of Payment:</label>
                          <div className="document-preview">
                            {reservation.proofOfPayment ? (
                              <>
                                <div className="document-thumbnail">
                                  <img
                                    src={getImageUrl(
                                      reservation.proofOfPayment
                                    )}
                                    alt="Payment Proof"
                                    onError={(e) => {
                                      console.error(
                                        "Failed to load payment proof:",
                                        {
                                          original: reservation.proofOfPayment,
                                          attempted: e.target.src,
                                        }
                                      );
                                      e.target.onerror = null;
                                      e.target.src =
                                        "https://via.placeholder.com/100x100?text=Error+Loading+Document";
                                    }}
                                  />
                                </div>
                                <div className="document-actions">
                                  <a
                                    href={getImageUrl(
                                      reservation.proofOfPayment
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-document-btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleViewDocument(
                                        reservation.proofOfPayment,
                                        "Payment Proof"
                                      );
                                    }}
                                  >
                                    View Full Document
                                  </a>
                                </div>
                              </>
                            ) : (
                              <span className="no-document">
                                No payment proof uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h5>Reservation Status</h5>
                      <div className="status-update">
                        <select
                          value={reservation.status || "pending"}
                          onChange={(e) =>
                            handleStatusUpdate(reservation._id, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">
                            Approve (Will set to Booked)
                          </option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="status-timestamps">
                          <div>
                            Created: {formatDate(reservation.createdAt)}
                          </div>
                          <div>
                            Last Updated: {formatDate(reservation.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReservations;
