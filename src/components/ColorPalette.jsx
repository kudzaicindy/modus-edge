import { isPaintedColor, swatchIsLight, swatchStyle } from "../data";

function canSwatch(option) {
  return Boolean(option?.image) || isPaintedColor(option?.name);
}

export default function ColorPalette({ options = [], value = 0, onChange, showLabel = true, size = "md" }) {
  if (options.length < 2) return null;

  const chosen = options[value] || options[0];
  const useSwatches = options.every(canSwatch);

  return (
    <div className={`palette palette-${size}`}>
      {showLabel && (
        <p className="palette-label">
          Colour: <strong>{chosen.name}</strong>
        </p>
      )}
      <div className="palette-dots" role="listbox" aria-label="Colour">
        {options.map((option, index) =>
          useSwatches || canSwatch(option) ? (
            <button
              key={`${option.name}-${index}`}
              type="button"
              role="option"
              className={`swatch${index === value ? " on" : ""}${
                option.image ? " swatch-photo" : swatchIsLight(option.name) ? " light" : ""
              }`}
              style={
                option.image
                  ? { backgroundImage: `url(${option.image})` }
                  : swatchStyle(option.name)
              }
              aria-selected={index === value}
              aria-label={option.name}
              title={option.name}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(index);
              }}
            />
          ) : (
            <button
              key={`${option.name}-${index}`}
              type="button"
              role="option"
              className={index === value ? "color-chip on" : "color-chip"}
              aria-selected={index === value}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(index);
              }}
            >
              {option.name}
            </button>
          )
        )}
      </div>
    </div>
  );
}
