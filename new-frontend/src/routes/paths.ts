export const rootPaths = {
  root: '/',
  authRoot: 'authentication',
};

const paths = {
  signin: `/${rootPaths.authRoot}/sign-in`,
  signup: `/${rootPaths.authRoot}/sign-up`,
  bms: '/bms',
  bmsForm: '/bms/form',
  packs: '/packs',
  packsForm: '/packs/form',
  alerts: '/alerts',
  adminUsers: '/admin/users',
  adminBmsModels: '/admin/bms-models',
  adminBmsVerification: '/admin/bms-verification',
};

// react-router path patterns (above) can't carry a real id, so callers that
// need a link to a specific device's collaborators page use this instead.
export const bmsCollaboratorsPath = (bmsId: string) => `/bms/${bmsId}/collaborators`;

export const packDetailPath = (packId: string) => `/packs/${packId}`;

export default paths;
