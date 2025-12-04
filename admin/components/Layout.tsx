import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Activity, 
  Settings, 
  LogOut, 
  Server,
  Terminal,
  ShieldCheck,
  ShoppingCart
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const getTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/payments': return 'Transaction Monitoring';
      case '/simulation': return 'Middleware Simulator';
      case '/settings': return 'System Configuration';
      case '/portal': return 'Client Portal Simulator';
      default: return 'SATIM Interface';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SATIM <span className="text-blue-400">Bridge</span></h1>
              <p className="text-xs text-slate-400">SAP S/4HANA Middleware</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/payments" icon={CreditCard} label="Payments" />
          <SidebarItem to="/simulation" icon={Terminal} label="Simulator & Logs" />
          <SidebarItem to="/settings" icon={Settings} label="Configuration" />
          
          <div className="pt-4 mt-4 border-t border-slate-700">
             <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">External Apps</p>
             <SidebarItem to="/portal" icon={ShoppingCart} label="Client Portal" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
           <div className="bg-slate-800 rounded-lg p-3 mb-3">
             <div className="flex items-center space-x-2">
                <Server size={16} className="text-green-400" />
                <span className="text-xs font-mono text-slate-300">Worker: ACTIVE</span>
             </div>
             <div className="flex items-center space-x-2 mt-1">
                <Activity size={16} className="text-blue-400" />
                <span className="text-xs font-mono text-slate-300">SAP: CONNECTED</span>
             </div>
           </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">{getTitle()}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Administrator</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};