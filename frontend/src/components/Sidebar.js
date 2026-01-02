import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, PlayCircle, Bug, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { clearAuth } from '../utils/auth';
import { toast } from 'sonner';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FileText className="w-5 h-5" />, label: 'Test Cases', path: '/test-cases' },
    { icon: <PlayCircle className="w-5 h-5" />, label: 'Executions', path: '/executions' },
    { icon: <Bug className="w-5 h-5" />, label: 'Bugs', path: '/bugs' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-card border-r border-white/10 flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2" data-testid="sidebar-logo">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black font-heading tracking-tighter">DevQA</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} data-testid={`sidebar-link-${item.label.toLowerCase().replace(' ', '-')}`}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;