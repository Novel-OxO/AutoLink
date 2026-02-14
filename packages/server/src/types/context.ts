export type AppEnv = {
  Variables: {
    requestId: string;
    user: { id: number; email: string };
    sessionId: string;
  };
};
