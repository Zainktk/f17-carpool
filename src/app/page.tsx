"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

type Ride = {
  id: number;
  driverId: number;
  driver: { name: string; rating: number; society: string };
  from: string;
  to: string;
  time: string;
  price: string;
  availableSeats: number;
};

function Feed() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All Rides");
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let url = "/api/rides?";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) url += `from=${encodeURIComponent(from)}&`;
    if (to) url += `to=${encodeURIComponent(to)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setRides(data);
        setRidesLoading(false);
      });
  }, [searchParams]);

  if (authLoading) return <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading Session...</div>;
  if (!user) return null; // AuthContext handles the redirect

  const bookRide = async (rideId: number) => {
    if (!user) return alert("Please login first");
    if (user.role === "OFFERER") return alert("Offerers cannot book rides.");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, riderId: user.id }) 
      });
      if (res.ok) {
        // Refresh rides to update seats
        const updated = await fetch("/api/rides").then(r => r.json());
        setRides(updated);
        alert("Ride booked successfully!");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Failed to book ride");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{user?.role === "OFFERER" ? "Driver Feed" : "Carpool Network"}</h1>
          <p className={styles.subtitle}>{user?.role === "OFFERER" ? "Available requests" : "Find a ride, share the cost"}</p>
        </div>
      </header>

      <div className={styles.filterTabs}>
        {["All Rides", "University", "Office Commute", "Airport"].map((tab: string) => (
          <button 
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.feed}>
        {ridesLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading rides...</div>
        ) : rides.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No rides available. Add one!</div>
        ) : (
          rides.filter((ride: any) => {
            if (activeTab === "All Rides") return true;
            const dest = ride.to.toLowerCase();
            if (activeTab === "University" && (dest.includes("university") || dest.includes("nust") || dest.includes("fast"))) return true;
            if (activeTab === "Airport" && dest.includes("airport")) return true;
            if (activeTab === "Office Commute" && (dest.includes("blue area") || dest.includes("office") || dest.includes("i-8"))) return true;
            return false;
          }).map((ride) => {
            const isMyRide = user?.id === ride.driverId;

            return (
              <div key={ride.id} className={styles.rideCard}>
                <div className={styles.driverInfo}>
                  <div className={styles.avatar}>{ride.driver.name.substring(0,2).toUpperCase()}</div>
                  <div className={styles.driverDetails}>
                    <h3>{ride.driver.name} {isMyRide && "(You)"}</h3>
                    <p>{ride.driver.society}</p>
                  </div>
                  <div className={styles.rating}>
                    ★ {ride.driver.rating.toFixed(1)}
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
                  {user?.role === "BOOKER" ? (
                    <button 
                      className={styles.seats} 
                      onClick={() => bookRide(ride.id)}
                      disabled={ride.availableSeats === 0}
                      style={{ 
                        background: ride.availableSeats === 0 ? "rgba(255,255,255,0.05)" : "var(--primary)", 
                        color: ride.availableSeats === 0 ? "var(--text-muted)" : "white",
                        border: "none",
                        cursor: ride.availableSeats === 0 ? "not-allowed" : "pointer"
                      }}
                    >
                      {ride.availableSeats > 0 ? `Book Seat (${ride.availableSeats} left)` : "Full"}
                    </button>
                  ) : isMyRide ? (
                    <span className={styles.seats} style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                      Your Ride ({ride.availableSeats} seats left)
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading Feed...</div>}>
      <Feed />
    </Suspense>
  );
}
