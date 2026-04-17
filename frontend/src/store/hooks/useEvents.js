import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEvents, fetchEventById, createEvent, updateEvent, deleteEvent,
  fetchMyEvents, setFilters, clearFilters, setCurrentEvent, clearCurrentEvent,
} from '../slices/eventSlice';

export const useEvents = () => {
  const dispatch = useDispatch();
  const { events, myEvents, currentEvent, loading, error, filters, pagination } = useSelector((state) => state.events);

  return {
    events,
    myEvents,
    currentEvent,
    loading,
    error,
    filters,
    pagination,
    fetchEvents: (filters) => dispatch(fetchEvents(filters)),
    fetchEventById: (id) => dispatch(fetchEventById(id)),
    createEvent: (data) => dispatch(createEvent(data)),
    updateEvent: (id, data) => dispatch(updateEvent({ eventId: id, eventData: data })),
    deleteEvent: (id) => dispatch(deleteEvent(id)),
    fetchMyEvents: () => dispatch(fetchMyEvents()),
    setFilters: (filters) => dispatch(setFilters(filters)),
    clearFilters: () => dispatch(clearFilters()),
    setCurrentEvent: (event) => dispatch(setCurrentEvent(event)),
    clearCurrentEvent: () => dispatch(clearCurrentEvent()),
  };
};

export default useEvents;
