import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Users, TrendingUp } from "lucide-react";

const stats = [
  { icon: BookOpen, value: 4015, suffix: "+", label: "Livros no Acervo" },
  { icon: Users, value: 637, suffix: "+", label: "Leitores Registrados" },
  { icon: TrendingUp, value: 247, suffix: "+", label: "Leitores Ativos" },
];

const AnimatedNumber = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="text-gradient font-display text-4xl sm:text-5xl font-bold tabular-nums">
      {count.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="py-8 relative z-10 -mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glow-border rounded-2xl bg-gradient-card p-8 text-center transition-all duration-300"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-4" />
              <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              <p className="text-muted-foreground text-sm mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
