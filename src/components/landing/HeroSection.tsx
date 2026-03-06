import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] floating" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px] floating-delayed" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
              Sistema completo para{" "}
              <span className="text-gradient">bibliotecas escolares</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center gap-1 mb-10 text-base sm:text-lg text-muted-foreground"
          >
            <p>
              <span className="font-semibold text-primary">Desenvolvido</span> por{" "}
              <em className="text-foreground">alunos</em>
            </p>
            <p>
              <span className="font-semibold text-primary">Validado</span> por{" "}
              <em className="text-foreground">escolas</em>
            </p>
            <p>
              <span className="font-semibold text-primary">Criado</span> pro{" "}
              <em className="text-foreground">futuro</em>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#sobre"
              className="group flex items-center gap-2 border border-border rounded-xl px-7 py-3.5 text-sm font-medium hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300"
            >
              Conhecer o Sistema
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://app.bibliotech.tech/demo"
              className="flex items-center gap-2 bg-gradient-cta rounded-xl px-7 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-primary/20"
            >
              Acessar conta de demonstração
              <Rocket className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
