"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading Profile...</div>;
  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>Not logged in</div>;

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>{user.name.substring(0,2).toUpperCase()}</div>
        <div className={styles.userInfo}>
          <h1>{user.name}</h1>
          <span className={styles.badge}>✓ {user.society}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account Information</h2>
        <div className={styles.menuItem}>
          <span>Role</span>
          <span className={styles.menuValue} style={{ fontWeight: "bold", color: user.role === "OFFERER" ? "var(--primary)" : "#28a745" }}>
            {user.role}
          </span>
        </div>
        <div className={styles.menuItem}>
          <span>Current Rating</span>
          <span className={styles.menuValue}>★ {user.rating.toFixed(1)}</span>
        </div>
        <div className={styles.menuItem}>
          <span>Total Rides {user.role === "OFFERER" ? "Offered" : "Booked"}</span>
          <span className={styles.menuValue}>
            {user.role === "OFFERER" ? (user.ridesOffered?.length || 0) : (user.bookings?.length || 0)}
          </span>
        </div>
      </div>

      {user.role === "OFFERER" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Vehicle Details</h2>
          <div className={styles.menuItem}>
            <span>Car Model</span>
            <span className={styles.menuValue}>{user.carModel || "Not provided"}</span>
          </div>
          <div className={styles.menuItem}>
            <span>Color</span>
            <span className={styles.menuValue}>{user.carColor || "Not provided"}</span>
          </div>
          <div className={styles.menuItem}>
            <span>License Plate</span>
            <span className={styles.menuValue}>{user.licensePlate || "Not provided"}</span>
          </div>
        </div>
      )}

      <button className={styles.logoutBtn} onClick={logout}>Log Out</button>
    </div>
  );
}
