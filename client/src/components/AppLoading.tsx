import { useEffect, useState } from 'react';

type AppLoadingProps = {
  fullScreen?: boolean;
  label?: string;
};

export function AppLoading({ fullScreen = true, label = 'กำลังโหลดข้อมูล' }: AppLoadingProps) {
  // ใช้ DOM class แทน useTheme() เพราะ component นี้อาจถูก render นอก ThemeProvider
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`grid place-items-center px-4 transition-colors ${
        isDark ? 'bg-[#161412] text-[#f0ebe3]' : 'bg-[#faf8f5] text-[#1a1410]'
      } ${fullScreen ? 'fixed inset-0 z-50' : 'min-h-[56vh] rounded-2xl'}`}
    >
      <div className="flex w-full max-w-[280px] animate-in fade-in slide-in-from-bottom-4 duration-500 flex-col items-center text-center">
        <svg className="mb-6 h-20 w-20 animate-[splash-pulse_2s_ease-in-out_infinite]" viewBox="0 0 64 64" role="img" aria-label="ShipTrack">
          <path d="M 35.0 9.2 A 23 23 0 0 1 53.2 40.8" fill="none" stroke={isDark ? '#5a4f46' : '#c8b8a2'} strokeWidth="4.5" strokeLinecap="butt" />
          <path d="M 50.3 46.0 A 23 23 0 0 1 13.7 46.0" fill="none" stroke={isDark ? '#5a4f46' : '#c8b8a2'} strokeWidth="4.5" strokeLinecap="butt" />
          <path d="M 10.8 40.8 A 23 23 0 0 1 29.0 9.2" fill="none" stroke={isDark ? '#5a4f46' : '#c8b8a2'} strokeWidth="4.5" strokeLinecap="butt" />
          <path d="M 18.5 41.5 L 32 20 L 45.5 41.5" fill="none" stroke="#e8392a" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="butt" />
        </svg>
        <p className={`font-display text-2xl font-black leading-tight ${isDark ? 'text-[#f0ebe3]' : 'text-[#1a1410]'}`}>
          ShipTrack
        </p>
        <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-[#8a7f74]' : 'text-[#9a8878]'}`}>
          {label}
        </p>
        <div
          className="mt-8 h-10 w-10 animate-spin rounded-full border-[3px]"
          style={{ borderColor: isDark ? 'rgba(232,57,42,0.15)' : 'rgba(232,57,42,0.2)', borderTopColor: '#e8392a' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default AppLoading;
