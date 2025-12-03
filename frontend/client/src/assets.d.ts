declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';

// Optionally allow importing from bare asset aliases
declare module '@assets/*' {
  const value: string;
  export default value;
}
