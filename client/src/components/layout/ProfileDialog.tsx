import type React from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ProfileFormState = {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileDialogProps = {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  handleProfileSave: (event: React.FormEvent) => void;
  profileForm: ProfileFormState;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  profileLoading: boolean;
  showPasswordFields: boolean;
  setShowPasswordFields: React.Dispatch<React.SetStateAction<boolean>>;
  showCurrentPassword: boolean;
  setShowCurrentPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showNewPassword: boolean;
  setShowNewPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ProfileDialog({
  isProfileOpen,
  setIsProfileOpen,
  handleProfileSave,
  profileForm,
  setProfileForm,
  profileLoading,
  showPasswordFields,
  setShowPasswordFields,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: ProfileDialogProps) {
  return (
    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-outline-variant bg-card p-0 shadow-xl sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="relative bg-primary px-5 py-5 text-white">
          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="ปิดแก้ไขโปรไฟล์"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-white">แก้ไขโปรไฟล์</DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold text-slate-300">
                แก้ไขชื่อหรือรหัสผ่านของคุณ
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleProfileSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1.5">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              disabled={profileLoading}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>

          <div className="border-t border-outline-variant/20 pt-3">
            {!showPasswordFields ? (
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                disabled={profileLoading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-primary transition-all hover:bg-surface-container disabled:opacity-50"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                เปลี่ยนรหัสผ่าน
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider">เปลี่ยนรหัสผ่าน</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
                    }}
                    disabled={profileLoading}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-on-surface-variant/65 transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    ไม่เปลี่ยน
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1.5">รหัสผ่านปัจจุบัน</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileForm.currentPassword}
                      onChange={e => setProfileForm(f => ({ ...f, currentPassword: e.target.value }))}
                      disabled={profileLoading}
                      className="h-11 w-full rounded-lg border border-outline-variant bg-surface pl-3 pr-11 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={profileLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1.5">รหัสผ่านใหม่</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))}
                      disabled={profileLoading}
                      className="h-11 w-full rounded-lg border border-outline-variant bg-surface pl-3 pr-11 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                      placeholder="อย่างน้อย 4 ตัวอักษร"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={profileLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      disabled={profileLoading}
                      className="h-11 w-full rounded-lg border border-outline-variant bg-surface pl-3 pr-11 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={profileLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t border-outline-variant/15 bg-surface px-6 py-4">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              disabled={profileLoading}
              className="h-11 flex-1 rounded-lg border border-outline-variant font-semibold text-on-surface-variant transition-all hover:bg-surface-container disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={profileLoading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {profileLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : 'บันทึก'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

  );
}
