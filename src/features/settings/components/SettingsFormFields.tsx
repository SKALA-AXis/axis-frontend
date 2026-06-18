import { Switch } from '../../../app/components/ui/switch';

// 설정 화면 폼 필드 표현 컴포넌트 (refactoring P2/stage3). SettingsView 에서 그대로 옮긴 것.

/** 라벨 + 기본값 입력 필드(비제어). */
export function Field({
  label,
  type = 'text',
  defaultValue,
}: {
  label: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-body-sm font-semibold text-[var(--axis-ink)]">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-3 text-body-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
      />
    </label>
  );
}

/** 라벨 + 비밀번호 입력 필드(제어). */
export function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-body-sm font-semibold text-[var(--axis-ink)]">{label}</span>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={id === 'settings-current-password' ? 'current-password' : 'new-password'}
        className="h-11 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-body-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
      />
    </label>
  );
}

/** 제목/설명 + 스위치 토글 행. */
export function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
      <div>
        <p className="text-body-sm font-semibold text-[var(--axis-ink)]">{title}</p>
        <p className="mt-1 text-caption leading-5 text-[var(--axis-muted)]">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
        className="h-7 w-12 [&_[data-slot=switch-thumb]]:size-5"
      />
    </div>
  );
}
