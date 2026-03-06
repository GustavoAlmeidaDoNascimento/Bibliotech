import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import logoIcon from "../../assets/landing/logo-icon.png";

const navItems = [
  { label: "Produto", href: "#sobre" },
  { label: "Preços", href: "#precos" },
  { label: "Contato", href: "#contato" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Bibliotech" className="h-8 w-auto" />
          <span className="font-display font-bold text-lg tracking-tight">
            Bibliotech<span className="text-primary">.tech</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/select-user-type"
            className="flex items-center gap-2 text-sm border border-border rounded-lg px-4 py-2 hover:border-primary/50 hover:text-primary transition-all duration-200"
          >
            <User className="w-4 h-4" />
            Acessar
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 -mr-2 rounded-lg text-foreground hover:bg-secondary/50 active:bg-secondary/70 transition-colors touch-manipulation"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="w-6 h-6 shrink-0" strokeWidth={2} /> : <Menu className="w-6 h-6 shrink-0" strokeWidth={2} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground py-2"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/select-user-type"
                className="flex items-center gap-2 text-sm border border-border rounded-lg px-4 py-2.5 w-fit hover:border-primary/50"
              >
                <User className="w-4 h-4" />
                Acessar
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
