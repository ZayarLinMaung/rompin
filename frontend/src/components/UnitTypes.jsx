import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UnitTypes = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/units', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch units');
        }

        const data = await response.json();
        setUnits(data.units || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching units:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const getUnitStats = (phase) => {
    if (!Array.isArray(units)) return { total: 0, available: 0 };

    const phaseUnits = units.filter(unit => unit.phase === phase);
    return {
      total: phaseUnits.length,
      available: phaseUnits.filter(unit => unit.status === "PRESENT").length
    };
  };

  const unitTypes = [
    {
      phase: "TERES FASA 1",
      specifications: {
        price: 299000,
        landArea: "20' x 70'",
        builtUp: "1,400 sq ft",
        bedrooms: 4,
        bathrooms: 3
      }
    },
    {
      phase: "TERES FASA 2",
      specifications: {
        price: 309000,
        landArea: "20' x 70'",
        builtUp: "1,400 sq ft",
        bedrooms: 4,
        bathrooms: 3
      }
    },
    {
      phase: "SEMI-D",
      specifications: {
        price: 499000,
        landArea: "40' x 80'",
        builtUp: "2,200 sq ft",
        bedrooms: 5,
        bathrooms: 4
      }
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">THE PARKZ ROMPIN</h1>
      
      {/* Status Legend */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Unit Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-green-500 mr-2"></div>
            <span>ADVISE</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-yellow-400 mr-2"></div>
            <span>PRESENT</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-pink-500 mr-2"></div>
            <span>LA SIGNED</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-purple-700 mr-2"></div>
            <span>SPA SIGNED</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-orange-500 mr-2"></div>
            <span>LOAN APPROVED</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-500 mr-2"></div>
            <span>PENDING BUYER DOC</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-600 mr-2"></div>
            <span>LANDOWNER UNIT</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-cyan-400 mr-2"></div>
            <span>LOAN IN PROCESS</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-red-600 mr-2"></div>
            <span>NEW BOOK</span>
          </div>
        </div>
      </div>

      {/* Unit Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {unitTypes.map((type) => {
          const stats = getUnitStats(type.phase);
          return (
            <div key={type.phase} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h3 className="text-xl font-semibold">{type.phase}</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600">
                    RM {type.specifications.price.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Land Area:</span> {type.specifications.landArea}
                  </p>
                  <p>
                    <span className="font-semibold">Built-up:</span> {type.specifications.builtUp}
                  </p>
                  <p>
                    <span className="font-semibold">Bedrooms:</span> {type.specifications.bedrooms}
                  </p>
                  <p>
                    <span className="font-semibold">Bathrooms:</span> {type.specifications.bathrooms}
                  </p>
                  <p>
                    <span className="font-semibold">Total Units:</span> {stats.total}
                  </p>
                  <p>
                    <span className="font-semibold">Present:</span>{' '}
                    <span className="text-green-600">{stats.available}</span>
                  </p>
                </div>
                <button className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  View Units
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnitTypes; 