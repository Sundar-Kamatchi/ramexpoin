"use client";

import React from "react";

// Full-screen animated dot grid background. Pure CSS for performance.
export default function AnimatedDots({ className = "" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 animated-dots ${className}`}
    />
  );
}


