import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const interests = [
  "Suporte",
  "Conhecer mais sobre o sistema",
  "Solicitar demonstração",
  "Oportunidades de parceria",
  "Outros assuntos",
];

const ContactSection = () => {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const text = `Olá! Meu nome é ${name}. Interesse: ${interest}. ${message}`;
    window.open(`https://wa.me/5551997188572?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="contato" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              Entre em <span className="text-gradient">contato</span>
            </h2>
            <p className="text-muted-foreground">
              Pronto para revolucionar a biblioteca da sua escola? Vamos conversar!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glow-border rounded-2xl bg-gradient-card p-8 space-y-5"
          >
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Interesse</label>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="">Selecione um interesse</option>
                {interests.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="Sua mensagem..."
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-cta text-primary-foreground rounded-xl py-3.5 text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" />
              Enviar via WhatsApp
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
