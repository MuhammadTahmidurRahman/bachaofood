import React, { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

const FreeLocationInput = React.forwardRef(({ value, onChange, error }, ref) => {
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  const searchCity = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.locationiq.com/v1/autocomplete.php?key=${import.meta.env.VITE_LOCATIONIQ_TOKEN}&q=${encodeURIComponent(query)}&limit=5&tag=city,town`
      );
      const data = await res.json();
      setSuggestions(data || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus()
  }));

  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e);
          searchCity(e.target.value);
        }}
        className={`input-field pl-12 ${error ? 'border-red-400' : ''}`}
        placeholder="Search your city..."
      />

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <div
              key={item.place_id}
              onClick={() => {
                onChange({ target: { name: 'location', value: item.display_name } });
                setSuggestions([]);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
            >
              {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default FreeLocationInput;
