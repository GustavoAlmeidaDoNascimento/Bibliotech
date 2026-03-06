import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    monthly: "94,90",
    yearly: "79,90",
    popular: false,
    features: [
      "Gerenciamento de biblioteca básico (acervo, cadastros e retiradas)",
      "Gerenciamento de turmas",
      "Botão de mensagem para WhatsApp",
      "Geração de etiquetas",
    ],
  },
  {
    name: "Intermediário",
    monthly: "157,90",
    yearly: "132,90",
    popular: true,
    features: [
      "Tudo do Bibliotech Básico",
      "Catálogo do leitor (com integração à API do Google)",
      "Estatísticas por turma",
      "Estatísticas da biblioteca",
      "Interface do aluno",
      "Estatísticas do aluno na interface do aluno",
      "Estatísticas de cada aluno",
    ],
  },
  {
    name: "Avançado",
    monthly: "219,99",
    yearly: "184,99",
    popular: false,
    features: [
      "Tudo do Bibliotech Intermediário",
      "Conquistas",
      "Reservas de livros",
      "Estatísticas da turma na interface do aluno",
      "Futuras funcionalidades de inteligência artificial",
    ],
  },
];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="precos" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Escolha seu <span className="text-gradient">plano</span>
          </h2>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${yearly ? "bg-primary" : "bg-muted"}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform duration-200 ${yearly ? "translate-x-6" : ""}`}
            />
          </button>
          <span className={`text-sm ${yearly ? "text-foreground" : "text-muted-foreground"}`}>Anual</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-2xl p-[1px] ${plan.popular ? "bg-gradient-to-b from-primary/50 to-primary/10" : "glow-border"}`}
            >
              <div className="rounded-2xl bg-gradient-card p-7 h-full flex flex-col">
                {plan.popular && (
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 w-fit mb-4">
                    Mais Popular
                  </span>
                )}
                <h3 className="font-display text-sm text-muted-foreground mb-1">Bibliotech</h3>
                <p className="font-display text-xl font-bold mb-4">{plan.name}</p>
                <div className="mb-6">
                  <span className="font-display text-3xl font-bold">R$ {yearly ? plan.yearly : plan.monthly}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contato"
                  className={`text-center text-sm font-medium rounded-xl py-3 transition-all duration-200 ${
                    plan.popular
                      ? "bg-gradient-cta text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                      : "border border-border hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  Começar agora
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
