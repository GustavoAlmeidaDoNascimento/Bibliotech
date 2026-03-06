import { motion } from "framer-motion";
import { BookMarked, Sparkles, BarChart3, MessageCircle, Trophy, RefreshCw } from "lucide-react";

import acervoImg from "../../assets/landing/about-acervo.png";
import alunosImg from "../../assets/landing/about-alunos.png";
import dashboardImg from "../../assets/landing/about-dashboard.png";
import whatsappImg from "../../assets/landing/about-whatsapp.png";
import gamificacaoImg from "../../assets/landing/about-gamificacao.png";
import emprestimosImg from "../../assets/landing/about-emprestimos.png";

const features = [
  {
    icon: BookMarked,
    title: "Plataforma de Gestão de Acervo",
    description: "Sistema completo para catalogar, organizar e controlar todo o acervo da biblioteca em tempo real.",
    image: acervoImg,
  },
  {
    icon: Sparkles,
    title: "Interface de Recomendação para Alunos",
    description: "App intuitivo onde os alunos descobrem novos livros com recomendações personalizadas baseadas em seus interesses.",
    image: alunosImg,
  },
  {
    icon: BarChart3,
    title: "Dashboard de Métricas e Relatórios",
    description: "Análises detalhadas sobre empréstimos, leituras mais populares e evolução da leitura na escola.",
    image: dashboardImg,
  },
  {
    icon: MessageCircle,
    title: "Comunicação Integrada via WhatsApp",
    description: "Notificações automáticas sobre prazos, novas aquisições e lembretes de devolução direto no WhatsApp.",
    image: whatsappImg,
  },
  {
    icon: Trophy,
    title: "Sistema de Gamificação",
    description: "Pontuação, conquistas e rankings para motivar os alunos a lerem mais e se engajarem com a biblioteca.",
    image: gamificacaoImg,
  },
  {
    icon: RefreshCw,
    title: "Controle de Empréstimos Automatizado",
    description: "Gestão automática de empréstimos e devoluções com histórico completo e controle de disponibilidade.",
    image: emprestimosImg,
  },
];

const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Sobre o <span className="text-gradient">sistema</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            Uma solução completa que revoluciona a gestão de bibliotecas escolares, criando uma experiência moderna e engajante para todos os usuários.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group glow-border rounded-2xl bg-gradient-card overflow-hidden transition-all duration-300"
            >
              <div className="p-6 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
              <div className="px-6 pb-6">
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
