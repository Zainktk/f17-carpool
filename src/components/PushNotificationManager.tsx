"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if we are on iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if running as PWA (standalone)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (!user) return;

    if ("Notification" in window && "serviceWorker" in navigator) {
      if (Notification.permission === "default") {
        // Show prompt if permission has never been asked
        setShowPrompt(true);
      } else if (Notification.permission === "granted") {
        // If granted but maybe not subscribed (e.g. new login), ensure subscribed silently
        subscribeToPush();
      }
    }
  }, [user]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!user) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        alert("Setup Error: Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send to server
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subscription,
        }),
      });

      if (!res.ok) {
        alert("Failed to save subscription to database.");
      }

      setShowPrompt(false);
    } catch (err: any) {
      console.error("Push subscription failed", err);
      alert("Push subscription failed: " + err.message);
    }
  };

  const handleEnable = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        subscribeToPush();
      } else {
        setShowPrompt(false);
      }
    }
  };

  if (!showPrompt) return null;

  // On iOS, web push only works if the app is added to the home screen (standalone mode)
  if (isIOS && !isStandalone) {
    return (
      <div style={bannerStyle}>
        <div>
          <strong>Get Notifications</strong>
          <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>
            Tap the Share button <span style={{fontSize:"1.2rem"}}>⎙</span> then "Add to Home Screen" to enable notifications for rides and messages!
          </p>
        </div>
        <button onClick={() => setShowPrompt(false)} style={dismissBtnStyle}>✕</button>
      </div>
    );
  }

  return (
    <div style={bannerStyle}>
      <div>
        <strong>Enable Notifications</strong>
        <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>Never miss a ride booking or a new message.</p>
      </div>
      <button onClick={handleEnable} style={enableBtnStyle}>Enable</button>
      <button onClick={() => setShowPrompt(false)} style={dismissBtnStyle}>✕</button>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  position: "fixed",
  top: "10px",
  left: "10px",
  right: "10px",
  backgroundColor: "white",
  color: "#333",
  padding: "15px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 1000,
  borderLeft: "4px solid var(--primary)",
};

const enableBtnStyle: React.CSSProperties = {
  backgroundColor: "var(--primary)",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  marginLeft: "10px",
};

const dismissBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "1.2rem",
  color: "#999",
  cursor: "pointer",
  marginLeft: "10px",
  padding: "5px",
};
