"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./signup.module.css";
import MapPicker from "@/components/MapPicker";

export default function SignupPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState<"BOOKER" | "OFFERER">("BOOKER");
  
  // Map Geofencing State
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(2000); // Default 2km
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  const handleSocietyBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) return;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Pakistan")}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const society = formData.get("society") as string;
    
    // Vehicle details
    const carModel = formData.get("carModel") as string | null;
    const carColor = formData.get("carColor") as string | null;
    const licensePlate = formData.get("licensePlate") as string | null;
    
    if (!lat || !lng) {
      setErrorMsg("Please select your location on the map.");
      setLoading(false);
      return;
    }

    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, email, password, role, society, carModel, carColor, licensePlate, 
          lat, lng, radius: role === "OFFERER" ? radius : null 
        })
      });

      if (res.ok) {
        // We no longer refreshUser or go to "/" here. We go to verify OTP.
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Signup failed");
        setLoading(false);
      }
    } catch (e) {
      setErrorMsg("Signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Join Carpool</h1>
      
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>I want to...</label>
          <div className={styles.roleSelect}>
            <button 
              type="button" 
              className={`${styles.roleBtn} ${role === "BOOKER" ? styles.active : ""}`}
              onClick={() => setRole("BOOKER")}
            >
              Book Rides
            </button>
            <button 
              type="button" 
              className={`${styles.roleBtn} ${role === "OFFERER" ? styles.active : ""}`}
              onClick={() => setRole("OFFERER")}
            >
              Offer Rides
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Full Name</label>
          <input name="name" type="text" placeholder="Ali Khan" required />
        </div>

        <div className={styles.inputGroup}>
          <label>Society Name</label>
          <input 
            name="society" 
            type="text" 
            placeholder="e.g. F17 Society" 
            required 
            onBlur={handleSocietyBlur}
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input name="email" type="email" placeholder="ali@example.com" required />
        </div>

        <div className={styles.inputGroup}>
          <label>Password</label>
          <input name="password" type="password" required />
        </div>

        {role === "OFFERER" && (
          <div className={styles.vehicleSection}>
            <h3 style={{ marginBottom: "1rem", color: "var(--foreground)" }}>Vehicle Details</h3>
            <div className={styles.inputGroup}>
              <label>Car Model</label>
              <input name="carModel" type="text" placeholder="Toyota Corolla" required />
            </div>
            <div className={styles.inputGroup}>
              <label>Color</label>
              <input name="carColor" type="text" placeholder="Silver" required />
            </div>
            <div className={styles.inputGroup}>
              <label>License Plate</label>
              <input name="licensePlate" type="text" placeholder="ABC-123" required />
            </div>
          </div>
        )}

        <div className={styles.inputGroup}>
          <label>{role === "OFFERER" ? "Pin the center of your society" : "Pin your pickup location"}</label>
          <MapPicker 
            onLocationSelect={(l, ln) => { setLat(l); setLng(ln); }} 
            showRadius={role === "OFFERER" ? radius : undefined} 
            centerLocation={mapCenter}
          />
        </div>

        {role === "OFFERER" && (
          <div className={styles.inputGroup}>
            <label>Geofence Radius ({radius} meters)</label>
            <input 
              type="range" 
              min="500" 
              max="10000" 
              step="500" 
              value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))} 
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className={styles.loginLink}>
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}
