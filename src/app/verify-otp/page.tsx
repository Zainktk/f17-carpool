"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "../signup/signup.module.css";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Email is missing. Please sign up again.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Verification failed");
      }
    } catch (e) {
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Verify Email</h1>
      <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem" }}>
        We sent a 6-digit code to <strong>{email}</strong>
        <br/><br/>
        <small style={{ color: "var(--primary)" }}>(Check your terminal/console for the Ethereal Preview URL)</small>
      </p>
      
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>6-Digit Code</label>
          <input 
            type="text" 
            placeholder="123456" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required 
            style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "10px" }}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading || otp.length < 6}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
