import React from 'react';
import { TextField } from '../TextField';
import { Alert } from '../Alert';

const PatientInformationForm = ({ formData, handleChange, getMinDate }) => {
  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-start gap-4">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          <TextField
            className="h-auto w-full flex-none"
            label="First Name (required)"
            helpText=""
          >
            <TextField.Input
              placeholder="Enter patient's first name"
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </TextField>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          <TextField
            className="h-auto w-full flex-none"
            label="Last Name (required)"
            helpText=""
          >
            <TextField.Input
              placeholder="Enter patient's last name"
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </TextField>
        </div>
      </div>

      {/* Urgent Case Section */}
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isUrgent"
            name="isUrgent"
            checked={formData.isUrgent}
            onChange={handleChange}
            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 accent-sky-600"
          />
          <label
            htmlFor="isUrgent"
            className="text-body-bold font-body-bold text-default-font cursor-pointer"
          >
            Urgent Case
          </label>
        </div>

        {formData.isUrgent && (
          <div className="ml-7 w-full max-w-xs">
            <TextField
              className="h-auto w-full flex-none"
              label="Required Delivery Date"
              helpText="Select the latest acceptable delivery date"
            >
              <TextField.Input
                type="date"
                id="urgentDeliveryDate"
                name="urgentDeliveryDate"
                value={formData.urgentDeliveryDate}
                onChange={handleChange}
                min={getMinDate()}
                required={formData.isUrgent}
                className="text-body font-body"
              />
            </TextField>
          </div>
        )}

        {formData.isUrgent && (
          <div className="ml-7">
            <Alert
              title="Urgent Case Notice"
              description="Urgent cases may incur additional fees and are subject to availability. We'll contact you to confirm the delivery timeline and any extra charges."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientInformationForm;
