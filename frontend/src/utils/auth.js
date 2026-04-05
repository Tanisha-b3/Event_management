export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse stored user', err);
    return null;
  }
};

export const getUserRole = () => {
  const user = getStoredUser();
  return user?.role || 'booker';
};
