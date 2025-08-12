const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Research Labs</h3>
            <p className="text-sm text-muted-foreground">
              Advanced competitive intelligence and market research across strategic domains.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Teams</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Red Team - Competitive Disruption</li>
              <li>Black Team - Vendor Replacement</li>
              <li>White Team - Market Opportunities</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Focus Areas</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Marketplace Analysis</li>
              <li>Reverse Engineering</li>
              <li>White Space Identification</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Research Labs. Strategic intelligence for competitive advantage.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;