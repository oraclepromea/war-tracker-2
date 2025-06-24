import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Plus, 
  Edit,
  Trash2
} from 'lucide-react';

interface Weapon {
  id: string;
  name: string;
  type: 'missile' | 'aircraft' | 'naval' | 'ground' | 'cyber' | 'other';
  country: string;
  status: 'active' | 'retired' | 'development' | 'unknown';
  specifications: {
    range?: string;
    payload?: string;
    accuracy?: string;
    speed?: string;
  };
  lastSeen?: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  imageUrl?: string;
  operationalReadiness?: number;
}

export function WeaponsManagement() {
  const [weapons] = useState<Weapon[]>([
    {
      id: '1',
      name: 'F-35 Lightning II',
      type: 'aircraft',
      country: 'USA',
      status: 'active',
      specifications: {
        range: '2,220 km',
        payload: '8,160 kg',
        accuracy: '95%',
        speed: 'Mach 1.6'
      },
      lastSeen: '2024-01-15',
      threatLevel: 'high',
      imageUrl: '/weapons/f35.jpg',
      operationalReadiness: 85
    },
    {
      id: '2',
      name: 'Iron Dome',
      type: 'other',
      country: 'Israel',
      status: 'active',
      specifications: {
        range: '70 km',
        accuracy: '90%'
      },
      lastSeen: '2024-01-14',
      threatLevel: 'medium',
      imageUrl: '/weapons/iron-dome.jpg',
      operationalReadiness: 92
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWeapons = weapons.filter(weapon => {
    const matchesSearch = weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         weapon.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || weapon.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesStatus = filterStatus === 'all' || weapon.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Add the missing getReadinessColor function
  const getReadinessColor = (readiness: number | undefined): string => {
    if (!readiness) return 'bg-gray-500/20 text-gray-400';
    if (readiness > 80) return 'bg-green-500/20 text-green-400';
    if (readiness > 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neon-400 mb-2">
            Weapons Management System
          </h1>
          <p className="text-tactical-muted">
            Monitor and manage military assets and weapon systems
          </p>
        </div>

        {/* Filters */}
        <div className="tactical-panel p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tactical-muted" />
              <input
                type="text"
                placeholder="Search weapons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-tactical-bg border border-tactical-border rounded-lg text-tactical-text placeholder-tactical-muted focus:border-neon-400"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-tactical-bg border border-tactical-border rounded-lg px-3 py-2 text-tactical-text"
            >
              <option value="all">All Types</option>
              <option value="fighter">Fighter Aircraft</option>
              <option value="defense">Defense System</option>
              <option value="missile">Missile System</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-tactical-bg border border-tactical-border rounded-lg px-3 py-2 text-tactical-text"
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="deployed">Deployed</option>
            </select>

            <button className="bg-neon-600 hover:bg-neon-700 text-tactical-bg px-4 py-2 rounded-lg font-mono flex items-center space-x-2 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Weapon</span>
            </button>
          </div>
        </div>

        {/* Weapons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredWeapons.map((weapon, index) => (
              <motion.div
                key={weapon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="tactical-panel overflow-hidden"
              >
                <div className="relative h-48 bg-tactical-dark">
                  <img
                    src={weapon.imageUrl}
                    alt={weapon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1583373834259-46cc92173cb7?w=800&h=600&fit=crop&crop=center';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs ${getReadinessColor(weapon.operationalReadiness)}`}>
                                {weapon.operationalReadiness ? `${weapon.operationalReadiness}% Ready` : 'Unknown'}
                              </span>
                              <button className="p-1 hover:bg-tactical-border rounded">
                                <Edit className="w-4 h-4 text-tactical-muted" />
                              </button>
                              <button className="p-1 hover:bg-red-500/20 rounded">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-tactical-text mb-1">
                    {weapon.name}
                  </h3>
                  <p className="text-tactical-muted text-sm mb-3">{weapon.type}</p>

                  <div className="space-y-2 mb-4">
                    {Object.entries(weapon.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-tactical-muted capitalize">{key}:</span>
                        <span className="text-tactical-text">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-tactical-muted">Operational Readiness:</span>
                      <span className={`font-mono ${getReadinessColor(weapon.operationalReadiness)}`}>
                        {weapon.operationalReadiness}%
                      </span>
                    </div>
                    <div className="w-full bg-tactical-dark rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (weapon.operationalReadiness ?? 0) >= 90 ? 'bg-green-500' :
                          (weapon.operationalReadiness ?? 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${weapon.operationalReadiness ?? 0}%` }}
                      />
                    </div>
locally                   </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-tactical-border hover:bg-tactical-border/70 text-tactical-text px-3 py-2 rounded text-sm transition-colors">
                      <Edit className="h-4 w-4 inline mr-1" />
                      Edit
                    </button>
                    <button className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded text-sm transition-colors">
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredWeapons.length === 0 && !loading && (
          <div className="text-center py-20">
            <Shield className="h-16 w-16 text-tactical-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tactical-text mb-2">No weapons found</h3>
            <p className="text-tactical-muted">
              No weapons match your current search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}