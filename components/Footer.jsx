import React from 'react';
import { Link } from 'react-router-dom';

<<<<<<< HEAD
const tigerLogo = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png';

const Footer = () => (
  <footer className="border-t border-white/10 bg-[#050c12] pt-8 md:pt-10">
    <div className="container mx-auto px-5 md:px-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 pb-8 md:grid-cols-4 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="mb-3 inline-flex items-center gap-3">
            <img src={tigerLogo} alt="Taigour" className="h-12 w-12 object-contain" />
            <span className="font-space text-lg font-bold leading-tight">TAIGOUR<span className="block text-[10px] font-semibold uppercase tracking-[.35em] text-cyan">E-Sports</span></span>
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-slate-400">From Local Legends to National Champions.</p>
        </div>

        <div>
          <h2 className="mb-3 font-space text-[10px] font-bold uppercase tracking-wider text-white">Platform</h2>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li><Link to="/" className="hover:text-cyan">Home</Link></li>
            <li><Link to="/tournaments" className="hover:text-cyan">Tournaments</Link></li>
            <li><Link to="/games" className="hover:text-cyan">Games</Link></li>
            <li><Link to="/leaderboard" className="hover:text-cyan">Leaderboard</Link></li>
            <li><Link to="/streams" className="hover:text-cyan">Live Streams</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-cyan">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-cyan">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-space text-[10px] font-bold uppercase tracking-wider text-white">Titles</h2>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li><Link to="/games#free-fire" className="hover:text-cyan">Free Fire</Link></li>
            <li><Link to="/games#pubg-mobile" className="hover:text-cyan">PUBG Mobile</Link></li>
            <li><Link to="/games#ludo-king" className="hover:text-cyan">Ludo King</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-space text-[10px] font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2"><i className="fa-solid fa-envelope w-3 text-cyan" /><a href="mailto:taigouresports@gmail.com" className="hover:text-cyan">taigouresports@gmail.com</a></li>
            <li className="flex items-center gap-2"><i className="fa-solid fa-phone w-3 text-cyan" /><a href="tel:+9779766115626" className="hover:text-cyan">+977 9766115626</a></li>
            <li className="flex items-center gap-2"><i className="fa-solid fa-location-dot w-3 text-cyan" /><span>Janakpur, Nepal</span></li>
          </ul>
          <div className="mt-3 flex gap-3 text-sm text-slate-300">
            <a href="https://discord.gg/f2bgpfNP" target="_blank" rel="noopener noreferrer" title="Discord" aria-label="Discord" className="hover:text-cyan"><i className="fa-brands fa-discord" /></a>
            <a href="https://www.youtube.com/@TaigoursE-Sports" target="_blank" rel="noopener noreferrer" title="YouTube" aria-label="YouTube" className="hover:text-cyan"><i className="fa-brands fa-youtube" /></a>
            <a href="https://www.facebook.com/profile.php?id=61572485841102" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook" className="hover:text-cyan"><i className="fa-brands fa-facebook" /></a>
            <a href="https://chat.whatsapp.com/HhUd5QQNVDB5xRA67nMB0n" target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp" className="hover:text-cyan"><i className="fa-brands fa-whatsapp" /></a>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-4 text-[10px] text-slate-500 sm:flex-row sm:items-center">
=======
const Footer = () => (
  <footer className="bg-bg-dark border-t border-white/5 pt-12 md:pt-20 pb-8">
    <div className="container mx-auto px-4 md:px-6"> 
      {/* Main Footer Content */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
        {/* Brand Section */}
        <div className="col-span-2 md:col-span-1">
          <div className="font-space text-2xl md:text-3xl font-bold mb-4">
            <span className="text-white tracking-tight">TAIGOUR</span>
            <span className="text-cyan"> ESPORTS</span>
          </div>
          <p className="text-gray-400 mb-6 font-inter text-sm leading-relaxed">Nepal's premium competitive mobile esports platform. Trusted event management and tournament organization.</p>
          <div className="flex gap-4 text-xl">
            <a href="https://discord.gg/f2bgpfNP" className="text-gray-400 hover:text-cyan transition-colors" target="_blank" rel="noopener noreferrer" title="Discord">
              <i className="fab fa-discord"></i>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61572485841102" className="text-gray-400 hover:text-cyan transition-colors" target="_blank" rel="noopener noreferrer" title="Facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://www.youtube.com/@TaigoursE-Sports" className="text-gray-400 hover:text-cyan transition-colors" target="_blank" rel="noopener noreferrer" title="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://chat.whatsapp.com/HhUd5QQNVDB5xRA67nMB0n" className="text-gray-400 hover:text-cyan transition-colors" target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-space text-white mb-6 text-sm font-semibold uppercase tracking-wider">Platform</h4>
          <ul className="space-y-3 font-inter text-gray-400 text-sm">
            <li><Link to="/" className="hover:text-cyan transition-colors">Home</Link></li>
            <li><Link to="/tournaments" className="hover:text-cyan transition-colors">Tournaments</Link></li>
            <li><Link to="/leaderboard" className="hover:text-cyan transition-colors">Leaderboard</Link></li>
            <li><Link to="/streams" className="hover:text-cyan transition-colors">Live Streams</Link></li>
          </ul>
        </div>

        {/* Popular Games */}
        <div>
          <h4 className="font-space text-white mb-6 text-sm font-semibold uppercase tracking-wider">Titles</h4>
          <ul className="space-y-3 font-inter text-gray-400 text-sm">
            <li><a href="#" className="hover:text-cyan transition-colors">Free Fire</a></li>
            <li><a href="#" className="hover:text-cyan transition-colors">PUBG Mobile</a></li>
            <li><a href="#" className="hover:text-cyan transition-colors">Ludo King</a></li>
            <li><a href="#" className="hover:text-cyan transition-colors">Valorant Mobile</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-space text-white mb-6 text-sm font-semibold uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 font-inter text-gray-400 text-sm">
            <li className="flex items-center gap-3">
              <i className="fas fa-envelope text-cyan"></i>
              <span>taigouresports@gmail.com</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-phone text-cyan"></i>
              <span>+977 9766115626</span>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-map-marker-alt text-cyan"></i>
              <span>Janakpur, Nepal</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/5 pt-8 mb-9 flex flex-col md:flex-row justify-between items-center gap-4 font-inter text-sm text-gray-500">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
        <p>&copy; {new Date().getFullYear()} Taigour Esports. All rights reserved.</p>
        <p>Powered by <a href="https://taigra-nexus-labs.onrender.com" className="text-cyan hover:underline" target="_blank" rel="noopener noreferrer">Taigra Nexus Labs</a></p>
      </div>
    </div>
  </footer>
);

export default Footer;
