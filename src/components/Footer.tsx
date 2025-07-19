import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isBlackTeamPage = location.pathname === "/black-team";
  
  return (
    <footer className={`border-t ${isBlackTeamPage ? 'border-gray-800 bg-black' : 'border-border bg-card/30'} mt-auto py-4`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className={`text-center text-sm ${isBlackTeamPage ? 'text-gray-400' : 'text-muted-foreground'}`}>
          Internal Research Tool
        </p>
      </div>
    </footer>
  );
};

export default Footer;