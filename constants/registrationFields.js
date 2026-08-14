export const REGISTRATION_FIELD_DEFS = [
  { key: 'team_name', label: 'Team Name' },
  { key: 'team_tag', label: 'Team Tag' },
  { key: 'team_logo', label: 'Team Logo' },
  { key: 'manager_name', label: 'Manager Name' },
  { key: 'manager_contact', label: 'Manager Contact' },
  { key: 'registrant_email', label: 'Registrar Email' },
  { key: 'player_name', label: 'Player Name' },
  { key: 'player_uid', label: 'Player UID' },
  { key: 'citizenship_photo', label: 'Citizenship Photo' }
];

export const DEFAULT_REGISTRATION_FIELDS = Object.fromEntries(
  REGISTRATION_FIELD_DEFS.map(({ key }) => [key, true])
);

export function normalizeRegistrationFieldConfig(value) {
  const normalized = { ...DEFAULT_REGISTRATION_FIELDS };

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  for (const { key } of REGISTRATION_FIELD_DEFS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      normalized[key] = Boolean(value[key]) || value[key] === 'true' || value[key] === 1;
    }
  }

  return normalized;
}

export function getTournamentRegistrationFields(tournament = {}) {
  const rawConfig = tournament?.registration_fields ?? tournament?.required_fields ?? tournament?.registration_required_fields ?? {};
  return normalizeRegistrationFieldConfig(rawConfig);
}
