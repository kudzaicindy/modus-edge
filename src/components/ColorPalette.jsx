import { isPaintedColor, swatchIsLight, swatchStyle } from "../data";

export default function ColorPalette({ options = [], value = 0, onChange, showLabel = true, size = "md" }) {
  if (options.length < 2) return null;

  const chosen = options[value] || options[0];
  const painted = options.every((option) => isPaintedColor(option.name));

  return (
    <div className={`palette palette-${size}`}>
      {showLabel && (
        <p className="palette-label">
          {painted ? "Colour" : "Option"}: <strong>{chosen.name}</strong>
        </p>
      )}
      <div className="palette-dots" role="listbox" aria-label={painted ? "Colour" : "Option"}>
        {options.map((option, index) =>
          painted ? (
            <button
              key={option.name}
              type="button"
              role="option"
              className={`swatch${index === value ? " on" : ""}${swatchIsLight(option.name) ? " light" : ""}`}
              style={swatchStyle(option.name)}
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
              key={option.name}
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
