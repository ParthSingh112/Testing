import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { ArrowRight, Zap, Activity, Bug, BarChart3, Users, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Live Test Execution',
      description: 'Execute tests in real-time with instant feedback and streaming logs',
      color: 'text-primary',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-Time Monitoring',
      description: 'Monitor test progress with WebSocket-powered live updates',
      color: 'text-secondary',
    },
    {
      icon: <Bug className="w-8 h-8" />,
      title: 'Bug Tracking',
      description: 'Track and manage bugs seamlessly with integrated reporting',
      color: 'text-destructive',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Performance Metrics',
      description: 'Visualize test results and performance data with charts',
      color: 'text-primary',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Collaboration',
      description: 'Work together with role-based access and shared projects',
      color: 'text-secondary',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Insights',
      description: 'Get intelligent test suggestions and result analysis',
      color: 'text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1762278804996-eab062703db3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRpZ2l0YWwlMjBkYXRhJTIwZmxvdyUyMGJsdWUlMjBjeWFufGVufDB8fHx8MTc2NzMzNDcwNXww&ixlib=rb-4.1.0&q=85)',
          }}
        />
        <div className="absolute inset-0 hero-gradient" />

        <nav className="relative backdrop-blur-xl bg-black/40 border-b border-white/10">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-2xl font-black font-heading tracking-tighter">DevQA</span>
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login-btn">
                Login
              </Button>
              <Button
                className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                onClick={() => navigate('/register')}
                data-testid="nav-register-btn"
              >
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </nav>

        <section className="relative container mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter mb-6" data-testid="hero-title">
              Live Software Testing
              <br />
              <span className="text-primary">In Real-Time</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
              Execute, monitor, and analyze tests with live updates. Track bugs, collaborate with teams, and leverage
              AI-powered insights—all in one powerful platform.
            </p>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] rounded-md text-lg px-8 py-6"
              onClick={() => navigate('/register')}
              data-testid="hero-cta-btn"
            >
              Start Testing Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </section>
      </motion.div>

      <section className="py-20 bg-card/50 border-y border-white/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-4" data-testid="features-title">
              Everything You Need
            </h2>
            <p className="text-base text-muted-foreground">Powerful features for modern testing workflows</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-xl bg-card border border-white/10 hover:border-primary/50 transition-all duration-300"
                data-testid={`feature-card-${index}`}
              >
                <div className={`${feature.color} mb-4`}>{feature.icon}</div>
                <h3 className="text-2xl font-semibold font-heading tracking-tight mb-2">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-6" data-testid="cta-title">
              Ready to Transform Your Testing?
            </h2>
            <p className="text-base text-muted-foreground mb-8">
              Join teams already using DevQA to ship better software faster.
            </p>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] rounded-md text-lg px-8 py-6"
              onClick={() => navigate('/register')}
              data-testid="footer-cta-btn"
            >
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 DevQA. Built for teams that ship quality software.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;