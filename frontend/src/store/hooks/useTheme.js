import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, setTheme, setPrimaryColor, setFontSize } from '../slices/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const { mode, primaryColor, fontSize } = useSelector((state) => state.theme);

  return {
    mode,
    primaryColor,
    fontSize,
    isDark: mode === 'dark',
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (theme) => dispatch(setTheme(theme)),
    setPrimaryColor: (color) => dispatch(setPrimaryColor(color)),
    setFontSize: (size) => dispatch(setFontSize(size)),
  };
};

export default useTheme;
