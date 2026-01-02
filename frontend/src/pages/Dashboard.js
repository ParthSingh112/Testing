import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/card';
import { Activity, CheckCircle, XCircle, Clock, Bug } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_tests: 0,
    total_executions: 0,
    total_bugs: 0,
    open_bugs: 0,
    recent_executions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/dashboard');
        setStats(response.data);
      } catch (error) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Test Cases',
      value: stats.total_tests,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-primary',
    },
    {
      title: 'Test Executions',
      value: stats.total_executions,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-secondary',
    },
    {
      title: 'Open Bugs',
      value: stats.open_bugs,
      icon: <Bug className="w-6 h-6" />,
      color: 'text-destructive',
    },
    {
      title: 'Total Bugs',
      value: stats.total_bugs,
      icon: <Bug className="w-6 h-6" />,
      color: 'text-muted-foreground',
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto" data-testid="dashboard-container">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-black font-heading tracking-tighter mb-2" data-testid="dashboard-title">
              Dashboard
            </h1>
            <p className="text-base text-muted-foreground">Overview of your testing activity</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`stat-card-${index}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={stat.color}>{stat.icon}</div>
                    <span className="text-3xl font-bold font-mono">{stat.value}</span>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-6 bg-card border border-white/10" data-testid="recent-executions-card">
              <h2 className="text-2xl font-semibold font-heading tracking-tight mb-6">Recent Test Executions</h2>
              {stats.recent_executions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="no-executions-message">No recent test executions</p>
              ) : (
                <div className="space-y-3">
                  {stats.recent_executions.slice(0, 5).map((execution, index) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background border border-white/10 hover:border-primary/30 transition-all"
                      data-testid={`execution-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <p className="font-medium font-mono text-sm">{execution.test_case_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.start_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          execution.status === 'completed'
                            ? 'bg-secondary/20 text-secondary'
                            : execution.status === 'failed'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-primary/20 text-primary'
                        }`}
                        data-testid={`execution-status-${index}`}
                      >
                        {execution.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;