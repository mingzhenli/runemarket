const Footer: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center space-y-3 border-t bg-secondary px-4 py-8">
      <div>© 2024 Rune Market</div>
      <div className="text-sm">
        Trade Your Runes More Efficiently In Rune Market
      </div>
      <div className="flex items-center space-x-4 text-sm">
        <a
          href="https://t.me/runemarket"
          target="_blank"
          rel="noreferrer"
          className="text-primary transition-colors hover:text-theme"
        >
          Telegram
        </a>
        <a
          href="https://twitter.com/rune_market"
          target="_blank"
          rel="noreferrer"
          className="text-primary transition-colors hover:text-theme"
        >
          Twitter
        </a>
      </div>
    </footer>
  );
};

export default Footer;
