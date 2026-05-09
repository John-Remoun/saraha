import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import Spinner from "../components/Spinner";

const BASE_URL = "http://localhost:3000";

const toImageUrl = (value) => {
  if (!value) return "";

  // لو الرابط كامل
  if (value.startsWith("http")) {
    return value;
  }

  // لو المسار ناقص /
  if (!value.startsWith("/")) {
    value = "/" + value;
  }

  return `${BASE_URL}${value}`;
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/user")
      .then((res) => setProfile(res.data.data.account))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);
  console.log("PROFILE:", profile);
  console.log("IMAGE:", profile?.profilePicture);
  console.log("FINAL URL:", toImageUrl(profile?.profilePicture));

  const initials = useMemo(() => {
    const first = profile?.firstName?.[0] || "";
    const last = profile?.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profile]);

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("attachment", file);
      await api.patch("/user/profile-image", formData);
      const { data } = await api.get("/user");
      setProfile(data.data.account);
      setSuccess("Profile photo updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.errorMessage || "Failed to upload profile photo.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div
      className="animate-up"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div>
        <h1 style={title}>Profile</h1>
        <p style={sub}>Manage your account details and profile photo.</p>
      </div>

      <section style={card}>
        <div style={avatarRow}>
          <div style={avatarWrap}>
            {profile?.profilePicture ? (
              <img
                src={toImageUrl(profile?.profilePicture)}
                alt="Profile"
                style={avatarImage}
                onError={(e) => {
                  console.log("IMAGE FAILED:", e.target.src);
                }}
              />
            ) : (
              <div style={avatarFallback}>{initials}</div>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            <label style={uploadBtn}>
              {uploading ? "Uploading…" : "Upload profile photo"}
              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
                style={{ display: "none" }}
                disabled={uploading}
              />
            </label>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              JPG, PNG, WEBP. Max 10MB.
            </p>
          </div>
        </div>

        {error && <div style={alertError}>{error}</div>}
        {success && <div style={alertSuccess}>{success}</div>}

        <div style={infoGrid}>
          <Info label="First name" value={profile?.firstName} />
          <Info label="Last name" value={profile?.lastName} />
          <Info label="Username" value={profile?.username} />
          <Info label="Email" value={profile?.email} />
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={field}>
      <div style={fieldLabel}>{label}</div>
      <div style={fieldValue}>{value || "—"}</div>
    </div>
  );
}

const title = {
  fontFamily: "var(--font-display)",
  fontSize: "1.8rem",
  fontWeight: 700,
  color: "var(--ink)",
};
const sub = { fontSize: "0.9rem", color: "var(--muted)", marginTop: "0.2rem" };
const card = {
  background: "var(--paper)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "1.5rem",
  boxShadow: "var(--shadow)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};
const avatarRow = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};
const avatarWrap = {
  width: 88,
  height: 88,
  borderRadius: "50%",
  overflow: "hidden",
};
const avatarImage = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--ink), #2d2d4e)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "1.5rem",
};
const uploadBtn = {
  display: "inline-flex",
  padding: "0.55rem 1rem",
  background: "var(--accent)",
  color: "white",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.85rem",
};
const alertError = {
  background: "rgba(200,85,61,0.08)",
  border: "1px solid rgba(200,85,61,0.25)",
  color: "var(--accent)",
  padding: "0.75rem 1rem",
  borderRadius: 8,
  fontSize: "0.875rem",
};
const alertSuccess = {
  background: "rgba(61,167,114,0.09)",
  border: "1px solid rgba(61,167,114,0.35)",
  color: "#2f7f57",
  padding: "0.75rem 1rem",
  borderRadius: 8,
  fontSize: "0.875rem",
};
const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.75rem",
};
const field = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "0.8rem 0.9rem",
  background: "var(--cream)",
};
const fieldLabel = {
  fontSize: "0.78rem",
  color: "var(--muted)",
  marginBottom: "0.25rem",
};
const fieldValue = {
  fontSize: "0.95rem",
  color: "var(--ink)",
  fontWeight: 600,
};
