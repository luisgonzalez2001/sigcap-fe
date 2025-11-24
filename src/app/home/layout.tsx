"use client";
import React from "react";

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="layout-sec">
      <div className="sec-container">{children}</div>
    </section>
  );
}
