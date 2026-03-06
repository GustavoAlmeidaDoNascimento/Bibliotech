import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-gradient-cta p-12 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative z-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Pronto para transformar sua biblioteca?
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
              Junte-se às escolas que já estão revolucionando a gestão de suas bibliotecas.
            </p>
            <a
              href="https://wa.me/5551996468758?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20reuni%C3%A3o%20sobre%20o%20Bibliotech."
              className="group inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground rounded-xl px-7 py-3.5 text-sm font-medium hover:bg-background/20 transition-all duration-200"
            >
              Solicitar reunião
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
