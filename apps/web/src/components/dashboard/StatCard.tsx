import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  icon: LucideIcon;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-display font-bold mt-1 text-foreground">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs mt-2 font-medium ${changeType === "up" ? "text-success" : "text-destructive"}`}
            >
              {changeType === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
