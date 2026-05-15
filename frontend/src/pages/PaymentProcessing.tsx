import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = "https://api.gutmantra.in/api";

export default function PaymentProcessing() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const orderId =
    searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) return;

    let interval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/order-status/${orderId}`
        );

        const data =
          await response.json();

        console.log(
          "💳 Payment status:",
          data
        );

        if (
          data.paymentStatus === "PAID"
        ) {
          clearInterval(interval);

          navigate(
            `/success?orderId=${orderId}`
          );
        }

        if (
          data.paymentStatus === "FAILED"
        ) {
          clearInterval(interval);

          navigate(
            `/payment-failed?orderId=${orderId}`
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkPaymentStatus();

    interval = setInterval(
      checkPaymentStatus,
      3000
    );

    return () => clearInterval(interval);
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          Processing Payment...
        </h1>

        <p className="text-gray-600">
          Please wait while we confirm
          your payment.
        </p>
      </div>
    </div>
  );
}