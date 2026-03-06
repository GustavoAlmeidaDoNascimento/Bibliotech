import logoIcon from "../../assets/landing/logo-icon.png";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="Bibliotech" className="h-6 w-auto" />
          <span className="font-display font-semibold text-sm">
            Bibliotech<span className="text-primary">.tech</span>
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Bibliotech. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
