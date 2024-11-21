import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { supabase } from '../lib/supabase';

type User = {
  id: string;
  name: string;
  created_at: string;
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name: newUserName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setUsers([data, ...users]);
      setNewUserName('');
    } catch (error) {
      console.error('Error al crear usuario:', error);
    }
  };

  const selectUser = (userId: string) => {
    navigate(`/tasks/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Lista de Tareas I més
          </h1>
        </div>

        <div className="flex gap-4 mb-8">
          <Input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Nombre del nuevo usuario..."
            className="flex-grow"
          />
          <Button onClick={createUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">
                    Creado el {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => selectUser(user.id)}>
                  Acceder <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay usuarios</h3>
            <p className="text-gray-500">Crea un usuario para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}