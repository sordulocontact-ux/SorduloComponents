type ToggleSwitchProps = {
  isActive: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

/** Interrupteur contrôlé : fond noir qui glisse, pastille blanche. */
export default function ToggleSwitch({ isActive, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!isActive)}
      disabled={disabled}
      className={`group relative inline-flex h-[33px] w-[63px] items-center rounded-full bg-gray-300 transition-all duration-300 ease-out active:scale-90 overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      title={isActive ? 'Desactivate' : 'Activate'}
    >
      {/* Fond noir qui slide de la droite */}
      <span
        className={`absolute inset-0 bg-black rounded-full transition-transform duration-300 ease-out ${
          isActive ? '-translate-x-0' : '-translate-x-[66px]'
        }`}
      />

      {/* Badge blanc */}
      <span
        className={`relative z-10 inline-block h-6 w-6 rounded-full bg-white transition-all duration-300 ease-out group-active:scale-125 ${
          isActive ? 'translate-x-[33px]' : 'translate-x-[6px]'
        }`}
      />
    </button>
  );
}
