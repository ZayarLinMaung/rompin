import React, { useState, useEffect } from "react";
import axios from "axios";
import ReservationForm from "./ReservationForm";
import UserReservations from "./UserReservations";
import "./UserDashboard.css";

const UserDashboard = ({ user: initialUser }) => {
  const [activeView, setActiveView] = useState("overview");
  const [selectedView, setSelectedView] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorPage, setFloorPage] = useState(1);
  const floorsPerPage = 18;
  const unitsPerPage = 12;
  const [units, setUnits] = useState({ total: 0, groupedUnits: {}, units: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.phone || "",
    currentPassword: "",
    newPassword: "",
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingUnit, setBookingUnit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Add polling interval state
  const [pollingInterval, setPollingInterval] = useState(null);

  // Set up polling when component mounts
  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    if (selectedView || activeView === "reservations") {
      fetchUnits();
    }

    // Set up polling every 5 seconds, but don't poll when booking modal is open
    const interval = setInterval(() => {
      if (
        (selectedView || activeView === "reservations") &&
        isMounted &&
        !showBookingModal
      ) {
        fetchUnits(false); // false means don't show loading state
      }
    }, 5000);

    setPollingInterval(interval);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedView, activeView, showBookingModal]);

  const fetchUnits = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const unitsResponse = await axios.get("http://localhost:5000/api/units", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });

      // Process the units data
      const processedUnits = {
        ...unitsResponse.data,
        units: unitsResponse.data.units.map((unit) => {
          const [floor, unitNum] = unit.unitNumber.split("-");
          const unitNumber = parseInt(unitNum, 10);
          return {
            ...unit,
            facing:
              unitNumber >= 8 && unitNumber <= 18
                ? "Lake View"
                : "Facility View",
          };
        }),
      };

      setUnits(processedUnits);
    } catch (err) {
      console.error("Error fetching units:", err);
      if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please check your connection.");
      } else {
        setError(
          err.response?.data?.message ||
            "Error fetching units. Please try again."
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleViewSelect = (view) => {
    setSelectedView(view);
    setActiveView("units");
  };

  const handleBookUnit = (unit) => {
    console.log("Booking unit:", unit);
    setBookingUnit(unit);
    setShowBookingModal(true);
    console.log("Modal should be open now");
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setBookingUnit(null);
    setBookingError(null);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setBookingError(null);
      const token = localStorage.getItem("token");

      // Check if the unit is still available
      const unitResponse = await axios.get(
        `http://localhost:5000/api/units/${bookingUnit._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!unitResponse.data.isAvailable) {
        setBookingError("This unit is no longer available for reservation.");
        setIsSubmitting(false);
        return;
      }

      // Prepare the reservation data
      const reservationData = {
        agencyName: values.agencyName,
        agentName: values.agentName,
        customerName: values.name,
        customerIC: values.ic,
        customerContact: values.contact,
        customerAddress: values.address,
      };

      console.log("Sending reservation data:", reservationData);

      // First, create the reservation
      const reservationResponse = await axios.put(
        `http://localhost:5000/api/units/${bookingUnit._id}/reserve`,
        reservationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reservation response:", reservationResponse.data);

      // Then, handle file uploads if files are present
      if (values.proofOfPayment || values.icSoftcopy) {
        const formData = new FormData();
        if (values.proofOfPayment) {
          formData.append("proofOfPayment", values.proofOfPayment);
        }
        if (values.icSoftcopy) {
          formData.append("icSoftcopy", values.icSoftcopy);
        }

        await axios.post(
          `http://localhost:5000/api/units/${bookingUnit._id}/files`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setIsSubmitting(false);
      setBookingSuccess(true);
      handleCloseModal();
      fetchUnits(); // Refresh the units list
      setActiveView("reservations"); // Switch to reservations view
    } catch (error) {
      console.error("Booking error:", error);
      setIsSubmitting(false);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).join(
          ", "
        );
        setBookingError(`Validation error: ${errorMessages}`);
      } else {
        setBookingError(
          error.response?.data?.message ||
            "Failed to submit booking. Please try again."
        );
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);
    const token = localStorage.getItem("token");

    try {
      // Only send the fields that are required by the backend
      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword,
        ...(profileForm.newPassword && {
          newPassword: profileForm.newPassword,
        }),
      };

      await axios.put("http://localhost:5000/api/users/profile", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUpdateSuccess(true);
      setIsEditingProfile(false);
      // Reset password fields
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      // Update the parent component's user state if needed
      if (typeof initialUser.onUpdate === "function") {
        initialUser.onUpdate({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        });
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Error updating profile");
    }
  };

  const formatUnitNumber = (unitNumber) => {
    const [floor, unit] = unitNumber.split("-");
    return `${String(floor).padStart(2, "0")}-${String(unit).padStart(2, "0")}`;
  };

  const formatFloorNumber = (floor) => {
    return String(floor).padStart(2, "0");
  };

  const renderOverviewView = () => (
    <div className="overview-section">
      <h3>Welcome to Rompin</h3>
      <div className="view-options">
        <div className="view-option lake-view">
          <div className="view-image">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
              alt="Lake View"
            />
          </div>
          <div className="view-content">
            <h4>Lake View</h4>
            <p>
              Experience the serene beauty of our lake-facing units with
              stunning waterfront views.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleViewSelect("lake")}
            >
              Explore Lake View Units
            </button>
          </div>
        </div>
        <div className="view-option facility-view">
          <div className="view-image">
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
              alt="Facility View"
            />
          </div>
          <div className="view-content">
            <h4>Facility View</h4>
            <p>
              Enjoy convenient access to our world-class facilities and
              amenities.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleViewSelect("facility")}
            >
              Explore Facility View Units
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter and sort units
  const getFilteredAndSortedUnits = () => {
    if (!units?.units) return [];

    return units.units.filter((unit) => {
      // Filter by view type (lake or facility)
      const [floor, unitNum] = unit.unitNumber.split("-");
      const floorNumber = parseInt(floor, 10);
      const unitNumber = parseInt(unitNum, 10);

      // Only show units from floor 4 and above
      if (floorNumber < 4) return false;

      const isLakeView = unitNumber >= 8 && unitNumber <= 18;

      if (selectedView === "lake") {
        return isLakeView;
      } else if (selectedView === "facility") {
        return !isLakeView;
      }
      return true;
    });
  };

  const renderUnitsView = () => {
    if (!units?.units) {
      return <div className="loading">Loading units...</div>;
    }

    const filteredUnits = getFilteredAndSortedUnits();

    // Group units by floor
    const unitsByFloor = filteredUnits.reduce((acc, unit) => {
      const floor = unit.unitNumber.split("-")[0];
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(unit);
      return acc;
    }, {});

    // Create an array of floor numbers from 4 to 39
    const allFloors = Array.from({ length: 36 }, (_, i) => String(i + 4)).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    // Use only the floors that have units in the database
    const validFloors = allFloors.reduce((acc, floor) => {
      if (unitsByFloor[floor]) {
        acc[floor] = unitsByFloor[floor].sort((a, b) => {
          const [, unitA] = a.unitNumber.split("-");
          const [, unitB] = b.unitNumber.split("-");
          return parseInt(unitA) - parseInt(unitB);
        });
      }
      return acc;
    }, {});

    // Ensure we're showing floors in ascending order
    const sortedFloorNumbers = Object.keys(validFloors).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    // Pagination for floors
    const paginateFloors = (floors) => {
      const startIndex = (floorPage - 1) * floorsPerPage;
      const endIndex = startIndex + floorsPerPage;
      return floors.slice(startIndex, endIndex);
    };

    const renderFloorPagination = (totalFloors) => {
      const totalPages = Math.ceil(totalFloors / floorsPerPage);
      if (totalPages <= 1) return null;

      return (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setFloorPage((prev) => Math.max(1, prev - 1))}
            disabled={floorPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {floorPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() =>
              setFloorPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={floorPage === totalPages}
          >
            Next
          </button>
        </div>
      );
    };

    // Pagination for units in a floor
    const paginateUnits = (units) => {
      const startIndex = (currentPage - 1) * unitsPerPage;
      const endIndex = startIndex + unitsPerPage;
      return units.slice(startIndex, endIndex);
    };

    const renderUnitsPagination = (totalUnits) => {
      const totalPages = Math.ceil(totalUnits / unitsPerPage);
      if (totalPages <= 1) return null;

      return (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      );
    };

    // Update the unit card rendering to show the correct view type
    const renderUnitCard = (unit) => {
      const [, unitNum] = unit.unitNumber.split("-");
      const unitNumber = parseInt(unitNum, 10);
      const isLakeView = unitNumber >= 8 && unitNumber <= 18;
      const viewType = isLakeView ? "Lake View" : "Facility View";

      const getStatusClass = (unit) => {
        switch (unit.status) {
          case "booked":
            return "booked";
          case "reserved":
            return "reserved";
          case "available":
            return "available";
          default:
            return unit.isAvailable ? "available" : "reserved";
        }
      };

      const getStatusText = (unit) => {
        switch (unit.status) {
          case "booked":
            return "Booked";
          case "reserved":
            return "Reserved";
          case "available":
            return "Available";
          default:
            return unit.isAvailable ? "Available" : "Reserved";
        }
      };

      const isExpanded = selectedUnitId === unit._id;
      const shouldShow = !selectedUnitId || isExpanded;

      return (
        <div
          key={unit._id}
          className={`unit-card ${getStatusClass(unit)} ${
            isExpanded ? "expanded" : "minimized"
          } ${shouldShow ? "" : "hidden"}`}
          onClick={() => {
            if (selectedUnitId === unit._id) {
              setSelectedUnitId(null);
            } else {
              setSelectedUnitId(unit._id);
            }
          }}
        >
          <div className="unit-header">
            <h4>Unit {unit.unitNumber}</h4>
            <div className="unit-status">
              <span className={`status-badge ${getStatusClass(unit)}`}>
                {getStatusText(unit)}
              </span>
              <p className="view-type">{viewType}</p>
            </div>
          </div>
          <div className="unit-details">
            <div className="detail-row">
              <div>
                <strong>Type</strong>
                <p>{unit.type}</p>
              </div>
              <div>
                <strong>Facing</strong>
                <p>{unit.facing}</p>
              </div>
            </div>
            <div className="detail-row">
              <div>
                <strong>Built-up Area</strong>
                <p>{unit.builtUpArea} sq ft</p>
              </div>
              <div>
                <strong>Price</strong>
                <p>RM {unit.spaPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="detail-row">
              <div>
                <strong>Price per sq ft</strong>
                <p>RM {(unit.spaPrice / unit.builtUpArea).toFixed(2)}</p>
              </div>
              <div>
                <strong>Total Car Parks</strong>
                <p>{unit.totalCarParks}</p>
              </div>
            </div>
            {unit.isAvailable && (
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    "Reserve button clicked for unit:",
                    unit.unitNumber
                  );
                  handleBookUnit(unit);
                }}
              >
                Reserve Unit
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="units-section">
        <div className="units-header">
          <h3>{selectedView === "lake" ? "Lake View Units" : "Facility View Units"}</h3>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedView(null);
                setSelectedFloor(null);
                setCurrentPage(1);
                setFloorPage(1);
                setActiveView("overview");
                setSelectedUnitId(null);
              }}
            >
              Back to Overview
            </button>
            {selectedFloor && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedFloor(null);
                  setFloorPage(1);
                  setSelectedUnitId(null);
                  setCurrentPage(1);
                }}
              >
                Back to Floors
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading units...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : !selectedFloor ? (
          <>
            <div className="floors-grid">
              {paginateFloors(sortedFloorNumbers).map((floor) => {
                const floorUnits = validFloors[floor];
                const availableUnits = floorUnits.filter(
                  (unit) => unit.isAvailable
                ).length;

                return (
                  <button
                    key={floor}
                    className="floor-button"
                    onClick={() => {
                      setSelectedFloor(floor);
                      setCurrentPage(1);
                    }}
                  >
                    <h3>Floor {floor}</h3>
                    <div className="unit-counts">
                      <p>{floorUnits.length} Total Units</p>
                      <p className="available-count">
                        {availableUnits} Available
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {renderFloorPagination(sortedFloorNumbers.length)}
          </>
        ) : (
          <div className="floor-detail">
            <div className="units-grid-3x4">
              {paginateUnits(
                validFloors[selectedFloor].sort((a, b) => {
                  const [, unitA] = a.unitNumber.split("-");
                  const [, unitB] = b.unitNumber.split("-");
                  return parseInt(unitA, 10) - parseInt(unitB, 10);
                })
              ).map((unit) => renderUnitCard(unit))}
            </div>
            {renderUnitsPagination(validFloors[selectedFloor].length)}
          </div>
        )}
      </div>
    );
  };

  const renderProfileView = () => (
    <div className="profile-section">
      <h3>My Profile</h3>
      <div className="profile-content">
        {isEditingProfile ? (
          <form onSubmit={handleProfileUpdate} className="profile-form">
            {updateError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{updateError}</span>
              </div>
            )}
            {updateSuccess && (
              <div className="success-message">
                Profile updated successfully!
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={profileForm.currentPassword}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password (Optional)</label>
              <input
                type="password"
                className="form-input"
                value={profileForm.newPassword}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditingProfile(false);
                  setUpdateError(null);
                  setUpdateSuccess(false);
                  // Reset form to initial values
                  setProfileForm({
                    name: initialUser.name,
                    email: initialUser.email,
                    phone: initialUser.phone || "",
                    currentPassword: "",
                    newPassword: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{initialUser.name}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{initialUser.email}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{initialUser.phone || "Not provided"}</span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setIsEditingProfile(true)}
            >
              Update Profile
            </button>
          </>
        )}
      </div>
    </div>
  );

  const BookingModal = () => {
    if (!showBookingModal || !bookingUnit) return null;

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Reserve Unit {bookingUnit.unitNumber}</h3>
            <button
              className="modal-close"
              onClick={handleCloseModal}
              type="button"
            >
              &times;
            </button>
          </div>

          <ReservationForm
            unit={bookingUnit}
            onSuccess={handleBookingSubmit}
            onClose={handleCloseModal}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard user-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {initialUser.name}</h2>
        <div className="view-navigation">
          <button
            className={`view-button ${
              activeView === "overview" ? "active" : ""
            }`}
            onClick={() => {
              setActiveView("overview");
              setSelectedView(null);
            }}
          >
            Overview
          </button>
          <button
            className={`view-button ${
              activeView === "profile" ? "active" : ""
            }`}
            onClick={() => {
              setActiveView("profile");
              setSelectedView(null);
            }}
          >
            My Profile
          </button>
          <button
            className={`view-button ${
              activeView === "reservations" ? "active" : ""
            }`}
            onClick={() => {
              setActiveView("reservations");
              setSelectedView(null);
            }}
          >
            My Reservations
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "overview" && renderOverviewView()}
        {activeView === "profile" && renderProfileView()}
        {activeView === "units" && renderUnitsView()}
        {activeView === "reservations" && <UserReservations />}
      </div>

      {showBookingModal && <BookingModal />}
    </div>
  );
};

export default UserDashboard;
