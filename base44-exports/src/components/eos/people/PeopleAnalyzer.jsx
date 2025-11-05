import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EOSPersonAssessment } from '@/api/entities';
import { EOSAccountabilitySeat } from '@/api/entities';
import { Users, UserCheck, AlertTriangle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PersonAssessmentForm from './PersonAssessmentForm';

export default function PeopleAnalyzer({ client }) {
  const [assessments, setAssessments] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  useEffect(() => {
    if (client) {
      loadData();
    }
  }, [client]);

  const loadData = async () => {
    try {
      const [assessmentData, seatData] = await Promise.all([
        EOSPersonAssessment.filter({ client_id: client.id }, '-assessment_date'),
        EOSAccountabilitySeat.filter({ client_id: client.id })
      ]);
      setAssessments(assessmentData);
      setSeats(seatData);
    } catch (error) {
      console.error('Error loading people analyzer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async (assessmentData) => {
    try {
      if (editingAssessment) {
        await EOSPersonAssessment.update(editingAssessment.id, assessmentData);
      } else {
        await EOSPersonAssessment.create({ ...assessmentData, client_id: client.id });
      }
      setShowForm(false);
      setEditingAssessment(null);
      loadData();
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const handleEditAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setShowForm(true);
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await EOSPersonAssessment.delete(assessmentId);
        loadData();
      } catch (error) {
        console.error('Error deleting assessment:', error);
      }
    }
  };

  const getQuadrantColor = (rightPerson, rightSeat) => {
    if (rightPerson && rightSeat) return 'bg-green-100 border-green-300';
    if (rightPerson && !rightSeat) return 'bg-yellow-100 border-yellow-300';
    if (!rightPerson && rightSeat) return 'bg-blue-100 border-blue-300';
    return 'bg-red-100 border-red-300';
  };

  const getQuadrantText = (rightPerson, rightSeat) => {
    if (rightPerson && rightSeat) return 'Right Person, Right Seat';
    if (rightPerson && !rightSeat) return 'Right Person, Wrong Seat';
    if (!rightPerson && rightSeat) return 'Wrong Person, Right Seat';
    return 'Wrong Person, Wrong Seat';
  };

  const getQuadrantAction = (rightPerson, rightSeat) => {
    if (rightPerson && rightSeat) return 'Keep and develop';
    if (rightPerson && !rightSeat) return 'Find right seat';
    if (!rightPerson && rightSeat) return 'Coach on values';
    return 'Requires immediate attention';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Organize people by quadrants
  const quadrants = {
    rightPersonRightSeat: assessments.filter(a => a.right_person && a.right_seat),
    rightPersonWrongSeat: assessments.filter(a => a.right_person && !a.right_seat),
    wrongPersonRightSeat: assessments.filter(a => !a.right_person && a.right_seat),
    wrongPersonWrongSeat: assessments.filter(a => !a.right_person && !a.right_seat)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">People Analyzer</h3>
          <p className="text-slate-600 mt-1">Right Person (Core Values) × Right Seat (GWC) Analysis</p>
        </div>
        <Button
          onClick={() => {
            setEditingAssessment(null);
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <UserCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Yet</h3>
            <p className="text-slate-500 mb-6">Start analyzing your team by creating your first person assessment.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* People Matrix Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Right Person, Right Seat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{quadrants.rightPersonRightSeat.length}</div>
                <div className="text-xs text-green-600 mt-1">Ideal performers</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-700">Right Person, Wrong Seat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{quadrants.rightPersonWrongSeat.length}</div>
                <div className="text-xs text-yellow-600 mt-1">Need role adjustment</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Wrong Person, Right Seat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{quadrants.wrongPersonRightSeat.length}</div>
                <div className="text-xs text-blue-600 mt-1">Need cultural coaching</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Wrong Person, Wrong Seat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{quadrants.wrongPersonWrongSeat.length}</div>
                <div className="text-xs text-red-600 mt-1">Immediate attention</div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Assessments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(assessment => {
              const seat = seats.find(s => s.id === assessment.seat_id);
              return (
                <Card key={assessment.id} className={`border-2 ${getQuadrantColor(assessment.right_person, assessment.right_seat)} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assessment.person_name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAssessment(assessment)}
                      >
                        Edit
                      </Button>
                    </div>
                    {seat && (
                      <Badge variant="outline" className="w-fit">
                        {seat.seat_name}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Core Values:</span>
                          <div className="text-lg font-bold text-slate-900">
                            {assessment.overall_core_values_score ? assessment.overall_core_values_score.toFixed(1) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">GWC Score:</span>
                          <div className="text-lg font-bold text-slate-900">
                            {assessment.overall_gwc_score ? assessment.overall_gwc_score.toFixed(1) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-200">
                        <div className="text-sm font-medium text-slate-700 mb-1">
                          {getQuadrantText(assessment.right_person, assessment.right_seat)}
                        </div>
                        <div className="text-xs text-slate-600">
                          {getQuadrantAction(assessment.right_person, assessment.right_seat)}
                        </div>
                      </div>

                      {assessment.assessment_notes && (
                        <div className="pt-2 border-t border-slate-200">
                          <div className="text-xs text-slate-600 line-clamp-2">
                            {assessment.assessment_notes}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <Badge variant="secondary" className="text-xs">
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {showForm && (
        <PersonAssessmentForm
          assessment={editingAssessment}
          client={client}
          seats={seats}
          onSave={handleSaveAssessment}
          onCancel={() => {
            setShowForm(false);
            setEditingAssessment(null);
          }}
        />
      )}
    </div>
  );
}