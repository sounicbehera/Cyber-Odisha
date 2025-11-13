import { LogOut, Shield } from 'lucide-react';
import { Button } from './components/ui/button';
import { LoginScreen } from './components/LoginScreen';
import { ClerkDashboard } from './components/ClerkDashboard';
import { PoliceDashboard } from './components/PoliceDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './AuthContext';
import { auth } from './firebaseConfig';
import { signOut } from 'firebase/auth';

export default function App() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  const getRoleTitle = () => {
    switch (currentUser.role) {
      case 'clerk': return 'Court Clerk Dashboard';
      case 'police': return 'Police Officer Dashboard';
      case 'admin': return 'Administrator Dashboard';
      default: return 'Dashboard';
    }
  };

  const getRoleColor = () => {
    switch (currentUser.role) {
      case 'clerk': return 'bg-blue-600';
      case 'police': return 'bg-green-600';
      case 'admin': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 ${getRoleColor()} rounded-lg`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white">{getRoleTitle()}</h1>
                <p className="text-slate-400 text-sm">
                  Logged in as: {currentUser.fullName}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {currentUser.role === 'clerk' && <ClerkDashboard />}
        {currentUser.role === 'police' && <PoliceDashboard />}
        {currentUser.role === 'admin' && <AdminDashboard />}
      </main>

      <footer className="bg-slate-900/50 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-slate-400 text-sm">
            <p>Court Case Management System - Cybersecurity Hackathon Project</p>
            <p className="mt-1">Secure • Encrypted • Role-Based Access Control</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
