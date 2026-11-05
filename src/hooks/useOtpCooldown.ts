import { useCallback, useEffect, useState } from "react";
import { cooldownRemaining, recordOtpSent, sendsLeft } from "@/lib/otpGuard";

/** Live-ticking OTP cooldown + remaining-sends counter for a phone number. */
export function useOtpCooldown(phone: string) {
  const [seconds, setSeconds] = useState(0);
  const [left, setLeft] = useState(5);

  const sync = useCallback(() => {
    if (!phone) {
      setSeconds(0);
      return;
    }
    setSeconds(cooldownRemaining(phone));
    setLeft(sendsLeft(phone));
  }, [phone]);

  useEffect(() => {
    sync();
    const id = window.setInterval(sync, 1000);
    return () => window.clearInterval(id);
  }, [sync]);

  const markSent = useCallback(() => {
    if (!phone) return;
    recordOtpSent(phone);
    sync();
  }, [phone, sync]);

  return { seconds, sendsLeft: left, markSent, refresh: sync };
}
