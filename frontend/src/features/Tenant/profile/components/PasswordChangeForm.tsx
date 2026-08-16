import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";

interface PasswordChangeFormProps {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSaving: boolean;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PasswordChangeForm(props: PasswordChangeFormProps) {
  const [visible, setVisible] = useState({ old: false, next: false, confirm: false });

  return (
    <div className="w-full animate-in space-y-6 border border-gray-200 bg-white p-8 shadow-md fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-violet-50 text-violet-600"><Lock size={24} /></div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu tài khoản</h3>
          <p className="mt-0.5 text-xs text-gray-500">Mật khẩu mới cần có ít nhất 6 ký tự.</p>
        </div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); props.onSubmit(); }} className="max-w-2xl space-y-6">
        <PasswordInput label="Mật khẩu hiện tại *" value={props.oldPassword} visible={visible.old} onChange={props.onOldPasswordChange} onToggle={() => setVisible((state) => ({ ...state, old: !state.old }))} />
        <PasswordInput label="Mật khẩu mới *" value={props.newPassword} visible={visible.next} onChange={props.onNewPasswordChange} onToggle={() => setVisible((state) => ({ ...state, next: !state.next }))} />
        <PasswordInput label="Xác nhận mật khẩu mới *" value={props.confirmPassword} visible={visible.confirm} onChange={props.onConfirmPasswordChange} onToggle={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))} />
        <div className="flex justify-start gap-3 pt-4">
          <Button type="submit" isLoading={props.isSaving} className="px-6 py-3 font-bold shadow-md">Lưu thay đổi</Button>
          <Button type="button" variant="secondary" onClick={props.onCancel} disabled={props.isSaving}>Hủy bỏ</Button>
        </div>
      </form>
    </div>
  );
}

function PasswordInput({ label, value, visible, onChange, onToggle }: { label: string; value: string; visible: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input label={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={label.includes("hiện tại") ? "current-password" : "new-password"} />
      <button type="button" onClick={onToggle} className="absolute right-3 top-8.5 cursor-pointer text-gray-400 hover:text-gray-600" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
