const RadioGroup = ({ label, name, options, selectedValue, onChange }) => {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-body-bold font-body-bold text-default-font mb-2">
        {label}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer text-body font-body text-default-font group-disabled/0f804ad9:text-subtext-color"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
            className="accent-blue-600"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
};

export default RadioGroup;
