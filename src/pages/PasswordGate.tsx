import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Inou1238$') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-indigo-50">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <KeyRound className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Área Restringida
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Por favor, introduce la contraseña para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pr-10 ${error ? 'border-red-500 animate-shake' : ''}`}
                placeholder="Contraseña"
                autoFocus
              />
              {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center animate-fade-in">
                Contraseña incorrecta
              </p>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
              Acceder
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}