import { renderHook } from '@testing-library/react-native';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

import { Colors } from '@/constants/theme';

import { useColorScheme } from './use-color-scheme';
import { useTheme } from './use-theme';

const mockUseColorScheme = useColorScheme as jest.Mock;

describe('useTheme', () => {
  it('scheme が dark の場合は Colors.dark を返す', async () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.dark);
  });

  it('scheme が light の場合は Colors.light を返す', async () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });

  it('scheme が undefined の場合は Colors.light にフォールバックする', async () => {
    mockUseColorScheme.mockReturnValue(undefined);

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });

  it('scheme が null の場合は Colors.light にフォールバックする', async () => {
    mockUseColorScheme.mockReturnValue(null);

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });
});
