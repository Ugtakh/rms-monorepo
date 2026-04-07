"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Eye, Lock, Mail, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, login } = useSession();

  const [email, setEmail] = useState("superadmin@rms.local");
  const [password, setPassword] = useState("Admin@123");
  const [isShow, setIsShow] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, session, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(email, password);
      toast.success("Амжилттай нэвтэрлээ");
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message || "Нэвтрэх үед алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                RestaurantERP
              </h1>
              <p className="text-xs text-muted-foreground">Enterprise Login</p>
            </div>
          </div>

          <h2 className="text-lg font-display font-semibold text-foreground text-center mb-6">
            Нэвтрэх
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Имэйл"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={isShow ? "text" : "password"}
                placeholder="Нууц үг"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="pl-10"
              />
              <Eye
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer"
                onClick={() => setIsShow(!isShow)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || loading}
            >
              {submitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
