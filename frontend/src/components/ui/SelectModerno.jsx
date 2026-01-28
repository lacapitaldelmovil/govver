import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function SelectModerno({ 
  name, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Seleccionar...', 
  required = false,
  icon: Icon = null,
  groupedOptions = null,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Obtener label del valor actual
  const getSelectedLabel = () => {
    if (groupedOptions) {
      for (const group of groupedOptions) {
        const found = group.options.find(opt => opt.value === value);
        if (found) return found.label;
      }
    } else {
      const found = options.find(opt => opt.value === value);
      if (found) return found.label;
    }
    return placeholder;
  };

  // Filtrar opciones
  const filterOptions = (opts) => {
    if (!search) return opts;
    return opts.filter(opt => 
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } });
    setIsOpen(false);
    setSearch('');
  };

  const selectedLabel = getSelectedLabel();
  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3
          bg-white border-2 rounded-xl text-left
          transition-all duration-200 ease-out
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-veracruz-400 hover:shadow-md'}
          ${isOpen ? 'border-veracruz-500 ring-2 ring-veracruz-100 shadow-lg' : 'border-gray-200'}
          ${hasValue ? 'text-gray-900' : 'text-gray-400'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <Icon className={`h-5 w-5 flex-shrink-0 ${hasValue ? 'text-veracruz-600' : 'text-gray-400'}`} />
          )}
          <span className="truncate font-medium">{selectedLabel}</span>
        </div>
        <ChevronDownIcon 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-veracruz-600' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Búsqueda */}
          {(options.length > 5 || groupedOptions) && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
              />
            </div>
          )}

          {/* Opciones */}
          <div className="max-h-64 overflow-y-auto">
            {groupedOptions ? (
              // Opciones agrupadas
              groupedOptions.map((group, idx) => {
                const filteredOpts = filterOptions(group.options);
                if (filteredOpts.length === 0) return null;
                return (
                  <div key={idx}>
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                      {group.label}
                    </div>
                    {filteredOpts.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 text-left
                          transition-colors duration-100
                          ${opt.value === value 
                            ? 'bg-veracruz-50 text-veracruz-700' 
                            : 'hover:bg-gray-50 text-gray-700'}
                        `}
                      >
                        {opt.icon && <opt.icon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                        <span className="flex-1 font-medium">{opt.label}</span>
                        {opt.value === value && (
                          <CheckIcon className="h-5 w-5 text-veracruz-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })
            ) : (
              // Opciones simples
              filterOptions(options).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors duration-100
                    ${opt.value === value 
                      ? 'bg-veracruz-50 text-veracruz-700' 
                      : 'hover:bg-gray-50 text-gray-700'}
                  `}
                >
                  {opt.icon && <opt.icon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                  <span className="flex-1 font-medium">{opt.label}</span>
                  {opt.value === value && (
                    <CheckIcon className="h-5 w-5 text-veracruz-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}

            {/* Sin resultados */}
            {((groupedOptions && groupedOptions.every(g => filterOptions(g.options).length === 0)) ||
              (!groupedOptions && filterOptions(options).length === 0)) && (
              <div className="px-4 py-6 text-center text-gray-400">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input hidden para formularios */}
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
}
