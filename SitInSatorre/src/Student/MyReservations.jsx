import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function MyReservations({ reservations, loading, onReservationDeleted }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteClick = (reservationId) => {
    setDeleteConfirm(reservationId);
    setError(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const url = authService.getActionUrl('deleteReservation.php');
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: deleteConfirm,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeleteConfirm(null);
        onReservationDeleted();
      } else {
        setError(result.message || 'Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      setError('An error occurred while deleting the reservation');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
            ⏳ Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            ✓ Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
            ✗ Declined
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            ✓ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
            ⊘ Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const canDelete = (reservation) => {
    return reservation.status === 'pending';
  };

  // Group reservations by status
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const approvedReservations = reservations.filter(r => r.status === 'approved');
  const otherReservations = reservations.filter(
    r => r.status === 'declined' || r.status === 'completed' || r.status === 'cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-red-900">Delete Reservation?</h3>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this pending reservation? This action cannot be
                undone.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                {reservations.find(r => r.id === deleteConfirm) && (
                  <>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">
                        {reservations.find(r => r.id === deleteConfirm)?.lab_name}
                      </span>{' '}
                      • PC{' '}
                      <span className="font-medium">
                        {reservations.find(r => r.id === deleteConfirm)?.pc_number}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(reservations.find(r => r.id === deleteConfirm)?.reservation_date)}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
              >
                Keep It
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Reservations Section */}
      {pendingReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">
              ⏳ Pending Approval ({pendingReservations.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Waiting for admin approval. You can delete these reservations if needed.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lab</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PC</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map((reservation, idx) => (
                  <tr
                    key={reservation.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {reservation.lab_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{reservation.pc_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(reservation.reservation_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTime(reservation.time_from)} - {formatTime(reservation.time_to)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteClick(reservation.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition text-sm font-medium"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Reservations Section */}
      {approvedReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">
              ✓ Approved ({approvedReservations.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">Your confirmed reservations are ready to use.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lab</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PC</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedReservations.map((reservation, idx) => (
                  <tr
                    key={reservation.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {reservation.lab_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{reservation.pc_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(reservation.reservation_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTime(reservation.time_from)} - {formatTime(reservation.time_to)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Reservations Section */}
      {otherReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Reservation History ({otherReservations.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">Declined, completed, or cancelled reservations.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lab</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PC</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  {otherReservations.some(r => r.decline_reason) && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Note
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {otherReservations.map((reservation, idx) => (
                  <tr
                    key={reservation.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {reservation.lab_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{reservation.pc_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(reservation.reservation_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTime(reservation.time_from)} - {formatTime(reservation.time_to)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                    {otherReservations.some(r => r.decline_reason) && (
                      <td className="px-6 py-4">
                        {reservation.decline_reason && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs">
                            <AlertCircle size={14} /> {reservation.decline_reason}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reservations.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No reservations yet</p>
          <p className="text-gray-400 text-sm">
            Create a new reservation to book a PC in your preferred lab
          </p>
        </div>
      )}
    </div>
  );
}
