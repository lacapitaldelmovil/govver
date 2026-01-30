import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function FiltroSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Filtrar...', 
  color = 'veracruz', // veracruz, amber, emerald, purple, indigo, blue, gray, cyan, teal
  showCount = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Colores por estado
  const colorClasses = {
    veracruz: { active: 'bg-veracruz-600 text-white border-veracruz-600', hover: 'hover:bg-veracruz-50' },
    amber: { active: 'bg-amber-600 text-white border-amber-600', hover: 'hover:bg-amber-50' },
    emerald: { active: 'bg-emerald-600 text-white border-emerald-600', hover: 'hover:bg-emerald-50' },
    purple: { active: 'bg-purple-600 text-white border-purple-600', hover: 'hover:bg-purple-50' },
    indigo: { active: 'bg-indigo-600 text-white border-indigo-600', hover: 'hover:bg-indigo-50' },
    blue: { active: 'bg-blue-600 text-white border-blue-600', hover: 'hover:bg-blue-50' },
    gray: { active: 'bg-gray-700 text-white border-gray-700', hover: 'hover:bg-gray-50' },
    cyan: { active: 'bg-cyan-600 text-white border-cyan-600', hover: 'hover:bg-cyan-50' },
    teal: { active: 'bg-teal-600 text-white border-teal-600', hover: 'hover:bg-teal-50' },
  };

  const colors = colorClasses[color] || colorClasses.veracruz;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const hasValue = value !== '' && value !== null && value !== undefined;

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
          rounded-full border-2 transition-all duration-200
          ${hasValue 
            ? colors.active 
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <span className="truncate max-w-[150px]">
          {selectedOption?.label || placeholder}
        </span>
        {hasValue ? (
          <XMarkIcon 
            className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" 
            onClick={handleClear}
          />
        ) : (
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 min-w-[180px] max-w-[280px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-64 overflow-y-auto py-1">
            {/* Opción para limpiar */}
            {hasValue && (
              <button
                onClick={() => handleSelect('')}
                className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
                Quitar filtro
              </button>
            )}
            
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2
                  transition-colors duration-100
                  ${opt.value === value 
                    ? `${colors.hover} font-medium` 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <span className="truncate">{opt.label}</span>
                <div className="flex items-center gap-2">
                  {showCount && opt.count !== undefined && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {opt.count}
                    </span>
                  )}
                  {opt.value === value && (
                    <CheckIcon className="h-4 w-4 text-veracruz-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
