export const storage = {
  get: jest.fn(),
  set: jest.fn(),
};
export const requestJira = jest.fn();
export const route = jest.fn((strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
);
