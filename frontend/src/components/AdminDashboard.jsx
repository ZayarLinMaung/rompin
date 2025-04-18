import React, { useState, useEffect } from "react";
import axios from "axios";
import UnitCard from "./UnitCard";
import UnitModal from "./UnitModal";
import ReservationForm from "./ReservationForm";
import AdminReservations from "./AdminReservations";
import "./AdminDashboard.css";

const UNIT_TYPE_ORDER = {
  B1: 0,
  B: 1,
  C1: 2,
  C: 3,
};

const AdminDashboard = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeView, setActiveView] = useState("units");
  const [selectedFacing, setSelectedFacing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const UNITS_PER_PAGE = 12;

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch("http://localhost:5000/api/units", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }
      
      const data = await response.json();
      console.log("Full API Response:", data);
      console.log("Units from API:", data.units);
      console.log("Sample unit:", data.units?.[0]);
      
      // Extract units array from response
      const unitsData = data.units || [];
      setUnits(unitsData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching units:", err);
      setError(err.message);
      setUnits([]);
      setLoading(false);
    }
  };

  const handleViewSelect = (facing) => {
    const newFacing = facing === selectedFacing ? null : facing;
    setSelectedFacing(newFacing);
    setCurrentPage(1); // Reset pagination when changing view
  };

  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    setShowUnitModal(true);
  };

  const handleBookingClick = (unit) => {
    setSelectedUnit(unit);
    setShowBookingModal(true);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedUnit(null);
    setSelectedFacing(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleAddUnit = () => {
    setSelectedUnit(null);
    setShowUnitModal(true);
  };

  const handleUnitUpdate = async (updatedUnit) => {
    const token = localStorage.getItem("token");
    setError(null);

    try {
      console.log("Updating unit with data:", updatedUnit);
      const response = await axios.put(
        `http://localhost:5000/api/units/${updatedUnit._id}`,
        {
          ...updatedUnit,
          status: updatedUnit.status,
          isAvailable: updatedUnit.status === "available",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Update response:", response.data);

      setShowUnitModal(false);
      setSelectedUnit(null);
      await fetchUnits();
      alert("Unit updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Error updating unit");
      alert(err.response?.data?.message || "Error updating unit");
    }
  };

  const handleUnitDelete = async (unitId) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    const token = localStorage.getItem("token");
    setError(null);

    try {
      await axios.delete(`http://localhost:5000/api/units/${unitId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowUnitModal(false);
      setSelectedUnit(null);
      await fetchUnits();
      alert("Unit deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Error deleting unit");
      alert(err.response?.data?.message || "Error deleting unit");
    }
  };

  const handleUnitCreate = async (newUnit) => {
    const token = localStorage.getItem("token");
    setError(null);

    try {
      await axios.post("http://localhost:5000/api/units", newUnit, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setShowUnitModal(false);
      await fetchUnits();
      alert("Unit created successfully!");
    } catch (err) {
      console.error("Create error:", err);
      setError(err.response?.data?.message || "Error creating unit");
      alert(err.response?.data?.message || "Error creating unit");
    }
  };

  const handleBookingSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    setError(null);

    try {
      // Get the user ID from the token
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const userId = decodedToken.id;

      // Prepare the booking data with all required fields
      const bookingData = {
        unitId: selectedUnit._id,
        userId: userId,
        status: "reserved",
        agencyName: formData.agencyName || "",
        agentName: formData.agentName || "",
        name: formData.name,
        ic: formData.ic,
        contact: formData.contact,
        address: formData.address,
      };

      console.log("Submitting booking data:", bookingData);

      // Reserve unit using the new reserve endpoint
      const response = await axios.put(
        `http://localhost:5000/api/units/${selectedUnit._id}/reserve`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reservation response:", response.data);

      // Handle file uploads if present
      if (formData.proofOfPayment || formData.icSoftcopy) {
        const fileData = new FormData();
        if (formData.proofOfPayment) {
          fileData.append("proofOfPayment", formData.proofOfPayment);
        }
        if (formData.icSoftcopy) {
          fileData.append("icSoftcopy", formData.icSoftcopy);
        }

        // Upload files
        const fileResponse = await axios.post(
          `http://localhost:5000/api/units/${selectedUnit._id}/files`,
          fileData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("File upload response:", fileResponse.data);
      }

      // Close modal and refresh data
      setShowBookingModal(false);
      setSelectedUnit(null);
      await fetchUnits();

      // Show success message
      alert("Unit reserved successfully!");

      // Switch to reservations view
      setActiveView("reservations");
      setSelectedFacing(null);
      setCurrentPage(1);
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Error reserving unit. Please try again.";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getUnitsForType = () => {
    if (!selectedFacing || !Array.isArray(units)) return [];

    console.log("Current units:", units);
    console.log("Selected type:", selectedFacing);

    const filteredUnits = units.filter((unit) => {
      console.log("Checking unit:", unit);
      if (!unit || typeof unit !== 'object') {
        console.log("Invalid unit object");
        return false;
      }
      const matches = unit.phase === selectedFacing;
      console.log("Unit phase match:", matches, unit.phase);
      return matches;
    });

    console.log("Filtered units:", filteredUnits);

    return filteredUnits.sort((a, b) => {
      if (!a || !b) return 0;
      const aNum = parseInt(a.unitNumber?.replace(/[^0-9]/g, '') || '0');
      const bNum = parseInt(b.unitNumber?.replace(/[^0-9]/g, '') || '0');
        return aNum - bNum;
      });
  };

  const getUnitStats = (type) => {
    if (!Array.isArray(units)) {
      console.warn("Units is not an array:", units);
      return { total: 0, available: 0 };
    }

    const typeUnits = units.filter((unit) => {
      if (!unit || typeof unit !== 'object') return false;
      return unit.phase === type;
    });

    return {
      total: typeUnits.length,
      available: typeUnits.filter((u) => u && u.status === "PRESENT").length,
    };
  };

  const getPagedUnits = () => {
    const allUnits = getUnitsForType();
    const startIndex = (currentPage - 1) * UNITS_PER_PAGE;
    const pagedUnits = allUnits.slice(startIndex, startIndex + UNITS_PER_PAGE);
    console.log('Paged units:', pagedUnits); // Debug log
    return pagedUnits;
  };

  const getTotalPages = () => {
    const totalUnits = getUnitsForType().length;
    console.log('Total units:', totalUnits); // Debug log
    return Math.ceil(totalUnits / UNITS_PER_PAGE);
  };

  const renderPagination = (totalItems, itemsPerPage, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    // Calculate which page numbers to show (show max 5 pages)
    let pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If we have 5 or fewer pages, show all of them
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Otherwise show a window of pages around the current page
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;
      
      if (currentPage <= leftSide + 1) {
        // Near the start
        pageNumbers = Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
      } else if (currentPage >= totalPages - rightSide) {
        // Near the end
        pageNumbers = Array.from({ length: maxVisiblePages }, (_, i) => totalPages - maxVisiblePages + i + 1);
      } else {
        // In the middle
        pageNumbers = Array.from({ length: maxVisiblePages }, (_, i) => currentPage - leftSide + i);
      }
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {itemsPerPage * (currentPage - 1) + 1} to {Math.min(itemsPerPage * currentPage, totalItems)} of {totalItems} items
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ←
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => setCurrentPage(number)}
            >
              {number}
            </button>
          ))}
          
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading units...</p>
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
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Property Management Dashboard</h2>
        <div className="view-controls">
          <button
            className={activeView === "units" ? "active" : ""}
            onClick={() => handleViewChange("units")}
          >
            Units
          </button>
          <button
            className={activeView === "reservations" ? "active" : ""}
            onClick={() => handleViewChange("reservations")}
          >
            Reservations
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {activeView === "units" && (
        <>
          <div className="view-overview">
            <div
              className="view-card"
              onClick={() => handleViewSelect("TERES FASA 1")}
            >
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3"
                alt="TERES FASA 1"
                className="view-image"
              />
              <div className="view-content">
                <h3>TERES FASA 1</h3>
                <p>
                  Spacious 20' x 70' terrace houses with modern design and comfortable living spaces.
                </p>
                <div className="view-stats">
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {getUnitStats("TERES FASA 1").total}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">
                      {getUnitStats("TERES FASA 1").available}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Price:</span>
                    <span className="stat-value">RM 299,000</span>
                  </div>
                </div>
                <button
                  className={`view-button ${
                    selectedFacing === "TERES FASA 1" ? "active" : ""
                  }`}
                >
                  MANAGE TERES FASA 1 UNITS
                </button>
              </div>
            </div>

            <div
              className="view-card"
              onClick={() => handleViewSelect("TERES FASA 2")}
            >
              <img
                src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3"
                alt="TERES FASA 2"
                className="view-image"
              />
              <div className="view-content">
                <h3>TERES FASA 2</h3>
                <p>
                  Premium 20' x 70' terrace houses with enhanced features and strategic location.
                </p>
                <div className="view-stats">
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {getUnitStats("TERES FASA 2").total}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">
                      {getUnitStats("TERES FASA 2").available}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Price:</span>
                    <span className="stat-value">RM 309,000</span>
                  </div>
                </div>
                <button
                  className={`view-button ${
                    selectedFacing === "TERES FASA 2" ? "active" : ""
                  }`}
                >
                  MANAGE TERES FASA 2 UNITS
                </button>
              </div>
            </div>

            <div
              className="view-card"
              onClick={() => handleViewSelect("SEMI-D")}
            >
              <img
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3"
                alt="SEMI-D Units"
                className="view-image"
              />
              <div className="view-content">
                <h3>SEMI-D</h3>
                <p>
                  Luxurious 40' x 80' semi-detached houses with premium finishes and spacious layouts.
                </p>
                <div className="view-stats">
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {getUnitStats("SEMI-D").total}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">
                      {getUnitStats("SEMI-D").available}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Price:</span>
                    <span className="stat-value">RM 499,000</span>
                  </div>
                </div>
                <button
                  className={`view-button ${
                    selectedFacing === "SEMI-D" ? "active" : ""
                  }`}
                >
                  MANAGE SEMI-D UNITS
                </button>
              </div>
            </div>
          </div>

          {selectedFacing && (
            <div className="units-section">
              <div className="units-header">
                    <div className="header-left">
                  <h3>{selectedFacing} Units</h3>
                  <span className="unit-count">
                    {getUnitStats(selectedFacing).available} units available out of {getUnitsForType().length} total
                  </span>
                    </div>
                    <div className="header-right">
                      <button className="add-unit-btn" onClick={handleAddUnit}>
                        Add New Unit
                      </button>
                    </div>
                  </div>
                  <div className="units-grid">
                    {getPagedUnits().map((unit) => (
                      <div
                        key={unit._id}
                        className="unit-card"
                        onClick={() => handleUnitClick(unit)}
                      >
                        <div className="unit-header">
                          <h4>Unit {unit.unitNumber}</h4>
                          <span className={`unit-status status-${unit.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {unit.status}
                          </span>
                        </div>
                        <div className="unit-details">
                          <div className="detail-row">
                            <span className="label">Type:</span>
                            <span className="value">{unit.phase}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Area:</span>
                            <span className="value">
                              {unit.specifications?.builtUp || unit.builtUpArea || '-'} sq ft
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Price:</span>
                            <span className="value">
                              RM {(unit.specifications?.price || unit.spaPrice || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Status:</span>
                            <span className={`value status-value status-${unit.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {unit.status}
                            </span>
                          </div>
                        </div>
                        <div className="unit-actions">
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnitClick(unit);
                            }}
                          >
                            Edit
                          </button>
                          {unit.status === "PRESENT" && (
                            <button
                              className="book-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookingClick(unit);
                              }}
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPagination(getUnitsForType().length, UNITS_PER_PAGE, currentPage, handlePageChange)}
            </div>
          )}
        </>
      )}

      {activeView === "reservations" && <AdminReservations />}

      {showUnitModal && (
        <UnitModal
          unit={units.find((u) => u._id === selectedUnit?._id)}
          onClose={() => {
            setShowUnitModal(false);
            setSelectedUnit(null);
          }}
          onUpdate={handleUnitUpdate}
          onDelete={handleUnitDelete}
          onCreate={handleUnitCreate}
          isAdmin={true}
        />
      )}

      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => {
                setShowBookingModal(false);
                setSelectedUnit(null);
              }}
            >
              ×
            </button>
            <h3>Reserve Unit {selectedUnit?.unitNumber}</h3>
            <ReservationForm
              unit={selectedUnit}
              onSuccess={handleBookingSubmit}
              onClose={() => {
                setShowBookingModal(false);
                setSelectedUnit(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
