export type ProfileInputs = {
  answers: Record<string, number>;
  formato: string[];
  trabajo: string;
  intereses?: string;
};

export type ProfileDimensions = {
  MI: number;
  UTIL: number;
  MC: number;
  AR: number;
  EST: number;
  COL: number;
  ANS: number;
  AE: number;
};

export type ProfileResult = {
  dims: ProfileDimensions;
  arquetipo: string;
  arquetipoDescripcion: string;
  arquetipoSecundario?: string;
  dimensionesDominantes: string[];
  formato: string[];
  trabajo: string;
  intereses?: string;
};
