import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CheckoutSuccess = () => {
  const [query] = useSearchParams();
  const subscriptionId = query.get("subscription_id");
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const verify = async () => {
      if (!subscriptionId) {
        navigate("/billing");
        return;
      }

      const res = await fetch(`${API_URL}/api/subscription/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Success", description: "Subscription activated!" });
        updateUser(data.user);
      } else {
        toast({ title: "Pending", description: "Verification pending..." });
      }

      navigate("/billing");
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Verifying subscription…</p>
    </div>
  );
};

export default CheckoutSuccess;
