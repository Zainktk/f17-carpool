"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "../page.module.css";
import Link from "next/link";

export default function ActivityPage() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading Activity...</div>;
  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>Please log in to see your activity.</div>;

  // For Bookers, show rides they've booked.
  // For Offerers, show rides they've offered.
  const myActivity = user.role === "OFFERER" 
    ? (user.ridesOffered || []).map((r: any) => ({ ...r, type: "OFFERED" }))
    : (user.bookings || []).map((b: any) => ({ ...b.ride, type: "BOOKED" }));

  // Sort by creation date
  myActivity.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Activity</h1>
          <p className={styles.subtitle}>
            {user.role === "OFFERER" ? "Rides you are providing" : "Rides you have booked"}
          </p>
        </div>
      </header>

      <div className={styles.feed}>
        {myActivity.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p>You have no {user.role === "OFFERER" ? "offered" : "booked"} rides yet.</p>
          </div>
        ) : (
          myActivity.map((ride: any) => (
            <div key={`${ride.type}-${ride.id}`} className={styles.rideCard}>
              <div className={styles.driverInfo}>
                <div className={styles.avatar} style={{ background: ride.type === "OFFERED" ? "var(--primary)" : "#333" }}>
                  {ride.driver?.name?.substring(0,2).toUpperCase() || "DR"}
                </div>
                <div className={styles.driverDetails}>
                  <h3>{ride.driver?.name || "Unknown Driver"}</h3>
                  <p>{ride.driver?.society || "Unknown Society"}</p>
                </div>
              </div>

              <div className={styles.route}>
                <div className={styles.timeline}>
                  <div className={`${styles.dot} ${styles.filled}`}></div>
                  <div className={styles.line}></div>
                  <div className={styles.dot}></div>
                </div>
                <div className={styles.locations}>
                  <div className={styles.locationItem}>
                    <h4>{ride.from}</h4>
                  </div>
                  <div className={styles.locationItem}>
                    <h4>{ride.to}</h4>
                    <p>{ride.time}</p>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.price}>{ride.price}</span>
                <span className={styles.seats} style={{ background: ride.type === "OFFERED" ? "rgba(13, 110, 253, 0.2)" : "rgba(40, 167, 69, 0.2)", color: ride.type === "OFFERED" ? "var(--primary)" : "#28a745" }}>
                  {ride.type === "OFFERED" ? "Driving" : "Booked"}
                </span>
              </div>

              {ride.type === "BOOKED" && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <Link href={`/chat/${ride.id}/${ride.driver.id}`} style={{ display: "block", textAlign: "center", background: "var(--primary)", color: "white", padding: "0.8rem", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
                    Chat with Driver
                  </Link>
                </div>
              )}

              {ride.type === "OFFERED" && ride.bookings && ride.bookings.length > 0 && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Passengers:</h4>
                  {ride.bookings.map((b: any) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "0.8rem", borderRadius: "8px", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{b.rider.name}</span>
                      <Link href={`/chat/${ride.id}/${b.rider.id}`} style={{ background: "var(--primary)", color: "white", padding: "0.4rem 1rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
                        Chat
                      </Link>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
