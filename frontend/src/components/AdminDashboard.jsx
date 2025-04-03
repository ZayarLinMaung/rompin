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
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingUnit, setBookingUnit] = useState(null);
  const [activeView, setActiveView] = useState("units");
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedFacing, setSelectedFacing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorPage, setFloorPage] = useState(1);
  const [sortBy, setSortBy] = useState("type"); // Default sort by type
  const [filters, setFilters] = useState({
    facing: "",
    minPrice: "",
    maxPrice: "",
    isAvailable: "",
    type: "",
    minArea: "",
    maxArea: "",
  });
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [currentFloorPage, setCurrentFloorPage] = useState(1);

  const UNITS_PER_PAGE = 12; // 2x6 grid

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      let url = "http://localhost:5000/api/units";
      if (selectedFacing) {
        const facing =
          selectedFacing === "Facility View"
            ? "facing[$regex]=^Facility View"
            : `facing=${selectedFacing}`;
        url += `?${facing}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter units by floor on the frontend
      let filteredUnits = response.data.units;
      if (selectedFloor) {
        filteredUnits = filteredUnits.filter((unit) => {
          const floorNumber = parseInt(unit.unitNumber.split("-")[0]);
          return floorNumber === selectedFloor;
        });
      }

      setUnits(filteredUnits);
    } catch (err) {
      console.error("Error fetching units:", err);
      setError(err.response?.data?.message || "Error fetching units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [selectedFacing, selectedFloor]);

  const handleViewSelect = (facing) => {
    setSelectedFacing(facing === selectedFacing ? null : facing);
  };

  const handleUnitClick = (unit) => {
    setSelectedUnitId(unit._id);
    setShowUnitModal(true);
  };

  const handleBookingClick = (unit) => {
    setBookingUnit(unit);
    setShowBookingModal(true);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedUnitId(null);
    setSelectedFacing(null);
  };

  const handleAddUnit = () => {
    setSelectedUnitId(null);
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
      setSelectedUnitId(null);
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
      setSelectedUnitId(null);
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
        unitId: bookingUnit._id,
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
        `http://localhost:5000/api/units/${bookingUnit._id}/reserve`,
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
          `http://localhost:5000/api/units/${bookingUnit._id}/files`,
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
      setBookingUnit(null);
      await fetchUnits();

      // Show success message
      alert("Unit reserved successfully!");

      // Switch to reservations view
      setActiveView("reservations");
      setSelectedUnitId(null);
      setSelectedFacing(null);
      setCurrentPage(1);
      setFloorPage(1);
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

  const handleFloorPageChange = (newPage) => {
    setCurrentFloorPage(newPage);
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
  };

  const getFloorNumbers = () => {
    const floors = [];
    for (let i = 4; i <= 39; i++) {
      floors.push(i);
    }
    return floors;
  };

  const getCurrentPageFloors = () => {
    const floors = getFloorNumbers();
    const itemsPerPage = 16; // 4x4 grid
    const startIndex = (currentFloorPage - 1) * itemsPerPage;
    return floors.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalFloorPages = () => {
    return Math.ceil((39 - 4 + 1) / 16); // (39-4+1) total floors divided by items per page
  };

  const getUnitsForFloor = () => {
    if (!selectedFloor || !selectedFacing) return [];

    return units
      .filter((unit) => {
        const floorNumber = parseInt(unit.unitNumber.split("-")[0]);
        const floorMatch = floorNumber === selectedFloor;
        const facingMatch =
          selectedFacing === "Facility View"
            ? unit.facing.startsWith("Facility View")
            : unit.facing === selectedFacing;
        return floorMatch && facingMatch;
      })
      .sort((a, b) => {
        const aNum = parseInt(a.unitNumber.split("-")[1]);
        const bNum = parseInt(b.unitNumber.split("-")[1]);
        return aNum - bNum;
      });
  };

  const getUnitStats = (facing) => {
    const facingUnits = units.filter((unit) => {
      if (facing === "Facility View") {
        return unit.facing.startsWith("Facility View");
      }
      return unit.facing === facing;
    });

    return {
      total: facingUnits.length,
      available: facingUnits.filter((u) => u.status === "available").length,
    };
  };

  const getPagedUnits = () => {
    const allUnits = getUnitsForFloor();
    const startIndex = (currentPage - 1) * UNITS_PER_PAGE;
    return allUnits.slice(startIndex, startIndex + UNITS_PER_PAGE);
  };

  const getTotalPages = () => {
    const totalUnits = getUnitsForFloor().length;
    return Math.ceil(totalUnits / UNITS_PER_PAGE);
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
        </div>
      </div>

      {activeView === "units" && (
        <>
          <div className="view-overview">
            <div
              className="view-card"
              onClick={() => handleViewSelect("Lake View")}
            >
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
                alt="Lake View Units"
                className="view-image"
              />
              <div className="view-content">
                <h3>Lake View</h3>
                <p>
                  Experience the serene beauty of our lake-facing units with
                  stunning waterfront views.
                </p>
                <div className="view-stats">
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {getUnitStats("Lake View").total}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">
                      {getUnitStats("Lake View").available}
                    </span>
                  </div>
                </div>
                <button
                  className={`view-button ${
                    selectedFacing === "Lake View" ? "active" : ""
                  }`}
                >
                  MANAGE LAKE VIEW UNITS
                </button>
              </div>
            </div>

            <div
              className="view-card"
              onClick={() => handleViewSelect("Facility View")}
            >
              <img
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
                alt="Facility View Units"
                className="view-image"
              />
              <div className="view-content">
                <h3>Facility View</h3>
                <p>
                  Enjoy convenient access to our world-class facilities and
                  amenities.
                </p>
                <div className="view-stats">
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {getUnitStats("Facility View").total}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">
                      {getUnitStats("Facility View").available}
                    </span>
                  </div>
                </div>
                <button
                  className={`view-button ${
                    selectedFacing === "Facility View" ? "active" : ""
                  }`}
                >
                  MANAGE FACILITY VIEW UNITS
                </button>
              </div>
            </div>
          </div>

          {selectedFacing && (
            <div className="floor-selection">
              {!selectedFloor ? (
                <>
                  <h3>Select Floor</h3>
                  <div className="floor-grid">
                    {getCurrentPageFloors().map((floor) => (
                      <button
                        key={floor}
                        className="floor-button"
                        onClick={() => handleFloorSelect(floor)}
                      >
                        {floor}
                      </button>
                    ))}
                  </div>
                  <div className="pagination">
                    {Array.from(
                      { length: getTotalFloorPages() },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        className={`page-button ${
                          currentFloorPage === page ? "active" : ""
                        }`}
                        onClick={() => handleFloorPageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="floor-units">
                  <div className="floor-header">
                    <div className="header-left">
                      <button
                        className="back-button"
                        onClick={() => setSelectedFloor(null)}
                      >
                        ← Back to Floors
                      </button>
                      <h3>Floor {selectedFloor} Units</h3>
                    </div>
                    <button className="add-unit-btn" onClick={handleAddUnit}>
                      Add New Unit
                    </button>
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
                          <span className={`unit-status ${unit.status}`}>
                            {unit.status}
                          </span>
                        </div>
                        <div className="unit-details">
                          <div className="detail-row">
                            <span className="label">Type:</span>
                            <span className="value">{unit.type}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Area:</span>
                            <span className="value">
                              {unit.builtUpArea} sq ft
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Price:</span>
                            <span className="value">
                              RM {unit.spaPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Facing:</span>
                            <span className="value">{unit.facing}</span>
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
                          {unit.status === "available" && (
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
                  {getTotalPages() > 1 && (
                    <div className="pagination">
                      {Array.from(
                        { length: getTotalPages() },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          className={`page-button ${
                            currentPage === page ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeView === "reservations" && <AdminReservations />}

      {showUnitModal && (
        <UnitModal
          unit={units.find((u) => u._id === selectedUnitId)}
          onClose={() => {
            setShowUnitModal(false);
            setSelectedUnitId(null);
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
                setBookingUnit(null);
              }}
            >
              ×
            </button>
            <h3>Reserve Unit {bookingUnit?.unitNumber}</h3>
            <ReservationForm
              unit={bookingUnit}
              onSuccess={handleBookingSubmit}
              onClose={() => {
                setShowBookingModal(false);
                setBookingUnit(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
