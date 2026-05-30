import { useCallback, useEffect, useState } from "react";
import { type PageId } from "../lib/permissionHelper";

export const pagePaths: Record<PageId, string> = {
  dashboard: "/dashboard",
  create: "/create",
  track: "/track",
  parcelActivity: "/parcel-activity",
  auditLogs: "/audit-logs",
  users: "/users",
  branches: "/branches",
  login: "/login",
};

const pathPages: Record<string, PageId> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/create": "create",
  "/track": "track",
  "/parcel-activity": "parcelActivity",
  "/audit-logs": "auditLogs",
  "/users": "users",
  "/branches": "branches",
  "/login": "login",
};

export const getRouteFromLocation = (): { page: PageId; isKnownPath: boolean } => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = pathPages[path];
  return page ? { page, isKnownPath: true } : { page: "create", isKnownPath: false };
};

export function useAppRouter() {
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    const route = getRouteFromLocation();
    if (!route.isKnownPath) {
      window.history.replaceState({}, "", pagePaths.create);
    }
    return route.page;
  });

  const [pendingPage, setPendingPage] = useState<PageId | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromLocation();
      if (currentPage === "create" && route.page !== "create" && sessionStorage.getItem("shiptrack:create_parcel_dirty") === "true") {
        // Push state back to lock URL on /create while waiting for confirmation
        window.history.pushState({}, "", pagePaths.create);
        setPendingPage(route.page);
        setShowConfirmLeave(true);
        return;
      }
      setCurrentPage(route.page);
      if (!route.isKnownPath) {
        window.history.replaceState({}, "", pagePaths.create);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPage]);

  const navigateToPage = useCallback((page: PageId) => {
    if (currentPage === "create" && page !== "create" && sessionStorage.getItem("shiptrack:create_parcel_dirty") === "true") {
      setPendingPage(page);
      setShowConfirmLeave(true);
      return;
    }
    setCurrentPage(page);
    const nextPath = pagePaths[page];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, [currentPage]);

  const confirmLeave = useCallback(() => {
    if (pendingPage) {
      setCurrentPage(pendingPage);
      const nextPath = pagePaths[pendingPage];
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, "", nextPath);
      }
    }
    setShowConfirmLeave(false);
    setPendingPage(null);
  }, [pendingPage]);

  const cancelLeave = useCallback(() => {
    setShowConfirmLeave(false);
    setPendingPage(null);
  }, []);

  return {
    currentPage,
    forceSetPage: setCurrentPage,
    navigateToPage,
    showConfirmLeave,
    confirmLeave,
    cancelLeave,
  };
}
