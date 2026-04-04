import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Users, School } from "lucide-react";

const stats = [
  { icon: BookOpen, value: 5300, suffix: "+", label: "Livros Registrados" },
  { icon: Users, value: 637, suffix: "+", label: "Leitores Registrados" },
  { icon: School, value: 3, suffix: "", label: "Escolas Beneficiadas" },
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
    <span ref={ref} className="text-gradient-glow font-display text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums">
      {count.toLocaleString("pt-BR")}
      <span className="opacity-90">{suffix}</span>
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="py-8 relative z-10 -mt-20" aria-label="Estatísticas do sistema">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glow-border rounded-2xl bg-gradient-card p-4 sm:p-6 md:p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] sm:min-h-[180px]"
            >
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2 sm:mb-4 shrink-0" aria-hidden />
              <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
