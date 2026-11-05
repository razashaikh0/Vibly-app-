import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Mic, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { useOtpCooldown } from "@/hooks/useOtpCooldown";
import { checkOtpAllowed, normalizePhone } from "@/lib/otpGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — WeVoice Rooms" },
      {
        name: "description",
        content: "Sign in to WeVoice and join live voice rooms, take a mic seat and send gifts.",
      },
      { property: "og:title", content: "Sign in — WeVoice Rooms" },
      {
        property: "og:description",
        content: "Sign in to WeVoice and join live voice rooms, take a mic seat and send gifts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyFails, setVerifyFails] = useState(0);
  const { seconds: cooldown, sendsLeft, markSent } = useOtpCooldown(
    otpSent ? phone : phone ? normalizePhone(phone) : "",
  );

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else void navigate({ to: "/" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — welcome!");
      void navigate({ to: "/" });
    } else {
      toast.success("Account created! Please sign in.");
    }
  };


  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in fail hua");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    const allowed = checkOtpAllowed(normalized);
    if (!allowed.ok) {
      toast.error(
        allowed.reason === "cooldown"
          ? `Please wait — you can request a new OTP in ${allowed.secondsLeft}s.`
          : `OTP limit reached for this number. Try again in ${allowed.minutesLeft} min.`,
      );
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhone(normalized);
    markSent();
    setOtpSent(true);
    toast.success(`OTP sent to ${normalized}`);
  };

  const resendOtp = async () => {
    const allowed = checkOtpAllowed(phone);
    if (!allowed.ok) {
      toast.error(
        allowed.reason === "cooldown"
          ? `Resend in ${allowed.secondsLeft}s.`
          : `OTP limit reached. Try again in ${allowed.minutesLeft} min.`,
      );
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      markSent();
      toast.success("New code sent");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (!/^\d{4,8}$/.test(code)) {
      toast.error("Sahi OTP code likhein");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    setBusy(false);
    if (error) {
      const attempts = verifyFails + 1;
      setVerifyFails(attempts);
      if (attempts >= 5) {
        toast.error("Too many wrong attempts — start again with your number.");
        setOtpSent(false);
        setOtp("");
        setVerifyFails(0);
      } else {
        toast.error(`${error.message} (${5 - attempts} attempts bache)`);
      }
      return;
    }
    setVerifyFails(0);
    void navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-7 shadow-2xl">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Mic className="h-5 w-5" />
          </span>
          <span className="text-xl font-black tracking-tight">WeVoice</span>
        </Link>
        <h1 className="text-2xl font-bold">Join live voice rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Take a mic seat, talk with friends and send gifts.
        </p>

        <Button variant="secondary" className="mt-6 w-full" onClick={google} disabled={busy}>
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with email <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form className="space-y-3 pt-4" onSubmit={signIn}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="space-y-3 pt-4" onSubmit={signUp}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email2">Email</Label>
                <Input id="email2" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password2">Password</Label>
                <Input
                  id="password2"
                  type="password"
                  minLength={6}
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            {!otpSent ? (
              <form className="space-y-3 pt-4" onSubmit={sendOtp}>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    required
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Country code ke saath likhein (jaise +91…). SMS se OTP aayega.
                  </p>
                </div>
                <Button className="w-full" disabled={busy || cooldown > 0 || sendsLeft === 0}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cooldown > 0 ? (
                    `Dobara bhejein ${cooldown}s me`
                  ) : sendsLeft === 0 ? (
                    "OTP limit reached — try again in 1 hour"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form className="space-y-3 pt-4" onSubmit={verifyOtp}>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">OTP code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={otp}
                    required
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter the code sent to {phone}.</p>
                </div>
                <Button className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy || cooldown > 0 || sendsLeft === 0}
                  onClick={() => void resendOtp()}
                >
                  {cooldown > 0
                    ? `Resend OTP (${cooldown}s)`
                    : sendsLeft === 0
                      ? "Resend limit reached"
                      : `Resend OTP (${sendsLeft} bache)`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setVerifyFails(0);
                  }}
                >
                  Number badlo
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
