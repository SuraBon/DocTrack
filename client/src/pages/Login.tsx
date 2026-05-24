import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  PackagePlus,
  PackageSearch,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isValidEmployeeId, normalizeEmployeeId, validatePassword, validateRequiredText } from '@/lib/validation';

type AuthDialogState = {
  open: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
};

const DEFAULT_LOGIN_ERROR = 'เข้าสู่ระบบไม่สำเร็จ';

function getLoginErrorMessage(error?: string) {
  const err = error || '';

  if (err.includes('บัญชีถูกล็อค')) return err;
  if (err.includes('รหัสผ่านไม่ถูกต้อง') || err.includes('เหลือ')) {
    return err || DEFAULT_LOGIN_ERROR;
  }
  if (
    err.includes('ไม่พบรหัสพนักงาน') ||
    err.includes('ไม่พบ') ||
    err.includes('not found') ||
    err.includes('UNAVAILABLE')
  ) {
    return 'ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบอีกครั้ง หรือให้ผู้ดูแลระบบเพิ่มบัญชีก่อน';
  }

  return err || 'ระบบไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง';
}

export default function Login() {
  const { loginUser, setupUserPin, loading } = useAuth();
  
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  
  // For setup
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');

  const [authDialog, setAuthDialog] = useState<AuthDialogState>({
    open: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const isAuthSubmitting = authDialog.open && authDialog.status === 'loading';
  const isLoginDisabled = loading || isAuthSubmitting;
  const showAuthError = (title: string, message: string) => {
    setAuthDialog({ open: true, status: 'error', title, message });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      const message = 'กรุณากรอกรหัสพนักงานก่อนเข้าสู่ระบบ';
      showAuthError(DEFAULT_LOGIN_ERROR, message);
      return;
    }
    if (!isValidEmployeeId(employeeId)) {
      const message = 'รหัสพนักงานต้องใช้ A-Z, 0-9 หรือ _ เท่านั้น';
      showAuthError(DEFAULT_LOGIN_ERROR, message);
      return;
    }

    if (isSetup) {
      const passwordError = validatePassword(pin, 20);
      const nameError = validateRequiredText(name, 'ชื่อ-นามสกุล', 1, 100);
      const branchError = validateRequiredText(branch, 'แผนก/สาขา', 1, 100);
      if (passwordError || nameError || branchError) {
        const message = passwordError || nameError || branchError || 'กรุณากรอกข้อมูลให้ครบถ้วน';
        showAuthError('ตั้งค่าการเข้าใช้งานไม่สำเร็จ', message);
        return;
      }
      setAuthDialog({
        open: true,
        status: 'loading',
        title: 'กำลังบันทึกข้อมูล',
        message: 'กรุณารอสักครู่ ระบบกำลังตรวจสอบและบันทึกข้อมูลของท่าน',
      });
      const res = await setupUserPin(employeeId, pin, name, branch);
      if (res.success) {
        setAuthDialog({
          open: true,
          status: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          message: 'ตั้งค่ารหัสผ่านและข้อมูลผู้ใช้เรียบร้อยแล้ว',
        });
        toast.success('ตั้งรหัสผ่านสำเร็จ');
      } else {
        const message = res.error || 'เกิดข้อผิดพลาดในการตั้งค่า กรุณาลองใหม่อีกครั้ง';
        showAuthError('ตั้งค่าการเข้าใช้งานไม่สำเร็จ', message);
      }
    } else {
      if (!pin) {
        const message = 'กรุณากรอกรหัสผ่านก่อนเข้าสู่ระบบ';
        showAuthError(DEFAULT_LOGIN_ERROR, message);
        return;
      }
      const passwordError = validatePassword(pin, 20);
      if (passwordError) {
        showAuthError(DEFAULT_LOGIN_ERROR, passwordError);
        return;
      }

      setAuthDialog({
        open: true,
        status: 'loading',
        title: 'กำลังเข้าสู่ระบบ',
        message: 'กรุณารอสักครู่ ระบบกำลังตรวจสอบรหัสพนักงานและรหัสผ่าน',
      });
      const res = await loginUser(employeeId, pin);
      
      if (res.success) {
        if (res.needsSetup) {
          setIsSetup(true);
          setName(res.name !== 'Unknown' ? res.name! : '');
          setBranch(res.branch !== 'Unknown' ? res.branch! : '');
          setAuthDialog({
            open: true,
            status: 'success',
            title: 'ตรวจสอบสำเร็จ',
            message: 'เข้าใช้งานครั้งแรก กรุณาตั้งค่ารหัสผ่านและข้อมูลของท่าน',
          });
          toast.info('เข้าใช้งานครั้งแรก กรุณาตั้งรหัสผ่านและข้อมูลของท่าน');
        } else {
          setAuthDialog({
            open: true,
            status: 'success',
            title: 'เข้าสู่ระบบสำเร็จ',
            message: 'ยืนยันตัวตนเรียบร้อย กำลังเปิดหน้าระบบ',
          });
          toast.success('เข้าสู่ระบบสำเร็จ');
        }
      } else {
        const message = getLoginErrorMessage(res.error);
        showAuthError('เข้าสู่ระบบไม่สำเร็จ', message);
      }
    }
  };

  return (
    <div className="flex min-h-dvh w-screen items-center justify-center overflow-x-hidden bg-slate-50 px-3 py-6 sm:px-4">
      <div className="grid w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 md:max-w-5xl md:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden bg-slate-950 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                <PackageSearch className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">Internal Delivery Portal</p>
                <h2 className="text-2xl font-bold leading-tight">ShipTrack</h2>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/65">
              ระบบจัดการรายการส่งภายในสำหรับผู้ดูแลระบบ พนักงานส่ง และการติดตามหลักฐานรับของในที่เดียว
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">ติดตามสถานะชัดเจน</p>
                <p className="mt-1 text-xs leading-5 text-white/55">สร้างรายการ ค้นหา และตรวจประวัติการเคลื่อนไหวของพัสดุได้เร็ว</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">สิทธิ์ผู้ใช้งานตามบทบาท</p>
                <p className="mt-1 text-xs leading-5 text-white/55">แยกมุมมองผู้ดูแลระบบ พนักงานส่ง และผู้สร้างรายการทั่วไป</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <PackagePlus className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">หลักฐานพร้อมตำแหน่ง</p>
                <p className="mt-1 text-xs leading-5 text-white/55">รองรับรูปยืนยันและพิกัด GPS ในขั้นตอนรับส่งสำคัญ</p>
              </div>
            </div>
          </div>
        </section>

        <main className="px-5 py-6 sm:px-8 sm:py-8 md:px-10">
          <div className="mb-7">
            <div className="mb-5 flex items-center gap-3 md:hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <PackageSearch className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Internal Delivery Portal</p>
                <p className="text-xl font-bold text-foreground">ShipTrack</p>
              </div>
            </div>

            <p className="mb-2 text-xs font-bold uppercase text-primary">Staff access</p>
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {isSetup ? 'ตั้งค่าการเข้าใช้งาน' : 'เข้าสู่ระบบพนักงานส่ง'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isSetup ? 'ยืนยันข้อมูลผู้ใช้งานครั้งแรกและตั้งรหัสผ่านสำหรับเข้าใช้งานครั้งต่อไป' : 'เข้าสู่ระบบสำหรับผู้ดูแลระบบและพนักงานส่ง หรือสร้างรายการแบบไม่เข้าสู่ระบบ'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">รหัสพนักงาน</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={e => setEmployeeId(normalizeEmployeeId(e.target.value))}
                  disabled={isSetup || isLoginDisabled}
                  className="app-input w-full pl-11 font-medium uppercase"
                  placeholder="กรอกรหัสพนักงาน"
                  autoComplete="username"
                />
              </div>
            </div>

            {isSetup && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">ชื่อ-นามสกุล</label>
                  <div className="relative">
                    <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={isLoginDisabled}
                      className="app-input w-full pl-11"
                      placeholder="ชื่อของท่าน"
                      autoComplete="name"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">แผนก/สาขาประจำ</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      type="text"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      disabled={isLoginDisabled}
                      className="app-input w-full pl-11"
                      placeholder="เช่น พิบูลสงคราม"
                      autoComplete="organization"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {isSetup ? 'ตั้งรหัสผ่าน' : 'รหัสผ่าน'}
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  disabled={isLoginDisabled}
                  className="app-input w-full pl-11 font-medium"
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoginDisabled}
              className="app-primary-button mt-2 flex w-full items-center justify-center gap-2"
            >
              {isLoginDisabled ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{isSetup ? 'กำลังบันทึกข้อมูล' : 'กำลังเข้าสู่ระบบ'}</span>
                </>
              ) : (
                <>
                  <span>{isSetup ? 'บันทึกข้อมูลและเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>

            {!isSetup && (
              <button
                type="button"
                onClick={() => { window.history.pushState({}, '', '/create'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-primary transition-colors hover:bg-slate-50 active:scale-[0.99]"
              >
                <PackagePlus className="h-5 w-5" aria-hidden="true" />
                <span>สร้างรายการแบบไม่เข้าสู่ระบบ</span>
              </button>
            )}
          </form>
        </main>
      </div>

      <Dialog
        open={authDialog.open}
        onOpenChange={(open) => {
          if (authDialog.status !== 'loading') setAuthDialog((current) => ({ ...current, open }));
        }}
        >
          <DialogContent
            className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border-none bg-white p-6 text-center shadow-2xl"
            showCloseButton={authDialog.status !== 'loading'}
          >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {authDialog.status === 'loading' ? (
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            ) : authDialog.status === 'success' ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
            ) : (
              <XCircle className="h-9 w-9 text-destructive" aria-hidden="true" />
            )}
            </div>
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl font-semibold text-primary">{authDialog.title}</DialogTitle>
              <DialogDescription className="max-w-full whitespace-normal break-words text-sm leading-relaxed text-muted-foreground">
                {authDialog.message}
              </DialogDescription>
            </DialogHeader>
          {authDialog.status !== 'loading' && (
            <button
              type="button"
              onClick={() => setAuthDialog((current) => ({ ...current, open: false }))}
              className="mt-2 h-11 rounded-2xl bg-primary px-6 font-display text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
            >
              ตกลง
            </button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
