import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EOSAccountabilitySeat } from '@/api/entities';
import { Plus, Edit, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AccountabilitySeatForm from './AccountabilitySeatForm';

export default function AccountabilityChart({ client }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);

  useEffect(() => {
    if (client) {
      loadSeats();
    }
  }, [client]);

  const loadSeats = async () => {
    try {
      const seatData = await EOSAccountabilitySeat.filter({ client_id: client.id }, 'level');
      setSeats(seatData);
    } catch (error) {
      console.error('Error loading seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSeat = async (seatData) => {
    try {
      if (editingSeat) {
        await EOSAccountabilitySeat.update(editingSeat.id, seatData);
      } else {
        await EOSAccountabilitySeat.create({ ...seatData, client_id: client.id });
      }
      setShowForm(false);
      setEditingSeat(null);
      loadSeats();
    } catch (error) {
      console.error('Error saving seat:', error);
    }
  };

  const handleEditSeat = (seat) => {
    setEditingSeat(seat);
    setShowForm(true);
  };

  const handleDeleteSeat = async (seatId) => {
    if (window.confirm('Are you sure you want to delete this seat?')) {
      try {
        await EOSAccountabilitySeat.delete(seatId);
        loadSeats();
      } catch (error) {
        console.error('Error deleting seat:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'issues':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'transition':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'filled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'issues':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'transition':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const organizeByLevel = (seats) => {
    const levels = {};
    seats.forEach(seat => {
      const level = seat.level || 1;
      if (!levels[level]) levels[level] = [];
      levels[level].push(seat);
    });
    return levels;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const seatsByLevel = organizeByLevel(seats);
  const levels = Object.keys(seatsByLevel).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Accountability Chart</h3>
          <p className="text-slate-600 mt-1">Define seats based on accountability, not hierarchy</p>
        </div>
        <Button
          onClick={() => {
            setEditingSeat(null);
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Seat
        </Button>
      </div>

      {seats.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Seats Defined</h3>
            <p className="text-slate-500 mb-6">Start building your Accountability Chart by adding your first seat.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Seat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {levels.map(level => (
            <div key={level} className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                Level {level}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seatsByLevel[level].map(seat => (
                  <Card key={seat.id} className={`border-2 ${getStatusColor(seat.status)} hover:shadow-lg transition-shadow`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(seat.status)}
                          <CardTitle className="text-lg">{seat.seat_name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSeat(seat)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      {seat.filled_by_name && (
                        <Badge variant="outline" className="w-fit">
                          {seat.filled_by_name}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {seat.core_responsibilities && seat.core_responsibilities.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-slate-700 mb-1">Key Responsibilities</h5>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {seat.core_responsibilities.slice(0, 3).map((resp, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{resp}</span>
                                </li>
                              ))}
                              {seat.core_responsibilities.length > 3 && (
                                <li className="text-slate-400">...and {seat.core_responsibilities.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {seat.key_metrics && seat.key_metrics.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-slate-700 mb-1">Key Metrics</h5>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {seat.key_metrics.map((metric, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{metric}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <Badge variant="secondary" className="text-xs">
                            {seat.status === 'filled' && 'Filled'}
                            {seat.status === 'empty' && 'Open Position'}
                            {seat.status === 'issues' && 'Has Issues'}
                            {seat.status === 'transition' && 'In Transition'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSeat(seat.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AccountabilitySeatForm
          seat={editingSeat}
          client={client}
          seats={seats}
          onSave={handleSaveSeat}
          onCancel={() => {
            setShowForm(false);
            setEditingSeat(null);
          }}
        />
      )}
    </div>
  );
}