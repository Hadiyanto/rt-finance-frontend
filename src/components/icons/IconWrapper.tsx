"use client";

import React from "react";

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function IconWrapper({ children, className }: IconWrapperProps) {
  return (
    <span className={className}>
      {children}
    </span>
  );
}
