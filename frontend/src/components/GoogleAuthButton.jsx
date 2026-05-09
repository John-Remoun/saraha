import { useEffect } from "react";

export default function GoogleAuthButton({ onSuccess }) {
  useEffect(() => {
    const loadGoogle = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
        }
      );
    };

    const handleResponse = (response) => {
      if (typeof onSuccess === "function") {
        onSuccess(response.credential); // ID TOKEN
      }
    };

    if (window.google) {
      loadGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = loadGoogle;
      document.body.appendChild(script);
    }
  }, [onSuccess]);

  return <div id="googleBtn"></div>;
}