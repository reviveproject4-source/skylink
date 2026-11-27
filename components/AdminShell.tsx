"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";

function ShellInner({
  appName,
  children,
}: {
  appName: string;
  children: React.ReactNode;
}) {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar appName={appName} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  );
}

export default function AdminShell({
  appName,
  children,
}: {
  appName: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ShellInner appName={appName}>{children}</ShellInner>
    </SidebarProvider>
  );
}
