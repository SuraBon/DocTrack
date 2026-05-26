import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { resolveSelectValue } from '@/components/NativeSelect';
import type { CreateParcelDraft } from '@/lib/createParcelDraft';
import type { GeoPosition } from '@/hooks/useGeolocation';

type CreateParcelDialogsProps = {
  isConfirmOpen: boolean;
  setIsConfirmOpen: (open: boolean) => void;
  isResultOpen: boolean;
  setIsResultOpen: (open: boolean) => void;
  formData: CreateParcelDraft;
  proofPhotoPreview: string | null;
  position: GeoPosition | null;
  isLoading: boolean;
  handleConfirmSubmit: () => void;
  createdTrackingId: string | null;
  handleCopyTrackingId: () => void;
};

export function CreateParcelDialogs({
  isConfirmOpen,
  setIsConfirmOpen,
  isResultOpen,
  setIsResultOpen,
  formData,
  proofPhotoPreview,
  position,
  isLoading,
  handleConfirmSubmit,
  createdTrackingId,
  handleCopyTrackingId,
}: CreateParcelDialogsProps) {
  return (
    <>
    {/* Confirmation Modal */}
    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg md:max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl">
        <div className="flex max-h-[92vh] flex-col">
          {/* Header */}
          <div className="bg-slate-950 px-5 py-5 text-white sm:px-6">
            <div className="min-w-0 text-left">
              <DialogTitle className="font-display text-xl font-black leading-tight sm:text-2xl">สรุปรายการส่ง</DialogTitle>
              <p className="mt-1 text-xs font-semibold text-slate-300">ตรวจต้นทาง ปลายทาง และหลักฐานก่อนสร้างรายการ</p>
            </div>
          </div>

          <div className="modal-scroll flex-1 overflow-y-auto bg-white p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Left Column: Details */}
              <div className="space-y-3">
                {/* Route summary */}
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="relative space-y-6">
                    <div className="absolute bottom-6 left-[9px] top-6 w-px bg-slate-200" />
                    <div className="relative flex min-w-0 gap-3">
                      <span className="mt-1 size-[18px] shrink-0 rounded-full border-[5px] border-blue-100 bg-blue-500 shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-black leading-tight text-slate-900">{formData.senderName}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-blue-900/70">{resolveSelectValue(formData.senderBranch)}</p>
                      </div>
                    </div>

                    <div className="relative flex min-w-0 gap-3">
                      <span className="mt-1 size-[18px] shrink-0 rounded-full border-[5px] border-red-100 bg-red-400 shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-black leading-tight text-slate-900">{formData.receiverName}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-blue-900/70">{resolveSelectValue(formData.receiverBranch)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parcel Details */}
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                  <span className="material-symbols-outlined mt-0.5 text-3xl text-slate-400" aria-hidden="true">inventory_2</span>
                  <p className="min-w-0 break-words text-base font-semibold text-slate-800">
                    <span className="font-black text-slate-950">สิ่งที่ส่ง:</span> {formData.description || '-'}
                  </p>
                </div>

                {/* Note */}
                <div className="flex items-start gap-3 rounded-2xl bg-orange-50 px-4 py-4">
                  <span className="material-symbols-outlined mt-0.5 text-3xl text-orange-500" aria-hidden="true">sticky_note_2</span>
                  <p className="min-w-0 break-words text-base font-semibold leading-relaxed text-slate-800">
                    <span className="font-black text-orange-600">หมายเหตุ:</span> {formData.note || '-'}
                  </p>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 ${position ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-3xl" aria-hidden="true">{position ? 'my_location' : 'location_searching'}</span>
                  <span className="min-w-0 text-base font-black">{position ? 'บันทึกตำแหน่งจุดรับแล้ว' : 'รอตำแหน่งจุดรับ'}</span>
                </div>
              </div>

              {/* Right Column: Photo Evidence */}
              <div className="h-full">
                <div className={`overflow-hidden rounded-2xl border flex flex-col h-full ${proofPhotoPreview ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  <div className="flex items-center gap-3 px-4 py-4 shrink-0">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">{proofPhotoPreview ? 'image' : 'add_photo_alternate'}</span>
                    <span className="min-w-0 text-base font-black">{proofPhotoPreview ? 'รูปถ่ายหลักฐาน' : 'ยังไม่ได้แนบรูปถ่ายหลักฐาน'}</span>
                  </div>
                  {proofPhotoPreview ? (
                    <div className="border-t border-blue-100 bg-white p-2 flex-1 flex items-center justify-center min-h-[250px] md:min-h-0">
                      <img
                        src={proofPhotoPreview}
                        alt="รูปสิ่งที่ส่ง"
                        className="max-h-[38vh] md:max-h-[50vh] w-full rounded-xl bg-slate-50 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border-t border-slate-200 bg-white p-8 flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
                      <span className="material-symbols-outlined text-5xl mb-2">add_photo_alternate</span>
                      <span className="text-sm font-semibold">ไม่มีรูปถ่ายหลักฐาน</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-white p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="app-secondary-button h-12 w-full rounded-xl text-base font-bold"
              >
                แก้ไข
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="app-primary-button h-12 w-full rounded-xl text-base font-bold"
              >
                {isLoading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <>
                    ยืนยันสร้างรายการ
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">verified</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Success Dialog */}
    <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
      <DialogContent 
          showCloseButton={false}
          className="w-[calc(100vw-1rem)] max-w-md max-h-[92vh] overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-0 shadow-xl"
        >
        <div className="max-h-[92vh] overflow-y-auto">
        <div className="relative w-full bg-slate-950 px-5 py-6 text-center text-white sm:p-7">
          <button
            type="button"
            onClick={() => setIsResultOpen(false)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="ปิดผลการสร้างรายการ"
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
          </button>
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white sm:size-16">
            <span className="material-symbols-outlined text-3xl sm:text-4xl" aria-hidden="true">check_circle</span>
          </div>
          <DialogTitle className="text-xl font-black text-white sm:text-2xl">สร้างรายการสำเร็จ</DialogTitle>
          <p className="mt-1 text-sm font-semibold text-slate-300">สร้างหมายเลขติดตามเรียบร้อยแล้ว</p>
        </div>

        <div className="w-full p-4 sm:p-6 space-y-5">
          <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-slate-50 p-6 shadow-sm text-center">
            <span className="text-xs font-black text-slate-400">หมายเลขติดตาม</span>
            <code className="block max-w-full break-all font-mono text-[clamp(1.5rem,7vw,2.25rem)] font-black leading-none text-slate-950 select-all">{createdTrackingId}</code>
            <p className="text-xs font-semibold text-slate-500 mt-3">
              คัดลอกรหัสติดตามนี้ส่งให้พนักงานเพื่อจัดส่งต่อได้ทันที
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyTrackingId}
              className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">content_copy</span>
              คัดลอกหมายเลข
            </button>
            <button
              onClick={() => setIsResultOpen(false)}
              className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-colors hover:bg-slate-900"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">done</span>
              เสร็จสิ้น
            </button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>

    </>
  );
}
