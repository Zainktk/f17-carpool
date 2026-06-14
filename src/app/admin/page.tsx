import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  
  if (!userIdCookie) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userIdCookie.value) }
  });

  // Only allow your email to view this page
  if (!user || user.email !== "zainktk1998@gmail.com") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "red" }}>Access Denied</h1>
        <p>You do not have administrator privileges.</p>
      </div>
    );
  }

  const totalUsers = await prisma.user.count();
  const totalBookers = await prisma.user.count({ where: { role: "BOOKER" } });
  const totalOfferers = await prisma.user.count({ where: { role: "OFFERER" } });
  const totalRides = await prisma.ride.count();
  const totalBookings = await prisma.booking.count();

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", paddingBottom: "100px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "20px", fontSize: "24px" }}>Admin Dashboard</h1>
      <p style={{ marginBottom: "20px", color: "var(--text-muted)" }}>Live statistics from your production database.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", gridColumn: "1 / -1" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>Total Users</h3>
          <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary)" }}>{totalUsers}</p>
        </div>
        
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>Bookers</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#28a745" }}>{totalBookers}</p>
        </div>
        
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>Drivers</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "var(--primary)" }}>{totalOfferers}</p>
        </div>
        
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>Total Rides</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#f39c12" }}>{totalRides}</p>
        </div>
        
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>Bookings</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#9b59b6" }}>{totalBookings}</p>
        </div>
      </div>
    </div>
  );
}
