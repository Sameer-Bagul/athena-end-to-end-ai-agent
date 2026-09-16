export interface Tool {
  name: string;
  description: string;
  schema: any;
  invoke: (args: any) => Promise<string>;
}
