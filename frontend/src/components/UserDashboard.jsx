import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import ReservationForm from "./ReservationForm";
import UserReservations from "./UserReservations";
import "./UserDashboard.css";

const UserDashboard = ({ user: initialUser }) => {
  const isLoggedIn = !!localStorage.getItem('token');
  const user = isLoggedIn ? initialUser : null;

  const [activeView, setActiveView] = useState("overview");
  const [selectedView, setSelectedView] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorPage, setFloorPage] = useState(1);
  const floorsPerPage = 18;
  const unitsPerPage = 6;
  const [units, setUnits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
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
  const [pollingInterval, setPollingInterval] = useState(null);
  const [unitStatsData, setUnitStatsData] = useState({
    'TERES FASA 1': { total: 0, present: 0, advise: 0, landowner: 0 },
    'TERES FASA 2': { total: 0, present: 0, advise: 0, landowner: 0 },
    'SEMI-D': { total: 0, present: 0, advise: 0, landowner: 0 }
  });

  // Update profileForm when user data changes
  useEffect(() => {
    if (isLoggedIn && user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [isLoggedIn, user]);

  // 1. Define all utility functions first
  const getUnitType = useCallback((unitNumber) => {
    const numericPart = parseInt(unitNumber.replace(/[^\d]/g, ''));
    if (numericPart >= 1 && numericPart <= 37) return 'TERES FASA 1';
    if (numericPart >= 38 && numericPart <= 74) return 'TERES FASA 2';
    return 'SEMI-D';
  }, []);

  const getUnitStats = useCallback((type, unitsData) => {
    if (!unitsData?.units) return { total: 0, available: 0, advise: 0, landowner: 0 };
    
    console.log("Processing units for", type, "Total units:", unitsData.units.length);
    
    const typeUnits = unitsData.units.filter(unit => {
      const numericPart = parseInt(unit.unitNumber.replace(/[^\d]/g, ''));
      let match = false;
      switch (type) {
        case "TERES FASA 1": match = (numericPart >= 1 && numericPart <= 37); break;
        case "TERES FASA 2": match = (numericPart >= 38 && numericPart <= 74); break;
        case "SEMI-D": match = (numericPart >= 75); break;
        default: match = false;
      }
      return match;
    });
    
    console.log(`${type} units:`, typeUnits.length);
    console.log(`${type} PRESENT units:`, typeUnits.filter(u => u.status === 'PRESENT').length);
    
    return {
      total: typeUnits.length,
      present: typeUnits.filter(unit => unit.status === 'PRESENT').length,
      advise: typeUnits.filter(unit => unit.status === 'ADVISE').length,
      landowner: typeUnits.filter(unit => unit.status === 'LANDOWNER UNIT').length
    };
  }, []);

  // 2. Define all memoized values
  const processedUnits = useMemo(() => {
    if (!units?.units) return [];
    return units.units.map(unit => ({
      ...unit,
      type: getUnitType(unit.unitNumber)
    }));
  }, [units, getUnitType]);

  const filteredUnits = useMemo(() => {
    return processedUnits
      .filter((unit) => !selectedView || unit.type === selectedView)
      .sort((a, b) => {
        const numA = parseInt(a.unitNumber.replace(/\D/g, ''));
        const numB = parseInt(b.unitNumber.replace(/\D/g, ''));
        return numA - numB;
      });
  }, [processedUnits, selectedView]);

  const unitStats = useMemo(() => {
    if (!processedUnits.length) return {};
    // If we have unitStatsData, use that instead of calculating again
    if (Object.keys(unitStatsData).length > 0 && 
        unitStatsData['TERES FASA 1'] && 
        unitStatsData['TERES FASA 2'] && 
        unitStatsData['SEMI-D']) {
      return unitStatsData;
    }
    // Otherwise use the original calculation logic
    return {
      'TERES FASA 1': getUnitStats('TERES FASA 1', units),
      'TERES FASA 2': getUnitStats('TERES FASA 2', units),
      'SEMI-D': getUnitStats('SEMI-D', units)
    };
  }, [processedUnits, getUnitStats, units, unitStatsData]);

  // 3. Define all event handlers
  const handleBookUnit = (unit) => {
    if (!isLoggedIn) {
      // Redirect to login if user is not authenticated
      const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      window.location.href = loginUrl;
      return;
    }
    setBookingUnit(unit);
    setShowBookingModal(true);
  };

  const handleCloseModal = useCallback(() => {
    setShowBookingModal(false);
    setBookingUnit(null);
    setBookingError(null);
    setBookingSuccess(false);
  }, []);

  const handleViewSelect = useCallback((view) => {
    setSelectedView(view);
    setActiveView("units");
  }, []);

  // 4. Define data fetching
  const fetchUnits = useCallback(async () => {
    try {
      console.log("Before API calls");
      // Fetch units for rendering unit cards and details
      const unitsResponse = await axios.get('http://localhost:5000/api/units');
      
      console.log("Units response data:", unitsResponse.data);
      
      if (JSON.stringify(unitsResponse.data) !== JSON.stringify(units)) {
        setUnits(unitsResponse.data);
        
        // Since /types endpoint is failing, calculate stats directly from units data
        if (unitsResponse.data && unitsResponse.data.units) {
          const statsObject = {
            'TERES FASA 1': getUnitStats('TERES FASA 1', unitsResponse.data),
            'TERES FASA 2': getUnitStats('TERES FASA 2', unitsResponse.data),
            'SEMI-D': getUnitStats('SEMI-D', unitsResponse.data)
          };
          setUnitStatsData(statsObject);
        }
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      setError(error.message);
    } finally {
        setLoading(false);
      }
  }, [getUnitType, units, getUnitStats]);

  // 5. Define effects
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!showBookingModal && isMounted) {
        await fetchUnits();
      }
    };

    fetchData();

    let interval;
    if (!showBookingModal) {
      interval = setInterval(fetchData, 5000);
      setPollingInterval(interval);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [showBookingModal, fetchUnits]);

  // Memoize the render functions
  const getStatusClass = useCallback((status) => {
    switch (status) {
      case 'PRESENT':
        return 'available';
      case 'ADVISE':
        return 'reserved';
      case 'LANDOWNER UNIT':
        return 'booked';
      default:
        return 'available';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'PRESENT':
        return 'Available';
      case 'ADVISE':
        return 'Advise';
      case 'LANDOWNER UNIT':
        return 'Landowner Unit';
      default:
        return status || 'Unknown';
    }
  }, []);

  const renderUnitCard = (unit) => {
    const isUnitAvailable = unit.status === "PRESENT";
    
    return (
      <div key={unit._id} className="unit-row">
        <div className="unit-cell unit-number">
          <span>Unit {unit.unitNumber}</span>
        </div>
        <div className="unit-cell unit-type">
          <span>{getUnitType(unit.unitNumber)}</span>
        </div>
        <div className="unit-cell unit-status">
          <span className={`status-badge ${unit.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {getStatusText(unit.status)}
          </span>
        </div>
        <div className="unit-cell unit-specs">
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Built-Up:</span>
              <span className="spec-value">{unit.specifications?.builtUp || '-'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Land Size:</span>
              <span className="spec-value">{unit.specifications?.landSize || '-'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Extra Land:</span>
              <span className="spec-value">{unit.specifications?.extraLand || '-'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Bed/Bath:</span>
              <span className="spec-value">{unit.specifications?.bedrooms || '-'}/{unit.specifications?.bathrooms || '-'}</span>
            </div>
          </div>
        </div>
        <div className="unit-cell unit-action">
          {isUnitAvailable && (
            <button
              className="book-button"
              onClick={() => handleBookUnit(unit)}
            >
              {isLoggedIn ? 'Book Now' : 'Login to Book'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Memoize pagination
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * unitsPerPage;
    const endIndex = startIndex + unitsPerPage;
    return filteredUnits.slice(startIndex, endIndex);
  }, [filteredUnits, currentPage, unitsPerPage]);

  const renderUnitsPagination = useCallback((totalUnits) => {
    const totalPages = Math.ceil(totalUnits / unitsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {unitsPerPage * (currentPage - 1) + 1} to {Math.min(unitsPerPage * currentPage, totalUnits)} of {totalUnits} units
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ←
          </button>
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
  }, [currentPage, unitsPerPage]);

  const handleBookingSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setBookingError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      console.log("Starting reservation process for unit:", bookingUnit);

      // Check if the unit is still available
      const unitResponse = await axios.get(
        `http://localhost:5000/api/units/${bookingUnit._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Unit availability check response:", unitResponse.data);

      if (!unitResponse.data.isAvailable) {
        setBookingError("This unit is no longer available for reservation.");
        setIsSubmitting(false);
        return;
      }

      // Prepare the reservation data
      const reservationData = {
        agencyName: values.agencyName || "",
        agentName: values.agentName || "",
        name: values.name || "",
        ic: values.ic || "",
        contact: values.contact || "",
        address: values.address || "",
        unitId: bookingUnit._id,
        unitNumber: bookingUnit.unitNumber
      };

      console.log("Form values received:", values);
      console.log("Prepared reservation data:", reservationData);
      console.log("Request headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      // First, create the reservation
      const reservationResponse = await axios.post(
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

        console.log("Uploading files:", {
          proofOfPayment: values.proofOfPayment ? "present" : "not present",
          icSoftcopy: values.icSoftcopy ? "present" : "not present"
        });

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
      console.error("Booking error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setIsSubmitting(false);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).join(
          ", "
        );
        setBookingError(`Validation error: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        setBookingError(error.response.data.message);
      } else {
        setBookingError(
          "Failed to submit booking. Please check your input and try again."
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

  const renderUnitStats = (type) => {
    const stats = getUnitStats(type, units);
    return (
      <div className="view-stats">
        <div className="stat-info">
          <div className="stat-row">
            <span className="stat-label">TOTAL UNITS</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">AVAILABLE</span>
            <span className="stat-value">{stats.present}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">ADVISE</span>
            <span className="stat-value">{stats.advise}</span>
        </div>
          <div className="stat-row">
            <span className="stat-label">LANDOWNER</span>
            <span className="stat-value">{stats.landowner}</span>
        </div>
      </div>
    </div>
  );
  };

  const renderOverviewView = () => {
    // This function will render the overview with property cards showing actual availability data
      return (
      <div className="overview-section">
        <div className="overview-grid">
          <div className="property-card">
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="TERES FASA 1" 
              className="property-image" 
            />
            <div className="property-content">
              <h3 className="property-title">TERES FASA 1</h3>
              <p className="property-description">
                Spacious 20' x 70' terrace houses with modern design and comfortable living spaces.
              </p>
              <div className="property-stats">
                <div className="stat-row">
                  <div className="stat-label">TOTAL UNITS:</div>
                  <div className="stat-value">{unitStatsData["TERES FASA 1"]?.total || 0}</div>
        </div>
                <div className="stat-row">
                  <div className="stat-label">AVAILABLE:</div>
                  <div className="stat-value">
                    {unitStatsData["TERES FASA 1"]?.present || 0}
        </div>
            </div>
                <div className="stat-row">
                  <div className="stat-label">PRICE:</div>
                  <div className="stat-value">RM 299,000</div>
          </div>
              </div>
              <button className="property-button" onClick={() => handleManageUnits('TERES FASA 1')}>
                MANAGE TERES FASA 1 UNITS
              </button>
              </div>
            </div>

          <div className="property-card">
            <img 
              src="https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="TERES FASA 2" 
              className="property-image" 
            />
            <div className="property-content">
              <h3 className="property-title">TERES FASA 2</h3>
              <p className="property-description">
                Premium 20' x 70' terrace houses with enhanced features and strategic location.
              </p>
              <div className="property-stats">
                <div className="stat-row">
                  <div className="stat-label">TOTAL UNITS:</div>
                  <div className="stat-value">{unitStatsData["TERES FASA 2"]?.total || 0}</div>
              </div>
                <div className="stat-row">
                  <div className="stat-label">AVAILABLE:</div>
                  <div className="stat-value">
                    {unitStatsData["TERES FASA 2"]?.present || 0}
              </div>
            </div>
                <div className="stat-row">
                  <div className="stat-label">PRICE:</div>
                  <div className="stat-value">RM 309,000</div>
              </div>
              </div>
              <button className="property-button" onClick={() => handleManageUnits('TERES FASA 2')}>
                MANAGE TERES FASA 2 UNITS
              </button>
          </div>
        </div>

          <div className="property-card">
            <img 
              src="https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="SEMI-D" 
              className="property-image" 
            />
            <div className="property-content">
              <h3 className="property-title">SEMI-D</h3>
              <p className="property-description">
                Luxurious 40' x 80' semi-detached houses with premium finishes and spacious layouts.
              </p>
              <div className="property-stats">
                <div className="stat-row">
                  <div className="stat-label">TOTAL UNITS:</div>
                  <div className="stat-value">{unitStatsData["SEMI-D"]?.total || 0}</div>
          </div>
                <div className="stat-row">
                  <div className="stat-label">AVAILABLE:</div>
                  <div className="stat-value">
                    {unitStatsData["SEMI-D"]?.present || 0}
        </div>
                    </div>
                <div className="stat-row">
                  <div className="stat-label">PRICE:</div>
                  <div className="stat-value">RM 499,000</div>
                </div>
              </div>
              <button className="property-button" onClick={() => handleManageUnits('SEMI-D')}>
                MANAGE SEMI-D UNITS
                  </button>
            </div>
            </div>
          </div>
      </div>
    );
  };

  const renderProfileView = () => (
    <div className="profile-section">
      <h3>My Profile</h3>
      {!isEditingProfile ? (
        <div className="profile-info">
          <div className="info-group">
            <label>Name:</label>
            <p>{profileForm.name}</p>
          </div>
          <div className="info-group">
            <label>Email:</label>
            <p>{profileForm.email}</p>
        </div>
          <div className="info-group">
            <label>Phone:</label>
            <p>{profileForm.phone || "Not set"}</p>
          </div>
                  <button
            className="btn btn-primary"
            onClick={() => setIsEditingProfile(true)}
          >
            Edit Profile
                  </button>
            </div>
      ) : (
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
                    name: user?.name || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    currentPassword: "",
                    newPassword: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
      )}
              </div>
  );

  const renderUnitsView = () => {
    if (!selectedView) {
      // Show only PRESENT units across all types
      const availableUnits = processedUnits
        .filter(unit => unit.status === 'PRESENT')
        .sort((a, b) => {
          const numA = parseInt(a.unitNumber.replace(/\D/g, ''));
          const numB = parseInt(b.unitNumber.replace(/\D/g, ''));
          return numA - numB;
        });
        
      return (
        <div className="units-section">
          <h3>Available Units</h3>
          <p>{availableUnits.length} units available</p>
          <div className="units-grid">
            <div className="unit-row header">
              <div className="unit-cell">Unit</div>
              <div className="unit-cell">Type</div>
              <div className="unit-cell">Status</div>
              <div className="unit-cell">Specifications</div>
              <div className="unit-cell">Action</div>
              </div>
            {availableUnits.map(unit => renderUnitCard(unit))}
      </div>
    </div>
  );
    }
    
    const filteredUnits = processedUnits
      .filter((unit) => unit.type === selectedView)
      .sort((a, b) => {
        const numA = parseInt(a.unitNumber.replace(/\D/g, ''));
        const numB = parseInt(b.unitNumber.replace(/\D/g, ''));
        return numA - numB;
      });

    const totalPages = Math.ceil(filteredUnits.length / unitsPerPage);
    const startIndex = (currentPage - 1) * unitsPerPage;
    const paginatedUnits = filteredUnits.slice(
      startIndex,
      startIndex + unitsPerPage
    );

    if (loading) {
      return <div className="loading">Loading units...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    return (
      <div className="units-section">
        <div className="units-header">
          <div className="header-content">
            <h3>{selectedView} Units</h3>
            <p className="units-count">
              {filteredUnits.length} {filteredUnits.length === 1 ? 'unit' : 'units'} available
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedView(null);
                setCurrentPage(1);
                setActiveView("overview");
                setSelectedUnitId(null);
              }}
            >
              Back to Overview
            </button>
          </div>
          </div>

        <div className="units-grid">
          <div className="unit-row header">
            <div className="unit-cell">Unit</div>
            <div className="unit-cell">Type</div>
            <div className="unit-cell">Status</div>
            <div className="unit-cell">Specifications</div>
            <div className="unit-cell">Action</div>
        </div>
          {paginatedUnits.map((unit) => renderUnitCard(unit))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-controls">
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  // Add this function to handle unit management navigation
  const handleManageUnits = (unitType) => {
    setActiveView('units');
    setSelectedView(unitType);
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>Property Management Dashboard</h2>
        <div className="view-navigation">
          <button
            className={`view-button ${activeView === 'units' ? 'active' : ''}`}
            onClick={() => setActiveView('units')}
          >
            Units
          </button>
          {isLoggedIn ? (
            <>
          <button
                className={`view-button ${activeView === 'reservations' ? 'active' : ''}`}
                onClick={() => setActiveView('reservations')}
              >
                Reservations
          </button>
          <button
                className="view-button logout-button"
                onClick={handleLogout}
              >
                Logout
          </button>
            </>
          ) : (
            <button
              className="view-button login-button"
              onClick={handleLogin}
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        {!activeView || activeView === 'overview' ? renderOverviewView() : null}
        {activeView === 'profile' && renderProfileView()}
        {activeView === 'units' && renderUnitsView()}
        {activeView === 'reservations' && <UserReservations />}
      </div>

      {showBookingModal && isLoggedIn && (
        <ReservationForm
          unit={bookingUnit}
          onClose={() => {
            setShowBookingModal(false);
            setBookingUnit(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setBookingUnit(null);
            setBookingSuccess(true);
          }}
          onError={(error) => setBookingError(error)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
