export const USER_ROLES = {
  DEVOTEE: 'DEVOTEE',
  FOLK_BOY: 'FOLK_BOY'
};

export const ROLE_LABELS = {
  [USER_ROLES.DEVOTEE]: 'Devotee',
  [USER_ROLES.FOLK_BOY]: 'Folk Boy'
};

export const ROLE_OPTIONS = [
  { value: USER_ROLES.DEVOTEE, label: ROLE_LABELS[USER_ROLES.DEVOTEE] },
  { value: USER_ROLES.FOLK_BOY, label: ROLE_LABELS[USER_ROLES.FOLK_BOY] }
];