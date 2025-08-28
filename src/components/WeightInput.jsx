"use client";
import React from 'react';

const WeightInput = ({ label, tons, kgs, onTonsChange, onKgsChange, required = false }) => {
  const handleTonsChange = (e) => {
    const tonsValue = e.target.value;
    onTonsChange(tonsValue);
    // Convert tons to kgs, handling empty or partial input
    const kgsValue = tonsValue ? (parseFloat(tonsValue) * 1000).toString() : '';
    onKgsChange(kgsValue);
  };

  const handleKgsChange = (e) => {
    const kgsValue = e.target.value;
    onKgsChange(kgsValue);
    // Convert kgs to tons
    const tonsValue = kgsValue ? (parseFloat(kgsValue) / 1000).toString() : '';
    onTonsChange(tonsValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          placeholder="Tons"
          value={tons}
          onChange={handleTonsChange}
          className="w-1/2 p-2 border rounded-md dark:bg-gray-700"
          step="0.001"
          required={required}
        />
        <input
          type="number"
          placeholder="Kgs"
          value={kgs}
          onChange={handleKgsChange}
          className="w-1/2 p-2 border rounded-md dark:bg-gray-700"
          step="0.01"
          required={required}
        />
      </div>
    </div>
  );
};

export default WeightInput;