// Adjust these to match your router. Everything in the patient screens links through here.
export const PATIENT_PATHS = {
  home: '/patient',
  arch: (arch) => `/patient/arch/${arch}`,
  log: '/patient/log',
  photos: '/patient/photos',
  help: '/patient/help',
  reminders: '/patient/reminders',
  viewer: '/patient/viewer',
  notifications: '/patient/notifications'
};